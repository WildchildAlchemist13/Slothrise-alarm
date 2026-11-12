import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { View } from 'react-native';
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

type Screen = 'welcome' | 'home' | 'ringing' | 'mission' | 'gentle' | 'win' | 'routine';
// Screens with a dark background get light status-bar text.
const DARK: Screen[] = ['gentle'];

export default function App() {
  const [fontsLoaded] = useFonts({ Fredoka_600SemiBold, Fredoka_700Bold, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });
  const [screen, setScreen] = useState<Screen>('welcome');
  const [streak, setStreak] = useState(6);
  // A new key each time remounts the screen, so its animations replay from the start.
  const [runId, setRunId] = useState(0);
  const go = (s: Screen) => {
    setRunId((n) => n + 1);
    setScreen(s);
  };

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: C.paper }} />;
  const dark = DARK.includes(screen) || (screen === 'home' && isNight());
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.paper }}>
      <SafeAreaProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Animated.View key={`${screen}-${runId}`} entering={FadeIn.duration(220)} style={{ flex: 1 }}>
          {screen === 'welcome' && <WelcomeScreen onStart={() => go('home')} onTryAlarm={() => go('ringing')} />}
          {screen === 'home' && <HomeScreen streak={streak} onRing={() => go('ringing')} onGentle={() => go('gentle')} onRoutine={() => go('routine')} />}
          {screen === 'ringing' && <RingingScreen streak={streak} onWake={() => go('mission')} onSnooze={() => go('home')} />}
          {screen === 'mission' && <MissionScreen onDone={() => go('win')} />}
          {screen === 'gentle' && <GentleScreen onWake={() => go('win')} onEscalate={() => go('ringing')} />}
          {screen === 'win' && (
            <WinScreen
              streakBefore={streak}
              onRoutine={() => {
                setStreak((s) => s + 1);
                go('routine');
              }}
              onDone={() => {
                setStreak((s) => s + 1);
                go('home');
              }}
            />
          )}
          {screen === 'routine' && <RoutineScreen onAlarms={() => go('home')} />}
        </Animated.View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
