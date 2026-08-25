import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSubscription } from "@/contexts/SubscriptionContext";

// ─── Palette ────────────────────────────────────────────────────────────────
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

// ─── Quotes ──────────────────────────────────────────────────────────────────
const QUOTES = [
  { text: "You are enough. You have always been enough.", author: "Unknown" },
  { text: "Growing a baby is the most creative thing you will ever do.", author: "Unknown" },
  { text: "A mother's love is the fuel that enables a normal human being to do the impossible.", author: "Marion C. Garretty" },
  { text: "You are braver than you believe, stronger than you seem.", author: "A.A. Milne" },
  { text: "The days are long but the years are short.", author: "Gretchen Rubin" },
  { text: "Motherhood: All love begins and ends there.", author: "Robert Browning" },
  { text: "You don't have to be perfect to be an amazing mother.", author: "Unknown" },
  { text: "Behind every great child is a mother who is pretty sure she's messing everything up.", author: "Unknown" },
  { text: "To the world you are a mother, but to your family you are the world.", author: "Unknown" },
  { text: "Rest when you're weary. Refresh and renew yourself, your body, your mind, your spirit.", author: "Ralph Marston" },
  { text: "You are doing a beautiful job navigating something you've never done before.", author: "Unknown" },
  { text: "The most precious jewels you'll ever have around your neck are the arms of your children.", author: "Unknown" },
  { text: "Motherhood is the greatest thing and the hardest thing.", author: "Ricki Lake" },
  { text: "Be gentle with yourself. You are a child of the universe.", author: "Max Ehrmann" },
  { text: "Your body did something miraculous. Give it grace.", author: "Unknown" },
  { text: "It's okay to not be okay. It's okay to ask for help.", author: "Unknown" },
  { text: "You were made for this, even on the days it doesn't feel like it.", author: "Unknown" },
  { text: "Every day may not be good, but there is something good in every day.", author: "Alice Morse Earle" },
  { text: "You are not just a mother. You are a whole person, and that matters.", author: "Unknown" },
  { text: "The love between a mother and child is forever.", author: "Unknown" },
  { text: "Healing is not linear. Be patient with your body and your heart.", author: "Unknown" },
  { text: "You are someone's whole world. And you are also your own.", author: "Unknown" },
  { text: "Sleep deprivation is a form of torture — and you're surviving it with grace.", author: "Unknown" },
  { text: "Your baby doesn't need a perfect mother. They need YOU.", author: "Unknown" },
  { text: "Asking for help is not weakness. It is wisdom.", author: "Unknown" },
  { text: "You grew a human. That is extraordinary.", author: "Unknown" },
  { text: "Even on your hardest days, you are still their favourite person.", author: "Unknown" },
  { text: "This season is hard. And you are harder.", author: "Unknown" },
];

// Gradient palettes per day-of-week (0=Sun … 6=Sat)
const QUOTE_GRADIENTS = [
  { bg: "#FFF0F3", accent: "#F4A0B0", mark: "#F4A0B0" }, // rose
  { bg: "#FFF4EC", accent: "#F4B87A", mark: "#F4B87A" }, // peach
  { bg: "#F3EEFF", accent: "#B89AE8", mark: "#B89AE8" }, // lavender
  { bg: "#EEF6FF", accent: "#7AAFE8", mark: "#7AAFE8" }, // sky
  { bg: "#EDFFF4", accent: "#6ECFA0", mark: "#6ECFA0" }, // mint
  { bg: "#FFFBEA", accent: "#F0C84A", mark: "#F0C84A" }, // gold
  { bg: "#FFF0E8", accent: "#E8906A", mark: "#E8906A" }, // amber
];

// ─── Affirmations ─────────────────────────────────────────────────────────────
const AFFIRMATIONS = [
  "I am a good mother.",
  "My love is enough for my baby.",
  "I am allowed to rest.",
  "I am healing, even when I can't see it.",
  "I trust my instincts.",
  "I am doing my best, and my best is enough.",
  "I deserve support and kindness.",
  "My feelings are valid.",
  "I am not alone in this.",
  "I am stronger than I know.",
  "I give myself permission to be imperfect.",
  "My baby is lucky to have me.",
  "I am learning and growing every day.",
  "I choose to be gentle with myself today.",
  "I am worthy of love and care.",
  "This hard season will pass.",
  "I am present, and that is everything.",
  "I honour my body for all it has done.",
  "I am exactly the mother my baby needs.",
  "Today, I am enough.",
];

