// Home. By day: warm paper, next alarm as the hero. After 9 pm: a dim wind-down check with one "Goodnight".
// Every number here is computed from the schedule and the saved streak — no placeholders.
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, TabBar } from './Scenery';
import { Card, Chip, FlatCard, Label, TactileButton, TextButton, Toggle } from './Tactile';
import { C, F, OUTLINE, POSE_RATIO, POSES, R, isNight } from './theme';
import { clock, countdown, dayKey, scheduleText, sleepHours, weekDays, type Alarm, type NextRing } from './state';
import type { AlarmPermissions } from './alarms';

type Props = {
  alarms: Alarm[];
  next: NextRing | null;
  streak: number;
  wins: string[];
  permissions: AlarmPermissions | null;
  scheduled: number;
  bedtime: { hour: number; minute: number };
  onToggleAlarm: (id: string) => void;
  onRing: () => void;
  onGentle: () => void;
  /** Dev-only: the same screen with the short demo timings. */
  onGentleDemo: () => void;
  onRoutine: () => void;
};

const FLAME = 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z';
const SUN = 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4';
const MOON = 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z';

const modeText = (a: Alarm) => (a.mode === 'gentle' ? 'Gentle sunrise' : 'Math mission');

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

/** Re-render every half minute so the countdown stays honest. */
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function Day({ onRing, onGentleDemo, onRoutine, streak, alarms, next, wins, onToggleAlarm, onNight }: Props & { onNight: () => void }) {
  const insets = useSafeAreaInsets();
  const now = useNow();
  const peekW = 116;
  const others = alarms.filter((a) => a.id !== next?.alarm.id);
  const week = weekDays(now);
  const today = dayKey(now);
  const onTime = week.filter((d) => wins.includes(d)).length;
  // A snoozed ring is due at a different time than the alarm's own, so show the ring, not the schedule.
  const heroTime = next ? (next.snoozed ? clock(next.at.getHours(), next.at.getMinutes()) : clock(next.alarm.hour, next.alarm.minute)) : null;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 120 }]}>
        <View style={styles.header}>
          <View>
            <Label>{now.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase()}</Label>
            <Text style={styles.h1}>Good morning</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.streak} accessibilityLabel={`${streak} day streak`}>
              <Icon d={FLAME} size={16} color={C.ink} width={2.4} />
              <Text style={styles.streakText}>{streak}</Text>
            </View>
            <ModeButton night={false} onPress={onNight} />
          </View>
        </View>

        <Card pad={0}>
          <View style={styles.heroBand}>
            <Label color={C.ink}>{next ? `${next.snoozed ? 'SNOOZED' : 'NEXT ALARM'} · ${countdown(next.at, now)}` : 'NEXT ALARM'}</Label>
            {next && heroTime ? (
              <Text style={styles.heroTime}>
                {heroTime.time}
                <Text style={styles.heroAmPm}> {heroTime.ampm}</Text>
              </Text>
            ) : (
              <Text style={[styles.heroTime, { fontSize: 34 }]}>Nothing set</Text>
            )}
            <Image source={POSES.peek} style={[styles.peek, { width: peekW, height: peekW / POSE_RATIO.peek }]} accessibilityLabel="Snooze peeking over the edge" />
          </View>
          <View style={styles.heroBody}>
            {next ? (
              <>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={styles.alarmLabel}>{next.alarm.label}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Chip label={scheduleText(next.alarm.weekdays)} dark />
                    <Chip label={modeText(next.alarm)} />
                  </View>
                </View>
                <Toggle on={next.alarm.enabled} onChange={() => onToggleAlarm(next.alarm.id)} label={`${next.alarm.label} alarm`} />
              </>
            ) : (
              <Text style={styles.heroEmpty}>Turn an alarm on below and it will ring here, even when the phone is locked.</Text>
            )}
          </View>
        </Card>

        <FlatCard>
          <Label>THIS WEEK · {onTime} OF {week.length} ON TIME</Label>
          <View style={styles.week}>
            {week.map((key) => {
              const d = new Date(`${key}T12:00:00`);
              const won = wins.includes(key);
              const future = key > today;
              return (
                <View key={key} style={styles.day}>
                  <View
                    style={[
                      styles.dayCell,
                      { backgroundColor: won ? C.leaf : future ? C.white : C.sun },
                      !won && !future && { opacity: 0.45 },
                    ]}
                  />
                  <Text style={styles.dayText}>{d.toLocaleDateString(undefined, { weekday: 'narrow' })}</Text>
                </View>
              );
            })}
          </View>
        </FlatCard>

        <Text style={styles.h2}>Other alarms</Text>
        {others.length ? (
          others.map((a) => <AlarmRow key={a.id} alarm={a} onToggle={() => onToggleAlarm(a.id)} />)
        ) : (
          <Text style={styles.heroEmpty}>No other alarms. The one above is the whole schedule.</Text>
        )}

        {/* Dev-only shortcut into the ring and sunrise screens. __DEV__ is false in release builds, so this never ships. */}
        {__DEV__ ? (
          <FlatCard style={{ gap: 2, marginTop: 6 }}>
            <Label>TRY IT</Label>
            <TextButton label={next ? `Ring the ${clock(next.alarm.hour, next.alarm.minute).time} alarm now` : 'Ring an alarm now'} onPress={onRing} />
            <TextButton label="Play the Gentle sunrise" onPress={onGentleDemo} />
          </FlatCard>
        ) : null}
      </ScrollView>
      <TabBar active="alarms" onAlarms={() => {}} onRoutine={onRoutine} />
    </View>
  );
}

