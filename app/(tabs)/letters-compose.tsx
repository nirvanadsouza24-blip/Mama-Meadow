import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/app/integrations/supabase/client";

const { width: SW } = Dimensions.get("window");

const COLORS = {
  background: "#FDF8F0",
  surface: "#FFFFFF",
  surfaceSecondary: "#F3EDE3",
  text: "#2C1A0E",
  textSecondary: "#7A5C44",
  textTertiary: "#B89880",
  primary: "#4A7C59",
  primaryMuted: "rgba(74, 124, 89, 0.10)",
  accent: "#C8956C",
  accentMuted: "rgba(200, 149, 108, 0.12)",
  border: "rgba(44, 26, 14, 0.07)",
  linedPaper: "rgba(200, 149, 108, 0.15)",
};

// ─── Unlock period options ────────────────────────────────────────────────────
interface UnlockOption {
  label: string;
  periodLabel: string;
  days: number;
  special?: boolean;
}

const UNLOCK_OPTIONS: UnlockOption[] = [
  { label: "2 Weeks", periodLabel: "2 weeks from now", days: 14 },
  { label: "1 Month", periodLabel: "1 month from now", days: 30 },
  { label: "6 Weeks", periodLabel: "6 weeks from now", days: 42 },
  { label: "3 Months", periodLabel: "3 months from now", days: 90 },
  { label: "6 Months", periodLabel: "6 months from now", days: 180 },
  { label: "1 Year", periodLabel: "1 year from now", days: 365 },
  { label: "2 Years", periodLabel: "2 years from now", days: 730 },
  { label: "Baby's 1st 🎂", periodLabel: "Baby's 1st Birthday", days: 365, special: true },
];

function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function formatUnlockDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

