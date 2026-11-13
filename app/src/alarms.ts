// Real alarm scheduling, not a preview: scheduled notifications fire with the app closed or the phone locked.
// Android uses an exact alarm (setAlarmClock) on a MAX-importance channel with an ALARM-usage audio stream.
// iOS gets the strongest thing a notification can do — a time-sensitive local notification with the app's own
// chime. iOS has no AlarmKit in Expo SDK 58, so it cannot bypass the mute switch; see README "Limits".
/* eslint-disable import/namespace -- expo-notifications exports these Android enums at runtime, but the
   rule resolves the package's declaration file and calls them missing. Values are the Android SDK's. */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { nextAlarm, nextRing, type Alarm, type AppState } from './state';

export const ALARM_CHANNEL = 'alarm';
export const ALARM_SOUND = 'alarm_chime.wav';
/** The sunrise's bells; listed in app.json so iOS has it in the bundle root for a locked-phone delivery. */
export const GENTLE_SOUND = 'gentle_bells.wav';

/**
 * iOS plays a notification's sound once — about three seconds — and then stops. A person who does not touch
 * the phone in those seconds is not woken again, so an alarm is delivered as a short chain: the scheduled
 * ring plus repeats every 30 s. Ten notifications is the cap, so a phone left alone for days cannot
 * accumulate hundreds; the chain is re-armed for the next alarm whenever the app schedules.
 */
export const CHAIN_STEP_MS = 30_000;
export const CHAIN_REPEATS = 9; // 0 + 9 x 30 s — about five minutes of ringing
/** iOS keeps at most 64 pending local notifications; this budget stays clear of it. */
export const PENDING_BUDGET = 50;
/** The fewest follow-ups worth arming: three beats a single chime. */
export const CHAIN_FLOOR = 3;
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];
/** Identifiers listed per log line before they are summarised; a long list used to evict the line QA needed. */
const IDS_SHOWN = 8;
/** How long the snooze button waits before the alarm rings again. */
export const SNOOZE_MS = 5 * 60_000;

export type AlarmPermissions = {
  /** notification permission granted */
  notifications: boolean;
  /** Android exact-alarm permission; null on iOS, which has no equivalent */
  exact: boolean | null;
};

/** Foreground presentations: the ringing screen plays the chime, so the banner stays quiet. */
export function installHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL, {
    name: 'Alarms',
    importance: Notifications.AndroidImportance.MAX,
    sound: ALARM_SOUND,
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
    enableVibrate: true,
    vibrationPattern: [0, 600, 350, 600],
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: true,
    enableLights: true,
    lightColor: '#FF7A45',
  });
}

export async function ensurePermissions(): Promise<AlarmPermissions> {
  let settings = await Notifications.getPermissionsAsync();
  if (!settings.granted) {
    settings = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: true },
    });
  }
  let exact: boolean | null = null;
  if (Platform.OS === 'android') {
    const current = await Notifications.getExactAlarmPermissionsAsync();
    exact = current.granted;
    if (!exact && current.canAskAgain) {
      exact = (await Notifications.requestExactAlarmPermissionsAsync()).granted;
    }
  }
  return { notifications: settings.granted, exact };
}

function content(alarm: Alarm, chain = false, dueAt?: number): Notifications.NotificationContentInput {
  return {
    title: alarm.label,
    body: alarm.mode === 'gentle' ? 'The sunrise is starting. Hold to wake.' : 'Time to get up. Hold to wake.',
    sound: alarm.mode === 'gentle' ? GENTLE_SOUND : ALARM_SOUND,
    interruptionLevel: 'timeSensitive',
    data: { alarmId: alarm.id, ...(chain ? { chain: true } : {}), ...(dueAt !== undefined ? { dueAt } : {}) },
  };
}

/* Chain diagnostics. A Release build prints nothing to the device log (RCTLog is a no-op without a log
   function), so the last few lines also go to AsyncStorage where a container pull can read them. They are
   written off the critical path: cancelChain runs inside the window QA is timing, so it must not wait on
   storage. One ordered queue keeps the lines in the order the events happened. */
const CHAIN_LOG_KEY = '@slothrise/chainlog';
const CHAIN_LOG_LIMIT = 900;

const stamp = (d: Date | number) => new Date(d).toISOString().slice(11, 19);
const shortId = (id: string) => id.slice(0, 8);

let logQueue: Promise<void> = Promise.resolve();

async function writeChainLog(stamped: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CHAIN_LOG_KEY);
    const lines = `${raw ? `${raw}\n` : ''}${stamped}`.split('\n');
    while (lines.join('\n').length > CHAIN_LOG_LIMIT) lines.shift();
    await AsyncStorage.setItem(CHAIN_LOG_KEY, lines.join('\n'));
  } catch {
    // diagnostics must never break scheduling
  }
}

/** Queue one diagnostic line without awaiting it; the timestamp is taken now, the write happens later. */
function logChain(line: string): void {
  console.log(`[chain] ${line}`);
  const stamped = `${stamp(new Date())} ${line}`;
  logQueue = logQueue.then(() => writeChainLog(stamped));
}

