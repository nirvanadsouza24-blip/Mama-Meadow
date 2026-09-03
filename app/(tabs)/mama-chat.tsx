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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { supabase } from "@/app/integrations/supabase/client";

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

const EDGE_FUNCTION_URL =
  "https://fhewklzevapipjnygomq.supabase.co/functions/v1/mama-chat";

const DEVICE_ID_KEY = "mama_meadow_device_id";

const OPENING_MESSAGE =
  "Hey Mama 🌸 I'm here for you. How are you feeling today? You can tell me anything — I'm listening with my whole heart. 💛";

const WELCOME_BACK_MESSAGE = "Welcome back, Mama 🌸";

const QUICK_REPLIES = [
  "I'm exhausted 😴",
  "I'm feeling anxious 😰",
  "I need encouragement 💛",
  "I'm struggling 💜",
];

const ERROR_REPLY =
  "I'm having a little trouble right now, please try again 🌸";

// ─── Device ID ────────────────────────────────────────────────────────────────
async function getOrCreateDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id =
      "device_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    console.log("[MamaChat] Created new device_id:", id);
  } else {
    console.log("[MamaChat] Loaded existing device_id:", id);
  }
  return id;
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

// ─── System Note ──────────────────────────────────────────────────────────────
function SystemNote({ text }: { text: string }) {
  return (
    <View style={styles.systemNoteWrap}>
      <Text style={styles.systemNoteText}>{text}</Text>
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [quickRepliesUsed, setQuickRepliesUsed] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const deviceIdRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // ─── Load history on mount ───────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      console.log("[MamaChat] Initializing — loading device_id and chat history");
      const deviceId = await getOrCreateDeviceId();
      deviceIdRef.current = deviceId;

      console.log("[MamaChat] Fetching chat history from Supabase for device_id:", deviceId);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) {
        console.log("[MamaChat] Error loading chat history:", error.message);
      }

      if (data && data.length > 0) {
        console.log("[MamaChat] Loaded", data.length, "previous messages");
        const loaded: Message[] = data.map((row) => ({
          id: row.id,
          role: row.role === "assistant" ? "app" : "user",
          text: row.content,
          timestamp: new Date(row.created_at),
        }));
        setMessages(loaded);
        setShowWelcomeBack(true);
        setQuickRepliesUsed(true);
      } else {
        console.log("[MamaChat] No previous messages — showing opening message");
        setMessages([
          {
            id: "opening",
            role: "app",
            text: OPENING_MESSAGE,
            timestamp: new Date(),
          },
        ]);
        setShowWelcomeBack(false);
      }

      setIsLoadingHistory(false);
    }

    init();
  }, []);

  // ─── Send message to edge function ──────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const deviceId = deviceIdRef.current;
      if (!deviceId) {
        console.log("[MamaChat] Device ID not ready yet, aborting send");
        return;
      }

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

      console.log("[MamaChat] POST", EDGE_FUNCTION_URL, "device_id:", deviceId);
      try {
        const response = await fetch(EDGE_FUNCTION_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoZXdrbHpldmFwaXBqbnlnb21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzQ0MzYsImV4cCI6MjEwMzk1MDQzNn0.zil-57qUyTF-6px45i-xALfKSnUQelaM_tXrj8R23Bw",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoZXdrbHpldmFwaXBqbnlnb21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzQ0MzYsImV4cCI6MjEwMzk1MDQzNn0.zil-57qUyTF-6px45i-xALfKSnUQelaM_tXrj8R23Bw",
          },
          body: JSON.stringify({ device_id: deviceId, message: trimmed }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.log("[MamaChat] Edge function error", response.status, errText);
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        console.log("[MamaChat] AI reply received, message_id:", json.message_id);

        const appMsg: Message = {
          id: json.message_id ?? `app_${Date.now()}`,
          role: "app",
          text: json.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, appMsg]);
      } catch (err) {
        console.log("[MamaChat] Failed to get AI response:", err);
        const errorMsg: Message = {
          id: `error_${Date.now()}`,
          role: "app",
          text: ERROR_REPLY,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
        scrollToBottom();
      }
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

  if (loading || isLoadingHistory) {
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
            {showWelcomeBack && <SystemNote text={WELCOME_BACK_MESSAGE} />}

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

  // System note
  systemNoteWrap: {
    alignItems: "center",
    marginBottom: 4,
  },
  systemNoteText: {
    fontSize: 12,
    fontFamily: "Karla_400Regular",
    color: COLORS.textTertiary,
    backgroundColor: "rgba(200, 149, 108, 0.10)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: "hidden",
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
