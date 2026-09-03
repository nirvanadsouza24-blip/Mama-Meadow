import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/app/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useBabies } from "@/contexts/BabiesContext";
import { AddMeadowEventModal } from "./AddMeadowEventModal";
import { MeadowMemoryModal } from "./MeadowMemoryModal";
import type { MeadowEvent } from "./MeadowMemoryModal";
import { WalkThroughMeadowModal } from "./WalkThroughMeadowModal";

const { width: SW } = Dimensions.get("window");
const CANVAS_WIDTH = SW - 40;
const CANVAS_HEIGHT = 200;

const COLORS = {
  background: "#FAF7F2",
  surface: "#FFFFFF",
  cream: "#FFF8F0",
  surfaceSecondary: "#F3EDE3",
  text: "#2C1A0E",
  textSecondary: "#7A5C44",
  textTertiary: "#B89880",
  primary: "#4A7C59",
  primaryMuted: "rgba(74, 124, 89, 0.10)",
  accent: "#C8956C",
  border: "rgba(44, 26, 14, 0.07)",
  accentBorder: "rgba(200,149,108,0.2)",
};

// Mood-based gradient colors (simulated with background color since LinearGradient not available)
const MOOD_COLORS = {
  sunny: { bg: "#E8F5E9", accent: "#C8E6C9" },
  rainy: { bg: "#E3EAF5", accent: "#D6E4F0" },
  rainbow: { bg: "#FFF8E1", accent: "#F3E5F5" },
};

const EVENT_TYPE_EMOJIS: Record<string, string> = {
  milestone: "🌸",
  memory: "🦋",
  mood_happy: "🌻",
  mood_difficult: "🌧️",
  first_word: "🐦",
  monthly: "🌳",
  feed: "🌱",
  sleep: "🌙",
  diaper: "💧",
  family_contribution: "🏡",
};

const DAILY_MESSAGES: Record<number, string> = {
  1: "🌼 Good morning, Mama.\nToday your little meadow needs only one thing from you:\n20 minutes of cuddles.\nEverything else can wait. ❤️",
  2: "🌱 Your meadow grew a little more yesterday.\nEvery log, every memory — it all counts. 🌸",
  3: "🦋 A butterfly visits when joy is near.\nWhat made you smile today, Mama?",
  4: "🌻 Sunflowers turn toward the light.\nSo do you, even on hard days. 💛",
  5: "🌸 This week, you showed up.\nThat is everything. Your meadow sees it all.",
  6: "🌈 Rest is part of growing.\nYour meadow is patient. So should you be. 🌿",
  0: "🏡 Home is wherever you and your baby are.\nYour meadow is always here. 💗",
};

// Deterministic position from index + seed
function getElementPosition(index: number, total: number): { left: number; top: number } {
  const seed = (index * 137 + 31) % 100;
  const seed2 = (index * 73 + 17) % 100;
  const cols = Math.ceil(Math.sqrt(total));
  const col = index % cols;
  const row = Math.floor(index / cols);
  const colWidth = CANVAS_WIDTH / cols;
  const rowHeight = (CANVAS_HEIGHT - 40) / Math.ceil(total / cols);
  const left = col * colWidth + (seed / 100) * (colWidth * 0.6) + colWidth * 0.1;
  const top = row * rowHeight + (seed2 / 100) * (rowHeight * 0.5) + 16;
  return {
    left: Math.min(left, CANVAS_WIDTH - 36),
    top: Math.min(top, CANVAS_HEIGHT - 40),
  };
}

function determineMood(events: MeadowEvent[]): "sunny" | "rainy" | "rainbow" {
  if (events.length === 0) return "sunny";
  const recent = events.slice(0, 5);
  const hasDifficult = recent.some((e) => e.event_type === "mood_difficult");
  const hasHappy = recent.some((e) => e.event_type === "mood_happy" || e.event_type === "milestone");
  if (hasDifficult && hasHappy) return "rainbow";
  if (hasDifficult) return "rainy";
  return "sunny";
}

