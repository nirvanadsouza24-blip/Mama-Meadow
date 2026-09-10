import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  Easing,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/app/integrations/supabase/client";

const { width: SW, height: SH } = Dimensions.get("window");

const COLORS = {
  background: "#1A0F08",
  parchment: "#FDF3E3",
  parchmentBorder: "rgba(200, 149, 108, 0.3)",
  gold: "#C8956C",
  goldLight: "#E8B88A",
  text: "#2C1A0E",
  textSecondary: "#7A5C44",
  textTertiary: "#B89880",
  surface: "#241408",
  white: "#FFFFFF",
};

interface FutureLetter {
  id: string;
  device_id: string;
  title: string;
  body: string;
  unlock_date: string;
  created_at: string;
  unlock_period_label: string;
}

// ─── Floating golden particles ────────────────────────────────────────────────
const PARTICLES = [
  { emoji: "✨", x: SW * 0.12, delay: 0, dur: 3200, size: 14 },
  { emoji: "⭐", x: SW * 0.28, delay: 600, dur: 4000, size: 11 },
  { emoji: "✨", x: SW * 0.55, delay: 1200, dur: 3600, size: 13 },
  { emoji: "⭐", x: SW * 0.72, delay: 400, dur: 4400, size: 10 },
  { emoji: "✨", x: SW * 0.88, delay: 900, dur: 3800, size: 12 },
  { emoji: "⭐", x: SW * 0.42, delay: 1600, dur: 3400, size: 9 },
];

