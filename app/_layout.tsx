import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Root index.tsx will handle initial routing

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="task/[id]" options={{ title: 'Task Detail' }} />
        <Stack.Screen name="pomodoro/session" options={{ title: 'Focus Session', presentation: 'modal' }} />
        <Stack.Screen name="journal/index" options={{ title: 'Journal', presentation: 'modal' }} />
        <Stack.Screen name="breath" options={{ title: 'Breathing Exercises', presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