function AlarmRow({ alarm, onToggle }: { alarm: Alarm; onToggle: () => void }) {
  const t = clock(alarm.hour, alarm.minute);
  return (
    <View style={[styles.row, !alarm.enabled && { opacity: 0.55 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTime}>
          {t.time}
          <Text style={styles.rowAmPm}> {t.ampm}</Text>
        </Text>
        <Text style={styles.rowLabel}>{alarm.label} · {scheduleText(alarm.weekdays)}</Text>
      </View>
      <Toggle on={alarm.enabled} onChange={onToggle} label={`${alarm.label} alarm`} />
    </View>
  );
}

function Night({ onGentle, onDay, next, bedtime, permissions, scheduled, streak, alarms }: Props & { onDay: () => void }) {
  const insets = useSafeAreaInsets();
  const poseW = 150;
  const tomorrow = next?.alarm ?? null;
  const at = next?.at ?? null;
  const bed = clock(bedtime.hour, bedtime.minute);
  const enabled = alarms.filter((a) => a.enabled).length;
  // The card says when the alarm actually is, not "tomorrow" by default: a 6:30 alarm at 10 pm is tonight.
  const heading = !at ? 'NEXT ALARM' : next?.snoozed ? 'SNOOZED' : dayKey(at) === dayKey() ? 'LATER TODAY' : 'TOMORROW';
  // The card follows the pending ring: a snoozed alarm is due sooner than the alarm's own time.
  const shownTime = !tomorrow ? null : next?.snoozed && at ? clock(at.getHours(), at.getMinutes()) : clock(tomorrow.hour, tomorrow.minute);

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
        <Label color={C.dim}>{heading}</Label>
        {tomorrow ? (
          <>
            <Text style={[styles.heroTime, { color: C.moon }]}>
              {shownTime?.time}
              <Text style={styles.heroAmPm}> {shownTime?.ampm}</Text>
            </Text>
            <Text style={styles.nightSub}>
              {tomorrow.label} · {modeText(tomorrow)}
              {next?.snoozed ? ' · snoozed' : ''}
            </Text>
            {at ? (
              <View style={styles.bedtimeRow}>
                <Icon d={MOON} size={20} color={C.sun} width={2.2} />
                <Text style={styles.bedtimeText}>
                  In bed by <Text style={{ color: C.sun }}>{bed.time} {bed.ampm}</Text> for {sleepHours(bedtime, at)} of sleep
                </Text>
              </View>
            ) : null}
          </>
        ) : (
          <Text style={[styles.nightSub, { marginTop: 6 }]}>No alarm is on for tomorrow. Turn one on and the night check will read it.</Text>
        )}
      </View>

      <View style={{ gap: 8, marginTop: 16 }}>
        <Label color={C.dim}>WHAT WILL ACTUALLY HAPPEN</Label>
        <View style={styles.checks}>
          <Check
            ok={permissions?.notifications ?? false}
            text={
              permissions?.notifications
                ? `${enabled} alarm${enabled === 1 ? '' : 's'} on, notifications allowed`
                : 'Notifications are off — an alarm cannot ring until you allow them'
            }
          />
          <Check
            ok={scheduled > 0}
            text={scheduled > 0 ? `${scheduled} alarm${scheduled === 1 ? '' : 's'} scheduled on this phone` : 'Nothing is scheduled yet'}
          />
          {permissions?.exact === false ? (
            <Check text="Exact alarms are off, so Android may ring late. Allow them in settings." last />
          ) : (
            <Check ok text={streak > 0 ? `${streak} day streak to keep` : 'Your first streak starts tomorrow'} last />
          )}
        </View>
        <Text style={styles.note}>
          {permissions?.exact === false
            ? 'Android needs the exact-alarm permission for an on-time ring.'
            : 'On iOS the chime plays at your alarm volume; a phone on silent can still mute it unless Apple grants a critical-alert entitlement.'}
        </Text>
      </View>

      <View style={{ marginTop: 'auto', gap: 4 }}>
        <TactileButton label="Goodnight, Snooze" variant="moon" shadowColor="#6E5F96" onPress={onGentle} />
        <Text style={styles.note}>Opens Gentle mode — a preview, not tomorrow’s alarm.</Text>
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
  heroEmpty: { fontFamily: F.body, fontSize: 14, color: C.ink60, flex: 1, lineHeight: 20 },
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
  note: { fontFamily: F.body, fontSize: 12.5, color: C.dim, textAlign: 'center', lineHeight: 18 },
});
