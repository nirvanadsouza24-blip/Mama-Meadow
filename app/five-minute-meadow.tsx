import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useBabies } from "@/contexts/BabiesContext";
import { supabase } from "@/app/integrations/supabase/client";

const { width: SW, height: SH } = Dimensions.get("window");

const SOUND_KEY = "meadow_last_sound";

const MOODS = [
  { label: "I'm overwhelmed", emoji: "🌧️" },
  { label: "I'm exhausted", emoji: "😴" },
  { label: "My mind won't switch off", emoji: "🧠" },
  { label: "I'm frustrated", emoji: "😤" },
  { label: "I'm feeling low", emoji: "😔" },
  { label: "I need comfort", emoji: "❤️" },
  { label: "I want to wind down", emoji: "🌙" },
  { label: "I just need some peace", emoji: "🌸" },
  { label: "SIT WITH ME", emoji: "🤍" },
];

const SOUNDS = [
  { label: "Gentle Rain", emoji: "🌧️" },
  { label: "Ocean Waves", emoji: "🌊" },
  { label: "Forest & Birds", emoji: "🌲" },
  { label: "Soft Fireplace", emoji: "🔥" },
  { label: "Night Meadow", emoji: "🌙" },
  { label: "Morning Birds", emoji: "🐦" },
  { label: "Gentle Stream", emoji: "💧" },
  { label: "Soft Instrumental", emoji: "🎵" },
  { label: "Silence", emoji: "🤍" },
];

const FEELINGS = [
  { label: "A little lighter", emoji: "😊" },
  { label: "Calmer", emoji: "😌" },
  { label: "Comforted", emoji: "❤️" },
  { label: "Sleepy", emoji: "😴" },
  { label: "About the same", emoji: "🌿" },
  { label: "I just needed the pause", emoji: "🤍" },
];

const PHASE_MESSAGES: Record<number, string[]> = {
  1: [
    "Put everything down for a moment, Mama.",
    "You don't have to solve anything right now.",
    "Just be here.",
    "Notice the meadow around you.",
    "Feel your breath.",
  ],
  2: [
    "Breathe in slowly... 2... 3... 4...",
    "Hold gently... 2... 3...",
    "Breathe out... 2... 3... 4... 5...",
    "Again. In... slowly...",
    "Let your shoulders soften.",
    "There's nowhere else to be.",
  ],
  3: [
    "Whatever you're carrying right now...",
    "You don't have to carry it perfectly.",
    "Let the meadow hold it for a moment.",
    "You are doing so much, Mama.",
    "It's okay to rest.",
  ],
  4: [
    "Take one last slow breath.",
    "You don't have to do everything today.",
    "You showed up.",
    "And that's enough.",
    "🌸",
  ],
};

function getTimeOfDayGradient(): readonly [string, string, string, string] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return ["#FFE4CC", "#FFF0E6", "#E8F5E9", "#C8E6C9"] as const;
  } else if (hour >= 11 && hour < 17) {
    return ["#87CEEB", "#B0E0E6", "#E8F5E9", "#A8D5A2"] as const;
  } else if (hour >= 17 && hour < 21) {
    return ["#FFB347", "#FFD700", "#FFF8DC", "#90EE90"] as const;
  } else {
    return ["#1a1a2e", "#16213e", "#1B4332", "#0D2818"] as const;
  }
}

// ─── Animated floating element ───────────────────────────────────────────────
function FloatingElement({
  emoji,
  style,
  delay,
  duration,
  range,
  horizontal,
}: {
  emoji: string;
  style: object;
  delay: number;
  duration: number;
  range: number;
  horizontal?: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: duration / 2,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: -1,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const transform = horizontal
    ? [{ translateX: anim.interpolate({ inputRange: [-1, 1], outputRange: [-range, range] }) }]
    : [{ translateY: anim.interpolate({ inputRange: [-1, 1], outputRange: [-range, range] }) }];

  return (
    <Animated.Text style={[styles.floatingEmoji, style, { transform }]}>
      {emoji}
    </Animated.Text>
  );
}

// ─── Drifting cloud ───────────────────────────────────────────────────────────
function DriftingCloud({ top, delay, size }: { top: number; delay: number; size: number }) {
  const x = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    const drift = () => {
      x.setValue(-80);
      Animated.timing(x, {
        toValue: SW + 80,
        duration: 28000 + delay * 4000,
        delay,
        useNativeDriver: true,
      }).start(() => drift());
    };
    drift();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.cloud,
        { top, fontSize: size, transform: [{ translateX: x }] },
      ]}
    >
      ☁️
    </Animated.Text>
  );
}

