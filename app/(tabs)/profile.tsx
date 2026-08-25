import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBabies } from "@/contexts/BabiesContext";

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
  divider: "rgba(44, 26, 14, 0.04)",
};

const STORAGE_KEY = "@mamameadow/profile";

const MOODS = [
  { emoji: "😴", label: "Tired" },
  { emoji: "😊", label: "Good" },
  { emoji: "🥰", label: "Loved" },
  { emoji: "😢", label: "Sad" },
  { emoji: "💪", label: "Strong" },
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

function FadeInView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export default function ProfileScreen() {
  const { babies } = useBabies();
  const [displayName, setDisplayName] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const firstBaby = babies[0];
  const babyInfo = firstBaby ? `${firstBaby.name} · Born ${firstBaby.dob}` : "No baby added yet";

  useEffect(() => {
    console.log("[ProfileScreen] Loading profile from AsyncStorage");
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const data = JSON.parse(raw);
          if (data.displayName) setDisplayName(data.displayName);
          if (data.mood) setSelectedMood(data.mood);
        } catch {
          console.warn("[ProfileScreen] Failed to parse profile data");
        }
      }
    });
  }, []);

  const handleSave = async () => {
    console.log("[ProfileScreen] Save button pressed", { displayName, selectedMood });
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ displayName, mood: selectedMood }));
      Alert.alert("Saved!", "Your profile has been updated. 🌸");
    } catch {
      Alert.alert("Error", "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleMoodSelect = (emoji: string) => {
    console.log("[ProfileScreen] Mood selected:", emoji);
    setSelectedMood(emoji);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <FadeInView delay={0}>
            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: "#FFF0F5",
                borderWidth: 3,
                borderColor: COLORS.accent,
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 4px 16px rgba(200, 149, 108, 0.25)",
              }}>
                <Text style={{ fontSize: 48 }}>🌸</Text>
              </View>
              <Text style={{
                marginTop: 12,
                fontSize: 22,
                fontFamily: "Fraunces_700Bold",
                color: COLORS.text,
                letterSpacing: -0.3,
              }}>
                My Profile
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontFamily: "Karla_400Regular", marginTop: 4 }}>
                Your personal space
              </Text>
            </View>
          </FadeInView>

          {/* Display Name */}
          <FadeInView delay={80}>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: COLORS.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 }}>
                Display Name
              </Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="e.g. Sarah"
                placeholderTextColor={COLORS.textTertiary}
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  fontFamily: "Karla_400Regular",
                  color: COLORS.text,
                }}
              />
            </View>
          </FadeInView>

          {/* Baby Info */}
          <FadeInView delay={140}>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: COLORS.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 }}>
                Baby
              </Text>
              <View style={{
                backgroundColor: COLORS.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}>
                <Text style={{ fontSize: 20 }}>🍼</Text>
                <Text style={{ fontSize: 15, fontFamily: "Karla_400Regular", color: firstBaby ? COLORS.text : COLORS.textTertiary }}>
                  {babyInfo}
                </Text>
              </View>
            </View>
          </FadeInView>

          {/* Mood Today */}
          <FadeInView delay={200}>
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: COLORS.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.6 }}>
                Mood Today
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {MOODS.map((mood) => {
                  const isSelected = selectedMood === mood.emoji;
                  return (
                    <AnimatedPressable
                      key={mood.emoji}
                      onPress={() => handleMoodSelect(mood.emoji)}
                      scaleValue={0.92}
                      style={{ flex: 1 }}
                    >
                      <View style={{
                        backgroundColor: isSelected ? COLORS.primaryMuted : COLORS.surface,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isSelected ? COLORS.primary : COLORS.border,
                        paddingVertical: 12,
                        alignItems: "center",
                        gap: 4,
                      }}>
                        <Text style={{ fontSize: 24 }}>{mood.emoji}</Text>
                        <Text style={{
                          fontSize: 10,
                          fontFamily: "Karla_700Bold",
                          color: isSelected ? COLORS.primary : COLORS.textTertiary,
                          letterSpacing: 0.3,
                        }}>
                          {mood.label}
                        </Text>
                      </View>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>
          </FadeInView>

          {/* Save Button */}
          <FadeInView delay={260}>
            <AnimatedPressable onPress={handleSave} scaleValue={0.975}>
              <View style={{
                backgroundColor: saving ? "rgba(74, 124, 89, 0.6)" : COLORS.primary,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
                boxShadow: "0 4px 16px rgba(74, 124, 89, 0.3)",
              }}>
                <Text style={{ fontSize: 16, fontFamily: "Karla_700Bold", color: "#fff", letterSpacing: 0.2 }}>
                  {saving ? "Saving…" : "Save profile"}
                </Text>
              </View>
            </AnimatedPressable>
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
