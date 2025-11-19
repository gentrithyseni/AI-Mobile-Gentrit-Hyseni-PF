import React from 'react';
import { useRouter } from 'expo-router';
import LoginScreen from '../src/screens/LoginScreen';

export default function LoginRoute(props: any) {
  const router = useRouter();
  // Provide a small navigation shim expected by the old screen
  const navigation = {
    navigate: (routeName: string) => router.push(routeName),
  } as any;

  return <LoginScreen {...props} navigation={navigation} />;
}
