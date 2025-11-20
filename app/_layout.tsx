import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

export const unstable_settings = {
  anchor: 'login',
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('[AuthGate] user:', user, 'loading:', loading, 'segments:', segments);
    
    // while checking auth, do nothing
    if (loading) {
      console.log('[AuthGate] Still loading, skipping redirect');
      return;
    }

    // if user is not authenticated and not already on /login, redirect to login
    const onLoginRoute = segments[0] === 'login' || segments.includes('login');
    console.log('[AuthGate] onLoginRoute:', onLoginRoute, 'user:', !!user);
    
    if (!user && !onLoginRoute) {
      console.log('[AuthGate] Redirecting to /login');
      router.replace('/login');
    }

    // if user is authenticated and on /login, send to the home screen
    if (user && onLoginRoute) {
      console.log('[AuthGate] User authenticated, redirecting to /(tabs)');
      router.replace('/(tabs)');
    }
  }, [user, loading, router, segments]);

  // render children regardless; navigation will redirect as needed
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGate>
          <Stack>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </AuthGate>
      </ThemeProvider>
    </AuthProvider>
  );
}