// ─── Moods ────────────────────────────────────────────────────────────────────
const MOODS = [
  { emoji: "😴", label: "Exhausted", message: "Rest is not laziness — it's medicine. Be gentle with yourself today. 💛" },
  { emoji: "😊", label: "Good", message: "Hold onto this feeling. You're doing wonderfully. 🌿" },
  { emoji: "🥰", label: "Grateful", message: "Gratitude is a superpower. Your heart is full. 🌸" },
  { emoji: "😢", label: "Struggling", message: "It's okay to struggle. You are not alone. Reach out to someone you trust. 💜" },
  { emoji: "💪", label: "Strong", message: "Yes, Mama! You are unstoppable. 🌟" },
];

const MOOD_STORAGE_KEY = "@mamameadow/mood-today";

// ─── Profile items ────────────────────────────────────────────────────────────
const PROFILE_ITEMS = [
  { icon: "🌸", label: "My Profile", subtitle: "Name, photo, preferences", route: "/profile" },
  { icon: "🍼", label: "Baby Details", subtitle: "Age, milestones, notes", route: "/baby-details" },
  { icon: "📅", label: "Appointments", subtitle: "Upcoming check-ups", route: "/appointments" },
  { icon: "🔔", label: "Notifications", subtitle: "Alerts and reminders", route: "/notifications" },
  { icon: "🔒", label: "Privacy & Security", subtitle: "Account settings", route: "/privacy" },
];

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

// ─── FadeInView ───────────────────────────────────────────────────────────────
function FadeInView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Daily Quote Card ─────────────────────────────────────────────────────────
function DailyQuoteCard() {
  const borderOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderOpacity, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(borderOpacity, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const dateIndex = today.getDate() % QUOTES.length;
  const quoteIndex = (dayOfWeek + dateIndex) % QUOTES.length;
  const quote = QUOTES[quoteIndex];
  const gradient = QUOTE_GRADIENTS[dayOfWeek];

  return (
    <View style={[styles.quoteCardOuter]}>
      <Animated.View
        style={[
          styles.quoteCardBorder,
          { borderColor: gradient.accent, opacity: borderOpacity },
        ]}
        pointerEvents="none"
      />
      <View style={[styles.quoteCard, { backgroundColor: gradient.bg }]}>
        <Text style={[styles.quoteMarkDecor, { color: gradient.mark }]}>{"\u201C"}</Text>
        <Text style={styles.quoteText}>{quote.text}</Text>
        <Text style={styles.quoteAuthor}>— {quote.author}</Text>
        <Text style={styles.quoteTomorrow}>✨ New quote tomorrow</Text>
      </View>
    </View>
  );
}

// ─── Affirmation Card ─────────────────────────────────────────────────────────
function AffirmationCard() {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  const handleRefresh = useCallback(() => {
    console.log("[MotherScreen] Affirmation refresh tapped");
    Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setIndex((prev) => (prev + 1) % AFFIRMATIONS.length);
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  }, []);

  const affirmationText = AFFIRMATIONS[index];

  return (
    <AnimatedPressable onPress={handleRefresh} scaleValue={0.975}>
      <View style={styles.affirmationCard}>
        <View style={styles.affirmationTopRow}>
          <Text style={styles.affirmationLabel}>Today's Affirmation</Text>
          <Text style={styles.affirmationRefreshHint}>Tap to refresh ✨</Text>
        </View>
        <Animated.Text style={[styles.affirmationText, { opacity }]}>
          {affirmationText}
        </Animated.Text>
      </View>
    </AnimatedPressable>
  );
}

// ─── Mood Check-in ────────────────────────────────────────────────────────────
function MoodCheckin() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const messageOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    AsyncStorage.getItem(MOOD_STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.date === todayKey && typeof saved.index === "number") {
          setSelectedMood(saved.index);
          messageOpacity.setValue(1);
        }
      } catch {}
    });
  }, []);

  const handleMoodSelect = useCallback(
    (idx: number) => {
      console.log(`[MotherScreen] Mood selected: ${MOODS[idx].label}`);
      const todayKey = new Date().toISOString().slice(0, 10);
      setSelectedMood(idx);
      messageOpacity.setValue(0);
      Animated.timing(messageOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      AsyncStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify({ date: todayKey, index: idx }));
    },
    []
  );

  const moodMessage = selectedMood !== null ? MOODS[selectedMood].message : "";

  return (
    <View style={styles.moodCard}>
      <Text style={styles.moodTitle}>How are you feeling today?</Text>
      <View style={styles.moodRow}>
        {MOODS.map((mood, idx) => {
          const isSelected = selectedMood === idx;
          return (
            <AnimatedPressable key={mood.label} onPress={() => handleMoodSelect(idx)} scaleValue={0.9}>
              <View style={[styles.moodButton, isSelected && styles.moodButtonSelected]}>
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[styles.moodButtonLabel, isSelected && styles.moodButtonLabelSelected]}>
                  {mood.label}
                </Text>
              </View>
            </AnimatedPressable>
          );
        })}
      </View>
      {selectedMood !== null && (
        <Animated.Text style={[styles.moodMessage, { opacity: messageOpacity }]}>
          {moodMessage}
        </Animated.Text>
      )}
    </View>
  );
}

