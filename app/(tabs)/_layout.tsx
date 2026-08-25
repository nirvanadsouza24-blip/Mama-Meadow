import React from 'react';
import { Stack } from 'expo-router';
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";

const HEADER_OPTIONS = {
  headerStyle: { backgroundColor: '#FAF7F2' },
  headerTintColor: '#2C1A0E',
  headerShadowVisible: false,
  headerBackTitle: '',
  headerTitleStyle: { fontFamily: 'Karla_700Bold', fontSize: 17 },
};

export default function TabLayout() {
  useSubscriptionGuard();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <Stack.Screen key="home" name="(home)" />
      <Stack.Screen key="mother" name="mother" />
      <Stack.Screen
        key="profile"
        name="profile"
        options={{ headerShown: true, title: 'My Profile', ...HEADER_OPTIONS }}
      />
      <Stack.Screen
        key="baby-details"
        name="baby-details"
        options={{ headerShown: true, title: 'Baby Details', ...HEADER_OPTIONS }}
      />
      <Stack.Screen
        key="appointments"
        name="appointments"
        options={{ headerShown: true, title: 'Appointments', ...HEADER_OPTIONS }}
      />
      <Stack.Screen
        key="notifications"
        name="notifications"
        options={{ headerShown: true, title: 'Notifications', ...HEADER_OPTIONS }}
      />
      <Stack.Screen
        key="privacy"
        name="privacy"
        options={{ headerShown: true, title: 'Privacy & Security', ...HEADER_OPTIONS }}
      />
      <Stack.Screen
        key="wellness"
        name="wellness"
        options={{ headerShown: true, title: 'Wellness Hub', ...HEADER_OPTIONS }}
      />
    </Stack>
  );
}
