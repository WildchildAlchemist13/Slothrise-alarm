// The branch plus Snooze hanging from it, swinging with the shared physics.
// Pivot trick that works on every platform: a square "swing frame" centred exactly on the grip point
// rotates around its own centre; Snooze sits inside it, offset so the hands land on that centre.
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector, type ComposedGesture } from 'react-native-gesture-handler';
import { GRIP, HEAD_PIVOT, SnoozeArms, SnoozeBody, SnoozeHead, toPx, VIEWBOX, type Eyes, type Mouth } from './Snooze';
import type { Swing } from './useSwing';
import { BRAND } from './sky';

type Props = {
  width: number;          // screen width
  size: number;           // Snooze width in px
  branchY: number;        // y of the branch centre
  swing: Swing;
  eyes: Eyes;
  mouth: Mouth;
  zzz: SharedValue<number>; // 0..1 visibility of the floating Z's
  gesture: ComposedGesture; // wrap a single gesture with useExclusiveGestures(g)
};

export function snoozeGeometry(size: number) {
  const slothH = (size * VIEWBOX.h) / VIEWBOX.w;
  const grip = toPx(GRIP, size);
  return { slothH, grip, feetY: slothH - grip.y };
}

export default function HangingSnooze({ width, size, branchY, swing, eyes, mouth, zzz, gesture }: Props) {
  const { slothH, grip } = snoozeGeometry(size);
  const headPivot = toPx(HEAD_PIVOT, size);
  const frame = 2 * Math.max(slothH - grip.y, size) + 20;
  const headFrame = 2 * size;

  const swingStyle = useAnimatedStyle(() => {
    const breathe = 0.015 * Math.sin(swing.time.value * 1.3); // gentle bob in place
    return { transform: [{ rotate: `${swing.theta.value + breathe}rad` }] };
  });
  // The head lags the body a little, wobbling on the neck.
  const headStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${swing.capPhi.value * 0.6}rad` }] }));
  const leafStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${swing.omega.value * 0.12}rad` }] }));

  // Floating Z's.
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

  return (
    <>
      <View style={[styles.branch, { top: branchY - 9 }]} pointerEvents="none">
        <Animated.View style={[styles.leaf, { left: width * 0.12 }, leafStyle]} />
        <Animated.View style={[styles.leaf, styles.leafRight, { right: width * 0.16 }, leafStyle]} />
      </View>
      <Animated.View
        pointerEvents="box-none"
        style={[styles.frame, { width: frame, height: frame, left: width / 2 - frame / 2, top: branchY - frame / 2 }, swingStyle]}
      >
        <GestureDetector gesture={gesture}>
          <View style={[styles.frame, { width: size, height: slothH, left: frame / 2 - grip.x, top: frame / 2 - grip.y }]}>
            <SnoozeBody size={size} />
            <Animated.View
              pointerEvents="none"
              style={[styles.frame, { width: headFrame, height: headFrame, left: headPivot.x - headFrame / 2, top: headPivot.y - headFrame / 2 }, headStyle]}
            >
              <View style={{ position: 'absolute', left: headFrame / 2 - headPivot.x, top: headFrame / 2 - headPivot.y }}>
                <SnoozeHead size={size} eyes={eyes} mouth={mouth} />
              </View>
            </Animated.View>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <SnoozeArms size={size} pose="hang" />
            </View>
            <View style={[styles.zWrap, { left: size * 0.78, top: size * 0.12 }]} pointerEvents="none">
              <Animated.Text style={[styles.z, { fontSize: 18 }, z0]}>z</Animated.Text>
              <Animated.Text style={[styles.z, { fontSize: 24 }, z1]}>z</Animated.Text>
              <Animated.Text style={[styles.z, { fontSize: 30 }, z2]}>Z</Animated.Text>
            </View>
          </View>
        </GestureDetector>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  frame: { position: 'absolute' },
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
  },
  leafRight: { borderTopLeftRadius: 0, borderBottomRightRadius: 0, borderTopRightRadius: 16, borderBottomLeftRadius: 16 },
  zWrap: { position: 'absolute', flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  z: { color: '#FFF4E2', fontFamily: 'Fredoka_700Bold' },
});
