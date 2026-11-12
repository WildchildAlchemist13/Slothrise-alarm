// Real alarm scheduling, not a preview: scheduled notifications fire with the app closed or the phone locked.
// Android uses an exact alarm (setAlarmClock) on a MAX-importance channel with an ALARM-usage audio stream.
// iOS gets the strongest thing a notification can do — a time-sensitive local notification with the app's own
// chime. iOS has no AlarmKit in Expo SDK 58, so it cannot bypass the mute switch; see README "Limits".
/* eslint-disable import/namespace -- expo-notifications exports these Android enums at runtime, but the
   rule resolves the package's declaration file and calls them missing. Values are the Android SDK's. */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Alarm } from './state';

export const ALARM_CHANNEL = 'alarm';
export const ALARM_SOUND = 'alarm_chime.wav';

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

function content(alarm: Alarm): Notifications.NotificationContentInput {
  return {
    title: alarm.label,
    body: alarm.mode === 'gentle' ? 'The sunrise is starting. Hold to wake.' : 'Time to get up. Hold to wake.',
    sound: ALARM_SOUND,
    interruptionLevel: 'timeSensitive',
    data: { alarmId: alarm.id },
  };
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

/** Replace every scheduled alarm with the current list. Safe to call on each change. */
export async function scheduleAlarms(alarms: Alarm[]): Promise<ScheduleResult> {
  try {
    await ensureChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();
    let scheduled = 0;
    for (const alarm of alarms) {
      if (!alarm.enabled) continue;
      const days = alarm.weekdays.length ? alarm.weekdays : [1, 2, 3, 4, 5, 6, 7];
      for (const weekday of days) {
        await Notifications.scheduleNotificationAsync({ content: content(alarm), trigger: trigger(alarm, weekday) });
        scheduled += 1;
      }
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
