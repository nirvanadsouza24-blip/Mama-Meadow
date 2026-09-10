import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Modal,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/app/integrations/supabase/client";

const { width: SW, height: SH } = Dimensions.get("window");

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
  accentMuted: "rgba(200, 149, 108, 0.12)",
  border: "rgba(44, 26, 14, 0.07)",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface FutureLetter {
  id: string;
  device_id: string;
  title: string;
  body: string;
  unlock_date: string;
  created_at: string;
  unlock_period_label: string;
}

// ─── Floating Nature ──────────────────────────────────────────────────────────
const NATURE_ELEMENTS = [
  { emoji: "🌸", top: SH * 0.08, left: SW * 0.06, size: 20, delay: 0, floatRange: 18, driftRange: 9, floatDur: 4000, driftDur: 5500 },
  { emoji: "🦋", top: SH * 0.15, right: SW * 0.10, size: 18, delay: 700, floatRange: 16, driftRange: 11, floatDur: 4400, driftDur: 6000 },
  { emoji: "🌼", top: SH * 0.38, left: SW * 0.04, size: 16, delay: 1400, floatRange: 20, driftRange: 8, floatDur: 3800, driftDur: 5000 },
  { emoji: "✉️", top: SH * 0.55, right: SW * 0.07, size: 15, delay: 300, floatRange: 14, driftRange: 10, floatDur: 3600, driftDur: 5800 },
  { emoji: "🌿", top: SH * 0.72, left: SW * 0.12, size: 14, delay: 1100, floatRange: 17, driftRange: 7, floatDur: 4200, driftDur: 4600 },
] as const;