// ─── Hair & Body Modal ────────────────────────────────────────────────────────
function HairBodyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
        {/* Gradient header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderInner}>
            <Text style={styles.modalHeaderTitle}>Hair & Body Changes After Birth</Text>
            <Text style={styles.modalHeaderEmoji}>💇‍♀️</Text>
          </View>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} accessibilityLabel="Close modal">
            <Text style={styles.modalCloseBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>

          {/* Section 1 — Hair Loss */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>🌿 Hair Loss (Postpartum Alopecia)</Text>

            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>What it is</Text>
              <Text style={styles.modalInfoText}>
                Around 3–6 months after birth, many mothers notice significant hair shedding. This is called postpartum alopecia and is completely normal.
              </Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Why it happens</Text>
              <Text style={styles.modalInfoText}>
                During pregnancy, high oestrogen keeps hair in the growth phase. After birth, oestrogen drops and all that "extra" hair sheds at once.
              </Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>When it stops</Text>
              <Text style={styles.modalInfoText}>
                Hair loss typically peaks at 3–4 months postpartum and resolves by 6–12 months. Your hair WILL grow back.
              </Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>What helps</Text>
              <Text style={styles.modalInfoText}>
                Gentle shampoo, wide-tooth comb, avoid tight hairstyles, biotin-rich foods (eggs, nuts, seeds), continue prenatal vitamins, be patient and kind to yourself.
              </Text>
            </View>
            <View style={[styles.modalInfoRow, styles.modalInfoRowLast]}>
              <Text style={styles.modalInfoLabel}>See a doctor if</Text>
              <Text style={styles.modalInfoText}>
                Hair loss is severe, patchy, or accompanied by fatigue and weight changes — this could indicate thyroid issues.
              </Text>
            </View>
          </View>

          {/* Section 2 — Skin Changes */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>✨ Skin Changes</Text>
            {[
              { title: "Melasma", desc: 'Brown patches on face ("mask of pregnancy"). Fades over months — use SPF daily.' },
              { title: "Stretch marks", desc: "Fade from red/purple to silver over time. Moisturise with rosehip or coconut oil." },
              { title: "Linea nigra", desc: "Dark line on abdomen. Fades naturally over time." },
              { title: "Acne", desc: "Hormonal fluctuations can cause breakouts. Use gentle skincare and avoid harsh products while breastfeeding." },
            ].map((item) => (
              <View key={item.title} style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>{item.title}</Text>
                <Text style={styles.modalInfoText}>{item.desc}</Text>
              </View>
            ))}
          </View>

          {/* Section 3 — Body Shape */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>🌸 Body Shape & Recovery</Text>
            <Text style={styles.modalBodyIntro}>
              Your body grew and birthed a human — it deserves reverence, not criticism.
            </Text>
            {[
              { title: "Diastasis recti", desc: "Abdominal separation is common. Physiotherapy helps — ask your GP for a referral." },
              { title: "Pelvic floor", desc: "Weakness and leaking are normal. Kegel exercises and a physio referral make a real difference." },
              { title: "Weight", desc: "Focus on nourishment, not restriction — especially if breastfeeding. Your body needs fuel." },
              { title: "Timeline", desc: 'Give your body at least 12 months. The "bounce back" culture is harmful and unrealistic.' },
            ].map((item) => (
              <View key={item.title} style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>{item.title}</Text>
                <Text style={styles.modalInfoText}>{item.desc}</Text>
              </View>
            ))}
          </View>

          {/* Section 4 — Love Note */}
          <View style={styles.loveNoteBox}>
            <Text style={styles.loveNoteText}>
              Your body is not broken. It is transformed. Every stretch mark is a map of the miracle you created. Every soft curve is evidence of the life you nurtured. You are not less — you are more. 🌸
            </Text>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MotherScreen() {
  const router = useRouter();
  const { isSubscribed } = useSubscription();
  const [hairModalVisible, setHairModalVisible] = useState(false);

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

  const handleHome = () => {
    console.log("[MotherScreen] Home button pressed");
    router.replace("/(tabs)/(home)");
  };

  const handleHairCard = () => {
    console.log("[MotherScreen] Hair & Body Changes card pressed");
    setHairModalVisible(true);
  };

  const handleHairModalClose = () => {
    console.log("[MotherScreen] Hair & Body modal closed");
    setHairModalVisible(false);
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
                <Text style={styles.avatarBadgeText}>{isSubscribed ? "✦" : "♡"}</Text>
              </View>
            </View>
            <Text style={styles.greeting}>Hello, Mama</Text>
            <Text style={styles.subGreeting}>
              {isSubscribed ? "Premium member · Mama Meadow" : "Welcome to Mama Meadow"}
            </Text>
            {/* Home button */}
            <AnimatedPressable onPress={handleHome} scaleValue={0.95}>
              <View style={styles.homeButton}>
                <Text style={styles.homeButtonText}>🏡 Home</Text>
              </View>
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Daily Quote */}
        <FadeInView delay={60}>
          <DailyQuoteCard />
        </FadeInView>

        {/* Affirmation Card */}
        <FadeInView delay={120}>
          <AffirmationCard />
        </FadeInView>

        {/* Mood Check-in */}
        <FadeInView delay={180}>
          <MoodCheckin />
        </FadeInView>

        {/* Go Premium Banner */}
        {!isSubscribed && (
          <FadeInView delay={240}>
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
          <FadeInView delay={240}>
            <View style={styles.subscribedBanner}>
              <Text style={styles.subscribedIcon}>✦</Text>
              <View>
                <Text style={styles.subscribedTitle}>Premium Member</Text>
                <Text style={styles.subscribedSubtitle}>All features unlocked</Text>
              </View>
            </View>
          </FadeInView>
        )}

        {/* Profile Section */}
        <FadeInView delay={300}>
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
                        <Text style={styles.listItemSubtitle}>{item.subtitle}</Text>
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
        <FadeInView delay={360}>
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

        {/* Hair & Body Changes Card */}
        <FadeInView delay={420}>
          <AnimatedPressable onPress={handleHairCard} scaleValue={0.975}>
            <View style={styles.hairCard}>
              <View style={styles.hairCardInner}>
                <View style={styles.hairIconWrap}>
                  <Text style={styles.hairIcon}>💇‍♀️</Text>
                </View>
                <View style={styles.hairTextWrap}>
                  <Text style={styles.hairTitle}>Hair & Body Changes</Text>
                  <Text style={styles.hairSubtitle}>
                    Hair loss · Skin · Recovery · Body shape
                  </Text>
                </View>
                <Text style={styles.hairChevron}>›</Text>
              </View>
              <Text style={styles.hairTagline}>
                Understanding what's normal — and what to do about it
              </Text>
            </View>
          </AnimatedPressable>
        </FadeInView>

        {/* App version */}
        <FadeInView delay={480}>
          <Text style={styles.versionText}>Mama Meadow · v1.0</Text>
        </FadeInView>
      </ScrollView>

      {/* Hair & Body Modal */}
      <HairBodyModal visible={hairModalVisible} onClose={handleHairModalClose} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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

  // ── Header ──
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
    marginBottom: 16,
  },
  homeButton: {
    backgroundColor: "#FFF8F0",
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  homeButtonText: {
    fontSize: 13,
    fontFamily: "Karla_700Bold",
    color: COLORS.accent,
    letterSpacing: 0.2,
  },

  // ── Daily Quote ──
  quoteCardOuter: {
    marginBottom: 20,
    borderRadius: 20,
  },
  quoteCardBorder: {
    position: "absolute",
    inset: 0,
    borderRadius: 20,
    borderWidth: 1.5,
    zIndex: 1,
  },
  quoteCard: {
    borderRadius: 20,
    padding: 24,
    overflow: "hidden",
  },
  quoteMarkDecor: {
    fontSize: 72,
    lineHeight: 60,
    fontFamily: "Fraunces_700Bold",
    opacity: 0.25,
    marginBottom: 4,
  },
  quoteText: {
    fontSize: 17,
    fontFamily: "Fraunces_700Bold",
    fontStyle: "italic",
    color: COLORS.text,
    lineHeight: 26,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 13,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  quoteTomorrow: {
    fontSize: 11,
    fontFamily: "Karla_400Regular",
    color: COLORS.textTertiary,
    letterSpacing: 0.2,
  },

  // ── Affirmation ──
  affirmationCard: {
    backgroundColor: "#EDE7FF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(124, 92, 191, 0.15)",
    shadowColor: "#7C5CBF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  affirmationTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  affirmationLabel: {
    fontSize: 11,
    fontFamily: "Karla_700Bold",
    color: "#7C5CBF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  affirmationRefreshHint: {
    fontSize: 11,
    fontFamily: "Karla_400Regular",
    color: "#9B7FD4",
  },
  affirmationText: {
    fontSize: 20,
    fontFamily: "Fraunces_700Bold",
    color: "#3D2470",
    lineHeight: 28,
    letterSpacing: -0.2,
  },

  // ── Mood ──
  moodCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  moodTitle: {
    fontSize: 14,
    fontFamily: "Karla_700Bold",
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 0.1,
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  moodButton: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
    backgroundColor: COLORS.surfaceSecondary,
    minWidth: 56,
  },
  moodButtonSelected: {
    borderColor: COLORS.accent,
    backgroundColor: "rgba(200, 149, 108, 0.12)",
  },
  moodEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  moodButtonLabel: {
    fontSize: 10,
    fontFamily: "Karla_400Regular",
    color: COLORS.textTertiary,
    textAlign: "center",
  },
  moodButtonLabelSelected: {
    color: COLORS.accent,
    fontFamily: "Karla_700Bold",
  },
  moodMessage: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 8,
  },

  // ── Premium Banner ──
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

  // ── Subscribed Banner ──
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

  // ── Section ──
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

  // ── Card ──
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

  // ── Wellness Card ──
  wellnessCard: {
    backgroundColor: "#F7A8C4",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
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

  // ── Hair Card ──
  hairCard: {
    backgroundColor: "#FFE4A0",
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    shadowColor: "#D4A017",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 209, 102, 0.5)",
  },
  hairCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  hairIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  hairIcon: {
    fontSize: 24,
  },
  hairTextWrap: {
    flex: 1,
  },
  hairTitle: {
    fontSize: 17,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.text,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  hairSubtitle: {
    fontSize: 12,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
  },
  hairChevron: {
    fontSize: 22,
    color: COLORS.textSecondary,
    fontWeight: "300",
  },
  hairTagline: {
    fontSize: 13,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // ── Footer ──
  versionText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: "center",
    fontFamily: "Karla_400Regular",
    marginTop: 4,
  },

  // ── Modal ──
  modalSafeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    backgroundColor: "#FFD166",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    position: "relative",
  },
  modalHeaderInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 44,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.text,
    letterSpacing: -0.3,
    flex: 1,
    lineHeight: 26,
  },
  modalHeaderEmoji: {
    fontSize: 28,
  },
  modalCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(44, 26, 14, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseBtnText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: "Karla_700Bold",
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.text,
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  modalBodyIntro: {
    fontSize: 14,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: "italic",
  },
  modalInfoRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalInfoRowLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  modalInfoLabel: {
    fontSize: 12,
    fontFamily: "Karla_700Bold",
    color: COLORS.accent,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  modalInfoText: {
    fontSize: 14,
    fontFamily: "Karla_400Regular",
    color: COLORS.text,
    lineHeight: 21,
  },
  loveNoteBox: {
    backgroundColor: "#FFF0F5",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#F4A0B0",
    marginBottom: 8,
  },
  loveNoteText: {
    fontSize: 15,
    fontFamily: "Fraunces_700Bold",
    fontStyle: "italic",
    color: "#8B2252",
    lineHeight: 24,
    textAlign: "center",
    letterSpacing: -0.1,
  },
});
