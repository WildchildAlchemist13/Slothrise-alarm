import { StatusBar } from 'expo-status-bar';
import { useFonts, Fredoka_500Medium, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WelcomeScreen from './src/WelcomeScreen';
import { BRAND } from './src/sky';

export default function App() {
  const [fontsLoaded] = useFonts({ Fredoka_500Medium, Fredoka_700Bold });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: BRAND.ink }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <WelcomeScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
