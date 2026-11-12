// Wake win: Snooze lets go of the branch, lands with a squash, and hops with a streak flame.
// Confetti bursts, the streak ticks up, and today's cell fills in on the week strip.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SnoozeArms, SnoozeBody, SnoozeFlame, SnoozeHead, VIEWBOX } from './Snooze';
import { BRAND } from './sky';
import { ui } from './ui';

const START_STREAK = 6;
const DAYS = ['F', 'S', 'S', 'M', 'T', 'W', 'T'];
const COLORS = ['#FF4D8D', '#FFD93D', '#3EE6B0', '#FF8A3D', '#7B9CFF', '#FFF4E2'];

type Piece = { x0: number; y0: number; vx: number; vy: number; r0: number; vr: number; w: number; h: number; c: string };

function ConfettiPiece({ t, p }: { t: SharedValue<number>; p: Piece }) {
  const style = useAnimatedStyle(() => {
    const s = t.value;
    return {
      opacity: s <= 0 ? 0 : s < 2.4 ? 1 : Math.max(0, 1 - (s - 2.4) * 2),
      transform: [
        { translateX: p.x0 + p.vx * s },
        { translateY: p.y0 + p.vy * s + 520 * s * s },
        { rotate: `${p.r0 + p.vr * s}rad` },
      ],
    };
  });
  return <Animated.View pointerEvents="none" style={[styles.piece, { width: p.w, height: p.h, backgroundColor: p.c }, style]} />;
}

