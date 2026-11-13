// Gentle mode: a sunrise, not a siren.
// Night lifts into dawn while soft bells rise from a whisper and Snooze yawns awake.
// Get up any time with "I'm up". Still in bed when the backup kicks in? The full alarm takes over.
import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HoldButton from './HoldButton';
import { RisingSun, SkyGradient } from './Scenery';
import { SOUNDS, useLoopingSound, useOneShot } from './sound';
import { clock, type Alarm } from './state';
import { C, F, POSE_RATIO, POSES } from './theme';

// Product timings: a three-minute sunrise, then the full alarm at five minutes.
export const SUNRISE_S = 180;
export const BACKUP_S = 300;
// Demo timings, used only by the dev-only "Play the Gentle sunrise" shortcut so the whole arc
// is visible in half a minute. Never used by a real alarm.
export const DEMO_SUNRISE_S = 15;
export const DEMO_BACKUP_S = 30;
const MIN_VOLUME = 0.06;

export default function GentleScreen({ alarm, onWake, onEscalate, demo = false }: { alarm: Alarm | null; onWake: () => void; onEscalate: () => void; demo?: boolean }) {
  const sunriseS = demo ? DEMO_SUNRISE_S : SUNRISE_S;
  const backupS = demo ? DEMO_BACKUP_S : BACKUP_S;
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sunrise = useSharedValue(0); // 0 = night, 1 = dawn
  const breathe = useSharedValue(0);
  const [secondsLeft, setSecondsLeft] = useState(backupS);
  const [percent, setPercent] = useState(0);

  useOneShot(SOUNDS.yawn, 0.7);
  const bells = useLoopingSound(SOUNDS.bells, MIN_VOLUME);

  const escalated = useRef(false);
  useEffect(() => {
    sunrise.value = withTiming(1, { duration: sunriseS * 1000, easing: Easing.inOut(Easing.sin) });
    breathe.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
    const start = Date.now();
    const id = setInterval(() => {
      const el = (Date.now() - start) / 1000;
      const p = Math.min(1, el / sunriseS);
      try {
        bells.volume = MIN_VOLUME + (1 - MIN_VOLUME) * p;
      } catch {
        // player released while leaving the screen
      }
      setPercent(Math.round(p * 100));
      setSecondsLeft(Math.max(0, Math.ceil(backupS - el)));
      if (el >= backupS && !escalated.current) {
        escalated.current = true;
        onEscalate();
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sunriseS, backupS]);

  const nightStyle = useAnimatedStyle(() => ({ opacity: 0.85 * (1 - sunrise.value) }));
  const sunStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - sunrise.value) * 160 }] }));
  const poseStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -4 * breathe.value }, { scaleY: 1 + 0.025 * breathe.value }] }));
  const barStyle = useAnimatedStyle(() => ({ width: `${sunrise.value * 100}%` }));

  const poseW = Math.min(width * 0.58, 230);
  const sun = width * 1.1;
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <View style={styles.root}>
      <SkyGradient id="gentle" stops={[[0, '#3B2A63'], [0.45, '#B86A7E'], [1, '#FFB27A']]} />
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, sunStyle]} pointerEvents="none">
        <RisingSun size={sun} style={{ left: (width - sun * 1.27) / 2, top: height - sun * 0.36 }} />
      </Animated.View>
      {/* night that lifts as the sun comes up */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: C.night }, nightStyle]} />

      <View style={[styles.top, { paddingTop: insets.top + 22 }]}>
        <Text style={styles.eyebrow}>EASY NOW, SLEEPYHEAD</Text>
        {/* The real next alarm, or nothing at all — never a time the user did not set. */}
        {alarm ? (
          <>
            <Text style={styles.time}>
              {clock(alarm.hour, alarm.minute).time}
              <Text style={styles.ampm}> {clock(alarm.hour, alarm.minute).ampm}</Text>
            </Text>
            <Text style={styles.label}>{alarm.label}</Text>
          </>
        ) : (
          <>
            <Text style={styles.label}>Gentle sunrise</Text>
            <Text style={styles.note}>No alarm is on, so this is only the preview.</Text>
          </>
        )}
      </View>

      <Animated.View style={[{ alignSelf: 'center', marginTop: 18 }, poseStyle]}>
        <Image source={POSES.yawn} style={{ width: poseW, height: poseW / POSE_RATIO.yawn }} accessibilityLabel="Snooze yawning and stretching" />
      </Animated.View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>Sunrise {percent}%</Text>
            <Text style={[styles.progressText, { color: C.sun }]}>
              Full alarm in {mm}:{ss}
            </Text>
          </View>
          <View style={styles.track}>
            <Animated.View style={[styles.bar, barStyle]} />
          </View>
          <Text style={styles.progressSub}>Getting brighter and a little louder. No rush.</Text>
        </View>
        <HoldButton label="I’m up · hold" onDone={onWake} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.night, overflow: 'hidden' },
  top: { alignItems: 'center' },
  eyebrow: { fontFamily: F.label, fontSize: 13, letterSpacing: 2.2, color: C.sun },
  time: { fontFamily: F.display, fontSize: 104, lineHeight: 110, color: C.moon },
  ampm: { fontSize: 30 },
  label: { fontFamily: F.displaySemi, fontSize: 20, color: C.moon },
  note: { fontFamily: F.bodyBold, fontSize: 14, color: C.dim, marginTop: 2, textAlign: 'center' },
  actions: { position: 'absolute', left: 22, right: 22, bottom: 0, gap: 12 },
  progressCard: { backgroundColor: 'rgba(26,20,48,0.8)', borderRadius: 20, padding: 14, gap: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontFamily: F.label, fontSize: 14, color: C.moon },
  track: { height: 10, borderRadius: 6, backgroundColor: C.nightLine, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 6, backgroundColor: C.sun },
  progressSub: { fontFamily: F.bodyBold, fontSize: 13, color: C.dim },
});