function FloatingNature() {
  const anims = useRef(
    NATURE_ELEMENTS.map(() => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(0.3),
    }))
  ).current;

  useEffect(() => {
    NATURE_ELEMENTS.forEach((el, i) => {
      const { translateY, translateX, opacity } = anims[i];
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, { toValue: -el.floatRange, duration: el.floatDur / 2, delay: el.delay, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: el.floatRange, duration: el.floatDur, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: el.floatDur / 2, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateX, { toValue: -el.driftRange, duration: el.driftDur / 2, delay: el.delay, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: el.driftRange, duration: el.driftDur, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 0, duration: el.driftDur / 2, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.5, duration: 3000, delay: el.delay, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.2, duration: 3000, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={floatStyles.container} pointerEvents="none">
      {NATURE_ELEMENTS.map((el, i) => {
        const { translateY, translateX, opacity } = anims[i];
        const posStyle: Record<string, number> = { top: el.top };
        if ("left" in el) posStyle.left = (el as any).left;
        if ("right" in el) posStyle.right = (el as any).right;
        return (
          <Animated.View key={i} style={[floatStyles.element, posStyle, { opacity, transform: [{ translateY }, { translateX }] }]}>
            <Text style={{ fontSize: el.size }}>{el.emoji}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const floatStyles = StyleSheet.create({
  container: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  element: { position: "absolute" },
});

// ─── AnimatedPressable ────────────────────────────────────────────────────────
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
  const animIn = () => Animated.spring(scale, { toValue: scaleValue, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const animOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPressIn={animIn} onPressOut={animOut} onPress={onPress} style={style}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ─── Staggered list item ──────────────────────────────────────────────────────
function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, delay: index * 70, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 380, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ─── Premium Gate Modal ───────────────────────────────────────────────────────
function PremiumGateModal({ visible, onClose, onUnlock }: { visible: boolean; onClose: () => void; onUnlock: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleUnlock = () => {
    console.log("[Letters] Premium gate modal — Unlock Premium button pressed");
    onUnlock();
  };

  const handleClose = () => {
    console.log("[Letters] Premium gate modal — dismissed");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Pressable style={gateStyles.overlay} onPress={handleClose}>
        <Animated.View style={[gateStyles.sheet, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <Pressable onPress={() => {}}>
            <Text style={gateStyles.sealEmoji}>🔒</Text>
            <Text style={gateStyles.title}>This letter is sealed</Text>
            <Text style={gateStyles.subtitle}>
              Reading your future letters is a premium feature. Unlock premium to open every letter you've written to yourself.
            </Text>
            <AnimatedPressable onPress={handleUnlock} scaleValue={0.96}>
              <View style={gateStyles.unlockButton}>
                <Text style={gateStyles.unlockButtonText}>Unlock Premium ✨</Text>
              </View>
            </AnimatedPressable>
            <Pressable onPress={handleClose} style={gateStyles.cancelButton}>
              <Text style={gateStyles.cancelText}>Maybe later</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const gateStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(44, 26, 14, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(200, 149, 108, 0.2)",
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  sealEmoji: { fontSize: 44, textAlign: "center", marginBottom: 12 },
  title: {
    fontSize: 22,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  unlockButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  unlockButtonText: {
    fontSize: 16,
    fontFamily: "Karla_700Bold",
    color: "#fff",
    fontWeight: "700",
  },
  cancelButton: { marginTop: 14, paddingVertical: 8 },
  cancelText: { fontSize: 14, fontFamily: "Karla_400Regular", color: COLORS.textTertiary },
});

// ─── Letter Card ──────────────────────────────────────────────────────────────
function LetterCard({ letter, index, onPress }: { letter: FutureLetter; index: number; onPress: () => void }) {
  const days = daysUntil(letter.unlock_date);
  const isUnlocked = days <= 0;
  const formattedUnlockDate = formatDate(letter.unlock_date);

  const statusLine = isUnlocked ? "💌 Ready to read!" : days < 30 ? `🔒 Opens in ${days} day${days === 1 ? "" : "s"}` : `🔒 Opens ${formattedUnlockDate}`;
  const statusColor = isUnlocked ? "#4A7C59" : COLORS.textSecondary;

  const subLine = isUnlocked ? `Unlocked ${formattedUnlockDate}` : `Written for: ${letter.unlock_period_label}`;

  const cardBg = isUnlocked ? "#F0F7F2" : COLORS.surface;
  const cardBorder = isUnlocked ? "rgba(74, 124, 89, 0.2)" : COLORS.border;

  return (
    <AnimatedListItem index={index}>
      <AnimatedPressable onPress={onPress} scaleValue={0.975}>
        <View style={[cardStyles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[cardStyles.sealCircle, isUnlocked && cardStyles.sealCircleUnlocked]}>
            <Text style={cardStyles.sealEmoji}>{isUnlocked ? "💌" : "📜"}</Text>
          </View>
          <View style={cardStyles.info}>
            <Text style={cardStyles.title} numberOfLines={1}>{letter.title}</Text>
            <Text style={[cardStyles.status, { color: statusColor }]}>{statusLine}</Text>
            <Text style={cardStyles.period}>{subLine}</Text>
          </View>
          <Text style={cardStyles.lockIcon}>{isUnlocked ? "💌" : "🔒"}</Text>
        </View>
      </AnimatedPressable>
    </AnimatedListItem>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sealCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accentMuted,
    borderWidth: 1.5,
    borderColor: "rgba(200, 149, 108, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  sealCircleUnlocked: {
    backgroundColor: "rgba(74, 124, 89, 0.12)",
    borderColor: "rgba(74, 124, 89, 0.3)",
  },
  sealEmoji: { fontSize: 22 },
  info: { flex: 1 },
  title: {
    fontSize: 16,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.text,
    letterSpacing: -0.1,
    marginBottom: 3,
  },
  status: {
    fontSize: 13,
    fontFamily: "Karla_700Bold",
    marginBottom: 2,
  },
  period: {
    fontSize: 12,
    fontFamily: "Karla_400Regular",
    color: COLORS.textTertiary,
  },
  lockIcon: { fontSize: 18 },
});

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onWrite }: { onWrite: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[emptyStyles.container, { opacity, transform: [{ translateY }] }]}>
      <Text style={emptyStyles.illustration}>✉️</Text>
      <Text style={emptyStyles.title}>Your first letter is waiting</Text>
      <Text style={emptyStyles.subtitle}>
        Write a letter to your future self today. Seal it, and let it find you when the time is right.
      </Text>
      <AnimatedPressable onPress={onWrite} scaleValue={0.96}>
        <View style={emptyStyles.button}>
          <Text style={emptyStyles.buttonText}>Write your first letter 🕯️</Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  illustration: { fontSize: 64, marginBottom: 20 },
  title: {
    fontSize: 22,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: { fontSize: 16, fontFamily: "Karla_700Bold", color: "#fff" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LettersScreen() {
  const router = useRouter();
  const { isSubscribed } = useSubscription();
  const [letters, setLetters] = useState<FutureLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gateVisible, setGateVisible] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(headerTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchLetters = useCallback(async () => {
    console.log("[Letters] Fetching letters from Supabase");
    try {
      const deviceId = (await AsyncStorage.getItem("device_id")) || "unknown";
      const { data, error } = await (supabase as any)
        .from("future_letters")
        .select("*")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Letters] Supabase fetch error:", error.message);
      } else {
        console.log("[Letters] Fetched", data?.length ?? 0, "letters");
        setLetters((data as FutureLetter[]) || []);
      }
    } catch (err) {
      console.error("[Letters] Unexpected fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  const handleRefresh = useCallback(() => {
    console.log("[Letters] Pull-to-refresh triggered");
    setRefreshing(true);
    fetchLetters();
  }, [fetchLetters]);

  const handleWriteLetter = useCallback(() => {
    console.log("[Letters] Write a Letter button pressed — navigating to compose");
    router.push("/(tabs)/letters-compose");
  }, [router]);

  const handleLetterPress = useCallback(
    (letter: FutureLetter) => {
      const days = daysUntil(letter.unlock_date);
      const isUnlocked = days <= 0;
      console.log("[Letters] Letter card pressed", { id: letter.id, title: letter.title, isUnlocked, isSubscribed });

      if (!isSubscribed) {
        setGateVisible(true);
        return;
      }
      if (!isUnlocked) {
        console.log("[Letters] Letter is still locked — showing gate");
        setGateVisible(true);
        return;
      }
      router.push({ pathname: "/(tabs)/letters-read", params: { id: letter.id } });
    },
    [isSubscribed, router]
  );

  const handleUnlockPremium = useCallback(() => {
    console.log("[Letters] Navigating to paywall from premium gate");
    setGateVisible(false);
    router.push("/paywall");
  }, [router]);

  // Skeleton loader
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.skeletonHeader} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.skeletonCard} />
        ))}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <FloatingNature />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}>
          <Text style={styles.headerEmoji}>✉️</Text>
          <Text style={styles.headerTitle}>Letters to My Future Self</Text>
          <Text style={styles.headerSubtitle}>Words written today, waiting to be read</Text>
        </Animated.View>

        {/* Write button */}
        <Animated.View style={{ opacity: headerOpacity }}>
          <AnimatedPressable onPress={handleWriteLetter} scaleValue={0.97}>
            <View style={styles.writeButton}>
              <Text style={styles.writeButtonText}>✍️  Write a Letter</Text>
            </View>
          </AnimatedPressable>
        </Animated.View>

        {/* Letters list or empty state */}
        {letters.length === 0 ? (
          <EmptyState onWrite={handleWriteLetter} />
        ) : (
          <View style={styles.listContainer}>
            <Text style={styles.sectionLabel}>YOUR LETTERS</Text>
            {letters.map((letter, index) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                index={index}
                onPress={() => handleLetterPress(letter)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <PremiumGateModal
        visible={gateVisible}
        onClose={() => setGateVisible(false)}
        onUnlock={handleUnlockPremium}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 },

  header: { alignItems: "center", paddingVertical: 28, paddingBottom: 20 },
  headerEmoji: { fontSize: 40, marginBottom: 10 },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.text,
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  writeButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  writeButtonText: {
    fontSize: 16,
    fontFamily: "Karla_700Bold",
    color: "#fff",
    fontWeight: "700",
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: "Karla_700Bold",
    color: COLORS.textTertiary,
    letterSpacing: 1.0,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  listContainer: { paddingTop: 4 },

  // Skeleton
  skeletonHeader: {
    height: 120,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 16,
    margin: 20,
    marginBottom: 12,
  },
  skeletonCard: {
    height: 80,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    opacity: 0.6,
  },
});
