import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useBabies, Baby } from "@/contexts/BabiesContext";
import { usePremiumGate } from "@/hooks/usePremiumGate";

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: "" };
  if (typeof source === "string") return { uri: source };
  return source as ImageSourcePropType;
}

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

const CARD_GRADIENTS = [
  { from: "#FFD6E7", to: "#FFBCB5", emoji: "🌸" },
  { from: "#C8F7C5", to: "#A8E6CF", emoji: "🌿" },
  { from: "#E8D5FF", to: "#C9B8FF", emoji: "💜" },
  { from: "#FFF3B0", to: "#FFD166", emoji: "🌻" },
];

const MILESTONES = [
  "First smile",
  "First laugh",
  "Rolled over",
  "Sat up",
  "First tooth",
  "First words",
  "First steps",
];

const MONTH_PASTELS = ["#FFE4EF", "#E8F5E9", "#EDE7F6", "#FFF8E1"];
const TOTAL_MONTHS = 24;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requestMediaPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  console.log("[ImagePicker] Media library permission status:", status);
  return status === "granted";
}

async function pickImage(options?: Partial<ImagePicker.ImagePickerOptions>): Promise<string | null> {
  const granted = await requestMediaPermission();
  if (!granted) {
    Alert.alert("Permission needed", "Please allow access to your photo library in Settings.");
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    ...options,
  });
  console.log("[ImagePicker] Pick result canceled:", result.canceled);
  if (result.canceled) return null;
  return result.assets[0].uri;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function FadeInView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

// ─── Monthly Album Modal ───────────────────────────────────────────────────────

function MonthAlbumModal({
  visible,
  month,
  babyId,
  photos,
  onClose,
  onPhotosChanged,
}: {
  visible: boolean;
  month: number;
  babyId: string;
  photos: string[];
  onClose: () => void;
  onPhotosChanged: (month: number, photos: string[]) => void;
}) {
  const storageKey = `@mamameadow/monthly/${babyId}/month_${month}`;

  const handleAddPhoto = useCallback(async () => {
    console.log(`[MonthAlbum] Add photo pressed for baby: ${babyId}, month: ${month}`);
    const uri = await pickImage({ allowsEditing: false, aspect: undefined });
    if (!uri) return;
    const updated = [...photos, uri];
    await AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(() => {});
    console.log(`[MonthAlbum] Photo added for baby: ${babyId}, month: ${month}, total: ${updated.length}`);
    onPhotosChanged(month, updated);
  }, [photos, babyId, month, storageKey, onPhotosChanged]);

  const handleRemovePhoto = useCallback(async (index: number) => {
    console.log(`[MonthAlbum] Remove photo at index ${index} for baby: ${babyId}, month: ${month}`);
    const updated = photos.filter((_, i) => i !== index);
    await AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(() => {});
    onPhotosChanged(month, updated);
  }, [photos, babyId, month, storageKey, onPhotosChanged]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{
          backgroundColor: COLORS.background,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 16,
          paddingBottom: Platform.OS === "ios" ? 40 : 28,
          maxHeight: "85%",
        }}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 16 }} />

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontFamily: "Fraunces_700Bold", color: COLORS.text }}>
              Month {month}
            </Text>
            <Pressable
              onPress={handleAddPhoto}
              style={{
                backgroundColor: COLORS.primary,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
              }}
            >
              <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: "#fff" }}>+ Add Photo</Text>
            </Pressable>
          </View>

          {photos.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>📷</Text>
              <Text style={{ fontSize: 15, fontFamily: "Karla_400Regular", color: COLORS.textSecondary }}>
                No photos yet — tap Add Photo
              </Text>
            </View>
          ) : (
            <FlatList
              data={photos}
              keyExtractor={(_, i) => String(i)}
              numColumns={3}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
              renderItem={({ item, index }) => (
                <Pressable
                  onLongPress={() => {
                    console.log(`[MonthAlbum] Long press on photo index ${index} for baby: ${babyId}, month: ${month}`);
                    Alert.alert("Remove photo?", undefined, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Remove", style: "destructive", onPress: () => handleRemovePhoto(index) },
                    ]);
                  }}
                  style={{ flex: 1 / 3, aspectRatio: 1, margin: 3, borderRadius: 10, overflow: "hidden" }}
                >
                  <Image source={resolveImageSource(item)} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                </Pressable>
              )}
            />
          )}

          <Pressable
            onPress={onClose}
            style={{ marginHorizontal: 20, marginTop: 8, paddingVertical: 14, backgroundColor: COLORS.surfaceSecondary, borderRadius: 14, alignItems: "center" }}
          >
            <Text style={{ fontSize: 15, fontFamily: "Karla_400Regular", color: COLORS.textSecondary }}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Monthly Albums Section ────────────────────────────────────────────────────