// ─── Floating pollen seed ─────────────────────────────────────────────────────
function PollenSeed({ left, delay }: { left: number; delay: number }) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rise = () => {
      y.setValue(0);
      opacity.setValue(0);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 600, delay, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(y, { toValue: -SH * 0.4, duration: 8000, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(5000),
            Animated.timing(opacity, { toValue: 0, duration: 3000, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => rise());
    };
    rise();
  }, []);

  return (
    <Animated.Text
      style={[styles.pollen, { left, bottom: 80, opacity, transform: [{ translateY: y }] }]}
    >
      ✨
    </Animated.Text>
  );
}

// ─── Butterfly (appears at 4:00) ──────────────────────────────────────────────
function Butterfly({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(SW * 0.2)).current;
  const y = useRef(new Animated.Value(SH * 0.4)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.timing(opacity, { toValue: 1, duration: 2000, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: SW * 0.7, duration: 6000, useNativeDriver: true }),
        Animated.timing(x, { toValue: SW * 0.3, duration: 6000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: SH * 0.3, duration: 4000, useNativeDriver: true }),
        Animated.timing(y, { toValue: SH * 0.5, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, [visible]);

  return (
    <Animated.Text
      style={[styles.butterfly, { opacity, transform: [{ translateX: x }, { translateY: y }] }]}
    >
      🦋
    </Animated.Text>
  );
}

// ─── Meadow background ────────────────────────────────────────────────────────
function MeadowBackground({
  gradient,
  cloudOverlayOpacity,
  goldenOverlayOpacity,
  showButterfly,
}: {
  gradient: readonly [string, string, string, string];
  cloudOverlayOpacity: Animated.Value;
  goldenOverlayOpacity: Animated.Value;
  showButterfly: boolean;
}) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />

      {/* Clouds */}
      <DriftingCloud top={SH * 0.06} delay={0} size={36} />
      <DriftingCloud top={SH * 0.12} delay={8000} size={28} />
      <DriftingCloud top={SH * 0.04} delay={15000} size={22} />

      {/* Pollen */}
      <PollenSeed left={SW * 0.15} delay={0} />
      <PollenSeed left={SW * 0.45} delay={3000} />
      <PollenSeed left={SW * 0.72} delay={6000} />
      <PollenSeed left={SW * 0.3} delay={9000} />

      {/* Grass blades */}
      <FloatingElement emoji="🌿" style={[styles.grass, { left: SW * 0.05, bottom: 20 }]} delay={0} duration={3200} range={5} />
      <FloatingElement emoji="🌿" style={[styles.grass, { left: SW * 0.15, bottom: 14 }]} delay={400} duration={3800} range={6} />
      <FloatingElement emoji="🌿" style={[styles.grass, { left: SW * 0.28, bottom: 22 }]} delay={200} duration={2900} range={4} />
      <FloatingElement emoji="🌿" style={[styles.grass, { left: SW * 0.55, bottom: 18 }]} delay={600} duration={3500} range={5} />
      <FloatingElement emoji="🌿" style={[styles.grass, { left: SW * 0.68, bottom: 12 }]} delay={100} duration={4000} range={7} />
      <FloatingElement emoji="🌿" style={[styles.grass, { left: SW * 0.82, bottom: 20 }]} delay={800} duration={3100} range={5} />
      <FloatingElement emoji="🌿" style={[styles.grass, { left: SW * 0.92, bottom: 16 }]} delay={300} duration={3600} range={6} />

      {/* Wildflowers */}
      <FloatingElement emoji="🌸" style={[styles.flower, { left: SW * 0.1, bottom: 50 }]} delay={500} duration={4200} range={4} />
      <FloatingElement emoji="🌼" style={[styles.flower, { left: SW * 0.38, bottom: 44 }]} delay={1200} duration={3900} range={5} />
      <FloatingElement emoji="🌻" style={[styles.flower, { left: SW * 0.62, bottom: 52 }]} delay={700} duration={4500} range={3} />
      <FloatingElement emoji="🌸" style={[styles.flower, { left: SW * 0.82, bottom: 46 }]} delay={300} duration={3700} range={4} />
      <FloatingElement emoji="🌼" style={[styles.flower, { left: SW * 0.25, bottom: 58 }]} delay={900} duration={4100} range={5} />

      {/* Butterfly */}
      <Butterfly visible={showButterfly} />

      {/* Cloud overlay (clears during meditation) */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(200,210,220,1)", opacity: cloudOverlayOpacity }]}
        pointerEvents="none"
      />

      {/* Golden overlay (warms during meditation) */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,200,80,1)", opacity: goldenOverlayOpacity }]}
        pointerEvents="none"
      />
    </View>
  );
}

// ─── Guided text overlay ──────────────────────────────────────────────────────
function GuidedTextOverlay({ text }: { text: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const prevText = useRef(text);

  useEffect(() => {
    if (text !== prevText.current) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]).start();
      prevText.current = text;
    } else {
      Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    }
  }, [text]);

  return (
    <Animated.View style={[styles.guidedTextContainer, { opacity }]}>
      <Text style={styles.guidedText}>{text}</Text>
    </Animated.View>
  );
}

