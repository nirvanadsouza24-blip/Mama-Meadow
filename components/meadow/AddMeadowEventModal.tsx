import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/app/integrations/supabase/client";
import { useBabies } from "@/contexts/BabiesContext";

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

type EventTypeOption = {
  type: string;
  emoji: string;
  label: string;
};

const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  { type: "milestone", emoji: "🌸", label: "Milestone" },
  { type: "memory", emoji: "🦋", label: "Memory" },
  { type: "mood_happy", emoji: "🌻", label: "Happy Moment" },
  { type: "mood_difficult", emoji: "🌧️", label: "Difficult Day" },
  { type: "first_word", emoji: "🐦", label: "First Word" },
  { type: "family_contribution", emoji: "🏡", label: "Family" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddMeadowEventModal({ visible, onClose, onSaved }: Props) {
  const { babies } = useBabies();
  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [selectedType, setSelectedType] = useState<string>("memory");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [howMamaFelt, setHowMamaFelt] = useState("");
  const [titleError, setTitleError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      console.log("[AddMeadowEventModal] Modal opened");
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 340, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(80);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const resetForm = useCallback(() => {
    setSelectedType("memory");
    setTitle("");
    setDescription("");
    setHowMamaFelt("");
    setTitleError("");
    setSaving(false);
  }, []);

  const handleClose = useCallback(() => {
    console.log("[AddMeadowEventModal] Cancel / close pressed");
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSave = useCallback(async () => {
    console.log("[AddMeadowEventModal] Save button pressed", { selectedType, title, description, howMamaFelt });

    if (!title.trim()) {
      setTitleError("Please enter a title");
      return;
    }

    setSaving(true);
    try {
      const deviceId = await AsyncStorage.getItem("mama_meadow_device_id");
      const babyId = babies[0]?.id ?? null;
      const today = new Date().toISOString().split("T")[0];

      const selectedOption = EVENT_TYPE_OPTIONS.find((o) => o.type === selectedType);
      const emoji = selectedOption?.emoji ?? "🌼";

      console.log("[AddMeadowEventModal] Inserting meadow_event to Supabase", {
        device_id: deviceId,
        baby_id: babyId,
        event_type: selectedType,
        title: title.trim(),
        event_date: today,
      });

      const { data: eventData, error: eventError } = await (supabase as any)
        .from("meadow_events")
        .insert({
          device_id: deviceId ?? "unknown",
          baby_id: babyId,
          event_type: selectedType,
          emoji,
          title: title.trim(),
          description: description.trim() || null,
          mood: null,
          photo_uri: null,
          voice_note_uri: null,
          how_mama_felt: howMamaFelt.trim() || null,
          event_date: today,
        })
        .select()
        .single();

      if (eventError) {
        console.error("[AddMeadowEventModal] Error inserting meadow_event", eventError);
        setSaving(false);
        return;
      }

      console.log("[AddMeadowEventModal] meadow_event inserted successfully", { id: (eventData as any)?.id });

      // Also insert into meadow_memories
      if (title.trim()) {
        console.log("[AddMeadowEventModal] Inserting meadow_memory to Supabase", { event_id: (eventData as any)?.id });
        const { error: memError } = await (supabase as any).from("meadow_memories").insert({
          event_id: (eventData as any)?.id ?? null,
          device_id: deviceId ?? "unknown",
          title: title.trim(),
          what_happened: description.trim() || null,
          how_mama_felt: howMamaFelt.trim() || null,
          photo_uris: null,
          voice_note_uri: null,
          memory_date: today,
        });

        if (memError) {
          console.warn("[AddMeadowEventModal] Error inserting meadow_memory (non-fatal)", memError);
        } else {
          console.log("[AddMeadowEventModal] meadow_memory inserted successfully");
        }
      }

      resetForm();
      onSaved();
    } catch (err) {
      console.error("[AddMeadowEventModal] Unexpected error saving meadow event", err);
      setSaving(false);
    }
  }, [selectedType, title, description, howMamaFelt, onSaved, resetForm, babies]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.overlayTouchable} />
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
            {/* Handle */}
            <View style={styles.handle} />

            <Text style={styles.sheetTitle}>Add to Your Meadow 🌸</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              style={styles.scrollView}
              bounces={false}
            >
              {/* Event type picker */}
              <Text style={styles.fieldLabel}>What kind of moment?</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typePickerRow}
              >
                {EVENT_TYPE_OPTIONS.map((opt) => {
                  const isSelected = selectedType === opt.type;
                  return (
                    <Pressable
                      key={opt.type}
                      style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                      onPress={() => {
                        console.log("[AddMeadowEventModal] Event type selected", { type: opt.type });
                        setSelectedType(opt.type);
                      }}
                    >
                      <Text style={styles.typeChipEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.typeChipLabel, isSelected && styles.typeChipLabelSelected]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Title */}
              <Text style={styles.fieldLabel}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, titleError ? styles.inputError : null]}
                placeholder="e.g. First smile, Said 'mama'…"
                placeholderTextColor={COLORS.textTertiary}
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  if (titleError) setTitleError("");
                }}
                returnKeyType="next"
                autoCapitalize="sentences"
              />
              {titleError !== "" && (
                <Text style={styles.errorText}>{titleError}</Text>
              )}

              {/* Description */}
              <Text style={styles.fieldLabel}>What happened? (optional)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Describe this beautiful moment…"
                placeholderTextColor={COLORS.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="next"
                autoCapitalize="sentences"
              />

              {/* How Mama felt */}
              <Text style={styles.fieldLabel}>How did Mama feel? (optional)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Overwhelmed with love, grateful, tired but happy…"
                placeholderTextColor={COLORS.textTertiary}
                value={howMamaFelt}
                onChangeText={setHowMamaFelt}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                returnKeyType="done"
                autoCapitalize="sentences"
              />

              {/* Date note */}
              <Text style={styles.dateNote}>📅  Saving for today</Text>

              {/* Save button */}
              <Pressable
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save to Meadow 🌱</Text>
                )}
              </Pressable>

              <Pressable style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    paddingTop: 12,
    paddingBottom: 0,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  scrollView: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(44,26,14,0.15)",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 22,
    fontFamily: "Fraunces_700Bold",
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.2,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Karla_700Bold",
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  required: {
    color: COLORS.accent,
  },
  typePickerRow: {
    gap: 8,
    paddingBottom: 16,
    paddingRight: 8,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  typeChipSelected: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  typeChipEmoji: {
    fontSize: 16,
  },
  typeChipLabel: {
    fontSize: 13,
    fontFamily: "Karla_700Bold",
    color: COLORS.textSecondary,
  },
  typeChipLabelSelected: {
    color: COLORS.primary,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "rgba(44,26,14,0.10)",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "Karla_400Regular",
    color: COLORS.text,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 12,
  },
  inputError: {
    borderColor: COLORS.accent,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Karla_400Regular",
    color: COLORS.accent,
    marginBottom: 12,
  },
  dateNote: {
    fontSize: 13,
    fontFamily: "Karla_400Regular",
    color: COLORS.textTertiary,
    marginBottom: 20,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
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
