import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSubscription } from "@/contexts/SubscriptionContext";

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

export default function HomeScreen() {
  const router = useRouter();
  const { isSubscribed } = useSubscription();

  const handleYouTab = () => {
    console.log("[HomeScreen] You tab button pressed — navigating to mother screen");
    router.push("/(tabs)/mother");
  };

  const handleGoPremium = () => {
    console.log("[HomeScreen] Go Premium button pressed");
    router.push("/paywall");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
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

          {/* You tab shortcut */}
          <FadeInView delay={180}>
            <View style={styles.sectionLabel}>
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
      </SafeAreaView>
    </>
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

  // Section label
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
});