// ─── Mood selector (Phase 0) ──────────────────────────────────────────────────
function MoodSelector({
  selectedMood,
  selectedSound,
  onSelectMood,
  onSelectSound,
  onBegin,
  insets,
}: {
  selectedMood: string;
  selectedSound: string;
  onSelectMood: (m: string) => void;
  onSelectSound: (s: string) => void;
  onBegin: () => void;
  insets: { top: number; bottom: number };
}) {
  return (
    <ScrollView
      style={styles.moodScrollView}
      contentContainerStyle={[
        styles.moodScrollContent,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.moodCard}>
        <Text style={styles.moodTitle}>What do you need right now, Mama?</Text>

        <View style={styles.pillRow}>
          {MOODS.map((m) => {
            const isSelected = selectedMood === m.label;
            return (
              <Pressable
                key={m.label}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => {
                  console.log("[FiveMinuteMeadow] Mood selected", { mood: m.label });
                  onSelectMood(m.label);
                }}
              >
                <Text style={styles.pillEmoji}>{m.emoji}</Text>
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.soundTitle}>Choose your sound</Text>

        <View style={styles.pillRow}>
          {SOUNDS.map((s) => {
            const isSelected = selectedSound === s.label;
            return (
              <Pressable
                key={s.label}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => {
                  console.log("[FiveMinuteMeadow] Sound selected", { sound: s.label });
                  onSelectSound(s.label);
                }}
              >
                <Text style={styles.pillEmoji}>{s.emoji}</Text>
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.audioComingSoon}>🎵 Audio coming soon</Text>

        <Pressable
          style={[
            styles.beginButton,
            !selectedMood && styles.beginButtonDisabled,
          ]}
          onPress={() => {
            if (!selectedMood) return;
            console.log("[FiveMinuteMeadow] Begin button pressed", {
              mood: selectedMood,
              sound: selectedSound,
            });
            onBegin();
          }}
        >
          <Text style={styles.beginButtonText}>Begin 🌿</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ─── Meditation controls (Phases 1–4) ────────────────────────────────────────
function MeadowControls({
  isPaused,
  onPause,
  onExit,
  progress,
  soundLabel,
  insets,
}: {
  isPaused: boolean;
  onPause: () => void;
  onExit: () => void;
  progress: Animated.Value;
  soundLabel: string;
  insets: { bottom: number };
}) {
  const progressWidth = progress.interpolate({
    inputRange: [0, 300],
    outputRange: [0, SW - 40],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.soundLabel}>{soundLabel}</Text>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* Buttons */}
      <View style={styles.controlButtons}>
        <Pressable
          style={styles.controlBtn}
          onPress={() => {
            console.log("[FiveMinuteMeadow] Pause/resume button pressed", { isPaused });
            onPause();
          }}
        >
          <Text style={styles.controlBtnText}>{isPaused ? "▶" : "⏸"}</Text>
        </Pressable>

        <Pressable
          style={styles.controlBtn}
          onPress={() => {
            console.log("[FiveMinuteMeadow] Exit button pressed");
            onExit();
          }}
        >
          <Text style={styles.controlBtnText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── After screen (Phase 5) ───────────────────────────────────────────────────
function AfterScreen({
  selectedMood,
  selectedFeeling,
  onSelectFeeling,
  onSave,
  onSkip,
  saving,
  saved,
  insets,
}: {
  selectedMood: string;
  selectedFeeling: string;
  onSelectFeeling: (f: string) => void;
  onSave: () => void;
  onSkip: () => void;
  saving: boolean;
  saved: boolean;
  insets: { top: number; bottom: number };
}) {
  return (
    <ScrollView
      style={styles.moodScrollView}
      contentContainerStyle={[
        styles.moodScrollContent,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.moodCard}>
        <Text style={styles.afterTitle}>How do you feel now, Mama?</Text>

        <View style={styles.pillRow}>
          {FEELINGS.map((f) => {
            const isSelected = selectedFeeling === f.label;
            return (
              <Pressable
                key={f.label}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => {
                  console.log("[FiveMinuteMeadow] Feeling selected", { feeling: f.label });
                  onSelectFeeling(f.label);
                }}
              >
                <Text style={styles.pillEmoji}>{f.emoji}</Text>
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!saved ? (
          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={() => {
              console.log("[FiveMinuteMeadow] Save moment button pressed", { mood: selectedMood, feeling: selectedFeeling });
              onSave();
            }}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "🌸 Save this moment to my Meadow"}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.savedConfirm}>
            <Text style={styles.savedConfirmText}>🌿 Saved to your Meadow</Text>
          </View>
        )}

        <Pressable
          style={styles.returnButton}
          onPress={() => {
            console.log("[FiveMinuteMeadow] Return to Meadow button pressed");
            onSkip();
          }}
        >
          <Text style={styles.returnButtonText}>Return to Meadow</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function FiveMinuteMeadow() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const { babies } = useBabies();

  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedSound, setSelectedSound] = useState("Morning Birds");
  const [selectedFeeling, setSelectedFeeling] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [showButterfly, setShowButterfly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [soundVisible] = useState(true);

  const gradient = getTimeOfDayGradient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cloudOverlay = useRef(new Animated.Value(0.3)).current;
  const goldenOverlay = useRef(new Animated.Value(0)).current;

  // Load persisted sound
  useEffect(() => {
    AsyncStorage.getItem(SOUND_KEY).then((val) => {
      if (val) setSelectedSound(val);
    }).catch(() => {});
  }, []);

  // Subscription gate
  useEffect(() => {
    if (subLoading) return;
    if (!isSubscribed) {
      console.log("[FiveMinuteMeadow] User not subscribed — redirecting to paywall");
      router.replace("/paywall");
    }
  }, [isSubscribed, subLoading]);

  // Timer
  useEffect(() => {
    if (phase < 1 || phase > 4) return;

    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= 300) {
            clearInterval(intervalRef.current!);
            setPhase(5);
            console.log("[FiveMinuteMeadow] Meditation complete — entering after phase");
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, isPaused]);

  // Phase transitions
  useEffect(() => {
    if (elapsedSeconds >= 0 && elapsedSeconds < 60 && phase !== 1) {
      setPhase(1);
      setTextIndex(0);
    } else if (elapsedSeconds >= 60 && elapsedSeconds < 150 && phase !== 2) {
      setPhase(2);
      setTextIndex(0);
      console.log("[FiveMinuteMeadow] Phase transition: BREATHE");
    } else if (elapsedSeconds >= 150 && elapsedSeconds < 240 && phase !== 3) {
      setPhase(3);
      setTextIndex(0);
      console.log("[FiveMinuteMeadow] Phase transition: RELEASE");
    } else if (elapsedSeconds >= 240 && elapsedSeconds < 300 && phase !== 4) {
      setPhase(4);
      setTextIndex(0);
      console.log("[FiveMinuteMeadow] Phase transition: RETURN");
    }

    // Butterfly at 4:00
    if (elapsedSeconds >= 240 && !showButterfly) {
      setShowButterfly(true);
      console.log("[FiveMinuteMeadow] Butterfly appeared");
    }

    // Atmosphere animations
    const t = elapsedSeconds / 300;
    Animated.timing(cloudOverlay, {
      toValue: 0.3 * (1 - t),
      duration: 1000,
      useNativeDriver: false,
    }).start();
    Animated.timing(goldenOverlay, {
      toValue: 0.15 * t,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Progress
    Animated.timing(progressAnim, {
      toValue: elapsedSeconds,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [elapsedSeconds]);

  // Guided text cycling
  useEffect(() => {
    if (phase < 1 || phase > 4) return;
    if (textIntervalRef.current) clearInterval(textIntervalRef.current);
    textIntervalRef.current = setInterval(() => {
      setTextIndex((prev) => {
        const msgs = PHASE_MESSAGES[phase] ?? [];
        return (prev + 1) % msgs.length;
      });
    }, 15000);
    return () => {
      if (textIntervalRef.current) clearInterval(textIntervalRef.current);
    };
  }, [phase]);

  const handleSelectMood = useCallback((mood: string) => {
    setSelectedMood(mood);
  }, []);

  const handleBegin = useCallback(() => {
    AsyncStorage.setItem(SOUND_KEY, selectedSound).catch(() => {});
    setElapsedSeconds(0);
    setPhase(1);
    setTextIndex(0);
    setShowButterfly(false);
    cloudOverlay.setValue(0.3);
    goldenOverlay.setValue(0);
    progressAnim.setValue(0);
    console.log("[FiveMinuteMeadow] Meditation started", { mood: selectedMood, sound: selectedSound });
  }, [selectedMood, selectedSound]);

  const handlePauseResume = useCallback(() => {
    const newPaused = !isPaused;
    console.log("[FiveMinuteMeadow] Pause/resume toggled", { newPaused });
    setIsPaused(newPaused);
  }, [isPaused]);

  const handleExit = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (textIntervalRef.current) clearInterval(textIntervalRef.current);
    console.log("[FiveMinuteMeadow] Exiting meditation early", { elapsedSeconds });
    router.back();
  }, [elapsedSeconds]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const babyId = babies[0]?.id ?? null;
    const description = `5-Minute Meadow — ${selectedMood} — ${selectedFeeling}`;
    console.log("[FiveMinuteMeadow] Saving moment to Supabase", { babyId, mood: selectedMood, feeling: selectedFeeling });
    try {
      const { error } = await (supabase as any).from("meadow_events").insert({
        event_type: "memory",
        title: "A moment of peace 🌿",
        description,
        feeling: selectedFeeling,
        event_date: new Date().toISOString(),
        emoji: "🌸",
        is_premium: true,
        baby_id: babyId,
      });
      if (error) {
        console.error("[FiveMinuteMeadow] Error saving moment", error);
      } else {
        console.log("[FiveMinuteMeadow] Moment saved successfully");
        setSaved(true);
      }
    } catch (err) {
      console.error("[FiveMinuteMeadow] Unexpected error saving moment", err);
    } finally {
      setSaving(false);
    }
  }, [babies, selectedMood, selectedFeeling]);

  const handleReturn = useCallback(() => {
    router.back();
  }, []);

  const handleSelectSound = useCallback((soundName: string) => {
    console.log("[FiveMinuteMeadow] Sound preference saved", { soundName });
    setSelectedSound(soundName);
    AsyncStorage.setItem(SOUND_KEY, soundName).catch(() => {});
  }, []);

  const isSitWithMe = selectedMood === "SIT WITH ME";
  const currentMessages = PHASE_MESSAGES[phase as 1 | 2 | 3 | 4] ?? [];
  const currentText = currentMessages[textIndex] ?? "";
  const soundEmoji = SOUNDS.find((s) => s.label === selectedSound)?.emoji ?? "🎵";
  const soundLabelDisplay = soundVisible ? `${soundEmoji} ${selectedSound}` : "";

  if (subLoading) return null;

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      <MeadowBackground
        gradient={gradient}
        cloudOverlayOpacity={cloudOverlay}
        goldenOverlayOpacity={goldenOverlay}
        showButterfly={showButterfly}
      />

      {/* Phase 0: Mood selection */}
      {phase === 0 && (
        <MoodSelector
          selectedMood={selectedMood}
          selectedSound={selectedSound}
          onSelectMood={handleSelectMood}
          onSelectSound={handleSelectSound}
          onBegin={handleBegin}
          insets={insets}
        />
      )}

      {/* Phases 1–4: Meditation */}
      {phase >= 1 && phase <= 4 && (
        <>
          {!isSitWithMe && (
            <GuidedTextOverlay text={currentText} />
          )}

          <MeadowControls
            isPaused={isPaused}
            onPause={handlePauseResume}
            onExit={handleExit}
            progress={progressAnim}
            soundLabel={soundLabelDisplay}
            insets={insets}
          />
        </>
      )}

      {/* Phase 5: After */}
      {phase === 5 && (
        <AfterScreen
          selectedMood={selectedMood}
          selectedFeeling={selectedFeeling}
          onSelectFeeling={setSelectedFeeling}
          onSave={handleSave}
          onSkip={handleReturn}
          saving={saving}
          saved={saved}
          insets={insets}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#4A7C59",
  },

  // Floating elements
  floatingEmoji: {
    position: "absolute",
    fontSize: 22,
  },
  grass: {
    fontSize: 26,
  },
  flower: {
    fontSize: 20,
  },
  cloud: {
    position: "absolute",
    opacity: 0.7,
  },
  pollen: {
    position: "absolute",
    fontSize: 12,
    opacity: 0.6,
  },
  butterfly: {
    position: "absolute",
    fontSize: 28,
    top: 0,
    left: 0,
  },

  // Guided text
  guidedTextContainer: {
    position: "absolute",
    top: "18%",
    left: 32,
    right: 32,
    alignItems: "center",
  },
  guidedText: {
    fontSize: 20,
    fontFamily: "Karla_400Regular",
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    lineHeight: 30,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

  // Controls
  controlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  soundLabel: {
    fontSize: 12,
    fontFamily: "Karla_400Regular",
    color: "rgba(255,255,255,0.6)",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  progressTrack: {
    width: SW - 40,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 1,
  },
  controlButtons: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 8,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlBtnText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
  },

  // Mood selector
  moodScrollView: {
    flex: 1,
  },
  moodScrollContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  moodCard: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  moodTitle: {
    fontSize: 20,
    fontFamily: "Karla_700Bold",
    color: "#2C1A0E",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 28,
  },
  soundTitle: {
    fontSize: 15,
    fontFamily: "Karla_700Bold",
    color: "#4A7C59",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  audioComingSoon: {
    fontSize: 12,
    fontFamily: "Karla_400Regular",
    color: "#4A7C59",
    opacity: 0.5,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "rgba(74,124,89,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(74,124,89,0.2)",
  },
  pillSelected: {
    backgroundColor: "#4A7C59",
    borderColor: "#4A7C59",
  },
  pillEmoji: {
    fontSize: 14,
  },
  pillText: {
    fontSize: 13,
    fontFamily: "Karla_400Regular",
    color: "#4A7C59",
  },
  pillTextSelected: {
    color: "#fff",
    fontFamily: "Karla_700Bold",
  },
  beginButton: {
    marginTop: 24,
    backgroundColor: "#4A7C59",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#4A7C59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  beginButtonDisabled: {
    backgroundColor: "rgba(74,124,89,0.4)",
    shadowOpacity: 0,
  },
  beginButtonText: {
    fontSize: 17,
    fontFamily: "Karla_700Bold",
    color: "#fff",
    letterSpacing: 0.3,
  },

  // After screen
  afterTitle: {
    fontSize: 22,
    fontFamily: "Karla_700Bold",
    color: "#2C1A0E",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 30,
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: "#4A7C59",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#4A7C59",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Karla_700Bold",
    color: "#fff",
  },
  savedConfirm: {
    marginTop: 24,
    backgroundColor: "rgba(74,124,89,0.1)",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(74,124,89,0.3)",
  },
  savedConfirmText: {
    fontSize: 15,
    fontFamily: "Karla_700Bold",
    color: "#4A7C59",
  },
  returnButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  returnButtonText: {
    fontSize: 15,
    fontFamily: "Karla_400Regular",
    color: "#7A5C44",
    textDecorationLine: "underline",
  },
});