// ─── AnimatedPressable ────────────────────────────────────────────────────────
function AnimatedPressable({
  onPress,
  style,
  children,
  scaleValue = 0.97,
  disabled = false,
}: {
  onPress?: () => void;
  style?: object | object[];
  children: React.ReactNode;
  scaleValue?: number;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const animIn = () => Animated.spring(scale, { toValue: scaleValue, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const animOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, disabled && { opacity: 0.5 }]}>
      <Pressable onPressIn={animIn} onPressOut={animOut} onPress={onPress} style={style} disabled={disabled}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ─── Lined paper background ───────────────────────────────────────────────────
function LinedPaperLines({ height }: { height: number }) {
  if (!height || height <= 0) return null;
  const lineCount = Math.floor(height / 32);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: lineCount }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 44 + i * 32,
            height: 1,
            backgroundColor: COLORS.linedPaper,
          }}
        />
      ))}
      {/* Left margin line */}
      <View
        style={{
          position: "absolute",
          left: 44,
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: "rgba(200, 149, 108, 0.2)",
        }}
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LettersComposeScreen() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<UnlockOption>(UNLOCK_OPTIONS[2]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [bodyHeight, setBodyHeight] = useState(320);
  const [titleFocused, setTitleFocused] = useState(false);
  const [bodyFocused, setBodyFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const sealScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const unlockDate = addDays(selectedOption.days);
  const unlockDateDisplay = formatUnlockDate(unlockDate);

  const handleSelectOption = useCallback((option: UnlockOption) => {
    console.log("[LettersCompose] Unlock period selected:", option.label, option.periodLabel);
    setSelectedOption(option);
  }, []);

  const handleBack = useCallback(() => {
    console.log("[LettersCompose] Back button pressed");
    router.back();
  }, [router]);

  const handleSeal = useCallback(async () => {
    console.log("[LettersCompose] Seal & Send button pressed", { title, bodyLength: body.length, period: selectedOption.label });

    if (!title.trim()) {
      Alert.alert("Missing title", "Please give your letter a title before sealing it.");
      return;
    }
    if (!body.trim()) {
      Alert.alert("Empty letter", "Your letter is empty. Write something to your future self first.");
      return;
    }

    // Seal animation
    Animated.sequence([
      Animated.spring(sealScale, { toValue: 0.94, useNativeDriver: true, speed: 50, bounciness: 4 }),
      Animated.spring(sealScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }),
    ]).start();

    setSaving(true);
    try {
      const deviceId = (await AsyncStorage.getItem("device_id")) || "unknown";
      console.log("[LettersCompose] Inserting letter to Supabase", { deviceId, unlockDate: unlockDate.toISOString() });

      const { error } = await (supabase as any).from("future_letters").insert({
        device_id: deviceId,
        title: title.trim(),
        body: body.trim(),
        unlock_date: unlockDate.toISOString(),
        unlock_period_label: selectedOption.periodLabel,
      });

      if (error) {
        console.error("[LettersCompose] Supabase insert error:", error.message);
        Alert.alert("Couldn't seal your letter", "Something went wrong saving your letter. Please try again.");
      } else {
        console.log("[LettersCompose] Letter saved successfully — navigating back");
        router.back();
      }
    } catch (err) {
      console.error("[LettersCompose] Unexpected error:", err);
      Alert.alert("Couldn't seal your letter", "An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [title, body, selectedOption, unlockDate, router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={handleBack} style={styles.backButton} accessibilityLabel="Go back">
                <Text style={styles.backArrow}>‹</Text>
              </Pressable>
              <Text style={styles.headerTitle}>Write to Your Future Self</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Unlock period selector */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>WHEN SHOULD THIS OPEN?</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pillRow}
                >
                  {UNLOCK_OPTIONS.map((option) => {
                    const isSelected = option.label === selectedOption.label;
                    return (
                      <AnimatedPressable
                        key={option.label}
                        onPress={() => handleSelectOption(option)}
                        scaleValue={0.94}
                      >
                        <View style={[styles.pill, isSelected && styles.pillSelected, option.special && styles.pillSpecial]}>
                          <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                            {option.label}
                          </Text>
                        </View>
                      </AnimatedPressable>
                    );
                  })}
                </ScrollView>

                {/* Unlock date display */}
                <View style={styles.unlockDateRow}>
                  <Text style={styles.unlockDateLabel}>
                    {"This letter will be sealed for "}
                    <Text style={styles.unlockDateLabelBold}>{selectedOption.label}</Text>
                    {" and open on"}
                  </Text>
                  <Text style={styles.unlockDateValue}>{unlockDateDisplay}</Text>
                </View>
              </View>

              {/* Letter paper */}
              <View style={styles.paperCard}>
                {/* Title field */}
                <TextInput
                  style={[styles.titleInput, titleFocused && styles.titleInputFocused]}
                  placeholder="Dear Future Me..."
                  placeholderTextColor={COLORS.textTertiary}
                  value={title}
                  onChangeText={setTitle}
                  onFocus={() => setTitleFocused(true)}
                  onBlur={() => setTitleFocused(false)}
                  returnKeyType="next"
                  maxLength={80}
                />

                {/* Divider */}
                <View style={styles.paperDivider} />

                {/* Body field with lined paper */}
                <View
                  style={[styles.bodyContainer, { minHeight: bodyHeight }]}
                  onLayout={(e) => setBodyHeight(Math.max(320, e.nativeEvent.layout.height))}
                >
                  <LinedPaperLines height={bodyHeight || 320} />
                  <TextInput
                    style={[styles.bodyInput, bodyFocused && styles.bodyInputFocused]}
                    placeholder={"Today I'm feeling...\n\nI want you to remember...\n\nBy the time you read this..."}
                    placeholderTextColor={COLORS.textTertiary}
                    value={body}
                    onChangeText={setBody}
                    onFocus={() => setBodyFocused(true)}
                    onBlur={() => setBodyFocused(false)}
                    multiline
                    textAlignVertical="top"
                    scrollEnabled={false}
                  />
                </View>
              </View>

              {/* Seal button */}
              <Animated.View style={{ transform: [{ scale: sealScale }] }}>
                <AnimatedPressable onPress={handleSeal} scaleValue={0.96} disabled={saving}>
                  <View style={[styles.sealButton, saving && { opacity: 0.7 }]}>
                    <Text style={styles.sealButtonText}>
                      {saving ? "Sealing..." : "🕯️  Seal this Letter"}
                    </Text>
                  </View>
                </AnimatedPressable>
              </Animated.View>

              <Text style={styles.sealHint}>
                Once sealed, this letter will be locked until {unlockDateDisplay}
              </Text>
            </ScrollView>
          </Animated.View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 28,
    color: COLORS.text,
    fontFamily: "Fraunces_700Bold",
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Karla_700Bold",
    color: COLORS.text,
    flex: 1,
    textAlign: "center",
  },

  sectionBlock: { marginTop: 24, marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Karla_700Bold",
    color: COLORS.textTertiary,
    letterSpacing: 1.0,
    textTransform: "uppercase",
    marginBottom: 12,
  },

  pillRow: { gap: 8, paddingRight: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: "rgba(44, 26, 14, 0.08)",
  },
  pillSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  pillSpecial: {
    borderColor: "rgba(200, 149, 108, 0.4)",
    backgroundColor: "rgba(200, 149, 108, 0.08)",
  },
  pillText: {
    fontSize: 14,
    fontFamily: "Karla_700Bold",
    color: COLORS.textSecondary,
  },
  pillTextSelected: { color: "#fff" },

  unlockDateRow: {
    marginTop: 14,
    backgroundColor: COLORS.accentMuted,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(200, 149, 108, 0.2)",
  },
  unlockDateLabel: {
    fontSize: 13,
    fontFamily: "Karla_400Regular",
    color: COLORS.accent,
    marginBottom: 4,
    lineHeight: 19,
  },
  unlockDateLabelBold: {
    fontFamily: "Karla_700Bold",
    color: COLORS.accent,
  },
  unlockDateValue: {
    fontSize: 15,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.accent,
    letterSpacing: -0.1,
  },

  paperCard: {
    backgroundColor: "#FEFAF3",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(200, 149, 108, 0.2)",
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  titleInput: {
    fontSize: 22,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.text,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    letterSpacing: -0.2,
  },
  titleInputFocused: { color: COLORS.text },
  paperDivider: {
    height: 1,
    backgroundColor: "rgba(200, 149, 108, 0.25)",
    marginHorizontal: 20,
    marginBottom: 8,
  },
  bodyContainer: {
    position: "relative",
    minHeight: 320,
  },
  bodyInput: {
    fontSize: 16,
    fontFamily: "Karla_400Regular",
    color: COLORS.text,
    lineHeight: 32,
    paddingHorizontal: 20,
    paddingLeft: 56,
    paddingTop: 12,
    paddingBottom: 20,
    minHeight: 320,
  },
  bodyInputFocused: { color: COLORS.text },

  sealButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 6,
  },
  sealButtonText: {
    fontSize: 17,
    fontFamily: "Karla_700Bold",
    color: "#fff",
    fontWeight: "700",
  },
  sealHint: {
    fontSize: 12,
    fontFamily: "Karla_400Regular",
    color: COLORS.textTertiary,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