function FloatingParticles() {
  const anims = useRef(
    PARTICLES.map(() => ({
      translateY: new Animated.Value(SH * 0.8),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    PARTICLES.forEach((p, i) => {
      const { translateY, opacity } = anims[i];
      const runParticle = () => {
        translateY.setValue(SH * 0.8 + Math.random() * 100);
        opacity.setValue(0);
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -60,
            duration: p.dur + Math.random() * 1000,
            delay: p.delay,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.7, duration: 400, delay: p.delay, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.7, duration: p.dur - 800, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
        ]).start(() => runParticle());
      };
      setTimeout(() => runParticle(), p.delay);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLES.map((p, i) => {
        const { translateY, opacity } = anims[i];
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: 0,
              opacity,
              transform: [{ translateY }],
            }}
          >
            <Text style={{ fontSize: p.size }}>{p.emoji}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LettersReadScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [letter, setLetter] = useState<FutureLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parchment unroll animation
  const unrollHeight = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const particlesOpacity = useRef(new Animated.Value(0)).current;

  const fetchLetter = useCallback(async () => {
    if (!id) {
      setError("Letter not found");
      setLoading(false);
      return;
    }
    console.log("[LettersRead] Fetching letter from Supabase", { id });
    try {
      const deviceId = (await AsyncStorage.getItem("device_id")) || "unknown";
      const { data, error: fetchError } = await (supabase as any)
        .from("future_letters")
        .select("*")
        .eq("id", id)
        .eq("device_id", deviceId)
        .single();

      if (fetchError || !data) {
        console.error("[LettersRead] Supabase fetch error:", fetchError?.message);
        setError("Couldn't load this letter. It may have been deleted.");
      } else {
        console.log("[LettersRead] Letter loaded successfully", { title: (data as FutureLetter).title });
        setLetter(data as FutureLetter);
      }
    } catch (err) {
      console.error("[LettersRead] Unexpected error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLetter();
  }, [fetchLetter]);

  // Start animations once letter is loaded
  useEffect(() => {
    if (!letter) return;

    // Background fade in
    Animated.timing(bgOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // Parchment unroll after short delay
    setTimeout(() => {
      Animated.timing(unrollHeight, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      // Content fades in after unroll starts
      setTimeout(() => {
        Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        Animated.timing(particlesOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      }, 500);
    }, 200);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter]);

  const handleClose = useCallback(() => {
    console.log("[LettersRead] Close button pressed");
    router.back();
  }, [router]);

  const writtenDate = letter
    ? new Date(letter.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Opening your letter...</Text>
      </View>
    );
  }

  if (error || !letter) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>📭</Text>
          <Text style={styles.errorTitle}>Letter not found</Text>
          <Text style={styles.errorSubtitle}>{error || "This letter could not be opened."}</Text>
          <Pressable onPress={handleClose} style={styles.closeButtonError}>
            <Text style={styles.closeButtonErrorText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Interpolate unroll height from 0 to a large value
  const parchmentMaxHeight = SH * 1.2;
  const animatedHeight = unrollHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, parchmentMaxHeight],
  });

  return (
    <View style={styles.outerContainer}>
      {/* Dark background */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.darkBg, { opacity: bgOpacity }]} />

      {/* Floating particles */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: particlesOpacity }]}>
        <FloatingParticles />
      </Animated.View>

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={handleClose} style={styles.topCloseButton} accessibilityLabel="Close letter">
            <Text style={styles.topCloseText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Parchment unroll container */}
          <Animated.View style={[styles.parchmentClip, { height: animatedHeight }]}>
            <View style={styles.parchment}>
              {/* Parchment content */}
              <Animated.View style={[styles.parchmentContent, { opacity: contentOpacity }]}>
                {/* Wax seal header */}
                <View style={styles.sealHeader}>
                  <Text style={styles.sealHeaderEmoji}>🕯️</Text>
                  <Text style={styles.sealHeaderLabel}>A Letter From Your Past Self</Text>
                </View>

                {/* Golden divider */}
                <View style={styles.goldDivider} />

                {/* Written date */}
                <Text style={styles.writtenDate}>Written on {writtenDate}</Text>

                {/* Letter title */}
                <Text style={styles.letterTitle}>{letter.title}</Text>

                {/* Body divider */}
                <View style={styles.goldDividerThin} />

                {/* Letter body */}
                <Text style={styles.letterBody}>{letter.body}</Text>

                {/* Bottom divider */}
                <View style={styles.goldDividerThin} />

                {/* Closing */}
                <View style={styles.closingRow}>
                  <Text style={styles.closingText}>With love,</Text>
                  <Text style={styles.closingSignature}>Your Past Self 🌸</Text>
                </View>
              </Animated.View>
            </View>
          </Animated.View>

          {/* Close button */}
          <Animated.View style={[styles.closeButtonContainer, { opacity: contentOpacity }]}>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close this letter</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: COLORS.background },
  darkBg: { backgroundColor: COLORS.background },
  safeArea: { flex: 1 },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Karla_400Regular",
    color: COLORS.gold,
    letterSpacing: 0.3,
  },

  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorEmoji: { fontSize: 48, marginBottom: 16 },
  errorTitle: {
    fontSize: 22,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.gold,
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 15,
    fontFamily: "Karla_400Regular",
    color: "rgba(200, 149, 108, 0.7)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  closeButtonError: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  closeButtonErrorText: {
    fontSize: 15,
    fontFamily: "Karla_700Bold",
    color: "#fff",
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  topCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(200, 149, 108, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(200, 149, 108, 0.25)",
  },
  topCloseText: {
    fontSize: 14,
    color: COLORS.gold,
    fontFamily: "Karla_700Bold",
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },

  // Parchment unroll
  parchmentClip: {
    overflow: "hidden",
    borderRadius: 20,
    marginBottom: 24,
  },
  parchment: {
    backgroundColor: COLORS.parchment,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.parchmentBorder,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
    overflow: "hidden",
  },
  parchmentContent: {
    padding: 28,
  },

  sealHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  sealHeaderEmoji: { fontSize: 36, marginBottom: 8 },
  sealHeaderLabel: {
    fontSize: 13,
    fontFamily: "Karla_700Bold",
    color: COLORS.gold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textAlign: "center",
  },

  goldDivider: {
    height: 1.5,
    backgroundColor: COLORS.gold,
    opacity: 0.35,
    marginBottom: 16,
    borderRadius: 1,
  },
  goldDividerThin: {
    height: 1,
    backgroundColor: COLORS.gold,
    opacity: 0.2,
    marginVertical: 20,
    borderRadius: 1,
  },

  writtenDate: {
    fontSize: 13,
    fontFamily: "Karla_400Regular",
    color: COLORS.textTertiary,
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 0.2,
  },

  letterTitle: {
    fontSize: 26,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.text,
    textAlign: "center",
    letterSpacing: -0.3,
    lineHeight: 34,
    marginBottom: 4,
  },

  letterBody: {
    fontSize: 16,
    fontFamily: "Karla_400Regular",
    color: COLORS.text,
    lineHeight: 28,
    letterSpacing: 0.1,
  },

  closingRow: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  closingText: {
    fontSize: 14,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  closingSignature: {
    fontSize: 16,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.gold,
    letterSpacing: -0.1,
  },

  closeButtonContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "rgba(200, 149, 108, 0.15)",
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(200, 149, 108, 0.3)",
  },
  closeButtonText: {
    fontSize: 15,
    fontFamily: "Karla_700Bold",
    color: COLORS.gold,
    letterSpacing: 0.2,
  },
});
