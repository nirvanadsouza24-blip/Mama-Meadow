import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSubscription } from "@/contexts/SubscriptionContext";

// Mama Meadow palette
const COLORS = {
  background: "#FAF7F2",
  surface: "#FFFFFF",
  surfaceSecondary: "#F3EDE3",
  text: "#2C1A0E",
  textSecondary: "#7A5C44",
  textTertiary: "#B89880",
  primary: "#4A7C59",       // meadow green
  primaryMuted: "rgba(74, 124, 89, 0.10)",
  accent: "#C8956C",        // warm terracotta
  border: "rgba(44, 26, 14, 0.07)",
  divider: "rgba(44, 26, 14, 0.04)",
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
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

const PROFILE_ITEMS = [
  { icon: "🌸", label: "My Profile", subtitle: "Name, photo, preferences", route: "/profile" },
  { icon: "🍼", label: "Baby Details", subtitle: "Age, milestones, notes", route: "/baby-details" },
  { icon: "📅", label: "Appointments", subtitle: "Upcoming check-ups", route: "/appointments" },
  { icon: "🔔", label: "Notifications", subtitle: "Alerts and reminders", route: "/notifications" },
  { icon: "🔒", label: "Privacy & Security", subtitle: "Account settings", route: "/privacy" },
];

export default function MotherScreen() {
  const router = useRouter();
  const { isSubscribed } = useSubscription();

  const handleGoPremium = () => {
    console.log("[MotherScreen] Go Premium button pressed");
    router.push("/paywall");
  };

  const handleProfileItem = (label: string, route: string) => {
    console.log(`[MotherScreen] Profile item pressed: ${label} → ${route}`);
    router.push(route as any);
  };

  const handleWellness = () => {
    console.log("[MotherScreen] Wellness Hub card pressed");
    router.push("/wellness");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <FadeInView delay={0}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>🌿</Text>
              </View>
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>
                  {isSubscribed ? "✦" : "♡"}
                </Text>
              </View>
            </View>
            <Text style={styles.greeting}>Hello, Mama</Text>
            <Text style={styles.subGreeting}>
              {isSubscribed
                ? "Premium member · Mama Meadow"
                : "Welcome to Mama Meadow"}
            </Text>
          </View>
        </FadeInView>

        {/* Go Premium Banner — only shown when not subscribed */}
        {!isSubscribed && (
          <FadeInView delay={80}>
            <AnimatedPressable onPress={handleGoPremium} scaleValue={0.975}>
              <View style={styles.premiumBanner}>
                <View style={styles.premiumBannerLeft}>
                  <View style={styles.premiumLeafRow}>
                    <Text style={styles.premiumLeaf}>🌿</Text>
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                    </View>
                  </View>
                  <Text style={styles.premiumTitle}>Unlock Mama Meadow</Text>
                  <Text style={styles.premiumSubtitle}>
                    Unlimited tracking, insights{"\n"}& expert guidance
                  </Text>
                </View>
                <View style={styles.premiumCTA}>
                  <Text style={styles.premiumCTAText}>Go Premium</Text>
                  <Text style={styles.premiumArrow}>→</Text>
                </View>
              </View>
            </AnimatedPressable>
          </FadeInView>
        )}

        {/* Subscribed badge */}
        {isSubscribed && (
          <FadeInView delay={80}>
            <View style={styles.subscribedBanner}>
              <Text style={styles.subscribedIcon}>✦</Text>
              <View>
                <Text style={styles.subscribedTitle}>Premium Member</Text>
                <Text style={styles.subscribedSubtitle}>
                  All features unlocked
                </Text>
              </View>
            </View>
          </FadeInView>
        )}

        {/* Profile Section */}
        <FadeInView delay={140}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Account</Text>
          </View>
          <View style={styles.card}>
            {PROFILE_ITEMS.map((item, index) => {
              const isLast = index === PROFILE_ITEMS.length - 1;
              return (
                <React.Fragment key={item.label}>
                  <AnimatedPressable
                    onPress={() => handleProfileItem(item.label, item.route)}
                    scaleValue={0.985}
                  >
                    <View style={styles.listItem}>
                      <View style={styles.listItemIcon}>
                        <Text style={styles.listItemEmoji}>{item.icon}</Text>
                      </View>
                      <View style={styles.listItemText}>
                        <Text style={styles.listItemLabel}>{item.label}</Text>
                        <Text style={styles.listItemSubtitle}>
                          {item.subtitle}
                        </Text>
                      </View>
                      <Text style={styles.listItemChevron}>›</Text>
                    </View>
                  </AnimatedPressable>
                  {!isLast && <View style={styles.divider} />}
                </React.Fragment>
              );
            })}
          </View>
        </FadeInView>

        {/* Wellness Hub Card */}
        <FadeInView delay={200}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Wellness & Research</Text>
          </View>
          <AnimatedPressable onPress={handleWellness} scaleValue={0.975}>
            <View style={styles.wellnessCard}>
              <View style={styles.wellnessCardInner}>
                <View style={styles.wellnessIconWrap}>
                  <Text style={styles.wellnessIcon}>🌸</Text>
                </View>
                <View style={styles.wellnessTextWrap}>
                  <Text style={styles.wellnessTitle}>Your Wellness Hub 🌸</Text>
                  <Text style={styles.wellnessSubtitle}>
                    Postpartum · Breastfeeding · Mental Health · More
                  </Text>
                </View>
                <Text style={styles.wellnessChevron}>›</Text>
              </View>
              <Text style={styles.wellnessTagline}>
                Evidence-based guidance for every stage of motherhood
              </Text>
            </View>
          </AnimatedPressable>
        </FadeInView>

        {/* App version */}
        <FadeInView delay={260}>
          <Text style={styles.versionText}>Mama Meadow · v1.0</Text>
        </FadeInView>
      </ScrollView>
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
    alignItems: "center",
    paddingVertical: 28,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: {
    fontSize: 40,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  avatarBadgeText: {
    fontSize: 12,
    color: "#fff",
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.text,
    fontFamily: "Fraunces_700Bold",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Karla_400Regular",
  },

  // Premium Banner
  premiumBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  premiumBannerLeft: {
    flex: 1,
  },
  premiumLeafRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  premiumLeaf: {
    fontSize: 18,
  },
  premiumBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1.2,
    fontFamily: "Karla_700Bold",
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Fraunces_700Bold",
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Karla_400Regular",
    lineHeight: 18,
  },
  premiumCTA: {
    alignItems: "center",
    marginLeft: 16,
  },
  premiumCTAText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Karla_700Bold",
    marginBottom: 4,
  },
  premiumArrow: {
    fontSize: 22,
    color: "#fff",
  },

  // Subscribed Banner
  subscribedBanner: {
    backgroundColor: COLORS.primaryMuted,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 124, 89, 0.2)",
  },
  subscribedIcon: {
    fontSize: 24,
    color: COLORS.primary,
  },
  subscribedTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: "Karla_700Bold",
  },
  subscribedSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: "Karla_400Regular",
    marginTop: 1,
  },

  // Section
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Karla_700Bold",
  },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 28,
    overflow: "hidden",
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  listItemEmoji: {
    fontSize: 18,
  },
  listItemText: {
    flex: 1,
  },
  listItemLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    fontFamily: "Karla_700Bold",
  },
  listItemSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: "Karla_400Regular",
    marginTop: 1,
  },
  listItemChevron: {
    fontSize: 20,
    color: COLORS.textTertiary,
    fontWeight: "300",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginLeft: 68,
  },

  // Wellness Card
  wellnessCard: {
    backgroundColor: "#F7A8C4",
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    shadowColor: "#C8956C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(247, 168, 196, 0.4)",
  },
  wellnessCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  wellnessIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  wellnessIcon: {
    fontSize: 24,
  },
  wellnessTextWrap: {
    flex: 1,
  },
  wellnessTitle: {
    fontSize: 17,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.text,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  wellnessSubtitle: {
    fontSize: 12,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
  },
  wellnessChevron: {
    fontSize: 22,
    color: COLORS.textSecondary,
    fontWeight: "300",
  },
  wellnessTagline: {
    fontSize: 13,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Footer
  versionText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: "center",
    fontFamily: "Karla_400Regular",
    marginTop: 4,
  },
});
