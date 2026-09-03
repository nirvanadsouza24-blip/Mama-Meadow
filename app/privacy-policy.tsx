import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const handleBack = () => {
    console.log('[PrivacyPolicy] Back button tapped');
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: August 24, 2026</Text>

        <Text style={styles.body}>
          Mama Meadow is a motherhood companion designed to help mothers care for, track, and preserve memories of their children.
        </Text>

        <Text style={styles.heading}>Information We Collect</Text>
        <Text style={styles.body}>
          Mama Meadow may collect information that users choose to provide, including mother profile information, child or baby profile information, journal entries, memories, feeding records, sleep records, diaper records, and other information entered by the user.
        </Text>

        <Text style={styles.heading}>How We Use Information</Text>
        <Text style={styles.body}>
          Information provided by users is used to provide, personalise, maintain, and improve the features of the Mama Meadow application.
        </Text>

        <Text style={styles.heading}>Children's Information</Text>
        <Text style={styles.body}>
          Mama Meadow is intended for parents and caregivers. Users should only enter information about a child when they are authorised to do so. Mama Meadow does not knowingly collect information directly from children.
        </Text>

        <Text style={styles.heading}>Data Storage and Security</Text>
        <Text style={styles.body}>
          We take reasonable measures to protect information provided through the application. However, no method of electronic storage or transmission can be guaranteed to be completely secure.
        </Text>

        <Text style={styles.heading}>Sharing of Information</Text>
        <Text style={styles.body}>
          We do not sell personal information. Information may be processed by service providers when necessary to operate and maintain the application.
        </Text>

        <Text style={styles.heading}>Data Deletion</Text>
        <Text style={styles.body}>
          Users may contact us to request deletion of their personal information and associated data, subject to any legal or operational requirements.
        </Text>

        <Text style={styles.heading}>Third-Party Services</Text>
        <Text style={styles.body}>
          The application may use third-party services to provide hosting, analytics, authentication, storage, or other technical functionality. Such services may process information according to their own privacy policies.
        </Text>

        <Text style={styles.heading}>Changes to This Privacy Policy</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time. Any updated version will be made available within the app.
        </Text>

        <Text style={styles.heading}>Contact Us</Text>
        <Text style={styles.body}>
          {"If you have questions, concerns, or requests regarding privacy or the Mama Meadow application, please contact:\n\n"}
          <Text style={styles.email}>nirvanadsouza24@gmail.com</Text>
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF7F2" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(44,26,14,0.07)",
    backgroundColor: "#FAF7F2",
  },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 15, color: "#4A7C59", fontFamily: "Karla_400Regular" },
  title: { fontSize: 22, fontFamily: "Fraunces_700Bold", color: "#2C1A0E", letterSpacing: -0.3 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  updated: { fontSize: 12, color: "#B89880", fontFamily: "Karla_400Regular", marginBottom: 16 },
  heading: { fontSize: 16, fontFamily: "Fraunces_700Bold", color: "#2C1A0E", marginTop: 20, marginBottom: 6 },
  body: { fontSize: 14, fontFamily: "Karla_400Regular", color: "#4A3728", lineHeight: 22 },
  email: { fontSize: 14, fontFamily: "Karla_700Bold", color: "#4A7C59" },
});
