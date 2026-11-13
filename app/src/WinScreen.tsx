// Wake win: the earned moment. A sunburst turns behind Snooze, who drops in cheering and keeps hopping.
// Confetti bursts, the streak ticks up, today's cell fills, and the routine is the next step.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
import Svg, { Circle, Path } from 'react-native-svg';
import { Icon } from './Scenery';
import { Card, TactileButton, TextButton } from './Tactile';
import { dayKey, weekDays } from './state';
import { C, F, OUTLINE, POSE_RATIO, POSES } from './theme';

const COLORS = [C.sunrise, C.sun, C.leaf, C.sky, C.lilac];
const FLAME = 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z';

type Piece = { x0: number; y0: number; vx: number; vy: number; r0: number; vr: number; c: string };

function ConfettiPiece({ t, p }: { t: SharedValue<number>; p: Piece }) {
  const style = useAnimatedStyle(() => {
    const s = t.value;
    return {
      opacity: s <= 0 ? 0 : s < 2.4 ? 1 : Math.max(0, 1 - (s - 2.4) * 2),
      transform: [{ translateX: p.x0 + p.vx * s }, { translateY: p.y0 + p.vy * s + 520 * s * s }, { rotate: `${p.r0 + p.vr * s}rad` }],
    };
  });
  return <Animated.View pointerEvents="none" style={[styles.piece, { backgroundColor: p.c }, style]} />;
}

/** Sunburst: alternating sun-coloured wedges in an outlined circle. */
function Sunburst({ size }: { size: number }) {
  const r = size / 2;
  const wedges = Array.from({ length: 15 }, (_, i) => {
    const a0 = (i * 2 * Math.PI) / 15, a1 = a0 + Math.PI / 15;
    return `M${r} ${r}L${r + r * Math.cos(a0)} ${r + r * Math.sin(a0)}A${r} ${r} 0 0 1 ${r + r * Math.cos(a1)} ${r + r * Math.sin(a1)}Z`;
  });
  return (
    <Svg width={size} height={size}>
      <Circle cx={r} cy={r} r={r - 1.5} fill={C.sunSoft} />
      {wedges.map((d, i) => (
        <Path key={i} d={d} fill={C.sun} />
      ))}
      <Circle cx={r} cy={r} r={r - 1.5} fill="none" stroke={C.ink} strokeWidth={OUTLINE} />
      <Circle cx={r} cy={r} r={r * 0.6} fill={C.sun} stroke={C.ink} strokeWidth={OUTLINE} />
    </Svg>
  );
}

