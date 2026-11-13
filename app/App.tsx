import { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { View } from 'react-native';
import * as Notifications from 'expo-notifications';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WelcomeScreen from './src/WelcomeScreen';
import HomeScreen from './src/HomeScreen';
import RingingScreen from './src/RingingScreen';
import MissionScreen from './src/MissionScreen';
import WinScreen from './src/WinScreen';
import RoutineScreen from './src/RoutineScreen';
import GentleScreen from './src/GentleScreen';
import { C, isNight } from './src/theme';
import { cancelChain, ensurePermissions, installHandler, scheduleAlarms, scheduledCount, setRingOpen, SNOOZE_MS, type AlarmPermissions } from './src/alarms';
import { clock, loadState, nextAlarm, nextRing, recordWin, ringScreen, saveState, type Alarm, type AppState } from './src/state';

type Screen = 'welcome' | 'home' | 'ringing' | 'mission' | 'gentle' | 'win' | 'routine';
// Screens with a dark background get light status-bar text.
const DARK: Screen[] = ['gentle'];

export default function App() {
  const [fontsLoaded] = useFonts({ Fredoka_600SemiBold, Fredoka_700Bold, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });
  const [screen, setScreen] = useState<Screen>('welcome');
  const [state, setState] = useState<AppState | null>(null);
  const [permissions, setPermissions] = useState<AlarmPermissions | null>(null);
  const [scheduled, setScheduled] = useState(0);
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  // A new key each time remounts the screen, so its animations replay from the start.
  const [runId, setRunId] = useState(0);
  // Gentle mode runs at the real 180 s / 300 s pace; only the dev shortcut uses the short demo.
  // `alarm` means a real alarm opened the sunrise; `preview` is Wind down, which earns nothing.
  const [gentleRun, setGentleRun] = useState<'preview' | 'demo' | 'alarm'>('preview');
  // True while the screen on show belongs to an alarm that actually fired. A preview is not a wake:
  // it must not record a win or reach the win screen, which says "that one counts".
  const [realRing, setRealRing] = useState(false);
  const stateRef = useRef<AppState | null>(null);

  const go = (s: Screen) => {
    setRunId((n) => n + 1);
    setScreen(s);
  };

  /** Every change goes through here: memory, disk, and the scheduled notifications follow. */
  const update = useCallback((next: AppState) => {
    stateRef.current = next;
    setState(next);
    void saveState(next);
  }, []);

  // The whole state goes in, not just the alarms: a pending snooze is part of what has to be re-armed.
  const reschedule = useCallback((next: AppState) => {
    void scheduleAlarms(next).then((result) => {
      setScheduled(result.scheduled);
      if (__DEV__) console.log('[alarms] scheduled', result.scheduled, result.error ? `error: ${result.error}` : 'ok');
    });
  }, []);

  // A response can arrive before the saved alarms have loaded, which is exactly what happens on a cold
  // start from a notification. Hold the request instead of dropping it, and answer it once state is in.
  const pendingRing = useRef<{ alarmId?: string } | null>(null);

  /** An alarm rang (or its notification was tapped): ring with that alarm, or the next one if the id is unknown. */
  const ring = useCallback((alarmId?: unknown) => {
    // Stop the follow-up rings the moment someone answers, even before the screen can switch: on a cold
    // start the alarm is being dismissed while the app is still loading. No chain may be armed behind this
    // screen, and the timestamp is the response receipt the chain log measures the cancel against.
    setRingOpen(true);
    void cancelChain(undefined, Date.now());
    const id = typeof alarmId === 'string' ? alarmId : undefined;
    const current = stateRef.current;
    if (!current) {
      pendingRing.current = { alarmId: id };
      return;
    }
    const found = id ? current.alarms.find((a) => a.id === id) ?? null : null;
    // A snooze that has now rung is no longer pending.
    if (current.snooze) update({ ...current, snooze: null });
    const target = found ?? nextAlarm(current.alarms)?.alarm ?? current.alarms[0] ?? null;
    setActiveAlarm(target);
    setRealRing(true);
    // A gentle alarm opens the sunrise instead of the ring screen; the chime takes over at 300 s.
    setGentleRun(target?.mode === 'gentle' ? 'alarm' : 'preview');
    setRunId((n) => n + 1);
    setScreen(ringScreen(target));
  }, [update]);

  useEffect(() => {
    installHandler();
    let alive = true;
    (async () => {
      const loaded = await loadState();
      if (!alive) return;
      stateRef.current = loaded;
      setState(loaded);
      // The alarm that launched us is now answerable.
      const waiting = pendingRing.current;
      pendingRing.current = null;
      if (waiting) ring(waiting.alarmId);
      const perms = await ensurePermissions();
      if (!alive) return;
      setPermissions(perms);
      if (perms.notifications) reschedule(loaded);
      else setScheduled(await scheduledCount());
    })();
    return () => {
      alive = false;
    };
  }, [reschedule, ring]);

  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener((n) => ring(n.request.content.data?.alarmId));
    const tapped = Notifications.addNotificationResponseReceivedListener((r) => ring(r.notification.request.content.data?.alarmId));
    return () => {
      received.remove();
      tapped.remove();
    };
  }, [ring]);

  // ring() sets the flag at once, before state has moved; this keeps it true only while an alarm's own
  // screen is actually open, so a later reschedule may arm a chain again once the alarm is answered.
  useEffect(() => {
    setRingOpen(realRing && (screen === 'ringing' || screen === 'mission' || screen === 'gentle'));
  }, [screen, realRing]);

  useEffect(() => {
    // Cold start caused by tapping an alarm. The response is read once, then cleared, so an ordinary
    // launch later does not jump back to a ring screen from a notification tapped days ago.
    Notifications.getLastNotificationResponseAsync()
      .then((r) => {
        if (!r) return;
        ring(r.notification.request.content.data?.alarmId);
        Notifications.clearLastNotificationResponse();
      })
      .catch(() => {});
  }, [ring]);

  const toggleAlarm = useCallback(
    (id: string) => {
      const current = stateRef.current;
      if (!current) return;
      const next = { ...current, alarms: current.alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)) };
      update(next);
      reschedule(next);
    },
    [reschedule, update],
  );

  const completeWake = useCallback(() => {
    const current = stateRef.current;
    if (!current) return;
    void cancelChain();
    const next = recordWin(current);
    update(next);
    // Re-arm the follow-up rings for the alarm that comes next.
    reschedule(next);
  }, [reschedule, update]);

  /** Snooze really snoozes: the same alarm is scheduled again in five minutes and the home screen waits. */
  const snooze = useCallback(() => {
    const alarm = activeAlarm;
    const current = stateRef.current;
    if (alarm && current) {
      // One owner: the pending ring goes into state, and only reschedule() touches the notification store.
      // Home reads the same value, so it counts down to the snoozed ring instead of next week's alarm.
      const next = { ...current, snooze: { alarmId: alarm.id, at: Date.now() + SNOOZE_MS } };
      update(next);
      reschedule(next);
    }
    go('home');
  }, [activeAlarm, reschedule, update]);

  if (!fontsLoaded || !state) return <View style={{ flex: 1, backgroundColor: C.paper }} />;
  const dark = DARK.includes(screen) || (screen === 'home' && isNight());
  // A pending snooze wins: it is the ring that is actually coming next.
  const next = nextRing(state);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.paper }}>
      <SafeAreaProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Animated.View key={`${screen}-${runId}`} entering={FadeIn.duration(220)} style={{ flex: 1 }}>
          {screen === 'welcome' && <WelcomeScreen onStart={() => go('home')} onTryAlarm={() => ring(state.alarms[0]?.id)} />}
          {screen === 'home' && (
            <HomeScreen
              alarms={state.alarms}
              next={next}
              streak={state.streak}
              wins={state.wins}
              permissions={permissions}
              scheduled={scheduled}
              bedtime={state.bedtime}
              onToggleAlarm={toggleAlarm}
              onRing={() => ring(next?.alarm.id)}
              onGentle={() => {
                setGentleRun('preview');
                setRealRing(false);
                go('gentle');
              }}
              onGentleDemo={() => {
                setGentleRun('demo');
                setRealRing(false);
                go('gentle');
              }}
              onRoutine={() => go('routine')}
            />
          )}
          {screen === 'ringing' && (
            <RingingScreen
              alarm={activeAlarm}
              time={activeAlarm ? clock(activeAlarm.hour, activeAlarm.minute).time : ''}
              onWake={() => go('mission')}
              onSnooze={snooze}
            />
          )}
          {screen === 'mission' && (
            <MissionScreen
              time={activeAlarm ? `${clock(activeAlarm.hour, activeAlarm.minute).time} ${clock(activeAlarm.hour, activeAlarm.minute).ampm}` : ''}
              style={state.missionStyle}
              onStyle={(missionStyle) => update({ ...state, missionStyle })}
              onDone={() => {
                if (!realRing) {
                  go('home');
                  return;
                }
                completeWake();
                go('win');
              }}
            />
          )}
          {/* A gentle alarm opens the sunrise; the chime takes over at 300 s. Wind down opens the same
              screen as a preview, so getting up from that earns nothing and the escalation goes home
              rather than to the win screen, which says "that one counts". */}
          {screen === 'gentle' && (
            <GentleScreen
              alarm={realRing ? activeAlarm : next?.alarm ?? null}
              demo={gentleRun === 'demo'}
              onWake={() => {
                if (!realRing) {
                  go('home');
                  return;
                }
                completeWake();
                go('win');
              }}
              onEscalate={() => (realRing ? go('ringing') : go('home'))}
            />
          )}
          {screen === 'win' && (
            <WinScreen
              streak={state.streak}
              best={state.best}
              wins={state.wins}
              onRoutine={() => go('routine')}
              onDone={() => go('home')}
            />
          )}
          {screen === 'routine' && <RoutineScreen habits={state.habits} onChange={(habits) => update({ ...state, habits })} onAlarms={() => go('home')} />}
        </Animated.View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
