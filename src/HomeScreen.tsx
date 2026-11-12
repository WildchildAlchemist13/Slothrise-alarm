// Home. By day: warm paper, next alarm as the hero. After 9 pm: a dim wind-down check with one "Goodnight".
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, TabBar } from './Scenery';
import { Card, Chip, FlatCard, Label, TactileButton, TextButton, Toggle } from './Tactile';
import { C, F, OUTLINE, POSE_RATIO, POSES, R, isNight } from './theme';

type Props = { onRing: () => void; onGentle: () => void; onRoutine: () => void; streak: number };

const WEEK = ['F', 'S', 'S', 'M', 'T', 'W', 'T'];
const FLAME = 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z';
const SUN = 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4';
const MOON = 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z';

export default function HomeScreen(props: Props) {
  const [night, setNight] = useState(isNight());
  return night ? <Night {...props} onDay={() => setNight(false)} /> : <Day {...props} onNight={() => setNight(true)} />;
}

function ModeButton({ night, onPress }: { night: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={night ? 'Show the morning view' : 'Show the bedtime view'}
      onPress={onPress}
      hitSlop={8}
      style={[styles.mode, night && { borderColor: C.moon, backgroundColor: C.nightCard }]}
    >
      <Icon d={night ? SUN : MOON} size={20} color={night ? C.sun : C.ink} />
    </Pressable>
  );
}

function Day({ onRing, onGentle, onRoutine, streak, onNight }: Props & { onNight: () => void }) {
  const insets = useSafeAreaInsets();
  const [alarms, setAlarms] = useState([
    { id: 'gym', on: true },
    { id: 'write', on: true },
    { id: 'slow', on: true },
  ]);
  const toggle = (id: string) => setAlarms((a) => a.map((x) => (x.id === id ? { ...x, on: !x.on } : x)));
  const on = (id: string) => alarms.find((a) => a.id === id)?.on ?? false;
  const peekW = 116;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 120 }]}>
        <View style={styles.header}>
          <View>
            <Label>{new Date().toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase()}</Label>
            <Text style={styles.h1}>Good morning</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.streak}>
              <Icon d={FLAME} size={16} color={C.ink} width={2.4} />
              <Text style={styles.streakText}>{streak}</Text>
            </View>
            <ModeButton night={false} onPress={onNight} />
          </View>
        </View>

        <Card pad={0}>
          <View style={styles.heroBand}>
            <Label color={C.ink}>NEXT ALARM · IN 8 H 49 MIN</Label>
            <Text style={styles.heroTime}>
              6:30<Text style={styles.heroAmPm}> am</Text>
            </Text>
            <Image source={POSES.peek} style={[styles.peek, { width: peekW, height: peekW / POSE_RATIO.peek }]} accessibilityLabel="Snooze peeking over the edge" />
          </View>
          <View style={styles.heroBody}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.alarmLabel}>Gym before the chaos</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Chip label="Mon · Wed · Fri" dark />
                <Chip label="Math mission" />
              </View>
            </View>
            <Toggle on={on('gym')} onChange={() => toggle('gym')} label="Gym alarm" />
          </View>
        </Card>

        <FlatCard>
          <Label>THIS WEEK · 6 OF 6 ON TIME</Label>
          <View style={styles.week}>
            {WEEK.map((d, i) => (
              <View key={i} style={styles.day}>
                <View style={[styles.dayCell, { backgroundColor: i < 6 ? C.leaf : C.sun }]} />
                <Text style={styles.dayText}>{d}</Text>
              </View>
            ))}
          </View>
        </FlatCard>

        <Text style={styles.h2}>Other alarms</Text>
        <AlarmRow time="7:15" label="Writing sprint · Weekdays · Math" on={on('write')} onToggle={() => toggle('write')} />
        <AlarmRow time="9:00" label="Slow start · Weekends · Gentle" on={on('slow')} onToggle={() => toggle('slow')} />

        <FlatCard style={{ gap: 2, marginTop: 6 }}>
          <Label>TRY IT</Label>
          <TextButton label="Ring the 6:30 alarm now" onPress={onRing} />
          <TextButton label="Play the Gentle sunrise" onPress={onGentle} />
        </FlatCard>
      </ScrollView>
      <TabBar active="alarms" onAlarms={() => {}} onRoutine={onRoutine} />
    </View>
  );
}