function trigger(alarm: Alarm, weekday: number): Notifications.NotificationTriggerInput {
  if (Platform.OS === 'android') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour: alarm.hour,
      minute: alarm.minute,
      channelId: ALARM_CHANNEL,
      delivery: 'alarmClock',
    };
  }
  return {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    weekday,
    hour: alarm.hour,
    minute: alarm.minute,
    repeats: true,
  };
}

export type ScheduleResult = { scheduled: number; error?: string };

/**
 * The follow-up rings after a delivery or a snooze. iOS only: an Android alarmClock notification keeps
 * sounding until it is dismissed, so it needs no chain.
 */
async function scheduleChain(alarm: Alarm, from: Date, steps = CHAIN_REPEATS): Promise<number> {
  if (Platform.OS !== 'ios') return 0;
  let count = 0;
  const at: string[] = [];
  for (let i = 1; i <= steps; i += 1) {
    const date = new Date(from.getTime() + i * CHAIN_STEP_MS);
    if (date.getTime() <= Date.now()) continue;
    await Notifications.scheduleNotificationAsync({ content: content(alarm, true, date.getTime()), trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date } });
    count += 1;
    at.push(stamp(date));
  }
  logChain(`arm ${alarm.id}/${alarm.mode} from=${stamp(from)} count=${count} at=[${at.join(' ')}]`);
  return count;
}

/** Every pending notification, compactly: identifier, chain flag and alarm id. Long lists are summarised. */
function describe(pending: Notifications.NotificationRequest[]): string {
  const shown = pending
    .slice(0, IDS_SHOWN)
    .map((n) => {
      const d = n.content.data;
      return `${shortId(n.identifier)}:${d?.alarmId ?? '-'}${d?.chain === true ? '*' : ''}`;
    })
    .join(' ');
  return pending.length > IDS_SHOWN ? `${shown} +${pending.length - IDS_SHOWN} more` : shown;
}

/* Every mutation of the notification store goes through this one queue, so a cancel and a reschedule can
   never interleave: on a cold start from a tapped notification both run in the same second, and a cancel
   that read the store before the reschedule armed a chain used to leave one follow-up behind. */
let mutations: Promise<unknown> = Promise.resolve();

function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = mutations.then(task, task);
  mutations = run.catch(() => {});
  return run;
}

/** True while an alarm's own screen is open, so nothing may arm a chain behind it. */
let ringOpen = false;

export function setRingOpen(open: boolean): void {
  ringOpen = open;
}

async function cancelChains(alarmId?: string, receivedAt?: number): Promise<void> {
  const entered = Date.now();
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  // Timestamps for the cold-start race: how long after the tap the cancel started, and how long the store
  // read took. If the read is what is slow, that shows up here as a large read, not as a late entry.
  const since = receivedAt ? `+${entered - receivedAt}ms` : 'n/a';
  const doomed = pending.filter((n) => n.content.data?.chain === true && (!alarmId || n.content.data?.alarmId === alarmId));
  logChain(`cancel ${alarmId ?? 'all'} since=${since} read=${Date.now() - entered}ms pending=${pending.length} chain=${doomed.length} [${describe(pending)}]`);
  await Promise.all(doomed.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  const left = await Notifications.getAllScheduledNotificationsAsync();
  logChain(`cancel ${alarmId ?? 'all'} left=${left.length} chain=${left.filter((n) => n.content.data?.chain === true).length} [${describe(left)}]`);
}

/** Cancel pending follow-up rings, for one alarm or all of them. Reading the store means this works after a restart. */
export async function cancelChain(alarmId?: string, receivedAt?: number): Promise<void> {
  return serial(async () => {
    try {
      await cancelChains(alarmId, receivedAt);
    } catch {
      // nothing scheduled is the same outcome as cancelling everything
    }
  });
}

/** Chain steps this close to firing are treated as due while a ring screen is open (a snooze chain is ≤9.5 min). */
const RING_WINDOW_MS = 15 * 60_000;

async function cancelDueChains(): Promise<number> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const now = Date.now();
  // The due time comes from the step's own payload. A request read back from the store has no absolute time
  // on its trigger: a date trigger is scheduled as a UNTimeIntervalNotificationTrigger and serialises as
  // { type: 'timeInterval', seconds }, so reading the trigger for a time never matched anything.
  const due = pending.filter((n) => {
    const d = n.content.data;
    if (d?.chain !== true) return false;
    return typeof d.dueAt === 'number' && d.dueAt - now <= RING_WINDOW_MS;
  });
  await Promise.all(due.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  return due.length;
}

/** How many follow-ups each enabled alarm's next ring gets, given what is left of the budget. */
type ChainPlan = { alarm: Alarm; at: Date; steps: number };

function planChains(state: AppState, ring: ReturnType<typeof nextRing>, budget: number): ChainPlan[] {
  const now = new Date();
  // One entry per enabled alarm, nearest first; the snoozed alarm's entry is its snooze, not next week's ring.
  const slots = state.alarms
    .filter((a) => a.enabled)
    .map((alarm) => {
      const snoozed = ring?.snoozed === true && ring.alarm.id === alarm.id;
      const at = snoozed && ring ? ring.at : nextAlarm([alarm], now)?.at ?? null;
      return at ? { alarm, at, snoozed } : null;
    })
    .filter((s): s is { alarm: Alarm; at: Date; snoozed: boolean } => s !== null)
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const steps = new Map<string, number>(slots.map((s) => [s.alarm.id, 0]));
  let left = Math.max(0, budget);

  // The snoozed ring keeps its full chain first: it is the ring that is about to happen.
  const live = slots.find((s) => s.snoozed);
  if (live) {
    const give = Math.min(CHAIN_REPEATS, left);
    steps.set(live.alarm.id, give);
    left -= give;
  }
  // Then a floor for every other ring, nearest first, so no alarm is left with a single chime.
  for (const slot of slots) {
    if (slot.snoozed || left <= 0) continue;
    const give = Math.min(CHAIN_FLOOR, left);
    steps.set(slot.alarm.id, give);
    left -= give;
  }
  // Then top up to the full chain, again nearest first.
  for (const slot of slots) {
    if (slot.snoozed || left <= 0) continue;
    const want = CHAIN_REPEATS - (steps.get(slot.alarm.id) ?? 0);
    const give = Math.min(want, left);
    steps.set(slot.alarm.id, (steps.get(slot.alarm.id) ?? 0) + give);
    left -= give;
  }
  return slots.map((s) => ({ alarm: s.alarm, at: s.at, steps: steps.get(s.alarm.id) ?? 0 })).filter((p) => p.steps > 0);
}

/** A one-off ring at a chosen time: the snooze anchor, whose weekly triggers do not cover it. */
function oneOffTrigger(at: Date): Notifications.NotificationTriggerInput {
  return Platform.OS === 'android'
    ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: ALARM_CHANNEL, delivery: 'alarmClock' }
    : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at };
}

