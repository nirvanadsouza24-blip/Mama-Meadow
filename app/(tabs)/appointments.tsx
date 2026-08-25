import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePremiumGate } from "@/hooks/usePremiumGate";

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

const STORAGE_KEY = "@mamameadow/appointments";

const DOT_COLORS = ["#4A7C59", "#C8956C", "#A78BFA", "#F59E0B"];

type Appointment = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
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

function FadeInItem({ children, index }: { children: React.ReactNode; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 70, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export default function AppointmentsScreen() {
  const { loading } = usePremiumGate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    console.log("[AppointmentsScreen] Loading appointments from AsyncStorage");
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setAppointments(Array.isArray(parsed) ? parsed : []);
        } catch {
          setAppointments([]);
        }
      }
    }).catch(() => {
      setAppointments([]);
    });
  }, []);

  const saveAppointments = useCallback(async (updated: Appointment[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  }, []);

  const handleAdd = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Please enter an appointment title.");
      return;
    }
    console.log("[AppointmentsScreen] Adding appointment:", { title, date, time, location });
    const newAppt: Appointment = {
      id: `appt_${Date.now()}`,
      title: title.trim(),
      date: date.trim(),
      time: time.trim(),
      location: location.trim(),
    };
    const updated = [...appointments, newAppt];
    setAppointments(updated);
    await saveAppointments(updated);
    setTitle(""); setDate(""); setTime(""); setLocation("");
    setModalVisible(false);
  }, [title, date, time, location, appointments]);

  const handleDelete = useCallback((appt: Appointment) => {
    console.log("[AppointmentsScreen] Delete appointment tapped:", appt.id);
    Alert.alert(
      "Delete appointment?",
      `Remove "${appt.title}"? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            console.log("[AppointmentsScreen] Appointment deleted:", appt.id);
            const updated = appointments.filter((a) => a.id !== appt.id);
            setAppointments(updated);
            await saveAppointments(updated);
          },
        },
      ]
    );
  }, [appointments]);

  const handleOpenModal = () => {
    console.log("[AppointmentsScreen] Add appointment button pressed");
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAF7F2" }}>
        <ActivityIndicator size="large" color="#4A7C59" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={["bottom"]}>
      {/* Banner */}
      <View style={{
        backgroundColor: "#A8D8EA",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginBottom: 4,
      }}>
        <Text style={{ fontSize: 24, fontFamily: "Fraunces_700Bold", color: COLORS.text, letterSpacing: -0.3 }}>
          Appointments
        </Text>
        <Text style={{ fontSize: 14, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, marginTop: 4 }}>
          Keep track of your check-ups
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {appointments.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 32 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: COLORS.primaryMuted,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 40 }}>📅</Text>
            </View>
            <Text style={{ fontSize: 20, fontFamily: "Fraunces_700Bold", color: COLORS.text, textAlign: "center", marginBottom: 10 }}>
              No upcoming appointments
            </Text>
            <Text style={{ fontSize: 15, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, textAlign: "center", lineHeight: 22 }}>
              Add your first appointment using the button below.
            </Text>
          </View>
        ) : (
          appointments.map((appt, index) => {
            const dotColor = DOT_COLORS[index % DOT_COLORS.length];
            return (
              <FadeInItem key={appt.id} index={index}>
                <AnimatedPressable onPress={() => handleDelete(appt)} scaleValue={0.985}>
                  <View style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    boxShadow: "0 1px 4px rgba(44, 26, 14, 0.05)",
                  }}>
                    <View style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: dotColor,
                      marginTop: 2,
                    }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontFamily: "Karla_700Bold", color: COLORS.text, marginBottom: 4 }}>
                        {appt.title}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                        {appt.date ? (
                          <Text style={{ fontSize: 13, fontFamily: "Karla_400Regular", color: COLORS.textSecondary }}>
                            📅 {appt.date}
                          </Text>
                        ) : null}
                        {appt.time ? (
                          <Text style={{ fontSize: 13, fontFamily: "Karla_400Regular", color: COLORS.textSecondary }}>
                            🕐 {appt.time}
                          </Text>
                        ) : null}
                        {appt.location ? (
                          <Text style={{ fontSize: 13, fontFamily: "Karla_400Regular", color: COLORS.textSecondary }}>
                            📍 {appt.location}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Text style={{ fontSize: 18, color: COLORS.textTertiary }}>›</Text>
                  </View>
                </AnimatedPressable>
              </FadeInItem>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <AnimatedPressable onPress={handleOpenModal} scaleValue={0.93}>
        <View style={{
          position: "absolute",
          bottom: 32,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: COLORS.primary,
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 4px 16px rgba(74, 124, 89, 0.4)",
        }}>
          <Text style={{ fontSize: 28, color: "#fff", lineHeight: 32 }}>+</Text>
        </View>
      </AnimatedPressable>

      {/* Add Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={["top", "bottom"]}>
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 20, fontFamily: "Fraunces_700Bold", color: COLORS.text }}>
                Add Appointment
              </Text>
              <AnimatedPressable onPress={() => setModalVisible(false)} scaleValue={0.9}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: COLORS.surfaceSecondary,
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  <Text style={{ fontSize: 16, color: COLORS.textSecondary }}>✕</Text>
                </View>
              </AnimatedPressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              {[
                { label: "Title *", value: title, setter: setTitle, placeholder: "e.g. 20-week scan" },
                { label: "Date", value: date, setter: setDate, placeholder: "e.g. 15 Jan 2026" },
                { label: "Time", value: time, setter: setTime, placeholder: "e.g. 10:30 AM" },
                { label: "Doctor / Location", value: location, setter: setLocation, placeholder: "e.g. Dr Smith, City Hospital" },
              ].map((field) => (
                <View key={field.label} style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: COLORS.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 }}>
                    {field.label}
                  </Text>
                  <TextInput
                    value={field.value}
                    onChangeText={field.setter}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.textTertiary}
                    style={{
                      backgroundColor: COLORS.surface,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 15,
                      fontFamily: "Karla_400Regular",
                      color: COLORS.text,
                    }}
                  />
                </View>
              ))}

              <AnimatedPressable onPress={handleAdd} scaleValue={0.975}>
                <View style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                  marginTop: 8,
                  boxShadow: "0 4px 16px rgba(74, 124, 89, 0.3)",
                }}>
                  <Text style={{ fontSize: 16, fontFamily: "Karla_700Bold", color: "#fff" }}>
                    Add appointment
                  </Text>
                </View>
              </AnimatedPressable>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
