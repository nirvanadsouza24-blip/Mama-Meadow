import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = {
  background: "#FAF7F2",
  surface: "#FFFFFF",
  surfaceSecondary: "#F3EDE3",
  text: "#2C1A0E",
  textSecondary: "#7A5C44",
  textTertiary: "#B89880",
  primary: "#4A7C59",
  primaryMuted: "rgba(74, 124, 89, 0.10)",
  accent: "#C8956C",
  border: "rgba(44, 26, 14, 0.07)",
  purple: "#7C5CBF",
  purpleMuted: "rgba(124, 92, 191, 0.10)",
};

const STORAGE_KEY = "@mamameadow/notification-prefs";

type Prefs = {
  feedReminders: boolean;
  sleepReminders: boolean;
  appointmentReminders: boolean;
  weeklyWellness: boolean;
  dailyAffirmation: boolean;
};

const DEFAULT_PREFS: Prefs = {
  feedReminders: false,
  sleepReminders: false,
  appointmentReminders: false,
  weeklyWellness: false,
  dailyAffirmation: false,
};

const TOGGLE_ROWS: {
  key: keyof Prefs;
  icon: string;
  label: string;
  subtitle: string;
}[] = [
  { key: "feedReminders", icon: "🍼", label: "Feed reminders", subtitle: "Gentle nudge every 3 hours" },
  { key: "sleepReminders", icon: "😴", label: "Sleep tracking", subtitle: "Remind me to log sleep" },
  { key: "appointmentReminders", icon: "📅", label: "Appointment reminders", subtitle: "24 hours before each visit" },
  { key: "weeklyWellness", icon: "🌿", label: "Weekly wellness check-in", subtitle: "Every Sunday morning" },
  { key: "dailyAffirmation", icon: "🌸", label: "Daily affirmation", subtitle: "A kind word each morning" },
];

function FadeInItem({ children, index }: { children: React.ReactNode; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 70, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export default function NotificationsScreen() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => {
    console.log("[NotificationsScreen] Loading notification prefs from AsyncStorage");
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }); } catch {}
      }
    });
  }, []);

  const handleToggle = async (key: keyof Prefs, value: boolean) => {
    console.log(`[NotificationsScreen] Toggle ${key}:`, value);
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const enabledCount = Object.values(prefs).filter(Boolean).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <FadeInItem index={0}>
          <View style={{
            backgroundColor: COLORS.purpleMuted,
            borderRadius: 20,
            padding: 20,
            marginBottom: 28,
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            borderWidth: 1,
            borderColor: "rgba(124, 92, 191, 0.15)",
          }}>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "rgba(124, 92, 191, 0.15)",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <Text style={{ fontSize: 28 }}>🔔</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontFamily: "Fraunces_700Bold", color: COLORS.text, letterSpacing: -0.2 }}>
                Reminders
              </Text>
              <Text style={{ fontSize: 13, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, marginTop: 2 }}>
                {enabledCount} of {TOGGLE_ROWS.length} enabled
              </Text>
            </View>
          </View>
        </FadeInItem>

        {/* Toggle Rows */}
        <FadeInItem index={1}>
          <View style={{
            backgroundColor: COLORS.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            overflow: "hidden",
            marginBottom: 24,
            boxShadow: "0 1px 4px rgba(44, 26, 14, 0.04)",
          }}>
            {TOGGLE_ROWS.map((row, index) => {
              const isLast = index === TOGGLE_ROWS.length - 1;
              return (
                <View key={row.key}>
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    gap: 12,
                  }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: prefs[row.key] ? COLORS.purpleMuted : COLORS.surfaceSecondary,
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                      <Text style={{ fontSize: 18 }}>{row.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontFamily: "Karla_700Bold", color: COLORS.text }}>
                        {row.label}
                      </Text>
                      <Text style={{ fontSize: 13, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, marginTop: 1 }}>
                        {row.subtitle}
                      </Text>
                    </View>
                    <Switch
                      value={prefs[row.key]}
                      onValueChange={(val) => handleToggle(row.key, val)}
                      trackColor={{ false: "rgba(44, 26, 14, 0.12)", true: COLORS.purple }}
                      thumbColor="#fff"
                    />
                  </View>
                  {!isLast && (
                    <View style={{ height: 1, backgroundColor: "rgba(44, 26, 14, 0.04)", marginLeft: 68 }} />
                  )}
                </View>
              );
            })}
          </View>
        </FadeInItem>

        {/* Note */}
        <FadeInItem index={2}>
          <View style={{
            backgroundColor: COLORS.surfaceSecondary,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}>
            <Text style={{ fontSize: 13, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, lineHeight: 20 }}>
              💡 Notification delivery requires a device build — toggles are saved for when notifications are enabled.
            </Text>
          </View>
        </FadeInItem>
      </ScrollView>
    </SafeAreaView>
  );
}
