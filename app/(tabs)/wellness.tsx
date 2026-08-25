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
  emoji: string;
  title: string;
  teaser: string;
  gradientFrom: string;
  gradientTo: string;
  sections: ArticleSection[];
};

const TOPICS: Topic[] = [
  {
    id: "postpartum-recovery",
    emoji: "🌸",
    title: "Postpartum Recovery",
    teaser: "What to expect in the first 6 weeks — healing, nutrition, and gentle movement.",
    gradientFrom: "#FFB3C6",
    gradientTo: "#FF8FAB",
    sections: [
      {
        heading: "The first 6 weeks",
        body: "Your body has done something extraordinary. In the first six weeks after birth, you'll experience physical healing that takes time and patience. Lochia (postpartum bleeding) is normal and gradually lightens from red to pink to yellow-white. Perineal care — warm sitz baths, gentle cleansing, and ice packs in the first 24 hours — can ease discomfort significantly.",
      },
      {
        heading: "Nutrition for recovery",
        body: "Iron-rich foods (red meat, lentils, spinach, fortified cereals) help replenish blood loss. Aim for 2–3 litres of water daily, especially if breastfeeding. Protein supports tissue repair — eggs, legumes, dairy, and lean meats are excellent choices. Don't skip meals; your body is working hard.",
      },
      {
        heading: "When to call your doctor",
        body: "Seek medical attention for: fever above 38°C (100.4°F), soaking more than one pad per hour, foul-smelling discharge, severe abdominal pain, redness or swelling at a wound site, or difficulty urinating. These may indicate infection or other complications that need prompt care.",
      },
      {
        heading: "Gentle movement",
        body: "Pelvic floor exercises (Kegels) can begin within days of birth — even if you had a caesarean. Short walks are wonderful from week one. Most healthcare providers recommend waiting 6 weeks before returning to higher-impact exercise, but listen to your body and get clearance from your midwife or doctor first.",
      },
      {
        heading: "Emotional changes",
        body: "Feeling tearful, overwhelmed, or anxious in the first two weeks is very common — this is often called the 'baby blues' and is linked to hormonal shifts. If these feelings persist beyond two weeks or intensify, please speak to your healthcare provider. You deserve support.",
      },
    ],
  },
  {
    id: "ppd",
    emoji: "💜",
    title: "Postpartum Depression & Anxiety",
    teaser: "Affects 1 in 5 mothers. It is not your fault — and it is treatable.",
    gradientFrom: "#C9B8FF",
    gradientTo: "#A78BFA",
    sections: [
      {
        heading: "What is PPD?",
        body: "Postpartum depression (PPD) affects approximately 1 in 5 mothers. It is a medical condition caused by a combination of hormonal changes, sleep deprivation, and the enormous psychological adjustment of new parenthood. It is NOT a sign of weakness, failure, or bad mothering. It is not your fault.",
      },
      {
        heading: "Recognising the symptoms",
        body: "Symptoms of PPD include: persistent sadness or emptiness, difficulty bonding with your baby, overwhelming anxiety or panic, intrusive or frightening thoughts, exhaustion that goes beyond normal tiredness, loss of interest in things you used to enjoy, difficulty concentrating or making decisions, and feelings of hopelessness or worthlessness.",
      },
      {
        heading: "Baby blues vs PPD",
        body: "Baby blues typically appear within the first few days after birth and resolve within 2 weeks. PPD is different — it persists beyond two weeks, often intensifies over time, and significantly impacts your ability to function. If you're still struggling at two weeks postpartum, please reach out to your healthcare provider.",
      },
      {
        heading: "Postpartum anxiety",
        body: "Postpartum anxiety is equally common but less talked about. Symptoms include racing thoughts, constant worry about your baby's safety, difficulty sleeping even when your baby sleeps, physical symptoms like a racing heart or shortness of breath, and feeling on edge or irritable. It is just as real and just as treatable as PPD.",
      },
      {
        heading: "Treatment options",
        body: "Effective treatments include: Cognitive Behavioural Therapy (CBT), which has strong evidence for both PPD and PPA; medication — several antidepressants are considered safe during breastfeeding; peer support groups where you can connect with other mothers who understand; and in some areas, specialist perinatal mental health services.",
      },
      {
        isCrisis: true,
        body: "🆘 If you are in crisis, please call or text 988 (Suicide & Crisis Lifeline) in the US. In Australia, call PANDA on 1300 726 306. In the UK, call the Samaritans on 116 123. You are not alone, and help is available right now.",
      },
      {
        heading: "Self-care strategies",
        body: "While professional support is essential, these strategies can help: sleep when your baby sleeps (even short naps matter), accept help from family and friends without guilt, talk to someone you trust about how you're feeling, step outside for fresh air daily, and be gentle with yourself — you are doing an incredibly hard job.",
      },
    ],
  },
  {
    id: "breastfeeding",
    emoji: "🤱",
    title: "Breastfeeding",
    teaser: "Latching, supply, common challenges, pumping, and when to seek help.",
    gradientFrom: "#FFDAB9",
    gradientTo: "#FFB347",
    sections: [
      {
        heading: "Getting started",
        body: "Breastfeeding is natural but not always easy — and that's completely normal. Key positions to try: cradle hold (baby across your body, tummy to tummy), football hold (baby tucked under your arm, great after a caesarean), and side-lying (both of you lying down, wonderful for night feeds). A good latch means baby's mouth covers most of the areola, not just the nipple.",
      },
      {
        heading: "How supply works",
        body: "Breast milk supply works on a demand-and-supply basis: the more your baby feeds (or you pump), the more milk your body produces. Cluster feeding — when your baby feeds very frequently for hours at a time — is completely normal, especially during growth spurts. It is your baby's way of boosting your supply, not a sign that you don't have enough milk.",
      },
      {
        heading: "Common challenges",
        body: "Sore nipples: apply lanolin cream after feeds and allow nipples to air dry. Engorgement: feed frequently, apply warm compresses before feeds and cold compresses after. Mastitis (breast infection): symptoms include a hard, red, painful area and flu-like symptoms — see your doctor promptly, as antibiotics may be needed. Don't stop breastfeeding; continuing to feed actually helps.",
      },
      {
        heading: "Pumping & storage",
        body: "Building a milk stash: pump after morning feeds when supply is highest. Storage guidelines: room temperature up to 4 hours, refrigerator up to 4 days, freezer up to 6 months (12 months in a deep freezer). Label bags with date and volume. Thaw frozen milk in the fridge overnight or under warm running water — never microwave.",
      },
      {
        heading: "Nutrition while breastfeeding",
        body: "Breastfeeding requires an extra 300–500 calories per day. Continue taking your prenatal vitamins. Limit caffeine to 1–2 cups per day. Stay well hydrated — keep a water bottle with you during every feed. Most foods are fine; if you notice your baby seems unsettled after you eat something specific, try eliminating it for a week.",
      },
      {
        heading: "When to seek help",
        body: "A lactation consultant (IBCLC) can be invaluable if you're struggling. Ask your midwife, hospital, or GP for a referral. If your baby is not gaining weight, has fewer than 6 wet nappies per day after day 5, or you're in significant pain, seek help promptly. Tongue tie (ankyloglossia) can affect latch and may need assessment.",
      },
    ],
  },
  {
    id: "sexual-health",
    emoji: "🌺",
    title: "Sexual & Reproductive Health",
    teaser: "Resuming intimacy, contraception, pelvic floor health, and communicating with your partner.",
    gradientFrom: "#FFD6E7",
    gradientTo: "#FFACC7",
    sections: [
      {
        heading: "When is it safe to resume sex?",
        body: "Most healthcare providers suggest waiting until your 6-week postnatal check before resuming penetrative sex. However, this is a guideline, not a rule — your physical and emotional readiness matters most. Many women feel ready later than 6 weeks, and that is completely normal. Listen to your body.",
      },
      {
        heading: "Physical changes",
        body: "Vaginal dryness is very common postpartum, especially if you're breastfeeding, due to lower oestrogen levels. A water-based lubricant can make a significant difference. Reduced libido is also normal — sleep deprivation, hormonal changes, and the demands of new parenthood all play a role. This typically improves over time.",
      },
      {
        heading: "Contraception after birth",
        body: "Options safe while breastfeeding include: the progestogen-only pill (mini-pill), hormonal IUD (Mirena), copper IUD, implant, and condoms. The combined pill (oestrogen + progestogen) is generally not recommended while breastfeeding. Fertility can return before your first period — contraception is important if you're not planning another pregnancy immediately.",
      },
      {
        heading: "Communicating with your partner",
        body: "Intimacy after a baby is as much emotional as physical. Talk openly about how you're feeling — both of you are adjusting to enormous change. Intimacy doesn't have to mean sex; closeness, touch, and connection matter too. Take it slowly, be patient with each other, and remember that this phase is temporary.",
      },
      {
        heading: "Pelvic floor health",
        body: "Pelvic floor muscles support your bladder, bowel, and uterus. Pregnancy and birth can weaken them, leading to leakage, prolapse symptoms, or pain. Kegel exercises — contracting and releasing the pelvic floor — can be started soon after birth. If you experience pain during sex, leakage, or a feeling of heaviness, ask for a referral to a pelvic floor physiotherapist.",
      },
      {
        heading: "When to see a doctor",
        body: "Please see your doctor if you experience: pain during sex (dyspareunia) that persists, symptoms of prolapse (a feeling of something coming down), irregular or heavy bleeding, or any concerns about your reproductive health. These are all treatable — you don't have to just live with them.",
      },
    ],
  },
  {
    id: "mental-health",
    emoji: "🧘‍♀️",
    title: "Mental Health & Self-Care",
    teaser: "The 'good enough' mother, building your village, sleep, mindfulness, and identity.",
    gradientFrom: "#B5EAD7",
    gradientTo: "#85D6B8",
    sections: [
      {
        heading: "The 'good enough' mother",
        body: "Perfectionism is the enemy of joy in motherhood. Paediatrician and psychoanalyst Donald Winnicott coined the term 'good enough mother' — a mother who meets her baby's needs most of the time, makes mistakes, and repairs them. This is not only sufficient; it is actually ideal for healthy child development. You do not need to be perfect.",
      },
      {
        heading: "Building your village",
        body: "Humans evolved to raise children in communities, not in isolation. Asking for help is not weakness — it is wisdom. Be specific when asking: 'Could you bring dinner on Tuesday?' is easier to say yes to than 'Let me know if you need anything.' Accept help graciously. Your village might include family, friends, neighbours, parent groups, or online communities.",
      },
      {
        heading: "Sleep deprivation",
        body: "Sleep deprivation is one of the hardest parts of new parenthood and has real effects on mood, cognition, and emotional regulation. Strategies that help: sleep in shifts with your partner so each of you gets a longer stretch, nap when your baby naps (even 20 minutes helps), lower your standards for housework, and prioritise sleep over screens in the evening.",
      },
      {
        heading: "Mindfulness for new mums",
        body: "You don't need an hour of meditation. Try: 5 deep breaths before getting out of bed, a body scan while feeding (notice sensations without judgment), a gratitude practice (name 3 things, however small), or simply stepping outside and noticing the sky for 2 minutes. These micro-practices accumulate into genuine resilience.",
      },
      {
        heading: "Matrescence — becoming a mother",
        body: "Anthropologist Dana Raphael coined the term 'matrescence' to describe the profound identity shift of becoming a mother — as significant as adolescence. You may grieve parts of your former self while falling in love with your new role. Both can be true simultaneously. This transition is normal, valid, and worthy of acknowledgment.",
      },
      {
        heading: "Returning to work",
        body: "Returning to work after maternity leave brings a complex mix of emotions — relief, guilt, grief, excitement. All of these are valid. Practical tips: do a trial run at childcare before your first day back, establish a pumping schedule if breastfeeding, communicate your needs to your employer, and be patient with yourself as you find a new rhythm.",
      },
    ],
  },
  {
    id: "nutrition",
    emoji: "🥗",
    title: "Nutrition & Wellness",
    teaser: "Postpartum nutrition essentials, hydration, mood-boosting foods, and supplements.",
    gradientFrom: "#DCEEFB",
    gradientTo: "#A8D8EA",
    sections: [
      {
        heading: "Postpartum nutrition essentials",
        body: "Iron: replenish what was lost during birth with red meat, lentils, spinach, and fortified cereals. Pair with vitamin C to boost absorption. Calcium: essential for bone health, especially if breastfeeding — dairy, fortified plant milks, tofu, and leafy greens. Omega-3 fatty acids: support brain health and mood — salmon, sardines, walnuts, chia seeds, and flaxseed.",
      },
      {
        heading: "Hydration",
        body: "Aim for 2–3 litres of water per day, more if you're breastfeeding. Dehydration worsens fatigue, headaches, and mood. Keep a large water bottle visible and within reach. Herbal teas (ginger, chamomile, fennel) count toward your fluid intake. Limit caffeine to 1–2 cups per day.",
      },
      {
        heading: "Foods to boost mood",
        body: "Complex carbohydrates (oats, wholegrain bread, sweet potato) provide steady energy and support serotonin production. Protein at every meal stabilises blood sugar and reduces mood swings. Avoid relying on sugar for energy — the crash worsens fatigue and irritability. Fermented foods (yoghurt, kefir, sauerkraut) support gut health, which is increasingly linked to mental wellbeing.",
      },
      {
        heading: "Meal prep for new mums",
        body: "Batch cooking before birth (soups, stews, casseroles) means nutritious meals are available when you're exhausted. Accept food from others — it is a gift. Keep easy snacks accessible: nuts, cheese, fruit, yoghurt, boiled eggs. You don't need to cook elaborate meals; nourishment matters more than presentation.",
      },
      {
        heading: "Supplements",
        body: "Continue your prenatal vitamins postpartum, especially if breastfeeding. Vitamin D is important for both you and your baby — many people are deficient, particularly in winter or with limited sun exposure. Magnesium glycinate may support sleep quality and reduce anxiety. Always discuss supplements with your healthcare provider.",
      },
      {
        heading: "Red flags to watch",
        body: "Extreme fatigue beyond what sleep deprivation explains, significant hair loss (some shedding at 3–6 months is normal, but excessive loss warrants investigation), unexplained weight changes, or feeling very cold all the time may indicate thyroid issues — common postpartum. A simple blood test can check your thyroid function.",
      },
    ],
  },
];

function ArticleModal({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={["top", "bottom"]}>
      {/* Gradient Header */}
      <View style={{
        backgroundColor: topic.gradientFrom,
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

  const handleTopicPress = (topic: Topic) => {
    console.log("[WellnessScreen] Topic card pressed:", topic.id);
    setSelectedTopic(topic);
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

          {TOPICS.map((topic, index) => (
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
                    backgroundColor: topic.gradientFrom,
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
