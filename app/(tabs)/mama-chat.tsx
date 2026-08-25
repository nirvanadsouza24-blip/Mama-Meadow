import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { usePremiumGate } from "@/hooks/usePremiumGate";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
  background: "#FAF7F2",
  surface: "#FFFFFF",
  text: "#2C1A0E",
  textSecondary: "#7A5C44",
  textTertiary: "#B89880",
  primary: "#4A7C59",
  primaryMuted: "rgba(74, 124, 89, 0.10)",
  accent: "#C8956C",
  border: "rgba(44, 26, 14, 0.07)",
};

// ─── Response Engine ──────────────────────────────────────────────────────────
const RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ["tired", "exhausted", "sleep", "no sleep", "can't sleep", "sleepless"],
    response:
      "Oh Mama, sleep deprivation is one of the hardest parts of this journey — and it's real, it's brutal, and it's not your fault. 💛 Your body is working so hard. Try to rest whenever you can, even in small moments. Is there anyone who can take a shift so you can sleep? You deserve rest just as much as your baby does. 🌿",
  },
  {
    keywords: ["sad", "cry", "crying", "tears", "down", "low", "depressed", "depression", "hopeless"],
    response:
      "I hear you, and I want you to know — what you're feeling is valid. 💜 So many mothers feel this way and feel alone in it. If these feelings are lasting more than two weeks or feel overwhelming, please reach out to your doctor or midwife. You are not broken. You are not failing. You are a mother going through something incredibly hard. You are not alone. 🌸",
  },
  {
    keywords: ["anxious", "anxiety", "worried", "worry", "scared", "fear", "panic", "overwhelmed"],
    response:
      "Anxiety after birth is so common, and it makes sense — you're responsible for a tiny human and everything feels high-stakes. 🌿 Take a slow breath with me: in for 4 counts, hold for 4, out for 4. You are safe. Your baby is safe. One moment at a time. If the anxiety feels unmanageable, please talk to your doctor — there is help available and you deserve it. 💛",
  },
  {
    keywords: ["breastfeed", "nursing", "latch", "milk", "supply", "nipple", "pump"],
    response:
      "Breastfeeding is beautiful AND incredibly hard — anyone who says otherwise hasn't done it! 🤱 Whether you're struggling with latch, supply, or just exhaustion from feeding around the clock — you are doing amazingly. A lactation consultant can be a game-changer if you're struggling. And remember: fed is best. However you feed your baby, you are a wonderful mother. 🌸",
  },
  {
    keywords: ["hair", "hair loss", "losing hair", "bald", "shedding"],
    response:
      "Oh, the hair loss! It's such a shock, isn't it? 💇‍♀️ Around 3–6 months postpartum, many mamas lose a lot of hair — it's called postpartum alopecia and it's completely normal. Your oestrogen dropped after birth and all that 'extra' pregnancy hair is shedding. It WILL grow back, I promise. Be gentle with your hair — wide-tooth comb, gentle shampoo, and biotin-rich foods like eggs and nuts can help. You're still beautiful. 🌿",
  },
  {
    keywords: ["body", "weight", "fat", "ugly", "hate my body", "look", "appearance", "stretch marks"],
    response:
      "Mama, your body grew and birthed a human being. That is extraordinary. 🌸 The 'bounce back' culture is a lie — your body deserves reverence, not criticism. Stretch marks are maps of the miracle you created. Softness is evidence of the life you nurtured. Please be as kind to your body as you would be to your best friend. You are beautiful, exactly as you are. 💛",
  },
  {
    keywords: ["partner", "husband", "relationship", "alone", "lonely", "support", "help"],
    response:
      "Feeling unsupported or lonely is one of the most painful parts of new motherhood. 💜 You shouldn't have to do this alone. It's okay to tell your partner exactly what you need — sometimes they genuinely don't know. And if you don't have that support, please know there are communities of mothers who understand. You deserve a village. 🌿",
  },
  {
    keywords: ["happy", "good", "great", "wonderful", "amazing", "love", "grateful", "joy", "beautiful"],
    response:
      "Oh, this makes my heart so happy! 🌸 Hold onto this feeling, Mama. You are doing something incredible, and moments of joy are your reward. Your baby is so lucky to have someone who loves them the way you do. 💛 What's making you feel good today?",
  },
  {
    keywords: ["guilty", "guilt", "bad mother", "failing", "failure", "not enough", "enough"],
    response:
      "Mama guilt is real, and it's one of the heaviest things a mother carries. 💜 But here's the truth: the fact that you care so deeply about being a good mother is proof that you already are one. Bad mothers don't worry about being bad mothers. You are enough. You have always been enough. 🌸",
  },
  {
    keywords: ["pain", "hurt", "sore", "healing", "recovery", "stitches", "c-section", "caesarean"],
    response:
      "Your body has been through so much, and healing takes time. 🌿 Please be patient with yourself — you just did something extraordinary. Make sure you're resting as much as possible, eating nourishing food, and accepting help when it's offered. If you're in significant pain, please don't hesitate to contact your doctor or midwife. You deserve to heal well. 💛",
  },
  {
    keywords: ["hello", "hi", "hey", "hiya", "howdy"],
    response:
      "Hello, beautiful Mama! 🌸 I'm so glad you're here. How are you feeling today? Remember, this is your safe space — you can share anything with me. 💛",
  },
  {
    keywords: ["thank", "thanks", "thank you"],
    response:
      "You are so welcome, Mama. 🌿 I'm always here for you. You're doing an incredible job, even on the days it doesn't feel like it. 💛",
  },
];