export default function WinScreen({ streak: streakNow, best, wins, onRoutine, onDone }: { streak: number; best: number; wins: string[]; onRoutine: () => void; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  // The same Monday-based week and the same win dates HomeScreen reads, so the two screens cannot disagree.
  const week = useMemo(() => weekDays(), []);
  const todayKey = dayKey();
  const insets = useSafeAreaInsets();
  const burst = Math.min(width * 0.72, 290);
  const poseW = burst * 0.78;
  const poseH = poseW / POSE_RATIO.celebrate;
  const stageTop = insets.top + 18;

  const drop = useSharedValue(-height * 0.5);
  const hop = useSharedValue(0);
  const squash = useSharedValue(1);
  const spin = useSharedValue(0);
  const confetti = useSharedValue(0);
  const reveal = useSharedValue(0);
  const today = useSharedValue(0);
  const pop = useSharedValue(1);
  const [streak, setStreak] = useState(Math.max(0, streakNow - 1));

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: 44 }, (_, i) => {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, sp = 380 + Math.random() * 420;
        return { x0: width / 2, y0: stageTop + burst * 0.45, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r0: Math.random() * 6, vr: (Math.random() - 0.5) * 14, c: COLORS[i % COLORS.length] };
      }),
    [width, stageTop, burst],
  );

  const onLand = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => {
      setStreak(streakNow);
      pop.value = withSequence(withTiming(1.3, { duration: 140 }), withSpring(1, { damping: 7 }));
    }, 450);
  }, [pop, streakNow]);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 24000, easing: Easing.linear }), -1, false);
    drop.value = withTiming(0, { duration: 520, easing: Easing.in(Easing.quad) }, (done) => {
      if (!done) return;
      squash.value = withSequence(withTiming(0.74, { duration: 70 }), withSpring(1, { damping: 6, stiffness: 260 }));
      confetti.value = withTiming(3.2, { duration: 3200, easing: Easing.linear });
      reveal.value = withDelay(150, withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }));
      today.value = withDelay(450, withSpring(1, { damping: 8 }));
      hop.value = withDelay(700, withRepeat(withSequence(withTiming(-22, { duration: 340, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 340, easing: Easing.in(Easing.quad) })), -1, false));
      scheduleOnRN(onLand);
    });
  }, [drop, squash, confetti, reveal, today, hop, spin, onLand]);

  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const poseStyle = useAnimatedStyle(() => {
    const air = interpolate(hop.value, [-22, -6, 0], [1, 1.02, 0.94], Extrapolation.CLAMP);
    const sy = squash.value * air;
    return { transform: [{ translateY: drop.value + hop.value + (poseH * (1 - sy)) / 2 }, { scaleX: 1 / Math.sqrt(sy) }, { scaleY: sy }] };
  });
  const revealStyle = useAnimatedStyle(() => ({ opacity: reveal.value, transform: [{ translateY: (1 - reveal.value) * 20 }] }));
  const todayStyle = useAnimatedStyle(() => ({ opacity: today.value, transform: [{ scaleY: today.value }] }));
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <View style={[styles.root, { paddingTop: stageTop, paddingBottom: insets.bottom + 18 }]}>
      <View style={{ width: burst, height: burst, alignSelf: 'center' }}>
        <Animated.View style={[StyleSheet.absoluteFill, spinStyle]}>
          <Sunburst size={burst} />
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', left: (burst - poseW) / 2, top: burst - poseH + 6, width: poseW, height: poseH }, poseStyle]}>
          <Image source={POSES.celebrate} style={{ width: poseW, height: poseH }} accessibilityLabel="Snooze celebrating with both arms up" />
        </Animated.View>
      </View>
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} t={confetti} p={p} />
      ))}

      <Animated.View style={[{ alignItems: 'center', gap: 4, marginTop: 14 }, revealStyle]}>
        <Text style={styles.h1}>You’re up.</Text>
        <Text style={styles.sub}>No snooze. That one counts.</Text>
      </Animated.View>

      <Animated.View style={[{ marginTop: 16 }, revealStyle]}>
        <Card>
          <View style={styles.streakRow}>
            <Animated.View style={[styles.streakTitle, popStyle]}>
              <Icon d={FLAME} size={28} color={C.ink} width={2.2} />
              <Text style={styles.streakText}>{streak} day streak</Text>
            </Animated.View>
            {best > 0 ? (
              <View style={styles.best}>
                <Text style={styles.bestText}>Best: {best}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.week}>
            {week.map((key) => {
              const won = wins.includes(key);
              const isToday = key === todayKey;
              return (
                <View key={key} style={styles.day}>
                  <View style={[styles.cell, { backgroundColor: won && !isToday ? C.leaf : C.oat }]}>
                    {won && isToday ? (
                      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.leaf, borderRadius: 8 }, todayStyle]} />
                    ) : null}
                  </View>
                  <Text style={styles.dayText}>{new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      </Animated.View>

      <Animated.View style={[{ marginTop: 'auto', gap: 4 }, revealStyle]}>
        <TactileButton label="Start morning routine" onPress={onRoutine} />
        <TextButton label="Done for now" onPress={onDone} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper, paddingHorizontal: 20 },
  piece: { position: 'absolute', left: 0, top: 0, width: 12, height: 7, borderRadius: 2, borderWidth: 1.5, borderColor: C.ink },
  h1: { fontFamily: F.display, fontSize: 46, lineHeight: 50, color: C.ink },
  sub: { fontFamily: F.bodyBold, fontSize: 16, color: C.ink60 },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakText: { fontFamily: F.display, fontSize: 26, color: C.ink },
  best: { backgroundColor: C.sunSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  bestText: { fontFamily: F.label, fontSize: 12.5, color: C.ink },
  week: { flexDirection: 'row', gap: 6, marginTop: 12 },
  day: { flex: 1, alignItems: 'center', gap: 4 },
  cell: { alignSelf: 'stretch', height: 30, borderRadius: 10, borderWidth: 2, borderColor: C.ink, overflow: 'hidden' },
  dayText: { fontFamily: F.label, fontSize: 11.5, color: C.ink },
});
