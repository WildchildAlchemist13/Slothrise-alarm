// Ringing: the calmest screen in the app. Soft sunrise, the time, Snooze, one huge action.
// The chime loops; each beat nudges Snooze's swing and gives a soft buzz. Snooze is a text link that states its cost.
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useExclusiveGestures } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArtHangingSnooze, { type ArtEyes } from './ArtHangingSnooze';
import HoldButton from './HoldButton';
import { Icon, RisingSun, SkyGradient } from './Scenery';
import { TextButton } from './Tactile';
import { SOUNDS, useLoopingSound } from './sound';
import { useSwing } from './useSwing';
import { C, F } from './theme';
import type { Alarm } from './state';

const BEAT_MS = 1100;
const HAND = 'M9 11V5a2 2 0 0 1 4 0v6M13 10a2 2 0 0 1 4 0v3c0 4-3 7-6 7s-5-2-6-5l-1-3a1.6 1.6 0 0 1 2.8-1.5L9 13';

type Props = {
  /** the alarm that fired; null only if the schedule changed while it rang */
  alarm: Alarm | null;
  time: string;
  onWake: () => void;
  onSnooze: () => void;
};

export default function RingingScreen({ alarm, time, onWake, onSnooze }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const displayW = Math.min(width * 0.56, 230);
  const branchY = insets.top + height * 0.31;

  const swing = useSwing();
  const drag = useExclusiveGestures(swing.pan);
  const [eyes, setEyes] = useState<ArtEyes>('closed');
  const zzz = useSharedValue(1);
  const hold = useSharedValue(0);

  useLoopingSound(SOUNDS.chime, 1);

  // Each beat: a gentle nudge and a soft buzz. Firm, not frantic.
  useEffect(() => {
    let dir = 1;
    const id = setInterval(() => {
      swing.omega.value += dir * 0.8;
      dir = -dir;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, BEAT_MS);
    return () => clearInterval(id);
  }, [swing.omega]);

  // Eyes open as you hold: closed, then the art's sleepy eyes, then wide open.
  const eyesFromHold = useCallback((stage: number) => setEyes(stage === 0 ? 'closed' : stage === 1 ? 'art' : 'open'), []);
  useAnimatedReaction(
    () => (hold.value > 0.75 ? 2 : hold.value > 0.3 ? 1 : 0),
    (stage, prev) => {
      if (stage !== prev) scheduleOnRN(eyesFromHold, stage);
    },
  );

  const sun = width * 1.1;
  return (
    <View style={styles.root}>
      <SkyGradient id="ring" stops={[[0, C.lilac], [0.52, '#FFC6B0'], [1, '#FFD98A']]} />
      <RisingSun size={sun} style={{ left: (width - sun * 1.27) / 2, top: height - sun * 0.42 }} />

      <View style={[styles.top, { paddingTop: insets.top + 22 }]}>
        <Text style={styles.eyebrow}>HELLO, WAKE UP!!</Text>
        <Text style={styles.time}>{time || '—'}</Text>
        <Text style={styles.label}>{alarm?.label ?? 'Alarm'}</Text>
      </View>

      <ArtHangingSnooze width={width} displayW={displayW} branchY={branchY} swing={swing} eyes={eyes} mouth="art" zzz={zzz} gesture={drag} />

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <HoldButton
          label="Hold to wake up"
          onDone={onWake}
          progress={hold}
          icon={<Icon d={HAND} size={26} />}
          onHoldStart={() => (zzz.value = withTiming(0, { duration: 300 }))}
          onHoldCancel={() => (zzz.value = withTiming(1, { duration: 400 }))}
        />
        <TextButton
          label="Snooze 5 min"
          sub="Rings again in 5 minutes"
          onPress={onSnooze}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.lilac, overflow: 'hidden' },
  top: { alignItems: 'center' },
  eyebrow: { fontFamily: F.label, fontSize: 13, letterSpacing: 2.2, color: C.ink },
  time: { fontFamily: F.display, fontSize: 112, lineHeight: 118, color: C.ink },
  label: { fontFamily: F.displaySemi, fontSize: 21, color: C.ink },
  actions: { position: 'absolute', left: 22, right: 22, bottom: 0, gap: 6 },
});
