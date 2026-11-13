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
import { ensurePermissions, installHandler, scheduleAlarms, scheduledCount, type AlarmPermissions } from './src/alarms';
import { clock, loadState, nextAlarm, recordWin, saveState, type Alarm, type AppState } from './src/state';

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
  const [gentleDemo, setGentleDemo] = useState(false);
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

  const reschedule = useCallback((alarms: Alarm[]) => {
    void scheduleAlarms(alarms).then((result) => {
      setScheduled(result.scheduled);
      if (__DEV__) console.log('[alarms] scheduled', result.scheduled, result.error ? `error: ${result.error}` : 'ok');
    });
  }, []);

  useEffect(() => {
    installHandler();
    let alive = true;
    (async () => {
      const loaded = await loadState();
      if (!alive) return;
      stateRef.current = loaded;
      setState(loaded);
      const perms = await ensurePermissions();
      if (!alive) return;
      setPermissions(perms);
      if (perms.notifications) reschedule(loaded.alarms);
      else setScheduled(await scheduledCount());
    })();
    return () => {
      alive = false;
    };
  }, [reschedule]);

  /** An alarm rang (or its notification was tapped): ring with that alarm, or the next one if the id is unknown. */
  const ring = useCallback((alarmId?: unknown) => {
    const current = stateRef.current;
    if (!current) return;
    const found = typeof alarmId === 'string' ? current.alarms.find((a) => a.id === alarmId) ?? null : null;
    setActiveAlarm(found ?? nextAlarm(current.alarms)?.alarm ?? current.alarms[0] ?? null);
    setRunId((n) => n + 1);
    setScreen('ringing');
  }, []);

  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener((n) => ring(n.request.content.data?.alarmId));
    const tapped = Notifications.addNotificationResponseReceivedListener((r) => ring(r.notification.request.content.data?.alarmId));
    return () => {
      received.remove();
      tapped.remove();
    };
  }, [ring]);

  useEffect(() => {
    // Cold start from a tapped alarm notification.
    Notifications.getLastNotificationResponseAsync()
      .then((r) => {
        if (r) ring(r.notification.request.content.data?.alarmId);
      })
      .catch(() => {});
  }, [ring]);

  const toggleAlarm = useCallback(
    (id: string) => {
      const current = stateRef.current;
      if (!current) return;
      const next = { ...current, alarms: current.alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)) };
      update(next);
      reschedule(next.alarms);
    },
    [reschedule, update],
  );

  const completeWake = useCallback(() => {
    const current = stateRef.current;
    if (!current) return;
    update(recordWin(current));
  }, [update]);

  if (!fontsLoaded || !state) return <View style={{ flex: 1, backgroundColor: C.paper }} />;
  const dark = DARK.includes(screen) || (screen === 'home' && isNight());
  const next = nextAlarm(state.alarms);

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
                setGentleDemo(false);
                go('gentle');
              }}
              onGentleDemo={() => {
                setGentleDemo(true);
                go('gentle');
              }}
              onRoutine={() => go('routine')}
            />
          )}
          {screen === 'ringing' && (
            <RingingScreen
              alarm={activeAlarm}
              time={activeAlarm ? clock(activeAlarm.hour, activeAlarm.minute).time : ''}
              streak={state.streak}
              onWake={() => go('mission')}
              onSnooze={() => go('home')}
            />
          )}
          {screen === 'mission' && (
            <MissionScreen
              time={activeAlarm ? `${clock(activeAlarm.hour, activeAlarm.minute).time} ${clock(activeAlarm.hour, activeAlarm.minute).ampm}` : ''}
              onDone={() => {
                completeWake();
                go('win');
              }}
            />
          )}
          {/* Gentle is only reachable as the bedtime preview (real alarms open RingingScreen), so getting up
              from it earns nothing and must not reach the win screen, which says "that one counts". */}
          {screen === 'gentle' && <GentleScreen demo={gentleDemo} onWake={() => go('home')} onEscalate={() => go('ringing')} />}
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