function AlarmRow({ time, label, on, onToggle }: { time: string; label: string; on: boolean; onToggle: () => void }) {
  return (
    <View style={[styles.row, !on && { opacity: 0.55 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTime}>
          {time}
          <Text style={styles.rowAmPm}> am</Text>
        </Text>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Toggle on={on} onChange={onToggle} label={`${time} alarm`} />
    </View>
  );
}

function Night({ onGentle, onDay }: Props & { onDay: () => void }) {
  const insets = useSafeAreaInsets();
  const poseW = 150;
  return (
    <View style={{ flex: 1, backgroundColor: C.night, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 22, paddingHorizontal: 20 }}>
      {[
        [40, 110, 4],
        [300, 86, 3],
        [210, 160, 3],
        [70, 230, 2],
      ].map(([x, y, s], i) => (
        <View key={i} style={{ position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: s, backgroundColor: C.moon, opacity: 0.5 }} />
      ))}
      <View style={styles.header}>
        <View>
          <Label color={C.dim}>BEDTIME</Label>
          <Text style={[styles.h1, { color: C.moon }]}>Wind down</Text>
        </View>
        <ModeButton night onPress={onDay} />
      </View>

      <View style={styles.nightCard}>
        <Image source={POSES.sleepCloud} style={{ position: 'absolute', right: -10, top: 12, width: poseW, height: poseW / POSE_RATIO.sleepCloud }} accessibilityLabel="Snooze asleep on a cloud" />
        <Label color={C.dim}>TOMORROW</Label>
        <Text style={[styles.heroTime, { color: C.moon }]}>
          6:30<Text style={styles.heroAmPm}> am</Text>
        </Text>
        <Text style={styles.nightSub}>Gym before the chaos · Math mission</Text>
        <View style={styles.bedtimeRow}>
          <Icon d={MOON} size={20} color={C.sun} width={2.2} />
          <Text style={styles.bedtimeText}>
            In bed by <Text style={{ color: C.sun }}>10:30</Text> for 8 hours of sleep
          </Text>
        </View>
      </View>

      <View style={{ gap: 8, marginTop: 16 }}>
        <Label color={C.dim}>I’LL RING. I CHECKED.</Label>
        <View style={styles.checks}>
          <Check ok text="Alarm sound on, even on silent" />
          <Check ok text="Rings through Sleep Focus" />
          <Check text="Plug in tonight, battery is low" last />
        </View>
        <Text style={styles.demoNote}>Demo values. The real check reads your phone’s settings.</Text>
      </View>

      <View style={{ marginTop: 'auto', gap: 4 }}>
        <TactileButton label="Goodnight, Snooze" variant="moon" shadowColor="#6E5F96" onPress={onGentle} />
        <Text style={styles.demoNote}>Demo: skips ahead to tomorrow’s Gentle sunrise</Text>
      </View>
    </View>
  );
}

function Check({ ok, text, last }: { ok?: boolean; text: string; last?: boolean }) {
  return (
    <View style={[styles.check, !last && { borderBottomWidth: 1, borderBottomColor: C.nightLine }]}>
      <View style={[styles.checkDot, { backgroundColor: ok ? C.leaf : C.sun }]}>
        {ok ? <Icon d="M5 12l5 5L20 7" size={14} color={C.night} width={3.6} /> : <Text style={styles.bang}>!</Text>}
      </View>
      <Text style={styles.checkText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  h1: { fontFamily: F.display, fontSize: 30, color: C.ink },
  h2: { fontFamily: F.displaySemi, fontSize: 20, color: C.ink, marginTop: 4 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.white, borderWidth: OUTLINE, borderColor: C.ink, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 5 },
  streakText: { fontFamily: F.label, fontSize: 14, color: C.ink },
  mode: { width: 44, height: 44, borderRadius: 22, borderWidth: OUTLINE, borderColor: C.ink, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  heroBand: { backgroundColor: C.peach, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12, borderBottomWidth: OUTLINE, borderBottomColor: C.ink },
  heroTime: { fontFamily: F.display, fontSize: 64, lineHeight: 68, color: C.ink },
  heroAmPm: { fontSize: 22 },
  peek: { position: 'absolute', right: 10, bottom: -3 },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 14 },
  alarmLabel: { fontFamily: F.bodyBold, fontSize: 16, color: C.ink },
  week: { flexDirection: 'row', gap: 5, marginTop: 8 },
  day: { flex: 1, alignItems: 'center', gap: 3 },
  dayCell: { alignSelf: 'stretch', height: 22, borderRadius: 8, borderWidth: 2, borderColor: C.ink },
  dayText: { fontFamily: F.label, fontSize: 11, color: C.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderWidth: OUTLINE, borderColor: C.ink, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 },
  rowTime: { fontFamily: F.display, fontSize: 30, color: C.ink },
  rowAmPm: { fontSize: 14 },
  rowLabel: { fontFamily: F.bodyBold, fontSize: 13.5, color: C.ink60 },
  nightCard: { marginTop: 16, backgroundColor: C.nightCard, borderRadius: R.l + 2, padding: 18, gap: 8, overflow: 'hidden' },
  nightSub: { fontFamily: F.bodyBold, fontSize: 14.5, color: C.dim },
  bedtimeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.night, borderRadius: 16, padding: 12, marginTop: 4 },
  bedtimeText: { fontFamily: F.bodyBold, fontSize: 14.5, color: C.moon, flex: 1 },
  checks: { backgroundColor: C.nightCard, borderRadius: 20 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  checkDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  bang: { fontFamily: F.label, fontSize: 15, color: C.night },
  checkText: { fontFamily: F.bodyBold, fontSize: 15, color: C.moon, flex: 1 },
  demoNote: { fontFamily: F.body, fontSize: 12.5, color: C.dim, textAlign: 'center' },
});