function MonthlyAlbumsSection({ baby, isSubscribed }: { baby: Baby; isSubscribed: boolean }) {
  const router = useRouter();
  const [monthPhotos, setMonthPhotos] = useState<Record<number, string[]>>({});
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  useEffect(() => {
    console.log(`[MonthlyAlbums] Loading album data for baby: ${baby.id}`);
    const months = Array.from({ length: TOTAL_MONTHS }, (_, i) => i + 1);
    Promise.all(
      months.map((m) =>
        AsyncStorage.getItem(`@mamameadow/monthly/${baby.id}/month_${m}`).then((v) => ({ m, v }))
      )
    ).then((results) => {
      const result: Record<number, string[]> = {};
      results.forEach(({ m, v }) => {
        if (v) {
          try {
            const parsed = JSON.parse(v);
            if (Array.isArray(parsed)) result[m] = parsed;
          } catch {}
        }
      });
      setMonthPhotos(result);
    }).catch(() => {});
  }, [baby.id]);

  const handlePhotosChanged = useCallback((month: number, photos: string[]) => {
    setMonthPhotos((prev) => ({ ...prev, [month]: photos }));
  }, []);

  if (!isSubscribed) {
    return (
      <View style={{
        backgroundColor: COLORS.surface,
        marginHorizontal: 0,
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
      }}>
        <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 14 }}>
          Monthly Albums
        </Text>
        <View style={{
          backgroundColor: COLORS.surfaceSecondary,
          borderRadius: 16,
          padding: 20,
          alignItems: "center",
          borderWidth: 1,
          borderColor: COLORS.border,
        }}>
          <Text style={{ fontSize: 28, marginBottom: 10 }}>🔒</Text>
          <Text style={{ fontSize: 16, fontFamily: "Fraunces_700Bold", color: COLORS.text, marginBottom: 6, textAlign: "center" }}>
            Monthly Albums
          </Text>
          <Text style={{ fontSize: 13, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, textAlign: "center", marginBottom: 16, lineHeight: 19 }}>
            Capture your baby's journey month by month
          </Text>
          <Pressable
            onPress={() => {
              console.log("[MonthlyAlbums] Unlock Premium pressed — navigating to paywall");
              router.push("/paywall");
            }}
            style={{
              backgroundColor: COLORS.primary,
              paddingHorizontal: 24,
              paddingVertical: 11,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 14, fontFamily: "Karla_700Bold", color: "#fff" }}>Unlock Premium</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const openMonth = (month: number) => {
    console.log(`[MonthlyAlbums] Month card tapped: month ${month} for baby: ${baby.id}`);
    setSelectedMonth(month);
  };

  return (
    <View style={{
      backgroundColor: COLORS.surface,
      paddingTop: 20,
      paddingBottom: 4,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    }}>
      <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 14, paddingHorizontal: 20 }}>
        Monthly Albums
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 10 }}
      >
        {Array.from({ length: TOTAL_MONTHS }, (_, i) => i + 1).map((month) => {
          const photos = monthPhotos[month] ?? [];
          const hasPhotos = photos.length > 0;
          const bgColor = MONTH_PASTELS[(month - 1) % MONTH_PASTELS.length];
          const thumbUri = hasPhotos ? photos[0] : null;
          const photoCount = photos.length;

          return (
            <Pressable
              key={month}
              onPress={() => openMonth(month)}
              style={{
                width: 88,
                height: 108,
                borderRadius: 16,
                backgroundColor: bgColor,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(44,26,14,0.06)",
                justifyContent: "flex-end",
              }}
            >
              {thumbUri !== null ? (
                <Image
                  source={resolveImageSource(thumbUri)}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 24, color: "rgba(44,26,14,0.25)" }}>+</Text>
                </View>
              )}
              {/* Bottom label */}
              <View style={{
                backgroundColor: "rgba(255,255,255,0.85)",
                paddingVertical: 5,
                paddingHorizontal: 6,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <Text style={{ fontSize: 11, fontFamily: "Karla_700Bold", color: COLORS.text }}>
                  Month {month}
                </Text>
                {hasPhotos && (
                  <View style={{
                    backgroundColor: COLORS.primary,
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 3,
                  }}>
                    <Text style={{ fontSize: 9, fontFamily: "Karla_700Bold", color: "#fff" }}>{photoCount}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedMonth !== null && (
        <MonthAlbumModal
          visible={selectedMonth !== null}
          month={selectedMonth}
          babyId={baby.id}
          photos={monthPhotos[selectedMonth] ?? []}
          onClose={() => setSelectedMonth(null)}
          onPhotosChanged={handlePhotosChanged}
        />
      )}
    </View>
  );
}

// ─── BabyCard ─────────────────────────────────────────────────────────────────

function BabyCard({ baby, index }: { baby: Baby; index: number }) {
  const { isSubscribed } = usePremiumGate();
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const [milestones, setMilestones] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [milestonePhotos, setMilestonePhotos] = useState<Record<string, string>>({});

  // Edit modal state
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState(baby.name);
  const [editDob, setEditDob] = useState(baby.dob);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const editDateValue = editDob ? new Date(editDob) : new Date();

  const { updateBaby, removeBaby } = useBabies();

  const milestonesKey = `@mamameadow/milestones/${baby.id}`;
  const notesKey = `@mamameadow/notes/${baby.id}`;
  const photoKey = `@mamameadow/baby_photo/${baby.id}`;

  useEffect(() => {
    console.log(`[BabyDetails] Loading data for baby: ${baby.id}`);
    const milestonePhotoPromises = MILESTONES.map((m) =>
      AsyncStorage.getItem(`@mamameadow/milestone_photo/${baby.id}/${m}`).then((v) => ({ m, v }))
    );
    Promise.all([
      AsyncStorage.getItem(milestonesKey),
      AsyncStorage.getItem(notesKey),
      AsyncStorage.getItem(photoKey),
      Promise.all(milestonePhotoPromises),
    ]).then(([mRaw, nRaw, pRaw, mpResults]) => {
      if (mRaw) {
        try {
          const parsed = JSON.parse(mRaw);
          setMilestones(Array.isArray(parsed) ? parsed : []);
        } catch {
          setMilestones([]);
        }
      }
      if (nRaw) setNotes(nRaw);
      if (pRaw) setPhotoUri(pRaw);
      const mpMap: Record<string, string> = {};
      mpResults.forEach(({ m, v }) => {
        if (v) mpMap[m] = v;
      });
      setMilestonePhotos(mpMap);
    }).catch(() => {
      setMilestones([]);
    });
  }, [baby.id]);

  const handlePickProfilePhoto = useCallback(async () => {
    console.log(`[BabyDetails] Profile photo tapped for baby: ${baby.id}`);
    const uri = await pickImage({ allowsEditing: true, aspect: [1, 1] });
    if (!uri) return;
    await AsyncStorage.setItem(photoKey, uri).catch(() => {});
    console.log(`[BabyDetails] Profile photo saved for baby: ${baby.id}`);
    setPhotoUri(uri);
  }, [baby.id, photoKey]);

  const handlePickMilestonePhoto = useCallback(async (milestone: string) => {
    console.log(`[BabyDetails] Milestone photo tapped: "${milestone}" for baby: ${baby.id}`);
    const uri = await pickImage({ allowsEditing: true, aspect: [1, 1] });
    if (!uri) return;
    const key = `@mamameadow/milestone_photo/${baby.id}/${milestone}`;
    await AsyncStorage.setItem(key, uri).catch(() => {});
    console.log(`[BabyDetails] Milestone photo saved: "${milestone}" for baby: ${baby.id}`);
    setMilestonePhotos((prev) => ({ ...prev, [milestone]: uri }));
  }, [baby.id]);

  const toggleMilestone = useCallback(async (milestone: string) => {
    console.log(`[BabyDetails] Toggle milestone: ${milestone} for baby: ${baby.id}`);
    const updated = milestones.includes(milestone)
      ? milestones.filter((m) => m !== milestone)
      : [...milestones, milestone];
    setMilestones(updated);
    await AsyncStorage.setItem(milestonesKey, JSON.stringify(updated)).catch(() => {});
  }, [milestones, baby.id]);

  const saveNotes = useCallback(async () => {
    console.log(`[BabyDetails] Saving notes for baby: ${baby.id}`);
    await AsyncStorage.setItem(notesKey, notes).catch(() => {});
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }, [notes, baby.id]);

  const openEdit = useCallback(() => {
    console.log(`[BabyDetails] Edit button pressed for baby: ${baby.id} (${baby.name})`);
    setEditName(baby.name);
    setEditDob(baby.dob);
    setShowDatePicker(false);
    setEditVisible(true);
  }, [baby.id, baby.name, baby.dob]);

  const handleSaveEdit = useCallback(() => {
    const trimmedName = editName.trim();
    if (!trimmedName) return;
    console.log(`[BabyDetails] Save edit pressed for baby: ${baby.id}`, { name: trimmedName, dob: editDob });
    updateBaby(baby.id, trimmedName, editDob);
    setEditVisible(false);
  }, [baby.id, editName, editDob, updateBaby]);

  const handleDelete = useCallback(() => {
    console.log(`[BabyDetails] Delete button pressed for baby: ${baby.id} (${baby.name})`);
    Alert.alert(
      `Remove ${baby.name}?`,
      "This will also remove all their logs and milestones. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel", onPress: () => console.log(`[BabyDetails] Delete cancelled for baby: ${baby.id}`) },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            console.log(`[BabyDetails] Confirmed delete for baby: ${baby.id}`);
            await Promise.all([
              AsyncStorage.removeItem(milestonesKey).catch(() => {}),
              AsyncStorage.removeItem(notesKey).catch(() => {}),
              AsyncStorage.removeItem(photoKey).catch(() => {}),
            ]);
            removeBaby(baby.id);
          },
        },
      ]
    );
  }, [baby.id, baby.name, milestonesKey, notesKey, photoKey, removeBaby]);

  const handleDateChange = useCallback((_event: unknown, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selected) {
      const iso = selected.toISOString().split("T")[0];
      console.log(`[BabyDetails] DOB picker changed for baby: ${baby.id}`, { dob: iso });
      setEditDob(iso);
    }
  }, [baby.id]);

  const dobDisplay = baby.dob ? `Born ${baby.dob}` : "No date of birth";

  return (
    <FadeInView delay={index * 100}>
      <View style={{
        borderRadius: 20,
        marginBottom: 24,
        overflow: "hidden",
        shadowColor: "#2C1A0E",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}>
        {/* Card Header */}
        <View style={{
          backgroundColor: gradient.from,
          paddingHorizontal: 20,
          paddingVertical: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}>
          {/* Tappable photo circle */}
          <Pressable
            onPress={handlePickProfilePhoto}
            style={{ position: "relative" }}
          >
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "rgba(255,255,255,0.5)",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: "#fff",
              overflow: "hidden",
            }}>
              {photoUri !== null ? (
                <Image
                  source={resolveImageSource(photoUri)}
                  style={{ width: 64, height: 64, borderRadius: 32 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ fontSize: 28 }}>{gradient.emoji}</Text>
              )}
            </View>
            {/* Camera overlay badge */}
            <View style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: COLORS.primary,
              borderWidth: 2,
              borderColor: "#fff",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <Text style={{ fontSize: 10 }}>📷</Text>
            </View>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontFamily: "Fraunces_700Bold", color: COLORS.text, letterSpacing: -0.2 }}>
              {baby.name}
            </Text>
            <Text style={{ fontSize: 13, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, marginTop: 2 }}>
              {dobDisplay}
            </Text>
          </View>
          {/* Edit / Delete buttons */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={openEdit}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.5)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16 }}>✏️</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.5)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </Pressable>
          </View>
        </View>

        {/* Milestones */}
        <View style={{ backgroundColor: COLORS.surface, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 }}>
          <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>
            Milestones
          </Text>
          {MILESTONES.map((milestone) => {
            const checked = milestones.includes(milestone);
            const mPhoto = milestonePhotos[milestone] ?? null;

            return (
              <AnimatedPressable key={milestone} onPress={() => toggleMilestone(milestone)} scaleValue={0.98}>
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  gap: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.border,
                }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: checked ? COLORS.primary : COLORS.border,
                    backgroundColor: checked ? COLORS.primary : "transparent",
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                    {checked && <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>✓</Text>}
                  </View>
                  <Text style={{
                    fontSize: 15,
                    fontFamily: "Karla_400Regular",
                    color: checked ? COLORS.primary : COLORS.text,
                    textDecorationLine: checked ? "line-through" : "none",
                    flex: 1,
                  }}>
                    {milestone}
                  </Text>
                  {checked && <Text style={{ fontSize: 12 }}>🎉</Text>}

                  {/* Premium: milestone photo thumbnail + camera button */}
                  {isSubscribed && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      {mPhoto !== null && (
                        <Image
                          source={resolveImageSource(mPhoto)}
                          style={{ width: 28, height: 28, borderRadius: 6 }}
                          resizeMode="cover"
                        />
                      )}
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handlePickMilestonePhoto(milestone);
                        }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          backgroundColor: COLORS.surfaceSecondary,
                          borderWidth: 1,
                          borderColor: COLORS.border,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontSize: 13 }}>📷</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </AnimatedPressable>
            );
          })}
        </View>

        {/* Monthly Albums */}
        <MonthlyAlbumsSection baby={baby} isSubscribed={isSubscribed} />

        {/* Notes */}
        <View style={{ backgroundColor: COLORS.surface, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
          <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>
            Notes
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            onBlur={saveNotes}
            placeholder="Add notes about your baby…"
            placeholderTextColor={COLORS.textTertiary}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: COLORS.surfaceSecondary,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              fontFamily: "Karla_400Regular",
              color: COLORS.text,
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />
          {notesSaved && (
            <Text style={{ fontSize: 12, color: COLORS.primary, fontFamily: "Karla_400Regular", marginTop: 6 }}>
              ✓ Notes saved
            </Text>
          )}
        </View>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
          onPress={() => setEditVisible(false)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
        >
          <View style={{
            backgroundColor: COLORS.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingBottom: Platform.OS === "ios" ? 40 : 28,
            paddingTop: 16,
          }}>
            {/* Drag handle */}
            <View style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: COLORS.border,
              alignSelf: "center",
              marginBottom: 20,
            }} />

            <Text style={{
              fontSize: 20,
              fontFamily: "Fraunces_700Bold",
              color: COLORS.text,
              letterSpacing: -0.2,
              marginBottom: 24,
            }}>
              Edit Baby Details
            </Text>

            {/* Name field */}
            <Text style={{
              fontSize: 12,
              fontFamily: "Karla_700Bold",
              color: COLORS.textTertiary,
              textTransform: "uppercase",
              letterSpacing: 0.7,
              marginBottom: 8,
            }}>
              Name
            </Text>
            <TextInput
              value={editName}
              onChangeText={(v) => {
                console.log(`[BabyDetails] Edit name changed for baby: ${baby.id}`, { name: v });
                setEditName(v);
              }}
              placeholder="Baby's name"
              placeholderTextColor={COLORS.textTertiary}
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                fontFamily: "Karla_400Regular",
                color: COLORS.text,
                marginBottom: 20,
              }}
            />

            {/* DOB field */}
            <Text style={{
              fontSize: 12,
              fontFamily: "Karla_700Bold",
              color: COLORS.textTertiary,
              textTransform: "uppercase",
              letterSpacing: 0.7,
              marginBottom: 8,
            }}>
              Date of Birth
            </Text>

            {Platform.OS === "ios" ? (
              <View style={{
                backgroundColor: COLORS.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: 20,
                overflow: "hidden",
              }}>
                <DateTimePicker
                  value={editDateValue}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  style={{ height: 120 }}
                />
              </View>
            ) : (
              <>
                <Pressable
                  onPress={() => {
                    console.log(`[BabyDetails] DOB picker opened for baby: ${baby.id}`);
                    setShowDatePicker(true);
                  }}
                  style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    marginBottom: 20,
                  }}
                >
                  <Text style={{ fontSize: 15, fontFamily: "Karla_400Regular", color: editDob ? COLORS.text : COLORS.textTertiary }}>
                    {editDob || "YYYY-MM-DD"}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={editDateValue}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </>
            )}

            {/* Buttons */}
            <Pressable
              onPress={handleSaveEdit}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 16, fontFamily: "Karla_700Bold", color: "#fff" }}>
                Save Changes
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                console.log(`[BabyDetails] Edit modal cancelled for baby: ${baby.id}`);
                setEditVisible(false);
              }}
              style={{
                backgroundColor: COLORS.surfaceSecondary,
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontFamily: "Karla_400Regular", color: COLORS.textSecondary }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </FadeInView>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BabyDetailsScreen() {
  const { babies } = useBabies();
  const { loading } = usePremiumGate();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAF7F2" }}>
        <ActivityIndicator size="large" color="#4A7C59" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {babies.length === 0 ? (
            <FadeInView delay={0}>
              <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 24,
                  backgroundColor: COLORS.primaryMuted,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                }}>
                  <Text style={{ fontSize: 40 }}>🌱</Text>
                </View>
                <Text style={{ fontSize: 20, fontFamily: "Fraunces_700Bold", color: COLORS.text, textAlign: "center", marginBottom: 10 }}>
                  No babies added yet
                </Text>
                <Text style={{ fontSize: 15, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, textAlign: "center", lineHeight: 22 }}>
                  Add your first baby from the home screen to start tracking milestones and notes.
                </Text>
              </View>
            </FadeInView>
          ) : (
            <>
              <FadeInView delay={0}>
                <Text style={{ fontSize: 22, fontFamily: "Fraunces_700Bold", color: COLORS.text, letterSpacing: -0.3, marginBottom: 4 }}>
                  Baby Details
                </Text>
                <Text style={{ fontSize: 14, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, marginBottom: 24 }}>
                  Track milestones and notes for each baby
                </Text>
              </FadeInView>
              {babies.map((baby, index) => (
                <BabyCard key={baby.id} baby={baby} index={index} />
              ))}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
