// Morning routine: one "next up" habit with a big Done button keeps the momentum. The rest wait quietly below.
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, TabBar } from './Scenery';
import { Card, Label, TactileButton, TextButton } from './Tactile';
import { C, F, OUTLINE, POSE_RATIO, POSES, R } from './theme';
import { dayKey } from './state';

export type RoutineHabit = { id: string; name: string; mins: number; streak: number; lastDone: string | null };
const BED = 'M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 14h18M7 9V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 18v2M21 18v2';
const STRETCH = 'M12 4a2 2 0 1 0 0 .1M12 8v6M7 9l5 2 5-2M9 20l3-6 3 6';
const PHONE = 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM3 3l18 18';
// Glyph per habit id; the names, lengths and progress come from stored state.
const GLYPH: Record<string, string> = { bed: BED, stretch: STRETCH, phone: PHONE };

export default function RoutineScreen({ habits: stored, onChange, onAlarms }: { habits: RoutineHabit[]; onChange: (h: RoutineHabit[]) => void; onAlarms: () => void }) {
  const insets = useSafeAreaInsets();
  const today = dayKey();
  // "Done" is a fact about today, not a switch that outlives the morning.
  const [skipped, setSkipped] = useState<string[]>([]);
  const habits = useMemo(() => stored.map((h) => ({ ...h, done: h.lastDone === today, icon: GLYPH[h.id] ?? '' })), [stored, today]);
  const done = habits.filter((h) => h.done).length;
  const next = useMemo(() => habits.find((h) => !h.done && !skipped.includes(h.id)), [habits, skipped]);
  const rest = habits.filter((h) => h !== next);

  const complete = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onChange(stored.map((h) => (h.id === id ? { ...h, lastDone: today, streak: h.lastDone === today ? h.streak : h.streak + 1 } : h)));
  };
  const skip = (id: string) => setSkipped((s) => (s.includes(id) ? s : [...s, id]));
  const toggle = (id: string) => {
    const habit = stored.find((h) => h.id === id);
    if (!habit) return;
    const wasDone = habit.lastDone === today;
    onChange(stored.map((h) => (h.id === id ? { ...h, lastDone: wasDone ? null : today, streak: wasDone ? Math.max(0, h.streak - 1) : h.streak + 1 } : h)));
  };

  const coffeeW = 80;
  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 120, paddingHorizontal: 20, gap: 16 }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Morning routine</Text>
            <Text style={styles.sub}>{done === habits.length ? 'All done. What a morning.' : `${done} of ${habits.length} done · nice and slow`}</Text>
          </View>
          <Image source={POSES.coffee} style={{ width: coffeeW, height: coffeeW / POSE_RATIO.coffee, marginBottom: -4 }} accessibilityLabel="Snooze sipping coffee" />
        </View>
        <View style={styles.progress} accessibilityLabel={`${done} of ${habits.length} habits done`}>
          {habits.map((h, i) => (
            <View key={h.id} style={[styles.seg, i < done && { backgroundColor: C.leaf }]} />
          ))}
        </View>

        {next ? (
          <Card pad={18}>
            <Label color={C.link}>NEXT UP</Label>
            <View style={styles.nextRow}>
              <View style={styles.nextIcon}>{next.icon ? <Icon d={next.icon} size={30} width={2.2} /> : null}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextName}>{next.name}</Text>
                <Text style={styles.nextMeta}>
                  About {next.mins} min{next.streak ? ` · ${next.streak} day streak` : ''}
                </Text>
              </View>
            </View>
            <TactileButton label="Done" variant="leaf" onPress={() => complete(next.id)} style={{ marginTop: 12 }} />
            <TextButton label="Skip today" color={C.ink60} onPress={() => skip(next.id)} />
          </Card>
        ) : (
          <Card pad={18} faceStyle={{ alignItems: 'center', gap: 6 }}>
            <Image source={POSES.celebrate} style={{ width: 110, height: 110 / POSE_RATIO.celebrate }} accessibilityLabel="Snooze cheering" />
            <Text style={styles.nextName}>Routine complete</Text>
            <Text style={styles.nextMeta}>Go have a great day. I’ll be napping.</Text>
          </Card>
        )}

        <View style={{ gap: 8 }}>
          <Label>THE REST</Label>
          {rest.map((h) => (
            <Pressable
              key={h.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: h.done }}
              accessibilityLabel={h.name}
              onPress={() => toggle(h.id)}
              style={[styles.restRow, !h.done && { backgroundColor: C.oat }]}
            >
              <View style={[styles.circle, h.done && { backgroundColor: C.leaf }]}>{h.done ? <Icon d="M5 12l5 5L20 7" size={18} width={3.4} /> : null}</View>
              <Text style={[styles.restName, h.done && styles.restDone]}>{h.name}</Text>
              <Text style={styles.restMeta}>{!h.done && skipped.includes(h.id) ? 'Skipped' : h.streak ? `${h.streak} days` : 'New'}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <TabBar active="routine" onAlarms={onAlarms} onRoutine={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  h1: { fontFamily: F.display, fontSize: 30, color: C.ink },
  sub: { fontFamily: F.label, fontSize: 15, color: C.ink60 },
  progress: { flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 12, borderRadius: 6, borderWidth: 2, borderColor: C.ink, backgroundColor: C.white },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 },
  nextIcon: { width: 60, height: 60, borderRadius: R.m, borderWidth: OUTLINE, borderColor: C.ink, backgroundColor: C.peach, alignItems: 'center', justifyContent: 'center' },
  nextName: { fontFamily: F.display, fontSize: 24, color: C.ink },
  nextMeta: { fontFamily: F.bodyBold, fontSize: 14, color: C.ink60 },
  restRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: R.m, minHeight: 56 },
  circle: { width: 34, height: 34, borderRadius: 17, borderWidth: OUTLINE, borderColor: C.ink, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  restName: { flex: 1, fontFamily: F.bodyBold, fontSize: 15.5, color: C.ink },
  restDone: { color: C.ink60, textDecorationLine: 'line-through' },
  restMeta: { fontFamily: F.label, fontSize: 13, color: C.ink60 },
});
