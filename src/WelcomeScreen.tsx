// Welcome screen: Snooze hangs from a branch under the sky of the hour.
// Tilt the phone and Snooze swings like a pendulum. Drag to push. Tap to wake.
// All motion runs on the UI thread with Reanimated (useFrameCallback + gravity sensor).
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  SensorType,
  useAnimatedReaction,
  useAnimatedSensor,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { GestureDetector, useExclusiveGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CAP_PIVOT, GRIP, SnoozeArms, SnoozeBody, SnoozeCap, toPx, VIEWBOX, type Eyes, type Mouth } from './Snooze';
import { BRAND, skyFor } from './sky';

// ---- feel knobs ----
const TILT_SIGN = 1;          // flip to -1 if Snooze swings the wrong way on your phone
const DEAD_ZONE = (3 * Math.PI) / 180; // ignore ~3 degrees of hand wobble
const MAX_TILT = 0.85;        // radians: furthest Snooze will lean from tilt alone
const STIFFNESS = 9;          // pendulum pull back to "down" (higher = faster swing)
const DAMPING = 0.55;         // air drag (higher = settles sooner)
const LEVEL_FOLLOW_S = 10;    // "level" slowly follows how you hold the phone over ~10 s
const MAX_SWING = 0.95;       // radians: never swings past this (about 55 degrees)
const DRAG_PX_PER_RAD = 260;  // finger travel for one radian of swing

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sky = skyFor();

  const size = Math.min(width * 0.7, 300);
  const slothH = (size * VIEWBOX.h) / VIEWBOX.w;
  const grip = toPx(GRIP, size);
  const capPivot = toPx(CAP_PIVOT, size);
  const frame = 2 * Math.max(slothH - grip.y, size) + 20; // big enough to hold Snooze at any swing angle
  const capFrame = 2 * size;
  const branchY = insets.top + height * 0.15;

  // ---- physics state (UI thread) ----
  const theta = useSharedValue(0);      // swing angle, 0 = hanging straight down
  const omega = useSharedValue(0);      // angular velocity
  const capPhi = useSharedValue(0);     // cap wobble relative to the body
  const capOmega = useSharedValue(0);
  const tilt = useSharedValue(0);       // eased tilt target
  const level = useSharedValue<number | null>(null);
  const dragging = useSharedValue(false);
  const dragStart = useSharedValue(0);
  const time = useSharedValue(0);

  const gravity = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });

  useFrameCallback((frame) => {
    'worklet';
    const dt = Math.min((frame.timeSincePreviousFrame ?? 16) / 1000, 0.05);
    time.value += dt;

    // Tilt from the phone's roll angle, not raw sensor numbers, so it works upright or lying in bed.
    const g = gravity.sensor.value;
    const roll = Math.atan2(g.x, Math.sqrt(g.y * g.y + g.z * g.z));
    if (level.value === null) level.value = roll;
    level.value += (roll - level.value) * Math.min(1, dt / LEVEL_FOLLOW_S);
    let d = (roll - (level.value as number)) * TILT_SIGN;
    d = Math.sign(d) * Math.max(0, Math.abs(d) - DEAD_ZONE);
    const target = Math.max(-MAX_TILT, Math.min(MAX_TILT, d * 1.6));
    tilt.value += (target - tilt.value) * Math.min(1, dt * 4); // ease in, never snap

    if (!dragging.value) {
      // Gravity pulls toward the tilted "down"; drag slows it so it coasts to a stop.
      const alpha = -STIFFNESS * Math.sin(theta.value - tilt.value) - DAMPING * omega.value;
      omega.value += alpha * dt;
      theta.value += omega.value * dt;
      if (Math.abs(theta.value) > MAX_SWING) {
        theta.value = Math.sign(theta.value) * MAX_SWING;
        omega.value *= -0.35; // soft bump at the end of the swing
      }
    }

    // Cap: a stiff little spring that lags behind the body's motion.
    const capAlpha = -40 * capPhi.value - 5 * capOmega.value - omega.value * 6;
    capOmega.value += capAlpha * dt;
    capPhi.value += capOmega.value * dt;
  });

  // ---- drag to push, tap to wake ----
  const pan = usePanGesture({
    minDistance: 4,
    onActivate: () => {
      'worklet';
      dragging.value = true;
      dragStart.value = theta.value;
    },
    onUpdate: (e) => {
      'worklet';
      const next = Math.max(-MAX_SWING, Math.min(MAX_SWING, dragStart.value - e.translationX / DRAG_PX_PER_RAD));
      omega.value = (next - theta.value) / 0.016;
      theta.value = next;
    },
    onDeactivate: (e) => {
      'worklet';
      dragging.value = false;
      omega.value = Math.max(-4, Math.min(4, -e.velocityX / DRAG_PX_PER_RAD));
    },
  });

  const [eyes, setEyes] = useState<Eyes>('closed');
  const [mouth, setMouth] = useState<Mouth>('smile');
  const [awake, setAwake] = useState(false);
  const bubble = useSharedValue(0);
  const zzz = useSharedValue(1);

  const wake = useCallback(() => {
    if (awake) return;
    setAwake(true);
    setEyes('open');
    setMouth('open');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    bubble.value = withSequence(withSpring(1, { damping: 9 }), withTiming(1, { duration: 1600 }), withTiming(0, { duration: 250 }));
    zzz.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      setEyes('half');
      setMouth('smile');
    }, 1900);
    setTimeout(() => {
      setEyes('closed');
      setAwake(false);
      zzz.value = withTiming(1, { duration: 600 });
    }, 3600);
  }, [awake, bubble, zzz]);

  const tap = useTapGesture({
    maxDistance: 10, // a drag is never a tap
    onActivate: () => {
      'worklet';
      omega.value += 1.8; // a little startled jolt
      scheduleOnRN(wake);
    },
  });
  const gestures = useExclusiveGestures(pan, tap);

  // Fast swings crack the eyes open ("whoa"), then they drift shut again.
  const setEyesFromSpeed = useCallback((fast: boolean) => {
    if (awake) return;
    setEyes(fast ? 'half' : 'closed');
  }, [awake]);
  useAnimatedReaction(
    () => Math.abs(omega.value) > 1.6,
    (fast, prev) => {
      if (fast !== prev) scheduleOnRN(setEyesFromSpeed, fast);
    },
  );

  // ---- styles ----
  // Rotate the whole sloth around the grip point on the branch.
  const swingStyle = useAnimatedStyle(() => {
    const breathe = 0.015 * Math.sin(time.value * 1.3); // gentle bob in place
    return { transform: [{ rotate: `${theta.value + breathe}rad` }] };
  });
  const capStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${capPhi.value}rad` }],
  }));
  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubble.value,
    transform: [{ scale: 0.6 + 0.4 * bubble.value }, { translateY: (1 - bubble.value) * 12 }],
  }));

  // Floating Z's while asleep.
  const zFloat = useSharedValue(0);
  useEffect(() => {
    zFloat.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }), -1, false);
  }, [zFloat]);
  // Called exactly three times, in the same order every render, so the hook order is stable.
  const zStyle = (i: number) =>
    useAnimatedStyle(() => {
      const p = (zFloat.value + i / 3) % 1;
      return {
        opacity: zzz.value * Math.sin(p * Math.PI),
        transform: [{ translateY: -p * 40 }, { translateX: p * 14 }, { rotate: `${-12 + p * 18}deg` }],
      };
    });
  const z0 = zStyle(0);
  const z1 = zStyle(1);
  const z2 = zStyle(2);

  // Leaves on the branch rustle with the swing.
  const leafStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${omega.value * 0.12}rad` }] }));

  // Sun drifts up slowly while the screen is open: the "rise".
  const sunY = useSharedValue(0);
  useEffect(() => {
    sunY.value = withTiming(1, { duration: 20000, easing: Easing.out(Easing.cubic) });
  }, [sunY]);
  const sunStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - sunY.value) * 120 }] }));

  return (
    <View style={styles.root}>
      {/* sky of the hour */}
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky.top} />
            <Stop offset="1" stopColor={sky.bottom} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#sky)" />
      </Svg>
      <Animated.View style={[styles.sunWrap, { top: height * 0.62 }, sunStyle]} pointerEvents="none">
        <Svg width={width * 1.3} height={width * 1.3}>
          <Circle cx={(width * 1.3) / 2} cy={(width * 1.3) / 2} r={(width * 1.3) / 2} fill={sky.sun} opacity={0.55} />
          <Circle cx={(width * 1.3) / 2} cy={(width * 1.3) / 2} r={(width * 1.3) / 2.6} fill={sky.sun} opacity={0.8} />
        </Svg>
      </Animated.View>

      {/* branch */}
      <View style={[styles.branch, { top: branchY - 9 }]} pointerEvents="none">
        <Animated.View style={[styles.leaf, { left: width * 0.12 }, leafStyle]} />
        <Animated.View style={[styles.leaf, styles.leafRight, { right: width * 0.16 }, leafStyle]} />
      </View>

      {/* Snooze, pinned at the grip point.
          Pivot trick that works on every platform: a square "swing frame" centred exactly on the grip
          point rotates around its own centre; Snooze sits inside it, offset so the hands land on that centre. */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.swingFrame, { width: frame, height: frame, left: width / 2 - frame / 2, top: branchY - frame / 2 }, swingStyle]}
      >
        <GestureDetector gesture={gestures}>
          <View style={[styles.sloth, { width: size, height: slothH, left: frame / 2 - grip.x, top: frame / 2 - grip.y }]}>
            <SnoozeBody size={size} eyes={eyes} mouth={mouth} />
            {/* cap wobbles around its own pivot with the same trick */}
            <Animated.View
              pointerEvents="none"
              style={[styles.swingFrame, { width: capFrame, height: capFrame, left: capPivot.x - capFrame / 2, top: capPivot.y - capFrame / 2 }, capStyle]}
            >
              <View style={{ position: 'absolute', left: capFrame / 2 - capPivot.x, top: capFrame / 2 - capPivot.y }}>
                <SnoozeCap size={size} />
              </View>
            </Animated.View>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <SnoozeArms size={size} />
            </View>
            <View style={[styles.zWrap, { left: size * 0.78, top: size * 0.12 }]} pointerEvents="none">
              <Animated.Text style={[styles.z, { fontSize: 18 }, z0]}>z</Animated.Text>
              <Animated.Text style={[styles.z, { fontSize: 24 }, z1]}>z</Animated.Text>
              <Animated.Text style={[styles.z, { fontSize: 30 }, z2]}>Z</Animated.Text>
            </View>
          </View>
        </GestureDetector>
      </Animated.View>

      {/* speech bubble when tapped */}
      <Animated.View style={[styles.bubble, { top: branchY + slothH - grip.y + 10 }, bubbleStyle]} pointerEvents="none">
        <Text style={styles.bubbleText}>Hello, wake up!!</Text>
      </Animated.View>

      {/* copy + button */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.brand}>Slothrise</Text>
        <Text style={styles.sub}>Tilt your phone. Give me a push.{'\n'}Tap me if you dare.</Text>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.98 }] }]}
          onPress={() => Haptics.selectionAsync().catch(() => {})}
        >
          <Text style={styles.ctaText}>Let’s get up</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.ink, overflow: 'hidden' },
  sunWrap: { position: 'absolute', alignSelf: 'center' },
  branch: {
    position: 'absolute',
    left: -20,
    right: -20,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7A4A35',
    borderWidth: 4,
    borderColor: BRAND.plum,
  },
  leaf: {
    position: 'absolute',
    top: -16,
    width: 30,
    height: 16,
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: '#3EE6B0',
    borderWidth: 3,
    borderColor: BRAND.plum,
    transformOrigin: 'bottom',
  },
  leafRight: { borderTopLeftRadius: 0, borderBottomRightRadius: 0, borderTopRightRadius: 16, borderBottomLeftRadius: 16 },
  sloth: { position: 'absolute' },
  swingFrame: { position: 'absolute' },
  zWrap: { position: 'absolute', flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  z: { color: '#FFF4E2', fontFamily: 'Fredoka_700Bold' },
  bubble: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#FFF4E2',
    borderRadius: 22,
    borderWidth: 4,
    borderColor: BRAND.plum,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  bubbleText: { fontFamily: 'Fredoka_700Bold', fontSize: 22, color: BRAND.plum },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, gap: 10, alignItems: 'center' },
  brand: { fontFamily: 'Fredoka_700Bold', fontSize: 46, color: '#FFF4E2', letterSpacing: -0.5 },
  sub: { fontFamily: 'Fredoka_500Medium', fontSize: 17, color: '#FFF4E2', textAlign: 'center', lineHeight: 23, opacity: 0.95 },
  cta: {
    marginTop: 8,
    alignSelf: 'stretch',
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontFamily: 'Fredoka_700Bold', fontSize: 19, color: BRAND.plum },
});