const FALLBACK_RESPONSE =
  "Thank you for sharing that with me, Mama. 🌸 Whatever you're going through, you don't have to face it alone. I'm here, and I'm listening. Can you tell me a little more about how you're feeling? 💛";

const OPENING_MESSAGE =
  "Hey Mama 🌸 I'm here for you. How are you feeling today? You can tell me anything — I'm listening with my whole heart. 💛";

const QUICK_REPLIES = [
  "I'm exhausted 😴",
  "I'm feeling anxious 😰",
  "I need encouragement 💛",
  "I'm struggling 💜",
];

function getResponse(text: string): string {
  const lower = text.toLowerCase();
  for (const entry of RESPONSES) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.response;
    }
  }
  return FALLBACK_RESPONSE;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Message = {
  id: string;
  role: "user" | "app";
  text: string;
  timestamp: Date;
};

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeDotAnim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: -6, duration: 300, delay, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(300),
        ])
      );
    const a1 = makeDotAnim(dot1, 0);
    const a2 = makeDotAnim(dot2, 150);
    const a3 = makeDotAnim(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  return (
    <View style={styles.typingRow}>
      <View style={styles.appAvatarSmall}>
        <Text style={styles.appAvatarSmallEmoji}>🌸</Text>
      </View>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[styles.typingDot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const timeStr = message.timestamp.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <View style={styles.userMessageWrapper}>
        <View style={styles.userBubble}>
          <Text style={styles.userBubbleText}>{message.text}</Text>
        </View>
        <Text style={styles.timestampRight}>{timeStr}</Text>
      </View>
    );
  }

  return (
    <View style={styles.appMessageWrapper}>
      <View style={styles.appAvatarSmall}>
        <Text style={styles.appAvatarSmallEmoji}>🌸</Text>
      </View>
      <View style={styles.appMessageContent}>
        <View style={styles.appBubble}>
          <Text style={styles.appBubbleText}>{message.text}</Text>
        </View>
        <Text style={styles.timestampLeft}>{timeStr}</Text>
      </View>
    </View>
  );
}

