import React, { useRef, useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
} from "react-native";
import type { MeadowEvent } from "./MeadowMemoryModal";

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

const EVENT_TYPE_LABELS: Record<string, string> = {
  milestone: "Milestone",
  memory: "Memory",
  mood_happy: "Happy Moment",
  mood_difficult: "Difficult Day",
  first_word: "First Word",
  monthly: "Monthly",
  feed: "Feed",
  sleep: "Sleep",
  diaper: "Diaper",
  family_contribution: "Family Contribution",
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

const DOT_COLORS: Record<string, string> = {
  milestone: "#4A7C59",
  memory: "#7B68EE",
  mood_happy: "#F4A261",
  mood_difficult: "#6B9FD4",
  first_word: "#E07B54",
  monthly: "#4A7C59",
  feed: "#81B29A",
  sleep: "#9B8EC4",
  diaper: "#6BAED6",
  family_contribution: "#C8956C",
};

function formatEventDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

interface TimelineItemProps {
  event: MeadowEvent;
  index: number;
  isLast: boolean;
}

function TimelineItem({ event, index, isLast }: TimelineItemProps) {
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const itemOpacity = useRef(new Animated.Value(0)).current;
  const itemTranslate = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(itemOpacity, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(itemTranslate, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    console.log("[WalkThroughMeadowModal] Timeline item toggled", { eventId: event.id, expanded: !expanded });
    setExpanded(!expanded);
    Animated.timing(expandAnim, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const emoji = event.emoji || EVENT_TYPE_EMOJIS[event.event_type] || "🌼";
  const typeLabel = EVENT_TYPE_LABELS[event.event_type] || event.event_type;
  const dotColor = DOT_COLORS[event.event_type] || COLORS.primary;
  const formattedDate = formatEventDate(event.event_date);

  const expandedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  return (
    <Animated.View
      style={[
        styles.timelineItem,
        { opacity: itemOpacity, transform: [{ translateY: itemTranslate }] },
      ]}
    >
      {/* Left: dot + line */}
      <View style={styles.timelineLeft}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Right: content */}
      <Pressable style={styles.timelineContent} onPress={toggleExpand}>
        <View style={styles.timelineRow}>
          <Text style={styles.timelineEmoji}>{emoji}</Text>
          <View style={styles.timelineTextBlock}>
            <Text style={styles.timelineTitle} numberOfLines={2}>
              {event.title}
            </Text>
            <Text style={styles.timelineDate}>{formattedDate}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{typeLabel}</Text>
            </View>
          </View>
          <Text style={[styles.expandChevron, expanded && styles.expandChevronOpen]}>
            ›
          </Text>
        </View>

        {/* Expanded details */}
        <Animated.View style={[styles.expandedDetails, { maxHeight: expandedHeight, overflow: "hidden" }]}>
          {event.description ? (
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>📝 What happened</Text>
              <Text style={styles.expandedBody}>{event.description}</Text>
            </View>
          ) : null}
          {event.how_mama_felt ? (
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>💗 How Mama felt</Text>
              <Text style={styles.expandedBody}>{event.how_mama_felt}</Text>
            </View>
          ) : null}
          {!event.description && !event.how_mama_felt ? (
            <Text style={styles.expandedEmpty}>No additional notes for this moment.</Text>
          ) : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

interface Props {
  visible: boolean;
  events: MeadowEvent[];
  onClose: () => void;
}

export function WalkThroughMeadowModal({ visible, events, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      console.log("[WalkThroughMeadowModal] Modal opened", { eventCount: events.length });
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 360, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(80);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  // Sort oldest → newest
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={() => {
        console.log("[WalkThroughMeadowModal] Close via back button");
        onClose();
      }}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Walk Through My Meadow 🌸</Text>
              <Text style={styles.headerSubtitle}>Your journey, from the very beginning</Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={() => {
                console.log("[WalkThroughMeadowModal] Close button pressed");
                onClose();
              }}
              accessibilityLabel="Close walk through meadow"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Timeline */}
          {sortedEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>Your meadow is just beginning to grow</Text>
              <Text style={styles.emptySubtitle}>
                Add your first moment to start your journey
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.timelineContainer}
              style={styles.timelineScroll}
            >
              {sortedEvents.map((event, index) => (
                <TimelineItem
                  key={event.id}
                  event={event}
                  index={index}
                  isLast={index === sortedEvents.length - 1}
                />
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: "92%",
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Fraunces_700Bold",
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(44,26,14,0.07)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  closeButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Karla_700Bold",
  },
  timelineScroll: {
    flex: 1,
  },
  timelineContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  timelineLeft: {
    width: 28,
    alignItems: "center",
    paddingTop: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: "rgba(44,26,14,0.08)",
    minHeight: 40,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  timelineEmoji: {
    fontSize: 24,
    marginTop: 2,
  },
  timelineTextBlock: {
    flex: 1,
    gap: 3,
  },
  timelineTitle: {
    fontSize: 15,
    fontFamily: "Fraunces_700Bold",
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  timelineDate: {
    fontSize: 12,
    fontFamily: "Karla_400Regular",
    color: COLORS.textTertiary,
  },
  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: "Karla_700Bold",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  expandChevron: {
    fontSize: 22,
    color: COLORS.textTertiary,
    fontWeight: "300",
    marginTop: -2,
    transform: [{ rotate: "90deg" }],
  },
  expandChevronOpen: {
    transform: [{ rotate: "-90deg" }],
  },
  expandedDetails: {
    marginTop: 12,
    gap: 8,
  },
  expandedRow: {
    gap: 4,
  },
  expandedLabel: {
    fontSize: 12,
    fontFamily: "Karla_700Bold",
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
  expandedBody: {
    fontSize: 14,
    fontFamily: "Karla_400Regular",
    color: COLORS.text,
    lineHeight: 20,
  },
  expandedEmpty: {
    fontSize: 13,
    fontFamily: "Karla_400Regular",
    color: COLORS.textTertiary,
    fontStyle: "italic",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Fraunces_700Bold",
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Karla_400Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
