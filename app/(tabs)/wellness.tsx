import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { supabase } from "@/app/integrations/supabase/client";

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
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

type ArticleSection = {
  heading?: string;
  body: string;
  isCrisis?: boolean;
};

type Topic = {
  id: string;
  slug: string;
  emoji: string;
  title: string;
  teaser: string;
  gradient_from: string;
  gradient_to: string;
  sections: ArticleSection[];
};

function ArticleModal({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={["top", "bottom"]}>
      {/* Gradient Header */}
      <View style={{
        backgroundColor: topic.gradient_from,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 28,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginBottom: 4,
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>{topic.emoji}</Text>
            <Text style={{ fontSize: 24, fontFamily: "Fraunces_700Bold", color: COLORS.text, letterSpacing: -0.3, lineHeight: 30 }}>
              {topic.title}
            </Text>
            <Text style={{ fontSize: 14, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, marginTop: 6, lineHeight: 20 }}>
              {topic.teaser}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              console.log("[WellnessScreen] Article modal closed:", topic.id);
              onClose();
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.6)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, color: COLORS.text, fontWeight: "600" }}>✕</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {topic.sections.map((section, index) => {
          if (section.isCrisis) {
            return (
              <View key={index} style={{
                backgroundColor: "#FFF0F0",
                borderRadius: 14,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1.5,
                borderColor: "#FFB3B3",
              }}>
                <Text style={{ fontSize: 14, fontFamily: "Karla_400Regular", color: "#C0392B", lineHeight: 22 }}>
                  {section.body}
                </Text>
              </View>
            );
          }
          return (
            <View key={index} style={{ marginBottom: 20 }}>
              {section.heading ? (
                <Text style={{ fontSize: 16, fontFamily: "Karla_700Bold", color: COLORS.primary, marginBottom: 8 }}>
                  {section.heading}
                </Text>
              ) : null}
              <Text style={{ fontSize: 15, fontFamily: "Karla_400Regular", color: COLORS.text, lineHeight: 24 }}>
                {section.body}
              </Text>
            </View>
          );
        })}

        {/* Remember callout */}
        <View style={{
          backgroundColor: "#FFF8F0",
          borderRadius: 16,
          padding: 20,
          marginTop: 8,
          borderWidth: 1,
          borderColor: "rgba(200, 149, 108, 0.25)",
        }}>
          <Text style={{ fontSize: 15, fontFamily: "Karla_700Bold", color: COLORS.accent, marginBottom: 8 }}>
            Remember 🌸
          </Text>
          <Text style={{ fontSize: 14, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, lineHeight: 22 }}>
            You are doing an incredible job. Every mother's journey is unique — be gentle with yourself.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function WellnessScreen() {
  const { loading } = usePremiumGate();
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    console.log("[WellnessScreen] Fetching wellness articles from Supabase");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('wellness_articles')
      .select('id, slug, emoji, title, teaser, gradient_from, gradient_to, sections')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('[WellnessScreen] Fetch error:', error);
        } else {
          console.log('[WellnessScreen] Fetched', data?.length ?? 0, 'articles');
          setTopics((data as Topic[]) ?? []);
        }
        setFetchLoading(false);
      });
  }, []);

  const handleTopicPress = (topic: Topic) => {
    console.log("[WellnessScreen] Topic card pressed:", topic.id);
    setSelectedTopic(topic);
  };

  if (loading || fetchLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAF7F2" }}>
        <ActivityIndicator size="large" color="#4A7C59" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <FadeInItem index={0}>
          <View style={{
            backgroundColor: "#F7A8C4",
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: 36,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
            marginBottom: 8,
          }}>
            <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: "rgba(44,26,14,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Wellness Hub
            </Text>
            <Text style={{ fontSize: 30, fontFamily: "Fraunces_700Bold", color: COLORS.text, letterSpacing: -0.4, lineHeight: 36, marginBottom: 10 }}>
              Your Wellness
            </Text>
            <Text style={{ fontSize: 15, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, lineHeight: 22 }}>
              Evidence-based guidance for every stage of motherhood
            </Text>
          </View>
        </FadeInItem>

        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <FadeInItem index={1}>
            <Text style={{ fontSize: 13, fontFamily: "Karla_700Bold", color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 16 }}>
              Topics
            </Text>
          </FadeInItem>

          {topics.map((topic, index) => (
            <FadeInItem key={topic.id} index={index + 2}>
              <AnimatedPressable onPress={() => handleTopicPress(topic)} scaleValue={0.975}>
                <View style={{
                  borderRadius: 20,
                  marginBottom: 16,
                  overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(44, 26, 14, 0.08)",
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}>
                  {/* Card gradient header */}
                  <View style={{
                    backgroundColor: topic.gradient_from,
                    paddingHorizontal: 20,
                    paddingVertical: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                  }}>
                    <View style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      backgroundColor: "rgba(255,255,255,0.45)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                      <Text style={{ fontSize: 26 }}>{topic.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, fontFamily: "Fraunces_700Bold", color: COLORS.text, letterSpacing: -0.2, marginBottom: 4 }}>
                        {topic.title}
                      </Text>
                      <Text style={{ fontSize: 13, fontFamily: "Karla_400Regular", color: COLORS.textSecondary, lineHeight: 18 }} numberOfLines={2}>
                        {topic.teaser}
                      </Text>
                    </View>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "rgba(255,255,255,0.5)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                      <Text style={{ fontSize: 16, color: COLORS.textSecondary }}>›</Text>
                    </View>
                  </View>
                </View>
              </AnimatedPressable>
            </FadeInItem>
          ))}
        </View>
      </ScrollView>

      {/* Article Modal */}
      <Modal
        visible={selectedTopic !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedTopic(null)}
      >
        {selectedTopic && (
          <ArticleModal topic={selectedTopic} onClose={() => setSelectedTopic(null)} />
        )}
      </Modal>
    </SafeAreaView>
  );
}
