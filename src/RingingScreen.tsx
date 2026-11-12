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
import ArtHangingSnooze, { artGeometry, type ArtEyes } from './ArtHangingSnooze';
import SkyBackground from './SkyBackground';
import { useSwing } from './useSwing';
import { BRAND, skyFor } from './sky';
import { ui } from './ui';
import HoldButton from './HoldButton';
import { SOUNDS, useLoopingSound } from './sound';

const ALARM = { hour: 7, minute: 15, label: 'Writing sprint' };
const BEAT_MS = 650;   // one alarm "ring"

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
  const displayW = Math.min(width * 0.56, 240);
  const branchY = insets.top + height * 0.29;
  const { feetBelowBranch } = artGeometry(displayW);

  const swing = useSwing();
  const drag = useExclusiveGestures(swing.pan);
  const [eyes, setEyes] = useState<ArtEyes>('closed');
  const zzz = useSharedValue(1);
  const hold = useSharedValue(0);

  // The alarm sound: the bright chime, looping at full volume until you're up.
  useLoopingSound(SOUNDS.chime, 1);

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

  // Eyes open as you hold: closed -> the art's sleepy eyes -> wide open.
  const eyesFromHold = useCallback((stage: number) => {
    setEyes(stage === 0 ? 'closed' : stage === 1 ? 'art' : 'open');
  }, []);
  useAnimatedReaction(
    () => (hold.value > 0.75 ? 2 : hold.value > 0.3 ? 1 : 0),
    (stage, prev) => {
      if (stage !== prev) scheduleOnRN(eyesFromHold, stage);
    },
  );

  // The time shakes with the ring, calming as you hold.
  const timeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${0.035 * (1 - hold.value) * Math.sin(swing.time.value * 26)}rad` }],
  }));

  const h12 = ALARM.hour % 12 || 12;
  const bodyCx = width / 2;
  const bodyCy = branchY + feetBelowBranch * 0.55;

  return (
    <View style={ui.root}>
      <SkyBackground sky={sky} sunTop={0.7} riseMs={60000} />
      <Ripple delay={0} size={displayW * 1.6} cx={bodyCx} cy={bodyCy} />
      <Ripple delay={700} size={displayW * 1.6} cx={bodyCx} cy={bodyCy} />
      <Ripple delay={1400} size={displayW * 1.6} cx={bodyCx} cy={bodyCy} />

      <View style={[styles.top, { paddingTop: insets.top + 26 }]}>
        <Text style={styles.eyebrow}>HELLO, WAKE UP!!</Text>
        <Animated.Text style={[styles.time, timeStyle]}>
          {h12}:{String(ALARM.minute).padStart(2, '0')}
        </Animated.Text>
        <Text style={styles.label}>{ALARM.label}</Text>
      </View>

      <ArtHangingSnooze width={width} displayW={displayW} branchY={branchY} swing={swing} eyes={eyes} mouth="art" zzz={zzz} gesture={drag} />

      <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
        <HoldButton
          label="Hold to wake up"
          onDone={onWake}
          progress={hold}
          onHoldStart={() => (zzz.value = withTiming(0, { duration: 300 }))}
          onHoldCancel={() => (zzz.value = withTiming(1, { duration: 400 }))}
        />
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
