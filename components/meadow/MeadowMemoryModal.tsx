import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export type MeadowEvent = {
  id: string;
  device_id: string;
  baby_id: string | null;
  event_type: string;
  emoji: string | null;
  title: string;
  description: string | null;
  mood: string | null;
  photo_uri: string | null;
  voice_note_uri: string | null;
  how_mama_felt: string | null;
  event_date: string;
  created_at: string;
};

const COLORS = {
  background: "#FAF7F2",
  surface: "#FFFFFF",
  cream: "#FFF8F0",
  text: "#2C1A0E",
  textSecondary: "#7A5C44",
  textTertiary: "#B89880",
  primary: "#4A7C59",
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

function formatEventDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

interface Props {
  visible: boolean;
  event: MeadowEvent | null;
  onClose: () => void;
}

export function MeadowMemoryModal({ visible, event, onClose }: Props) {
  useEffect(() => {
    if (visible) {
      console.log("[MeadowMemoryModal] Opening memory modal", { eventId: event?.id, title: event?.title });
    }
  }, [visible]);

  if (!event) return null;

  const emoji = event.emoji || EVENT_TYPE_EMOJIS[event.event_type] || "🌼";
  const typeLabel = EVENT_TYPE_LABELS[event.event_type] || event.event_type;
  const formattedDate = formatEventDate(event.event_date);
  const description = event.description || "No notes added";
  const howMamaFelt = event.how_mama_felt || "—";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Sheet */}
        <View style={styles.sheet}>
          {/* Close button */}
          <Pressable
            style={styles.closeButton}
            onPress={() => {
              console.log("[MeadowMemoryModal] Close button pressed");
              onClose();
            }}
            accessibilityLabel="Close memory"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.bigEmoji}>{emoji}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{typeLabel}</Text>
              </View>
            </View>

            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.date}>{formattedDate}</Text>

            {/* What happened */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>📝  What happened</Text>
              <Text style={styles.sectionBody}>{description}</Text>
            </View>

            {/* How Mama felt */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>💗  How Mama felt</Text>
              <Text style={styles.sectionBody}>{howMamaFelt}</Text>
            </View>

            {/* Photo */}
            {event.photo_uri ? (
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: event.photo_uri }}
                  style={styles.photo}
                  resizeMode="cover"
                  accessibilityLabel="Memory photo"
                />
              </View>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    paddingTop: 20,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(44,26,14,0.07)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Karla_700Bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    marginTop: 4,
  },
  bigEmoji: {
    fontSize: 48,
  },
  typeBadge: {
    backgroundColor: "rgba(74,124,89,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 12,
    fontFamily: "Karla_700Bold",
    color: "#4A7C59",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 26,
    fontFamily: "Fraunces_700Bold",
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 6,
    lineHeight: 32,
  },
  date: {
    fontSize: 14,
    fontFamily: "Karla_400Regular",
    color: COLORS.textTertiary,
    marginBottom: 24,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Karla_700Bold",
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  sectionBody: {
    fontSize: 15,
    fontFamily: "Karla_400Regular",
    color: COLORS.text,
    lineHeight: 22,
  },
  photoContainer: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photo: {
    width: "100%",
    height: 220,
  },
});