// ─── Locked State ─────────────────────────────────────────────────────────────
function LockedState() {
  const router = useRouter();
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleUnlock = () => {
    console.log("[MamaChat] Unlock with Premium button pressed");
    router.push("/paywall");
  };

  const features = [
    "Compassionate responses",
    "Available 24/7",
    "Completely private",
    "Tailored to your journey",
  ];

  return (
    <LinearGradient
      colors={["#FFE4EF", "#F3E8FF"]}
      style={styles.lockedContainer}
    >
      <Animated.View style={[styles.lockIconWrap, { opacity: glowAnim }]}>
        <Text style={styles.lockIcon}>🔒</Text>
      </Animated.View>
      <Text style={styles.lockedTitle}>Your Caring Companion</Text>
      <Text style={styles.lockedSubtitle}>
        Chat with Mama Meadow — your personal support friend, available whenever you need her. Share how you're feeling and receive warm, caring guidance.
      </Text>
      <View style={styles.featureList}>
        {features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>
      <Pressable
        style={styles.unlockButton}
        onPress={handleUnlock}
      >
        <Text style={styles.unlockButtonText}>Unlock with Premium</Text>
      </Pressable>
    </LinearGradient>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MamaChatScreen() {
  const router = useRouter();
  const { isSubscribed, loading } = usePremiumGate();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "opening",
      role: "app",
      text: OPENING_MESSAGE,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [quickRepliesUsed, setQuickRepliesUsed] = useState(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      console.log("[MamaChat] User sent message:", trimmed);

      const userMsg: Message = {
        id: `user_${Date.now()}`,
        role: "user",
        text: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
      setIsTyping(true);
      scrollToBottom();

      setTimeout(() => {
        const response = getResponse(trimmed);
        console.log("[MamaChat] App responding with matched response");
        const appMsg: Message = {
          id: `app_${Date.now()}`,
          role: "app",
          text: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, appMsg]);
        setIsTyping(false);
        scrollToBottom();
      }, 1200);
    },
    [scrollToBottom]
  );

  const handleSend = useCallback(() => {
    console.log("[MamaChat] Send button pressed");
    sendMessage(inputText);
  }, [inputText, sendMessage]);

  const handleQuickReply = useCallback(
    (chip: string) => {
      console.log("[MamaChat] Quick reply chip tapped:", chip);
      setQuickRepliesUsed(true);
      sendMessage(chip);
    },
    [sendMessage]
  );

  const handleBack = () => {
    console.log("[MamaChat] Back button pressed");
    router.back();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAF7F2" }}>
        <ActivityIndicator size="large" color="#4A7C59" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Background gradient */}
      <LinearGradient
        colors={["#FFF5F8", "#FAF7F2"]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarEmoji}>🌿</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Mama Meadow 🌸</Text>
            <Text style={styles.headerSubtitle}>Your caring companion</Text>
          </View>
        </View>
        <View style={styles.headerRight} />
      </View>

      {!isSubscribed ? (
        <LockedState />
      ) : (
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
          >
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Quick reply chips — shown after opening message, before first user message */}
            {!quickRepliesUsed && messages.length === 1 && (
              <View style={styles.quickRepliesWrap}>
                {QUICK_REPLIES.map((chip) => (
                  <Pressable
                    key={chip}
                    style={styles.quickReplyChip}
                    onPress={() => handleQuickReply(chip)}
                  >
                    <Text style={styles.quickReplyText}>{chip}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {isTyping && <TypingIndicator />}
          </ScrollView>

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Share how you're feeling…"
              placeholderTextColor={COLORS.textTertiary}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
            >
              <Text style={styles.sendButtonText}>🌿</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF5F8",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FAF7F2",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(44, 26, 14, 0.06)",
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 28,
    color: COLORS.primary,
    fontWeight: "300",
    lineHeight: 32,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatarEmoji: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
  },
  headerRight: {
    width: 36,
  },

  // Chat
  chatContainer: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },

  // User message
  userMessageWrapper: {
    alignItems: "flex-end",
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: SCREEN_WIDTH * 0.75,
  },
  userBubbleText: {
    fontSize: 15,
    fontFamily: "Karla_400Regular",
    color: "#fff",
    lineHeight: 22,
  },
  timestampRight: {
    fontSize: 11,
    fontFamily: "Karla_400Regular",
    color: COLORS.textTertiary,
    marginTop: 4,
    marginRight: 4,
  },

  // App message
  appMessageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  appAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFE4EF",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  appAvatarSmallEmoji: {
    fontSize: 14,
  },
  appMessageContent: {
    flex: 1,
    alignItems: "flex-start",
  },
  appBubble: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: SCREEN_WIDTH * 0.75,
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  appBubbleText: {
    fontSize: 15,
    fontFamily: "Karla_400Regular",
    color: COLORS.text,
    lineHeight: 22,
  },
  timestampLeft: {
    fontSize: 11,
    fontFamily: "Karla_400Regular",
    color: COLORS.textTertiary,
    marginTop: 4,
    marginLeft: 4,
  },

  // Quick replies
  quickRepliesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
    marginLeft: 36,
  },
  quickReplyChip: {
    backgroundColor: "#FFF0F5",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(200, 149, 108, 0.25)",
  },
  quickReplyText: {
    fontSize: 13,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
  },

  // Typing indicator
  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  typingBubble: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.textTertiary,
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: "#FAF7F2",
    borderTopWidth: 1,
    borderTopColor: "rgba(44, 26, 14, 0.06)",
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(44, 26, 14, 0.10)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Karla_400Regular",
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(74, 124, 89, 0.35)",
  },
  sendButtonText: {
    fontSize: 18,
  },

  // Locked state
  lockedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  lockIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.6)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#C8956C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  lockIcon: {
    fontSize: 40,
  },
  lockedTitle: {
    fontSize: 24,
    fontFamily: "Fraunces_700Bold",
    color: COLORS.text,
    letterSpacing: -0.3,
    textAlign: "center",
    marginBottom: 12,
  },
  lockedSubtitle: {
    fontSize: 15,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  featureList: {
    alignSelf: "stretch",
    marginBottom: 32,
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureCheck: {
    fontSize: 15,
    color: COLORS.primary,
    fontFamily: "Karla_700Bold",
    width: 20,
  },
  featureText: {
    fontSize: 15,
    fontFamily: "Karla_400Regular",
    color: COLORS.text,
  },
  unlockButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignSelf: "stretch",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  unlockButtonText: {
    fontSize: 16,
    fontFamily: "Karla_700Bold",
    color: "#fff",
    letterSpacing: 0.2,
  },
});
