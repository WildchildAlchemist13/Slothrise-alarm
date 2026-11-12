// Mission: three sums on a paper sheet. Snooze peeks over the edge; the alarm keeps chiming until you're done.
import React, { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, SkyGradient } from './Scenery';
import { SOUNDS, useLoopingSound } from './sound';
import { C, F, OUTLINE, POSE_RATIO, POSES, R } from './theme';

const ROUNDS = 3;
const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
function makeSum(i: number): { q: string; a: number } {
  if (i % 3 === 0) {
    const a = rnd(12, 49), b = rnd(12, 49);
    return { q: `${a} + ${b}`, a: a + b };
  }
  if (i % 3 === 1) {
    const a = rnd(6, 13), b = rnd(3, 9);
    return { q: `${a} × ${b}`, a: a * b };
  }
  const a = rnd(50, 99), b = rnd(11, 45);
  return { q: `${a} − ${b}`, a: a - b };
}

function Key({ label, onPress, kind = 'num', a11y, children }: { label?: string; onPress: () => void; kind?: 'num' | 'del' | 'ok'; a11y?: string; children?: React.ReactNode }) {
  const down = useSharedValue(0);
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: down.value * 3 }] }));
  const flat = kind === 'del';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y ?? label}
      onPressIn={() => {
        down.value = withTiming(1, { duration: 60 });
        Haptics.selectionAsync().catch(() => {});
      }}
      onPressOut={() => (down.value = withTiming(0, { duration: 100 }))}
      onPress={onPress}
      style={styles.keyWrap}
    >
      {!flat && <View style={styles.keyShadow} />}
      <Animated.View style={[styles.key, flat && styles.keyFlat, kind === 'ok' && { backgroundColor: C.leaf }, face]}>
        {children ?? <Text style={styles.keyText}>{label}</Text>}
      </Animated.View>
    </Pressable>
  );
}

export default function MissionScreen({ time, onDone }: { time: string; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const [round, setRound] = useState(0);
  const sum = useMemo(() => makeSum(round), [round]);
  const [entry, setEntry] = useState('');
  const shake = useSharedValue(0);

  useLoopingSound(SOUNDS.chime, 0.6); // still ringing, a little softer while you think

  const check = useCallback(() => {
    if (entry !== '' && Number(entry) === sum.a) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (round + 1 >= ROUNDS) return onDone();
      setRound((r) => r + 1);
      setEntry('');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      shake.value = withSequence(withTiming(-10, { duration: 50 }), withTiming(10, { duration: 70 }), withTiming(-6, { duration: 60 }), withTiming(0, { duration: 50 }));
      setEntry('');
    }
  }, [entry, sum, round, onDone, shake]);
  const press = (k: string) => setEntry((e) => (e.length < 4 ? e + k : e));
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const peekW = 132;

  return (
    <View style={styles.root}>
      <SkyGradient id="mission" stops={[[0, C.lilac], [0.3, '#FFC6B0'], [1, '#FFC6B0']]} />
      <View style={[styles.top, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.eyebrow}>STILL RINGING</Text>
          <Text style={styles.smallTime}>{time || '—'}</Text>
        </View>
        <View style={styles.dots} accessibilityLabel={`Sum ${round + 1} of ${ROUNDS}`}>
          {Array.from({ length: ROUNDS }, (_, i) => (
            <View key={i} style={[styles.dot, i <= round ? styles.dotOn : null]} />
          ))}
        </View>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
        <Image source={POSES.peek} style={[styles.peek, { width: peekW, height: peekW / POSE_RATIO.peek, top: -(peekW / POSE_RATIO.peek) + 6 }]} accessibilityLabel="Snooze peeking, one eye open" />
        <Text style={styles.kicker}>MISSION · MATH</Text>
        <Text style={styles.h1}>Solve it to stop me</Text>
        <Text style={styles.sum}>{sum.q}</Text>
        <Animated.View style={[styles.answer, shakeStyle]}>
          <Text style={styles.answerText}>{entry || '?'}</Text>
        </Animated.View>
        <View style={styles.pad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
            <Key key={k} label={k} onPress={() => press(k)} />
          ))}
          <Key kind="del" a11y="Delete" onPress={() => setEntry((e) => e.slice(0, -1))}>
            <Icon d="M9 5h11v14H9l-6-7zM12 9l5 6M17 9l-5 6" size={26} />
          </Key>
          <Key label="0" onPress={() => press('0')} />
          <Key kind="ok" a11y="Check answer" onPress={check}>
            <Icon d="M5 12l5 5L20 7" size={28} width={3.2} />
          </Key>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  top: { paddingHorizontal: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150 },
  eyebrow: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.8, color: C.ink },
  smallTime: { fontFamily: F.display, fontSize: 44, lineHeight: 48, color: C.ink },
  dots: { flexDirection: 'row', gap: 6, paddingBottom: 10 },
  dot: { width: 28, height: 10, borderRadius: 5, borderWidth: 2, borderColor: C.ink, backgroundColor: C.white },
  dotOn: { backgroundColor: C.ink },
  sheet: { flex: 1, marginTop: 60, backgroundColor: C.paper, borderTopWidth: OUTLINE, borderColor: C.ink, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, paddingHorizontal: 22, paddingTop: 24, gap: 12 },
  peek: { position: 'absolute', right: 18 },
  kicker: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.4, color: C.link },
  h1: { fontFamily: F.display, fontSize: 26, color: C.ink, marginTop: -8 },
  sum: { fontFamily: F.display, fontSize: 72, lineHeight: 78, color: C.ink, textAlign: 'center' },
  answer: { height: 68, borderRadius: 20, borderWidth: 3, borderColor: C.ink, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  answerText: { fontFamily: F.display, fontSize: 40, color: C.ink },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 'auto' },
  keyWrap: { width: '31%', flexGrow: 1, height: 63 },
  keyShadow: { position: 'absolute', left: 0, right: 0, top: 3, height: 60, borderRadius: R.m, backgroundColor: C.ink },
  key: { height: 60, borderRadius: R.m, borderWidth: OUTLINE, borderColor: C.ink, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  keyFlat: { borderWidth: 0, backgroundColor: C.oat },
  keyText: { fontFamily: F.displaySemi, fontSize: 26, color: C.ink },
});