/**
 * The only thing that schedules or cancels notifications. It takes the whole state, not just the alarm list,
 * because a pending snooze lives in that state: `cancelAll` below deletes its anchor, so whoever re-arms the
 * alarms has to put it back. A snooze scheduled from anywhere else would be a second owner of the same store,
 * which is how a relaunch or an alarm toggle used to swallow a snooze that Home was still counting down.
 */
export async function scheduleAlarms(state: AppState): Promise<ScheduleResult> {
  return serial(() => arm(state));
}

async function arm(state: AppState): Promise<ScheduleResult> {
  try {
    await ensureChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();
    logChain(`schedule ${state.alarms.filter((a) => a.enabled).map((a) => `${a.id}/${a.mode}`).join(' ') || 'none'}`);
    let scheduled = 0;
    for (const alarm of state.alarms) {
      if (!alarm.enabled) continue;
      const days = alarm.weekdays.length ? alarm.weekdays : ALL_DAYS;
      for (const weekday of days) {
        await Notifications.scheduleNotificationAsync({ content: content(alarm), trigger: trigger(alarm, weekday) });
        scheduled += 1;
      }
    }
    const anchors = scheduled;
    // The ring actually coming next: a live snooze first, otherwise the weekly schedule. An expired or
    // orphaned snooze is already dropped by nextRing, so it cannot hold this slot.
    const ring = nextRing(state);
    if (ring?.snoozed) {
      await Notifications.scheduleNotificationAsync({ content: content(ring.alarm), trigger: oneOffTrigger(ring.at) });
      scheduled += 1;
    }
    // Every enabled alarm gets follow-ups, not just the one that rings next: a ring that plays once and stops
    // is the product's core promise broken. Anchors are counted first because they all have to stay; what is
    // left of the budget goes to each alarm's next occurrence, nearest first, with the snoozed ring keeping a
    // full chain because its slot is the one already sold.
    const plan = planChains(state, ring, PENDING_BUDGET - scheduled);
    for (const step of plan) scheduled += await scheduleChain(step.alarm, step.at, step.steps);
    // The store's own total, not our intent: QA reads this to see the distribution rather than infer it.
    const armed = await Notifications.getAllScheduledNotificationsAsync();
    logChain(`pending ${armed.length} budget=${PENDING_BUDGET} anchors=${anchors} plan=[${plan.map((p) => `${p.alarm.id}:${p.steps}`).join(' ')}]`);
    // Someone is looking at the ring screen: no chain step due soon may fire behind it. Only the imminent ones
    // are cancelled, because every alarm now has a chain and cancelling them all would leave an install with no
    // follow-ups at all until the next launch.
    if (ringOpen) {
      const cancelled = await cancelDueChains();
      logChain(`ring open, cancelled ${cancelled} chain step(s) due within ${RING_WINDOW_MS / 60_000} min`);
    }
    return { scheduled };
  } catch (e) {
    return { scheduled: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function scheduledCount(): Promise<number> {
  try {
    return (await Notifications.getAllScheduledNotificationsAsync()).length;
  } catch {
    return 0;
  }
}