export default function WinScreen({ onAgain, onDone }: { onAgain: () => void; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const size = Math.min(width * 0.6, 260);
  const slothH = (size * VIEWBOX.h) / VIEWBOX.w;
  const slothTop = insets.top + height * 0.06;

  const drop = useSharedValue(-height * 0.5);
  const hop = useSharedValue(0);
  const squash = useSharedValue(1);
  const flame = useSharedValue(0);
  const confetti = useSharedValue(0);
  const reveal = useSharedValue(0);
  const todayCell = useSharedValue(0);
  const streakPop = useSharedValue(1);
  const [streak, setStreak] = useState(START_STREAK);

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: 48 }, (_, i) => {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const sp = 380 + Math.random() * 420;
        return {
          x0: width / 2,
          y0: slothTop + slothH * 0.35,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          r0: Math.random() * 6,
          vr: (Math.random() - 0.5) * 14,
          w: 7 + Math.random() * 6,
          h: 4 + Math.random() * 4,
          c: COLORS[i % COLORS.length],
        };
      }),
    [width, slothTop, slothH],
  );

  const onLand = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => {
      setStreak(START_STREAK + 1);
      streakPop.value = withSequence(withTiming(1.35, { duration: 140 }), withSpring(1, { damping: 7 }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, 450);
  }, [streakPop]);

  useEffect(() => {
    // 1. let go and fall
    drop.value = withTiming(0, { duration: 560, easing: Easing.in(Easing.quad) }, (done) => {
      if (!done) return;
      // 2. squash on landing, then spring back
      squash.value = withSequence(withTiming(0.72, { duration: 70 }), withSpring(1, { damping: 6, stiffness: 260 }));
      // 3. confetti, words, today's cell
      confetti.value = withTiming(3.2, { duration: 3200, easing: Easing.linear });
      reveal.value = withDelay(150, withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }));
      todayCell.value = withDelay(450, withSpring(1, { damping: 8 }));
      // 4. keep hopping
      hop.value = withDelay(
        650,
        withRepeat(
          withSequence(
            withTiming(-30, { duration: 320, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
          ),
          -1,
          false,
        ),
      );
      scheduleOnRN(onLand);
    });
    flame.value = withRepeat(withTiming(1, { duration: 180, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [drop, squash, confetti, reveal, todayCell, hop, flame, onLand]);

  const slothStyle = useAnimatedStyle(() => {
    // squash when touching the ground, stretch a little in the air
    const air = interpolate(hop.value, [-30, -8, 0], [1, 1.02, 0.93], Extrapolation.CLAMP);
    const sy = squash.value * air;
    const sx = 1 / Math.sqrt(sy);
    return {
      transform: [{ translateY: drop.value + hop.value + (slothH * (1 - sy)) / 2 }, { scaleX: sx }, { scaleY: sy }],
    };
  });
  const flameStyle = useAnimatedStyle(() => ({
    opacity: 0.85 + 0.15 * flame.value,
    transform: [{ translateY: -2 * flame.value }],
  }));
  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 24 }],
  }));
  const todayStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: todayCell.value }], opacity: todayCell.value }));
  const streakStyle = useAnimatedStyle(() => ({ transform: [{ scale: streakPop.value }] }));

  return (
    <View style={[ui.root, styles.bg]}>
      <View style={[styles.glow, { width: width * 1.2, height: width * 1.2, borderRadius: width * 0.6, top: -width * 0.45 }]} />

      <Animated.View style={[{ position: 'absolute', left: width / 2 - size / 2, top: slothTop, width: size, height: slothH }, slothStyle]}>
        <SnoozeBody size={size} />
        <View style={StyleSheet.absoluteFill}>
          <SnoozeHead size={size} eyes="happy" mouth="open" />
        </View>
        <View style={StyleSheet.absoluteFill}>
          <SnoozeArms size={size} pose="cheer" />
        </View>
        <Animated.View style={[StyleSheet.absoluteFill, flameStyle]}>
          <SnoozeFlame size={size} />
        </Animated.View>
      </Animated.View>

      {pieces.map((p, i) => (
        <ConfettiPiece key={i} t={confetti} p={p} />
      ))}

      <Animated.View style={[styles.content, { top: slothTop + slothH + 14 }, revealStyle]}>
        <Text style={styles.title}>You’re up.</Text>
        <Text style={styles.sub}>No snooze. That one counts.</Text>
        <View style={styles.card}>
          <Animated.Text style={[styles.streak, streakStyle]}>{streak} day streak</Animated.Text>
          <View style={styles.week}>
            {DAYS.map((d, i) => (
              <View key={i} style={styles.day}>
                {i < 6 ? (
                  <View style={[styles.cell, styles.cellDone]} />
                ) : (
                  <View style={[styles.cell, styles.cellEmpty]}>
                    <Animated.View style={[StyleSheet.absoluteFill, styles.cellToday, todayStyle]} />
                  </View>
                )}
                <Text style={[styles.dayText, i === 6 && { color: '#FBF7FF' }]}>{d}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.actions, { paddingBottom: insets.bottom + 20 }, revealStyle]}>
        <Pressable accessibilityRole="button" onPress={onAgain} style={({ pressed }) => [ui.ctaLight, pressed && ui.pressed]}>
          <Text style={ui.ctaLightText}>Ring me again</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onDone} style={styles.done}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: '#1A0F2E' },
  glow: { position: 'absolute', alignSelf: 'center', backgroundColor: '#7B4DFF', opacity: 0.45 },
  piece: { position: 'absolute', left: 0, top: 0, borderRadius: 2 },
  content: { position: 'absolute', left: 22, right: 22, alignItems: 'center', gap: 6 },
  title: { fontFamily: 'Fredoka_700Bold', fontSize: 46, color: '#FBF7FF' },
  sub: { fontFamily: 'Fredoka_500Medium', fontSize: 16, color: '#D9CFEA' },
  card: {
    marginTop: 12,
    alignSelf: 'stretch',
    backgroundColor: '#251A40',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,138,61,0.6)',
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  streak: { fontFamily: 'Fredoka_700Bold', fontSize: 30, color: '#FF8A3D' },
  week: { flexDirection: 'row', gap: 6, alignSelf: 'stretch' },
  day: { flex: 1, alignItems: 'center', gap: 4 },
  cell: { alignSelf: 'stretch', height: 30, borderRadius: 9, overflow: 'hidden' },
  cellDone: { backgroundColor: '#3EE6B0' },
  cellEmpty: { backgroundColor: '#3A2E5A' },
  cellToday: { backgroundColor: '#FFD34D', borderRadius: 9 },
  dayText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 12, color: '#B7AECF' },
  actions: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, gap: 6, alignItems: 'center' },
  done: { paddingVertical: 12, paddingHorizontal: 24 },
  doneText: { fontFamily: 'Fredoka_700Bold', fontSize: 17, color: '#FBF7FF' },
});
