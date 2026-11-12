// Ringing: the alarm jolts Snooze on every beat, rings pulse out from behind it, and the time shakes.
// Hold the button to wake up. Snooze's eyes open as you hold.
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { useExclusiveGestures } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HangingSnooze, { snoozeGeometry } from './HangingSnooze';
import SkyBackground from './SkyBackground';
import { useSwing } from './useSwing';
import type { Eyes } from './Snooze';
import { BRAND, skyFor } from './sky';
import { ui } from './ui';

const ALARM = { hour: 7, minute: 15, label: 'Writing sprint' };
const BEAT_MS = 650;   // one alarm "ring"
const HOLD_MS = 1100;  // how long to hold to wake

function Ripple({ delay, size, cx, cy }: { delay: number; size: number; cx: number; cy: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    const t = setTimeout(() => {
      p.value = withRepeat(withTiming(1, { duration: 2100, easing: Easing.out(Easing.quad) }), -1, false);
    }, delay);
    return () => clearTimeout(t);
  }, [p, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - p.value),
    transform: [{ scale: 0.45 + p.value * 1.25 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ripple, { width: size, height: size, borderRadius: size / 2, left: cx - size / 2, top: cy - size / 2 }, style]}
    />
  );
}

export default function RingingScreen({ onWake, onSnooze }: { onWake: () => void; onSnooze: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const alarmAt = new Date();
  alarmAt.setHours(ALARM.hour, ALARM.minute, 0, 0);
  const sky = skyFor(alarmAt);
  const size = Math.min(width * 0.62, 270);
  const branchY = insets.top + height * 0.3;
  const { feetY } = snoozeGeometry(size);

  const swing = useSwing();
  const drag = useExclusiveGestures(swing.pan);
  const [eyes, setEyes] = useState<Eyes>('closed');
  const zzz = useSharedValue(1);
  const hold = useSharedValue(0);

  // The alarm: each beat kicks the swing the other way and buzzes the phone.
  useEffect(() => {
    let dir = 1;
    const id = setInterval(() => {
      swing.omega.value += dir * 1.5;
      dir = -dir;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, BEAT_MS);
    return () => clearInterval(id);
  }, [swing.omega]);

  // Eyes open as you hold: closed -> sleepy logo eyes -> wide open.
  const eyesFromHold = useCallback((stage: number) => {
    setEyes(stage === 0 ? 'closed' : stage === 1 ? 'logo' : 'open');
  }, []);
  useAnimatedReaction(
    () => (hold.value > 0.75 ? 2 : hold.value > 0.3 ? 1 : 0),
    (stage, prev) => {
      if (stage !== prev) scheduleOnRN(eyesFromHold, stage);
    },
  );

  const finish = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onWake();
  }, [onWake]);
  const startHold = () => {
    zzz.value = withTiming(0, { duration: 300 });
    hold.value = withTiming(1, { duration: HOLD_MS * (1 - hold.value), easing: Easing.linear }, (done) => {
      if (done) scheduleOnRN(finish);
    });
  };
  const endHold = () => {
    if (hold.value < 1) {
      hold.value = withTiming(0, { duration: 250 });
      zzz.value = withTiming(1, { duration: 400 });
    }
  };

  const fillStyle = useAnimatedStyle(() => ({ width: `${hold.value * 100}%` }));
  // The time shakes with the ring, calming as you hold.
  const timeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${0.035 * (1 - hold.value) * Math.sin(swing.time.value * 26)}rad` }],
  }));

  const h12 = ALARM.hour % 12 || 12;
  const bodyCx = width / 2;
  const bodyCy = branchY + feetY * 0.55;

  return (
    <View style={ui.root}>
      <SkyBackground sky={sky} sunTop={0.7} riseMs={60000} />
      <Ripple delay={0} size={size * 1.5} cx={bodyCx} cy={bodyCy} />
      <Ripple delay={700} size={size * 1.5} cx={bodyCx} cy={bodyCy} />
      <Ripple delay={1400} size={size * 1.5} cx={bodyCx} cy={bodyCy} />

      <View style={[styles.top, { paddingTop: insets.top + 26 }]}>
        <Text style={styles.eyebrow}>HELLO, WAKE UP!!</Text>
        <Animated.Text style={[styles.time, timeStyle]}>
          {h12}:{String(ALARM.minute).padStart(2, '0')}
        </Animated.Text>
        <Text style={styles.label}>{ALARM.label}</Text>
      </View>

      <HangingSnooze width={width} size={size} branchY={branchY} swing={swing} eyes={eyes} mouth="logo" zzz={zzz} gesture={drag} />

      <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hold to wake up"
          onPressIn={startHold}
          onPressOut={endHold}
          style={ui.ctaDark}
        >
          <Animated.View style={[styles.fill, fillStyle]} />
          <Text style={ui.ctaDarkText}>Hold to wake up</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onSnooze} style={({ pressed }) => [styles.snooze, pressed && ui.pressed]}>
          <Text style={styles.snoozeText}>Snooze 5 min</Text>
          <Text style={styles.snoozeSub}>Your streak is at risk</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ripple: { position: 'absolute', borderWidth: 4, borderColor: 'rgba(60,10,47,0.45)' },
  top: { alignItems: 'center' },
  eyebrow: { fontFamily: 'Fredoka_700Bold', fontSize: 14, letterSpacing: 2.5, color: BRAND.plum },
  time: { fontFamily: 'Fredoka_700Bold', fontSize: 104, lineHeight: 112, color: BRAND.plum },
  label: { fontFamily: 'Fredoka_600SemiBold', fontSize: 22, color: BRAND.plum },
  actions: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, gap: 12 },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#FF8A3D' },
  snooze: {
    height: 58,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: BRAND.plum,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snoozeText: { fontFamily: 'Fredoka_700Bold', fontSize: 17, color: BRAND.plum },
  snoozeSub: { fontFamily: 'Fredoka_500Medium', fontSize: 12, color: BRAND.plum },
});
