// Welcome screen: Snooze hangs from a branch under the sky of the hour.
// Tilt the phone and Snooze swings. Drag to push. Tap to wake.
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useExclusiveGestures, useTapGesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArtHangingSnooze, { artGeometry, type ArtEyes, type ArtMouth } from './ArtHangingSnooze';
import SkyBackground from './SkyBackground';
import { useSwing } from './useSwing';
import { BRAND, skyFor } from './sky';
import { ui } from './ui';

export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sky = skyFor();
  const displayW = Math.min(width * 0.64, 270);
  const branchY = insets.top + height * 0.13;
  const { feetBelowBranch } = artGeometry(displayW);

  const swing = useSwing();
  const [eyes, setEyes] = useState<ArtEyes>('closed');
  const [mouth, setMouth] = useState<ArtMouth>('art');
  const [awake, setAwake] = useState(false);
  const awakeRef = useRef(false); // read by gesture callbacks, which can hold stale state
  const bubble = useSharedValue(0);
  const zzz = useSharedValue(1);

  const wake = useCallback(() => {
    if (awakeRef.current) return;
    awakeRef.current = true;
    setAwake(true);
    setEyes('open');
    setMouth('open');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    bubble.value = withSequence(withSpring(1, { damping: 9 }), withTiming(1, { duration: 1600 }), withTiming(0, { duration: 250 }));
    zzz.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      setEyes('art'); // back to the sleepy face in the art
      setMouth('art');
    }, 1900);
    setTimeout(() => {
      setEyes('closed');
      awakeRef.current = false;
      setAwake(false);
      zzz.value = withTiming(1, { duration: 600 });
    }, 3600);
  }, [bubble, zzz]);

  const tap = useTapGesture({
    maxDistance: 10, // a drag is never a tap
    onActivate: () => {
      'worklet';
      swing.omega.value += 1.8; // a little startled jolt
      scheduleOnRN(wake);
    },
  });
  const gestures = useExclusiveGestures(swing.pan, tap);

  // Fast swings crack the eyes open into the sleepy face from the art, then they drift shut again.
  const setEyesFromSpeed = useCallback(
    (fast: boolean) => {
      if (!awakeRef.current) setEyes(fast ? 'art' : 'closed');
    },
    [],
  );
  useAnimatedReaction(
    () => Math.abs(swing.omega.value) > 1.6,
    (fast, prev) => {
      if (fast !== prev) scheduleOnRN(setEyesFromSpeed, fast);
    },
  );

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubble.value,
    transform: [{ scale: 0.6 + 0.4 * bubble.value }, { translateY: (1 - bubble.value) * 12 }],
  }));

  return (
    <View style={ui.root}>
      <SkyBackground sky={sky} />
      <ArtHangingSnooze width={width} displayW={displayW} branchY={branchY} swing={swing} eyes={eyes} mouth={mouth} zzz={zzz} gesture={gestures} />
      <Animated.View style={[ui.bubble, { top: branchY + feetBelowBranch + 10 }, bubbleStyle]} pointerEvents="none">
        <Text style={ui.bubbleText}>Hello, wake up!!</Text>
      </Animated.View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={[styles.brand, { color: sky.ink }]}>Slothrise</Text>
        <Text style={[styles.sub, { color: sky.ink }]}>Tilt your phone. Give me a push.{'\n'}Tap me if you dare.</Text>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [ui.ctaLight, pressed && ui.pressed]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onStart();
          }}
        >
          <Text style={ui.ctaLightText}>Let’s get up</Text>
        </Pressable>
        <Text style={[styles.hint, { color: sky.ink }]}>Plays a demo alarm</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, gap: 10, alignItems: 'center' },
  brand: { fontFamily: 'Fredoka_700Bold', fontSize: 46, color: '#FFF4E2', letterSpacing: -0.5 },
  sub: { fontFamily: 'Fredoka_500Medium', fontSize: 17, color: '#FFF4E2', textAlign: 'center', lineHeight: 23 },
  hint: { fontFamily: 'Fredoka_500Medium', fontSize: 13, color: BRAND.plum, opacity: 0.75 },
});
