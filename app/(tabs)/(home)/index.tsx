import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useBabies, Baby, LogType } from "@/contexts/BabiesContext";

const { width: SW, height: SH } = Dimensions.get("window");

// ─── Floating Nature ──────────────────────────────────────────────────────────
const NATURE_ELEMENTS = [
  { emoji: "🌼", top: SH * 0.12, left: SW * 0.08, size: 22, delay: 0, floatRange: 20, driftRange: 10, floatDur: 3800, driftDur: 5200, opacDur: 4500 },
  { emoji: "🦋", top: SH * 0.18, right: SW * 0.12, size: 20, delay: 800, floatRange: 18, driftRange: 12, floatDur: 4200, driftDur: 6000, opacDur: 5000, rotate: true },
  { emoji: "🌸", top: SH * 0.35, left: SW * 0.05, size: 18, delay: 1600, floatRange: 22, driftRange: 9, floatDur: 4600, driftDur: 4800, opacDur: 4200 },
  { emoji: "🌼", top: SH * 0.55, right: SW * 0.08, size: 16, delay: 400, floatRange: 15, driftRange: 11, floatDur: 3500, driftDur: 5500, opacDur: 5500 },
  { emoji: "🌿", top: SH * 0.70, left: SW * 0.15, size: 14, delay: 1200, floatRange: 17, driftRange: 8, floatDur: 4000, driftDur: 4400, opacDur: 4800 },
  { emoji: "🌸", top: SH * 0.82, right: SW * 0.18, size: 18, delay: 2000, floatRange: 19, driftRange: 10, floatDur: 4400, driftDur: 6200, opacDur: 5200 },
] as const;

