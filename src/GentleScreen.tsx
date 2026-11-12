// Gentle mode: a sunrise, not a siren.
// The screen starts dark and brightens into the sky of the hour while soft bells rise from a whisper.
// Get up any time with "I'm up". Still in bed when the backup kicks in? The full alarm takes over.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useExclusiveGestures } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArtHangingSnooze, { artGeometry, type ArtEyes } from './ArtHangingSnooze';
import HoldButton from './HoldButton';
import SkyBackground from './SkyBackground';
import { SOUNDS, useLoopingSound, useOneShot } from './sound';
import { useSwing } from './useSwing';
import { BRAND, skyFor } from './sky';
import { ui } from './ui';

// Demo timings so you can feel the whole thing quickly. In the real app: sunrise 180 s, backup 300 s.
export const SUNRISE_S = 15;
export const BACKUP_S = 30;
const MIN_VOLUME = 0.06;

const ALARM = { hour: 9, minute: 0, label: 'Weekend slow start' };

export default function GentleScreen({ onWake, onEscalate }: { onWake: () => void; onEscalate: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const alarmAt = new Date();
  alarmAt.setHours(ALARM.hour, ALARM.minute, 0, 0);
  const sky = skyFor(alarmAt);
  const displayW = Math.min(width * 0.56, 240);
  const branchY = insets.top + height * 0.3;

  const swing = useSwing();
  const drag = useExclusiveGestures(swing.pan);
  const [eyes, setEyes] = useState<ArtEyes>('closed');
  const zzz = useSharedValue(1);
  const sunrise = useSharedValue(0); // 0 = dark, 1 = full sky
  const [secondsLeft, setSecondsLeft] = useState(BACKUP_S);
  const [percent, setPercent] = useState(0);

  // Sound: Snooze yawns, then the bells fade in from a whisper.
  useOneShot(SOUNDS.yawn, 0.7);
  const bells = useLoopingSound(SOUNDS.bells, MIN_VOLUME);

  const escalated = useRef(false);
  useEffect(() => {
    sunrise.value = withTiming(1, { duration: SUNRISE_S * 1000, easing: Easing.inOut(Easing.sin) });
    const start = Date.now();
    const id = setInterval(() => {
      const el = (Date.now() - start) / 1000;
      const p = Math.min(1, el / SUNRISE_S);
      try {
        bells.volume = MIN_VOLUME + (1 - MIN_VOLUME) * p;
      } catch {
        // player released while leaving the screen
      }
      setPercent(Math.round(p * 100));
      setSecondsLeft(Math.max(0, Math.ceil(BACKUP_S - el)));
      if (el >= BACKUP_S && !escalated.current) {
        escalated.current = true;
        onEscalate();
      }
    }, 250);
    // A slow, sleepy sway instead of the alarm's jolts.
    let dir = 1;
    const sway = setInterval(() => {
      swing.omega.value += dir * 0.35;
      dir = -dir;
    }, 2600);
    return () => {
      clearInterval(id);
      clearInterval(sway);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Eyes drift open as the sky brightens.
  const eyesFromLight = useCallback((open: boolean) => {
    setEyes(open ? 'art' : 'closed');
    zzz.value = withTiming(open ? 0 : 1, { duration: 800 });
  }, [zzz]);
  useAnimatedReaction(
    () => sunrise.value > 0.5,
    (open, prev) => {
      if (open !== prev) scheduleOnRN(eyesFromLight, open);
    },
  );

  const darkStyle = useAnimatedStyle(() => ({ opacity: 0.9 * (1 - sunrise.value) }));
  // Text is cream while it's dark and turns plum once the sky is bright.
  const inkStyle = useAnimatedStyle(() => ({
    color: interpolateColor(sunrise.value, [0, 0.5, 0.56], ['#FFF4E2', '#FFF4E2', BRAND.plum]),
  }));
  const barStyle = useAnimatedStyle(() => ({ width: `${sunrise.value * 100}%` }));

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <View style={ui.root}>
      <SkyBackground sky={sky} sunTop={0.66} riseMs={SUNRISE_S * 1000} />
      <ArtHangingSnooze width={width} displayW={displayW} branchY={branchY} swing={swing} eyes={eyes} mouth="art" zzz={zzz} gesture={drag} />
      {/* night over everything except the controls; fades away as the sun comes up */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dark, darkStyle]} />

      <View style={[styles.top, { paddingTop: insets.top + 26 }]} pointerEvents="none">
        <Animated.Text style={[styles.eyebrow, inkStyle]}>EASY NOW, SLEEPYHEAD</Animated.Text>
        <Animated.Text style={[styles.time, inkStyle]}>
          {ALARM.hour % 12 || 12}:{String(ALARM.minute).padStart(2, '0')}
        </Animated.Text>
        <Animated.Text style={[styles.label, inkStyle]}>{ALARM.label}</Animated.Text>
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>Sunrise {percent}%</Text>
            <Text style={[styles.progressText, { color: '#FFD34D' }]}>
              Mission in {mm}:{ss}
            </Text>
          </View>
          <View style={styles.track}>
            <Animated.View style={[styles.bar, barStyle]} />
          </View>
          <Text style={styles.progressSub}>Brighter and a little louder every few seconds</Text>
        </View>
        <HoldButton label="I’m up · hold" onDone={onWake} fillColor="#FFB50C" />
        <Animated.Text style={[styles.note, inkStyle]}>Getting up now counts for your streak. No mission needed.</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dark: { backgroundColor: '#0B0820' },
  top: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  eyebrow: { fontFamily: 'Fredoka_700Bold', fontSize: 14, letterSpacing: 2.5 },
  time: { fontFamily: 'Fredoka_700Bold', fontSize: 104, lineHeight: 112 },
  label: { fontFamily: 'Fredoka_600SemiBold', fontSize: 22 },
  actions: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, gap: 12 },
  progressCard: { backgroundColor: 'rgba(14,11,26,0.72)', borderRadius: 18, padding: 14, gap: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 15, color: '#FBF7FF' },
  track: { height: 8, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 5, backgroundColor: '#FFB50C' },
  progressSub: { fontFamily: 'Fredoka_500Medium', fontSize: 12.5, color: '#D9CFEA' },
  note: { fontFamily: 'Fredoka_600SemiBold', fontSize: 13, textAlign: 'center' },
});
