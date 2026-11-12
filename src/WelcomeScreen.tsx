// Welcome: Snooze hangs in a warm sky panel. Tilt, push or tap him. One clear way forward.
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useExclusiveGestures, useTapGesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArtHangingSnooze, { type ArtEyes, type ArtMouth } from './ArtHangingSnooze';
import { RisingSun } from './Scenery';
import { TactileButton, TextButton } from './Tactile';
import { useSwing } from './useSwing';
import { C, F, OUTLINE, R } from './theme';

export default function WelcomeScreen({ onStart, onTryAlarm }: { onStart: () => void; onTryAlarm: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const panelW = width - 40;
  const panelH = Math.min(height * 0.47, 420);
  const displayW = Math.min(panelW * 0.56, 220);

  const swing = useSwing();
  const [eyes, setEyes] = useState<ArtEyes>('closed');
  const [mouth, setMouth] = useState<ArtMouth>('art');
  const awake = useRef(false);
  const bubble = useSharedValue(0);
  const zzz = useSharedValue(1);

  const wake = useCallback(() => {
    if (awake.current) return;
    awake.current = true;
    setEyes('open');
    setMouth('open');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    bubble.value = withSequence(withSpring(1, { damping: 9 }), withTiming(1, { duration: 1600 }), withTiming(0, { duration: 250 }));
    zzz.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      setEyes('art');
      setMouth('art');
    }, 1900);
    setTimeout(() => {
      setEyes('closed');
      awake.current = false;
      zzz.value = withTiming(1, { duration: 600 });
    }, 3600);
  }, [bubble, zzz]);

  const tap = useTapGesture({
    maxDistance: 10,
    onActivate: () => {
      'worklet';
      swing.omega.value += 1.8;
      scheduleOnRN(wake);
    },
  });
  const gestures = useExclusiveGestures(swing.pan, tap);

  const eyesFromSpeed = useCallback((fast: boolean) => {
    if (!awake.current) setEyes(fast ? 'art' : 'closed');
  }, []);
  useAnimatedReaction(
    () => Math.abs(swing.omega.value) > 1.6,
    (fast, prev) => {
      if (fast !== prev) scheduleOnRN(eyesFromSpeed, fast);
    },
  );
  const bubbleStyle = useAnimatedStyle(() => ({ opacity: bubble.value, transform: [{ scale: 0.6 + 0.4 * bubble.value }] }));

  return (
    <View style={[styles.root, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 18 }]}>
      <View style={[styles.panel, { height: panelH }]}>
        <RisingSun size={panelW * 0.78} style={{ left: (panelW - panelW * 0.78 * 1.27) / 2, top: panelH * 0.52 }} />
        <ArtHangingSnooze width={panelW} displayW={displayW} branchY={56} swing={swing} eyes={eyes} mouth={mouth} zzz={zzz} gesture={gestures} />
        <Animated.View style={[styles.bubble, bubbleStyle]} pointerEvents="none">
          <Text style={styles.bubbleText}>Hello, wake up!!</Text>
        </Animated.View>
      </View>

      <View style={{ gap: 10, marginTop: 22 }}>
        <Text style={styles.h1}>Hello, wake up!!</Text>
        <Text style={styles.body}>I’m Snooze, the laziest alarm clock on earth. Let’s get you up anyway.</Text>
        <Text style={styles.hint}>Psst: tilt your phone, or give me a push.</Text>
      </View>

      <View style={{ marginTop: 'auto', gap: 4 }}>
        <TactileButton label="Get started" onPress={onStart} />
        <TextButton label="Try the alarm right now" onPress={onTryAlarm} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper, paddingHorizontal: 20 },
  panel: { borderRadius: R.xl, borderWidth: OUTLINE, borderColor: C.ink, backgroundColor: C.peach, overflow: 'hidden' },
  bubble: {
    position: 'absolute',
    right: 14,
    top: 14,
    backgroundColor: C.white,
    borderRadius: R.pill,
    borderWidth: OUTLINE,
    borderColor: C.ink,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  bubbleText: { fontFamily: F.display, fontSize: 17, color: C.ink },
  h1: { fontFamily: F.display, fontSize: 40, lineHeight: 44, color: C.ink },
  body: { fontFamily: F.body, fontSize: 17, lineHeight: 25, color: C.ink60 },
  hint: { fontFamily: F.bodyBold, fontSize: 14, color: C.link },
});
