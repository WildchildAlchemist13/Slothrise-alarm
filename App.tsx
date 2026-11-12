import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WelcomeScreen from './src/WelcomeScreen';
import RingingScreen from './src/RingingScreen';
import WinScreen from './src/WinScreen';
import GentleScreen from './src/GentleScreen';
import { BRAND } from './src/sky';

type Screen = 'welcome' | 'ringing' | 'gentle' | 'win';

export default function App() {
  const [fontsLoaded] = useFonts({ Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold });
  const [screen, setScreen] = useState<Screen>('welcome');
  // A new key each time remounts the screen, so its animations replay from the start.
  const [runId, setRunId] = useState(0);
  const go = (s: Screen) => {
    setRunId((n) => n + 1);
    setScreen(s);
  };

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BRAND.ink }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: BRAND.ink }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Animated.View key={`${screen}-${runId}`} entering={FadeIn.duration(250)} style={{ flex: 1 }}>
          {screen === 'welcome' && <WelcomeScreen onStart={() => go('ringing')} onGentle={() => go('gentle')} />}
          {screen === 'gentle' && <GentleScreen onWake={() => go('win')} onEscalate={() => go('ringing')} />}
          {screen === 'ringing' && <RingingScreen onWake={() => go('win')} onSnooze={() => go('welcome')} />}
          {screen === 'win' && <WinScreen onAgain={() => go('ringing')} onDone={() => go('welcome')} />}
        </Animated.View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