function FloatingNature() {
  const anims = useRef(
    NATURE_ELEMENTS.map(() => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(0.35),
      rotate: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    NATURE_ELEMENTS.forEach((el, i) => {
      const { translateY, translateX, opacity, rotate } = anims[i];

      // Vertical float
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, { toValue: -el.floatRange, duration: el.floatDur / 2, delay: el.delay, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: el.floatRange, duration: el.floatDur, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: el.floatDur / 2, useNativeDriver: true }),
        ])
      ).start();

      // Horizontal drift
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateX, { toValue: -el.driftRange, duration: el.driftDur / 2, delay: el.delay, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: el.driftRange, duration: el.driftDur, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 0, duration: el.driftDur / 2, useNativeDriver: true }),
        ])
      ).start();

      // Opacity pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.55, duration: el.opacDur / 2, delay: el.delay, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.25, duration: el.opacDur / 2, useNativeDriver: true }),
        ])
      ).start();

      // Rotation for butterfly
      if ((el as any).rotate) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotate, { toValue: 1, duration: 1500, delay: el.delay, useNativeDriver: true }),
            Animated.timing(rotate, { toValue: -1, duration: 3000, useNativeDriver: true }),
            Animated.timing(rotate, { toValue: 0, duration: 1500, useNativeDriver: true }),
          ])
        ).start();
      }
    });
  }, []);

  return (
    <View style={floatingStyles.container} pointerEvents="none">
      {NATURE_ELEMENTS.map((el, i) => {
        const { translateY, translateX, opacity, rotate } = anims[i];
        const rotateInterp = rotate.interpolate({ inputRange: [-1, 1], outputRange: ["-5deg", "5deg"] });
        const posStyle: Record<string, number> = { top: el.top };
        if ("left" in el) posStyle.left = (el as any).left;
        if ("right" in el) posStyle.right = (el as any).right;
        const hasRotate = !!(el as any).rotate;
        const transform = hasRotate
          ? ([{ translateY }, { translateX }, { rotate: rotateInterp }] as any)
          : ([{ translateY }, { translateX }] as any);
        return (
          <Animated.View
            key={i}
            style={[floatingStyles.element, posStyle, { opacity, transform }]}
          >
            <Text style={{ fontSize: el.size }}>{el.emoji}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const floatingStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  element: {
    position: "absolute",
  },
});

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
    Animated.spring(scale, {
      toValue: scaleValue,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  const animateOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={animateIn}
        onPressOut={animateOut}
        onPress={onPress}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function FadeInView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

const LOG_TYPES: LogType[] = ["Feed", "Sleep", "Diaper"];

const LOG_TYPE_META: Record<LogType, { emoji: string; label: string }> = {
  Feed: { emoji: "🍼", label: "Feed" },
  Sleep: { emoji: "😴", label: "Sleep" },
  Diaper: { emoji: "👶", label: "Diaper" },
};

function BabyCard({ baby }: { baby: Baby }) {
  const { logs, addLog } = useBabies();
  const [loggedType, setLoggedType] = useState<LogType | null>(null);

  const babyLogs = logs.filter((l) => l.babyId === baby.id);

  const lastFeed = babyLogs.filter((l) => l.type === "Feed").at(-1);
  const lastSleep = babyLogs.filter((l) => l.type === "Sleep").at(-1);
  const lastDiaper = babyLogs.filter((l) => l.type === "Diaper").at(-1);

  const formatTime = (log: typeof lastFeed) =>
    log
      ? new Date(log.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : "—";

  const feedTime = formatTime(lastFeed);
  const sleepTime = formatTime(lastSleep);
  const diaperTime = formatTime(lastDiaper);

  const dobText = baby.dob ? `Born ${baby.dob}` : null;

  const handleLog = useCallback(
    (type: LogType) => {
      console.log("[BabyCard] Quick-log button pressed", { babyId: baby.id, babyName: baby.name, type });
      addLog(baby.id, type);
      setLoggedType(type);
      setTimeout(() => setLoggedType(null), 1500);
    },
    [baby.id, baby.name, addLog]
  );

  return (
    <View style={styles.babyCard}>
      <View style={styles.babyCardTop}>
        <View style={styles.babyIconBadge}>
          <Text style={styles.babyIconEmoji}>🍼</Text>
        </View>
        <View style={styles.babyCardInfo}>
          <Text style={styles.babyName}>{baby.name}</Text>
          {dobText !== null && <Text style={styles.babyDob}>{dobText}</Text>}
        </View>
      </View>
      <View style={styles.logButtonRow}>
        {LOG_TYPES.map((type) => (
          <Pressable
            key={type}
            style={styles.logButton}
            onPress={() => handleLog(type)}
          >
            <Text style={styles.logButtonText}>{type}</Text>
          </Pressable>
        ))}
      </View>
      {loggedType !== null && (
        <Text style={styles.loggedConfirm}>✓ Logged</Text>
      )}
      {/* Per-type last log status chips */}
      <View style={styles.logStatusRow}>
        <View style={styles.logStatusChip}>
          <Text style={styles.logStatusEmoji}>{LOG_TYPE_META.Feed.emoji}</Text>
          <Text style={styles.logStatusLabel}>Feed</Text>
          <Text style={styles.logStatusTime}>{feedTime}</Text>
        </View>
        <View style={styles.logStatusDivider} />
        <View style={styles.logStatusChip}>
          <Text style={styles.logStatusEmoji}>{LOG_TYPE_META.Sleep.emoji}</Text>
          <Text style={styles.logStatusLabel}>Sleep</Text>
          <Text style={styles.logStatusTime}>{sleepTime}</Text>
        </View>
        <View style={styles.logStatusDivider} />
        <View style={styles.logStatusChip}>
          <Text style={styles.logStatusEmoji}>{LOG_TYPE_META.Diaper.emoji}</Text>
          <Text style={styles.logStatusLabel}>Diaper</Text>
          <Text style={styles.logStatusTime}>{diaperTime}</Text>
        </View>
      </View>
    </View>
  );
}

function AddBabyModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { addBaby } = useBabies();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [nameError, setNameError] = useState("");

  const handleAdd = useCallback(() => {
    console.log("[AddBabyModal] Add baby button pressed", { name, dob });
    if (!name.trim()) {
      setNameError("Please enter a name");
      return;
    }
    addBaby(name.trim(), dob.trim());
    setName("");
    setDob("");
    setNameError("");
    onClose();
  }, [name, dob, addBaby, onClose]);

  const handleCancel = useCallback(() => {
    console.log("[AddBabyModal] Cancel button pressed");
    setName("");
    setDob("");
    setNameError("");
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalKAV}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <Text style={styles.modalTitle}>Add a baby</Text>

                <TextInput
                  style={[styles.modalInput, nameError ? styles.modalInputError : null]}
                  placeholder="Baby's name"
                  placeholderTextColor={COLORS.textTertiary}
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (nameError) setNameError("");
                  }}
                  returnKeyType="next"
                />
                {nameError !== "" && (
                  <Text style={styles.inputError}>{nameError}</Text>
                )}

                <TextInput
                  style={styles.modalInput}
                  placeholder="Date of birth (optional)"
                  placeholderTextColor={COLORS.textTertiary}
                  value={dob}
                  onChangeText={setDob}
                  returnKeyType="done"
                  onSubmitEditing={handleAdd}
                />

                <Pressable style={styles.addBabyButton} onPress={handleAdd}>
                  <Text style={styles.addBabyButtonText}>Add baby</Text>
                </Pressable>
                <Pressable style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { isSubscribed } = useSubscription();
  const { babies } = useBabies();
  const [showAddModal, setShowAddModal] = useState(false);

  const handleYouTab = () => {
    console.log("[HomeScreen] You tab button pressed — navigating to mother screen");
    router.push("/(tabs)/mother");
  };

  const handleGoPremium = () => {
    console.log("[HomeScreen] Go Premium button pressed");
    router.push("/paywall");
  };

  const handleOpenAddModal = () => {
    console.log("[HomeScreen] + Add baby button pressed");
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { position: "relative" }]} edges={["top"]}>
      <FloatingNature />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <FadeInView delay={0}>
          <View style={styles.header}>
            <Text style={styles.appName}>Mama Meadow</Text>
            <AnimatedPressable onPress={handleYouTab} scaleValue={0.92}>
              <View style={styles.profileButton}>
                <Text style={styles.profileEmoji}>🌿</Text>
              </View>
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Welcome card */}
        <FadeInView delay={60}>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Welcome back, Mama 🌸</Text>
            <Text style={styles.welcomeSubtitle}>
              Your meadow is growing beautifully.
            </Text>
          </View>
        </FadeInView>

        {/* Go Premium CTA — only when not subscribed */}
        {!isSubscribed && (
          <FadeInView delay={120}>
            <AnimatedPressable onPress={handleGoPremium} scaleValue={0.975}>
              <View style={styles.premiumCard}>
                <View style={styles.premiumCardLeft}>
                  <Text style={styles.premiumCardTitle}>
                    Unlock all features
                  </Text>
                  <Text style={styles.premiumCardSubtitle}>
                    Tracking, insights & expert guidance
                  </Text>
                </View>
                <View style={styles.premiumCardButton}>
                  <Text style={styles.premiumCardButtonText}>Go Premium</Text>
                </View>
              </View>
            </AnimatedPressable>
          </FadeInView>
        )}

        {/* Your little ones section */}
        <FadeInView delay={160}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabelText}>Your little ones</Text>
            <Pressable style={styles.addBabyPill} onPress={handleOpenAddModal}>
              <Text style={styles.addBabyPillText}>+ Add baby</Text>
            </Pressable>
          </View>

          {babies.length === 0 ? (
            <View style={styles.emptyBabiesCard}>
              <Text style={styles.emptyBabiesEmoji}>🌱</Text>
              <Text style={styles.emptyBabiesTitle}>Add your first little one</Text>
              <Text style={styles.emptyBabiesSubtitle}>Tap + Add baby to get started</Text>
            </View>
          ) : (
            babies.map((baby) => (
              <BabyCard key={baby.id} baby={baby} />
            ))
          )}
        </FadeInView>

        {/* You tab shortcut */}
        <FadeInView delay={220}>
          <View style={[styles.sectionLabel, { marginTop: 8 }]}>
            <Text style={styles.sectionLabelText}>Your Space</Text>
          </View>
          <AnimatedPressable onPress={handleYouTab} scaleValue={0.985}>
            <View style={styles.youCard}>
              <View style={styles.youCardIcon}>
                <Text style={styles.youCardEmoji}>♡</Text>
              </View>
              <View style={styles.youCardText}>
                <Text style={styles.youCardTitle}>You</Text>
                <Text style={styles.youCardSubtitle}>
                  Profile, settings
                  {isSubscribed ? " · Premium member" : " & upgrade"}
                </Text>
              </View>
              <Text style={styles.youCardChevron}>›</Text>
            </View>
          </AnimatedPressable>
        </FadeInView>
      </ScrollView>

      <AddBabyModal visible={showAddModal} onClose={handleCloseAddModal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 8,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    marginBottom: 4,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    fontFamily: "Fraunces_700Bold",
    letterSpacing: -0.3,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  profileEmoji: {
    fontSize: 20,
  },

  // Welcome card
  welcomeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    fontFamily: "Fraunces_700Bold",
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Karla_400Regular",
    lineHeight: 20,
  },

  // Premium card
  premiumCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  premiumCardLeft: {
    flex: 1,
  },
  premiumCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Fraunces_700Bold",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  premiumCardSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Karla_400Regular",
  },
  premiumCardButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    marginLeft: 12,
  },
  premiumCardButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Karla_700Bold",
  },

  // Section label (shared)
  sectionLabel: {
    marginBottom: 10,
  },
  sectionLabelText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Karla_700Bold",
  },

  // Your little ones section header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  addBabyPill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  addBabyPillText: {
    fontSize: 12,
    fontFamily: "Karla_700Bold",
    color: "#fff",
    fontWeight: "700",
  },

  // Baby card
  babyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  babyCardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  babyIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(74,124,89,0.10)",
    justifyContent: "center",
    alignItems: "center",
  },
  babyIconEmoji: {
    fontSize: 20,
  },
  babyCardInfo: {
    flex: 1,
  },
  babyName: {
    fontSize: 16,
    fontFamily: "Fraunces_700Bold",
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.1,
  },
  babyDob: {
    fontSize: 13,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  logButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(44,26,14,0.10)",
    backgroundColor: COLORS.surfaceSecondary,
  },
  logButtonText: {
    fontSize: 12,
    fontFamily: "Karla_700Bold",
    fontWeight: "700",
    color: COLORS.primary,
  },
  loggedConfirm: {
    fontSize: 12,
    fontFamily: "Karla_700Bold",
    color: COLORS.primary,
    marginTop: 2,
    marginBottom: 6,
  },

  // Per-type log status row
  logStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  logStatusChip: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  logStatusEmoji: {
    fontSize: 13,
  },
  logStatusLabel: {
    fontSize: 10,
    fontFamily: "Karla_700Bold",
    color: COLORS.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  logStatusTime: {
    fontSize: 11,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
  },
  logStatusDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },

  // Empty state
  emptyBabiesCard: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyBabiesEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyBabiesTitle: {
    fontSize: 16,
    fontFamily: "Fraunces_700Bold",
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
    textAlign: "center",
  },
  emptyBabiesSubtitle: {
    fontSize: 13,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // You card
  youCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  youCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(200, 149, 108, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  youCardEmoji: {
    fontSize: 20,
    color: COLORS.accent,
  },
  youCardText: {
    flex: 1,
  },
  youCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    fontFamily: "Karla_700Bold",
  },
  youCardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: "Karla_400Regular",
    marginTop: 1,
  },
  youCardChevron: {
    fontSize: 20,
    color: COLORS.textTertiary,
    fontWeight: "300",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalKAV: {
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: "Fraunces_700Bold",
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "rgba(44,26,14,0.12)",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: "Karla_400Regular",
    color: COLORS.text,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
  },
  modalInputError: {
    borderColor: COLORS.accent,
    marginBottom: 4,
  },
  inputError: {
    fontSize: 13,
    fontFamily: "Karla_400Regular",
    color: COLORS.accent,
    marginBottom: 10,
  },
  addBabyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
  },
  addBabyButtonText: {
    fontSize: 16,
    fontFamily: "Karla_700Bold",
    fontWeight: "700",
    color: "#fff",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
  },
});
