import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
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
  sage: "#6B9E7A",
  sageMuted: "rgba(107, 158, 122, 0.10)",
  danger: "#D94F4F",
  dangerMuted: "rgba(217, 79, 79, 0.08)",
};

const MAMAMEADOW_KEYS = [
  "@mamameadow/profile",
  "@mamameadow/appointments",
  "@mamameadow/notification-prefs",
];

function AnimatedPressable({
  onPress,
  style,
  children,
  scaleValue = 0.97,
}: {
  onPress?: () => void;
  style?: object | object[];
  children: React.ReactNode;
  scaleValue?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const animateIn = () =>
    Animated.spring(scale, { toValue: scaleValue, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const animateOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPressIn={animateIn} onPressOut={animateOut} onPress={onPress} style={style}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

function FadeInItem({ children, index }: { children: React.ReactNode; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, delay: index * 80, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 380, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
      overflow: "hidden",
      marginBottom: 20,
      boxShadow: "0 1px 4px rgba(44, 26, 14, 0.04)",
    }}>
      {children}
    </View>
  );
}

export default function PrivacyScreen() {
  const router = useRouter();

  const handleExport = () => {
    console.log("[PrivacyScreen] Export data button pressed");
    Alert.alert("Coming soon", "Data export will be available in a future update.");
  };

  const handleDeleteAll = () => {
    console.log("[PrivacyScreen] Delete all data button pressed");
    Alert.alert(
      "Delete all data?",
      "This will permanently remove all your Mama Meadow data from this device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            console.log("[PrivacyScreen] Confirmed delete all data");
            try {
              const allKeys = await AsyncStorage.getAllKeys();
              const mamaMeadowKeys = allKeys.filter((k) => k.startsWith("@mamameadow/"));
              if (mamaMeadowKeys.length > 0) {
                await AsyncStorage.multiRemove(mamaMeadowKeys);
              }
              Alert.alert("Done", "All your data has been deleted from this device.");
            } catch {
              Alert.alert("Error", "Could not delete data. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    console.log("[PrivacyScreen] Privacy Policy link pressed");
    router.push("/privacy-policy");
  };

  const handleTerms = () => {
    console.log("[PrivacyScreen] Terms of Use link pressed");
    Linking.openURL("https://nirvanadsouza24.github.io/mama-meadow/terms");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header badge */}
        <FadeInItem index={0}>
          <View style={{
            backgroundColor: COLORS.sageMuted,
            borderRadius: 20,
            padding: 20,
            marginBottom: 28,
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            borderWidth: 1,
            borderColor: "rgba(107, 158, 122, 0.2)",
          }}>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "rgba(107, 158, 122, 0.15)",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <Text style={{ fontSize: 28 }}>🔒</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontFamily: "Fraunces_700Bold", color: COLORS.text, letterSpacing: -0.2 }}>
                Privacy & Security
              </Text>
              <Text style={{ fontSize: 13, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, marginTop: 2 }}>
                Your data, your control
              </Text>
            </View>
          </View>
        </FadeInItem>

        {/* Your Data */}
        <FadeInItem index={1}>
          <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>
            Your Data
          </Text>
          <SectionCard>
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <Text style={{ fontSize: 20 }}>📱</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontFamily: "Karla_700Bold", color: COLORS.text, marginBottom: 4 }}>
                    Stored locally on your device
                  </Text>
                  <Text style={{ fontSize: 14, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, lineHeight: 20 }}>
                    All your data — baby details, appointments, and preferences — is stored only on this device. It is never uploaded to any server or shared with third parties.
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Text style={{ fontSize: 20 }}>🛡️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontFamily: "Karla_700Bold", color: COLORS.text, marginBottom: 4 }}>
                    No tracking, no ads
                  </Text>
                  <Text style={{ fontSize: 14, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, lineHeight: 20 }}>
                    Mama Meadow does not use advertising SDKs or analytics that identify you personally.
                  </Text>
                </View>
              </View>
            </View>
          </SectionCard>
        </FadeInItem>

        {/* Exports */}
        <FadeInItem index={2}>
          <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>
            Exports
          </Text>
          <SectionCard>
            <AnimatedPressable onPress={handleExport} scaleValue={0.985}>
              <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: COLORS.primaryMuted,
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  <Text style={{ fontSize: 18 }}>📤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontFamily: "Karla_700Bold", color: COLORS.primary }}>
                    Export my data
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, marginTop: 1 }}>
                    Download a copy of all your data
                  </Text>
                </View>
                <Text style={{ fontSize: 20, color: COLORS.textTertiary }}>›</Text>
              </View>
            </AnimatedPressable>
          </SectionCard>
        </FadeInItem>

        {/* Delete Data */}
        <FadeInItem index={3}>
          <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>
            Delete Data
          </Text>
          <AnimatedPressable onPress={handleDeleteAll} scaleValue={0.975}>
            <View style={{
              backgroundColor: COLORS.dangerMuted,
              borderRadius: 14,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              borderWidth: 1,
              borderColor: "rgba(217, 79, 79, 0.15)",
              marginBottom: 28,
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: "rgba(217, 79, 79, 0.12)",
                justifyContent: "center",
                alignItems: "center",
              }}>
                <Text style={{ fontSize: 18 }}>🗑️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontFamily: "Karla_700Bold", color: COLORS.danger }}>
                  Delete all my data
                </Text>
                <Text style={{ fontSize: 13, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, marginTop: 1 }}>
                  Permanently removes all app data
                </Text>
              </View>
            </View>
          </AnimatedPressable>
        </FadeInItem>

        {/* Links */}
        <FadeInItem index={4}>
          <SectionCard>
            <AnimatedPressable onPress={handlePrivacyPolicy} scaleValue={0.985}>
              <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Text style={{ fontSize: 18 }}>📄</Text>
                <Text style={{ flex: 1, fontSize: 15, fontFamily: "Karla_700Bold", color: COLORS.primary }}>
                  Privacy Policy
                </Text>
                <Text style={{ fontSize: 20, color: COLORS.textTertiary }}>›</Text>
              </View>
            </AnimatedPressable>
            <View style={{ height: 1, backgroundColor: COLORS.border, marginLeft: 46 }} />
            <AnimatedPressable onPress={handleTerms} scaleValue={0.985}>
              <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Text style={{ fontSize: 18 }}>📋</Text>
                <Text style={{ flex: 1, fontSize: 15, fontFamily: "Karla_700Bold", color: COLORS.primary }}>
                  Terms of Use
                </Text>
                <Text style={{ fontSize: 20, color: COLORS.textTertiary }}>›</Text>
              </View>
            </AnimatedPressable>
          </SectionCard>
        </FadeInItem>
      </ScrollView>
    </SafeAreaView>
  );
}
