// Real alarm scheduling, not a preview: scheduled notifications fire with the app closed or the phone locked.
// Android uses an exact alarm (setAlarmClock) on a MAX-importance channel with an ALARM-usage audio stream.
// iOS gets the strongest thing a notification can do — a time-sensitive local notification with the app's own
// chime. iOS has no AlarmKit in Expo SDK 58, so it cannot bypass the mute switch; see README "Limits".
/* eslint-disable import/namespace -- expo-notifications exports these Android enums at runtime, but the
   rule resolves the package's declaration file and calls them missing. Values are the Android SDK's. */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { nextRing, type Alarm, type AppState } from './state';

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

function content(alarm: Alarm, chain = false): Notifications.NotificationContentInput {
  return {
    title: alarm.label,
    body: alarm.mode === 'gentle' ? 'The sunrise is starting. Hold to wake.' : 'Time to get up. Hold to wake.',
    sound: alarm.mode === 'gentle' ? GENTLE_SOUND : ALARM_SOUND,
    interruptionLevel: 'timeSensitive',
    data: { alarmId: alarm.id, ...(chain ? { chain: true } : {}) },
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
async function scheduleChain(alarm: Alarm, from: Date): Promise<number> {
  if (Platform.OS !== 'ios') return 0;
  let count = 0;
  const at: string[] = [];
  for (let i = 1; i <= CHAIN_REPEATS; i += 1) {
    const date = new Date(from.getTime() + i * CHAIN_STEP_MS);
    if (date.getTime() <= Date.now()) continue;
    await Notifications.scheduleNotificationAsync({ content: content(alarm, true), trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date } });
    count += 1;
    at.push(stamp(date));
  }
  logChain(`arm ${alarm.id}/${alarm.mode} from=${stamp(from)} count=${count} at=[${at.join(' ')}]`);
  return count;
}

/** Every pending notification, compactly: identifier, chain flag and alarm id. */
function describe(pending: Notifications.NotificationRequest[]): string {
  return pending
    .map((n) => {
      const d = n.content.data;
      return `${shortId(n.identifier)}:${d?.alarmId ?? '-'}${d?.chain === true ? '*' : ''}`;
    })
    .join(' ');
}

/** Cancel pending follow-up rings, for one alarm or all of them. Reading the store means this works after a restart. */
export async function cancelChain(alarmId?: string): Promise<void> {
  try {
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    const doomed = pending.filter((n) => n.content.data?.chain === true && (!alarmId || n.content.data?.alarmId === alarmId));
    logChain(`cancel ${alarmId ?? 'all'} pending=${pending.length} chain=${doomed.length} [${describe(pending)}]`);
    await Promise.all(doomed.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
    const left = await Notifications.getAllScheduledNotificationsAsync();
    logChain(`cancel ${alarmId ?? 'all'} left=${left.length} chain=${left.filter((n) => n.content.data?.chain === true).length} [${describe(left)}]`);
  } catch {
    // nothing scheduled is the same outcome as cancelling everything
  }
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
  try {
    await ensureChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();
    logChain(`schedule ${state.alarms.filter((a) => a.enabled).map((a) => `${a.id}/${a.mode}`).join(' ') || 'none'}`);
    let scheduled = 0;
    for (const alarm of state.alarms) {
      if (!alarm.enabled) continue;
      const days = alarm.weekdays.length ? alarm.weekdays : [1, 2, 3, 4, 5, 6, 7];
      for (const weekday of days) {
        await Notifications.scheduleNotificationAsync({ content: content(alarm), trigger: trigger(alarm, weekday) });
        scheduled += 1;
      }
    }
    // The ring actually coming next: a live snooze first, otherwise the weekly schedule. An expired or
    // orphaned snooze is already dropped by nextRing, so it cannot hold this slot.
    const ring = nextRing(state);
    if (ring?.snoozed) {
      await Notifications.scheduleNotificationAsync({ content: content(ring.alarm), trigger: oneOffTrigger(ring.at) });
      scheduled += 1;
    }
    // Follow-up rings for that one ring; the weekly triggers above carry the later alarms.
    if (ring) scheduled += await scheduleChain(ring.alarm, ring.at);
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
