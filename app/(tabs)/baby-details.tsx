import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBabies, Baby } from "@/contexts/BabiesContext";

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
};

const CARD_GRADIENTS = [
  { from: "#FFD6E7", to: "#FFBCB5", emoji: "🌸" },
  { from: "#C8F7C5", to: "#A8E6CF", emoji: "🌿" },
  { from: "#E8D5FF", to: "#C9B8FF", emoji: "💜" },
  { from: "#FFF3B0", to: "#FFD166", emoji: "🌻" },
];

const MILESTONES = [
  "First smile",
  "First laugh",
  "Rolled over",
  "Sat up",
  "First tooth",
  "First words",
  "First steps",
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

function BabyCard({ baby, index }: { baby: Baby; index: number }) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const [milestones, setMilestones] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  const milestonesKey = `@mamameadow/milestones/${baby.id}`;
  const notesKey = `@mamameadow/notes/${baby.id}`;

  useEffect(() => {
    console.log(`[BabyDetails] Loading data for baby: ${baby.id}`);
    Promise.all([
      AsyncStorage.getItem(milestonesKey),
      AsyncStorage.getItem(notesKey),
    ]).then(([mRaw, nRaw]) => {
      if (mRaw) {
        try { setMilestones(JSON.parse(mRaw)); } catch {}
      }
      if (nRaw) setNotes(nRaw);
    });
  }, [baby.id]);

  const toggleMilestone = useCallback(async (milestone: string) => {
    console.log(`[BabyDetails] Toggle milestone: ${milestone} for baby: ${baby.id}`);
    const updated = milestones.includes(milestone)
      ? milestones.filter((m) => m !== milestone)
      : [...milestones, milestone];
    setMilestones(updated);
    await AsyncStorage.setItem(milestonesKey, JSON.stringify(updated));
  }, [milestones, baby.id]);

  const saveNotes = useCallback(async () => {
    console.log(`[BabyDetails] Saving notes for baby: ${baby.id}`);
    await AsyncStorage.setItem(notesKey, notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }, [notes, baby.id]);

  return (
    <FadeInView delay={index * 100}>
      <View style={{
        borderRadius: 20,
        marginBottom: 24,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(44, 26, 14, 0.08)",
        borderWidth: 1,
        borderColor: COLORS.border,
      }}>
        {/* Card Header */}
        <View style={{
          backgroundColor: gradient.from,
          paddingHorizontal: 20,
          paddingVertical: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}>
          <View style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "rgba(255,255,255,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Text style={{ fontSize: 28 }}>{gradient.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontFamily: "Fraunces_700Bold", color: COLORS.text, letterSpacing: -0.2 }}>
              {baby.name}
            </Text>
            <Text style={{ fontSize: 13, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, marginTop: 2 }}>
              Born {baby.dob}
            </Text>
          </View>
        </View>

        {/* Milestones */}
        <View style={{ backgroundColor: COLORS.surface, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 }}>
          <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>
            Milestones
          </Text>
          {MILESTONES.map((milestone) => {
            const checked = milestones.includes(milestone);
            return (
              <AnimatedPressable key={milestone} onPress={() => toggleMilestone(milestone)} scaleValue={0.98}>
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  gap: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.border,
                }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: checked ? COLORS.primary : COLORS.border,
                    backgroundColor: checked ? COLORS.primary : "transparent",
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                    {checked && <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>✓</Text>}
                  </View>
                  <Text style={{
                    fontSize: 15,
                    fontFamily: "Karla_400Regular",
                    color: checked ? COLORS.primary : COLORS.text,
                    textDecorationLine: checked ? "line-through" : "none",
                    flex: 1,
                  }}>
                    {milestone}
                  </Text>
                  {checked && <Text style={{ fontSize: 12 }}>🎉</Text>}
                </View>
              </AnimatedPressable>
            );
          })}
        </View>

        {/* Notes */}
        <View style={{ backgroundColor: COLORS.surface, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
          <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>
            Notes
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            onBlur={saveNotes}
            placeholder="Add notes about your baby…"
            placeholderTextColor={COLORS.textTertiary}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: COLORS.surfaceSecondary,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              fontFamily: "Karla_400Regular",
              color: COLORS.text,
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />
          {notesSaved && (
            <Text style={{ fontSize: 12, color: COLORS.primary, fontFamily: "Karla_400Regular", marginTop: 6 }}>
              ✓ Notes saved
            </Text>
          )}
        </View>
      </View>
    </FadeInView>
  );
}

export default function BabyDetailsScreen() {
  const { babies } = useBabies();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {babies.length === 0 ? (
            <FadeInView delay={0}>
              <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 24,
                  backgroundColor: COLORS.primaryMuted,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                }}>
                  <Text style={{ fontSize: 40 }}>🌱</Text>
                </View>
                <Text style={{ fontSize: 20, fontFamily: "Fraunces_700Bold", color: COLORS.text, textAlign: "center", marginBottom: 10 }}>
                  No babies added yet
                </Text>
                <Text style={{ fontSize: 15, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, textAlign: "center", lineHeight: 22 }}>
                  Add your first baby from the home screen to start tracking milestones and notes.
                </Text>
              </View>
            </FadeInView>
          ) : (
            <>
              <FadeInView delay={0}>
                <Text style={{ fontSize: 22, fontFamily: "Fraunces_700Bold", color: COLORS.text, letterSpacing: -0.3, marginBottom: 4 }}>
                  Baby Details
                </Text>
                <Text style={{ fontSize: 14, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, marginBottom: 24 }}>
                  Track milestones and notes for each baby
                </Text>
              </FadeInView>
              {babies.map((baby, index) => (
                <BabyCard key={baby.id} baby={baby} index={index} />
              ))}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