function calculateMeadowAge(events: MeadowEvent[], babies: { born_at?: string; dob?: string }[]): number {
  const dates: Date[] = [];
  events.forEach((e) => {
    try {
      dates.push(new Date(e.event_date));
    } catch {}
  });
  babies.forEach((b) => {
    const dateStr = b.born_at || b.dob;
    if (dateStr) {
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) dates.push(d);
      } catch {}
    }
  });
  if (dates.length === 0) return 0;
  const earliest = dates.reduce((a, b) => (a < b ? a : b));
  const now = new Date();
  const diff = Math.floor((now.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function getLastYearMemory(events: MeadowEvent[]): MeadowEvent | null {
  const today = new Date();
  const lastYear = new Date(today);
  lastYear.setFullYear(today.getFullYear() - 1);
  const lastYearStr = lastYear.toISOString().split("T")[0];
  return events.find((e) => e.event_date === lastYearStr) ?? null;
}

// Floating meadow element
function FloatingMeadowElement({
  event,
  position,
  index,
  onPress,
}: {
  event: MeadowEvent;
  position: { left: number; top: number };
  index: number;
  onPress: (event: MeadowEvent) => void;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const floatDur = 3200 + (index * 317) % 1800;
  const floatRange = 6 + (index * 7) % 8;
  const delay = (index * 280) % 1200;

  useEffect(() => {
    // Entrance fade
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();

    // Float loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -floatRange,
          duration: floatDur / 2,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: floatRange,
          duration: floatDur,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: floatDur / 2,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const emoji = event.emoji || EVENT_TYPE_EMOJIS[event.event_type] || "🌼";

  return (
    <Animated.View
      style={[
        styles.floatingElement,
        {
          left: position.left,
          top: position.top,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        onPress={() => {
          console.log("[MeadowSection] Meadow element tapped", { eventId: event.id, title: event.title });
          onPress(event);
        }}
        accessibilityLabel={`Memory: ${event.title}`}
        style={styles.floatingElementPressable}
      >
        <Text style={styles.floatingEmoji}>{emoji}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function MeadowSection() {
  const router = useRouter();
  const { isSubscribed } = useSubscription();
  const { babies } = useBabies();

  const [events, setEvents] = useState<MeadowEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWalkModal, setShowWalkModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MeadowEvent | null>(null);

  const loadEvents = useCallback(async () => {
    const babyId = babies[0]?.id ?? null;
    console.log("[MeadowSection] Loading meadow events from Supabase", { babyId });
    try {
      let query = (supabase as any)
        .from("meadow_events")
        .select("*")
        .order("event_date", { ascending: false })
        .limit(50);

      if (babyId) {
        query = query.eq("baby_id", babyId);
      } else {
        console.log("[MeadowSection] No baby_id available, loading all events");
      }

      const { data, error } = await query;

      if (error) {
        console.error("[MeadowSection] Error loading meadow events", error);
      } else {
        console.log("[MeadowSection] Loaded meadow events", { count: data?.length ?? 0 });
        setEvents((data as MeadowEvent[]) ?? []);
      }
    } catch (err) {
      console.error("[MeadowSection] Unexpected error loading events", err);
    } finally {
      setLoading(false);
    }
  }, [babies]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const mood = determineMood(events);
  const moodColors = MOOD_COLORS[mood];
  const meadowAge = calculateMeadowAge(events, babies);
  const lastYearMemory = getLastYearMemory(events);

  const dayOfWeek = new Date().getDay();
  const dailyMessage = lastYearMemory
    ? `🦋 A little memory from this day last year…\n'${lastYearMemory.title}'`
    : DAILY_MESSAGES[dayOfWeek];

  // Up to 12 elements for canvas
  const canvasEvents = events.slice(0, 12);

  const meadowAgeText = `Your meadow has been growing for ${meadowAge} day${meadowAge !== 1 ? "s" : ""} 🌸`;

  const handleElementPress = useCallback((event: MeadowEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleAddPress = useCallback(() => {
    console.log("[MeadowSection] + Add to Meadow button pressed");
    setShowAddModal(true);
  }, []);

  const handleWalkPress = useCallback(() => {
    console.log("[MeadowSection] Walk Through My Meadow button pressed");
    setShowWalkModal(true);
  }, []);

  const handlePremiumLockPress = useCallback(() => {
    console.log("[MeadowSection] Premium lock button pressed — navigating to paywall");
    router.push("/paywall");
  }, [router]);

  const handleSaved = useCallback(() => {
    console.log("[MeadowSection] New meadow event saved — reloading events");
    setShowAddModal(false);
    loadEvents();
  }, [loadEvents]);

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabelText}>Your Little Meadow</Text>
        <View style={styles.moodBadge}>
          <Text style={styles.moodBadgeText}>
            {mood === "sunny" ? "☀️ Sunny" : mood === "rainy" ? "🌧️ Rainy" : "🌈 Rainbow"}
          </Text>
        </View>
      </View>

      {/* Canvas */}
      <View style={[styles.canvas, { backgroundColor: moodColors.bg }]}>
        {/* Ground strip */}
        <View style={[styles.groundStrip, { backgroundColor: moodColors.accent }]} />

        {/* Floating elements */}
        {canvasEvents.map((event, index) => {
          const position = getElementPosition(index, canvasEvents.length);
          return (
            <FloatingMeadowElement
              key={event.id}
              event={event}
              position={position}
              index={index}
              onPress={handleElementPress}
            />
          );
        })}

        {/* Empty state hint */}
        {!loading && canvasEvents.length === 0 && (
          <View style={styles.canvasEmpty}>
            <Text style={styles.canvasEmptyText}>
              Add your first moment to see it bloom here 🌱
            </Text>
          </View>
        )}

        {/* Age text */}
        <View style={styles.ageTextContainer}>
          <Text style={styles.ageText}>{meadowAgeText}</Text>
        </View>
      </View>

      {/* Today in Your Meadow card */}
      <View style={styles.dailyCard}>
        <Text style={styles.dailyCardTitle}>Today in Your Meadow</Text>
        <Text style={styles.dailyCardMessage}>{dailyMessage}</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        {/* Add to Meadow */}
        <Pressable
          style={styles.addButton}
          onPress={handleAddPress}
        >
          <Text style={styles.addButtonText}>+ Add to Meadow</Text>
        </Pressable>

        {/* Walk Through / Premium lock */}
        {isSubscribed ? (
          <Pressable
            style={styles.walkButton}
            onPress={handleWalkPress}
          >
            <Text style={styles.walkButtonText}>Walk Through 🌸</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.premiumLockButton}
            onPress={handlePremiumLockPress}
          >
            <Text style={styles.premiumLockText}>Premium 🌸</Text>
          </Pressable>
        )}
      </View>

      {/* Modals */}
      <AddMeadowEventModal
        visible={showAddModal}
        onClose={() => {
          console.log("[MeadowSection] AddMeadowEventModal closed");
          setShowAddModal(false);
        }}
        onSaved={handleSaved}
      />

      <MeadowMemoryModal
        visible={selectedEvent !== null}
        event={selectedEvent}
        onClose={() => {
          console.log("[MeadowSection] MeadowMemoryModal closed");
          setSelectedEvent(null);
        }}
      />

      <WalkThroughMeadowModal
        visible={showWalkModal}
        events={events}
        onClose={() => {
          console.log("[MeadowSection] WalkThroughMeadowModal closed");
          setShowWalkModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  moodBadge: {
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodBadgeText: {
    fontSize: 11,
    fontFamily: "Karla_700Bold",
    color: COLORS.primary,
  },

  // Canvas
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(74,124,89,0.15)",
    position: "relative",
  },
  groundStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    opacity: 0.35,
  },
  floatingElement: {
    position: "absolute",
  },
  floatingElementPressable: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingEmoji: {
    fontSize: 22,
  },
  canvasEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 28,
  },
  canvasEmptyText: {
    fontSize: 13,
    fontFamily: "Karla_400Regular",
    color: "rgba(74,124,89,0.6)",
    textAlign: "center",
    lineHeight: 18,
  },
  ageTextContainer: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  ageText: {
    fontSize: 11,
    fontFamily: "Karla_400Regular",
    color: "rgba(74,124,89,0.7)",
    textAlign: "center",
  },

  // Daily card
  dailyCard: {
    backgroundColor: "#FFF8F0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(200,149,108,0.2)",
    shadowColor: "#C8956C",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  dailyCardTitle: {
    fontSize: 11,
    fontFamily: "Karla_700Bold",
    color: COLORS.accent,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  dailyCardMessage: {
    fontSize: 14,
    fontFamily: "Karla_400Regular",
    color: COLORS.text,
    lineHeight: 22,
  },

  // Buttons
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  addButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 11,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 13,
    fontFamily: "Karla_700Bold",
    fontWeight: "700",
    color: "#fff",
  },
  walkButton: {
    flex: 1,
    backgroundColor: "rgba(74,124,89,0.10)",
    borderRadius: 20,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  walkButtonText: {
    fontSize: 13,
    fontFamily: "Karla_700Bold",
    fontWeight: "700",
    color: COLORS.primary,
  },
  premiumLockButton: {
    flex: 1,
    backgroundColor: "rgba(200,149,108,0.10)",
    borderRadius: 20,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  premiumLockText: {
    fontSize: 13,
    fontFamily: "Karla_700Bold",
    fontWeight: "700",
    color: COLORS.accent,
  },
});
