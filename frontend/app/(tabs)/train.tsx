import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { Card } from "../../src/components/Card";
import { Badge } from "../../src/components/Badge";
import { FONTS, SPACING, RADIUS } from "../../src/constants/theme";
import { usePlan } from "../../hooks/usePlan";

const SUB_TABS = [
  "Jaw & Face",
  "Body",
  "Posture",
  "Nutrition",
  "Guides",
] as const;
type SubTab = (typeof SUB_TABS)[number];

const CATEGORY_MAP: Record<Exclude<SubTab, "Nutrition" | "Guides">, string> = {
  "Jaw & Face": "jaw_face",
  Body: "body",
  Posture: "posture",
};

export default function TrainScreen() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SubTab>("Jaw & Face");
  const [nofapDays, setNofapDays] = useState(0);

  useEffect(() => {
    const nofapStreak = profile?.streaks?.find((s: any) => s.type === "nofap");
    if (nofapStreak && nofapStreak.start_date) {
      const start = new Date(nofapStreak.start_date).getTime();
      const days = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24));
      setNofapDays(days);
    }
  }, [profile]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bgPrimary }]}
      testID="train-screen"
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: theme.textPrimary, fontFamily: FONTS.cinzelBold },
          ]}
        >
          The Captain's Gym
        </Text>
        <View
          style={[styles.captainBadge, { backgroundColor: theme.bgElevated }]}
        >
          <Text style={{ fontSize: 16 }}>🎯</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
      >
        <View style={styles.tabRow}>
          {SUB_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabPill,
                {
                  backgroundColor:
                    activeTab === tab ? theme.bgElevated : theme.bgSurface,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === tab ? theme.gold : theme.textSecondary,
                    fontFamily: FONTS.semiBold,
                  },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.contentWrap}>
        {(activeTab === "Jaw & Face" ||
          activeTab === "Body" ||
          activeTab === "Posture") && (
          <ProgramsTab
            category={
              CATEGORY_MAP[activeTab as Exclude<SubTab, "Nutrition" | "Guides">]
            }
            theme={theme}
          />
        )}
        {activeTab === "Nutrition" && <NutritionTab theme={theme} />}
        {activeTab === "Guides" && <GuidesTab theme={theme} />}
      </View>

      {/* Floating NoFap Tracker */}
      <TouchableOpacity
        onPress={() => router.push("/nofap")}
        style={[
          styles.nofapFloat,
          { backgroundColor: theme.bgElevated, borderColor: theme.gold },
        ]}
      >
        <Text
          style={{ color: theme.gold, fontFamily: FONTS.bold, fontSize: 12 }}
        >
          NoFap 🔥 {nofapDays}d
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Programs Tab ────────────────────────────────────────────────────────────
function ProgramsTab({ category, theme }: { category: string; theme: any }) {
  const { profile } = useAuth();
  const router = useRouter();
  const { canAccess, handleGate } = usePlan();
  const [programs, setPrograms] = useState<any[]>([]);
  const [exercises, setExercises] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchData();
  }, [category]);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data: progData, error: progErr } = await supabase
        .from("training_programs")
        .select(
          "id, title, subtitle, description, difficulty, unlock_level, required_plan, duration_weeks, sort_order",
        )
        .eq("category", category)
        .eq("is_active", true)
        .order("sort_order");

      if (progErr) throw progErr;
      if (!progData || progData.length === 0) {
        setPrograms([]);
        setLoading(false);
        return;
      }

      const progs = progData.map((p: any) => {
        let isLocked = false;
        if (p.unlock_level && (profile?.power_level || 1) < p.unlock_level)
          isLocked = true;
        if (p.required_plan && !canAccess(p.required_plan)) isLocked = true;
        return { ...p, locked: isLocked };
      });
      setPrograms(progs);

      // Fetch exercises for all programs in parallel
      const exerciseResults = await Promise.all(
        progs.map(async (p: any) => {
          const { data: exData } = await supabase
            .from("exercises")
            .select("*")
            .eq("program_id", p.id)
            .eq("is_active", true)
            .order("exercise_order");
          return { programId: p.id, exercises: exData || [] };
        }),
      );

      const exMap: Record<string, any[]> = {};
      exerciseResults.forEach(({ programId, exercises: ex }) => {
        exMap[programId] = ex;
      });
      setExercises(exMap);
    } catch (e) {
      console.error("Train fetch error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.gold} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <Feather name="alert-circle" size={40} color={theme.red || "#E74C3C"} />
        <Text
          style={{
            color: theme.textPrimary,
            fontFamily: FONTS.semiBold,
            marginTop: 12,
          }}
        >
          Load Failed
        </Text>
        <TouchableOpacity
          onPress={fetchData}
          style={{
            marginTop: 12,
            paddingHorizontal: 24,
            paddingVertical: 10,
            backgroundColor: theme.gold,
            borderRadius: RADIUS.pill,
          }}
        >
          <Text style={{ color: "#0A0A0A", fontFamily: FONTS.bold }}>
            RETRY
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (programs.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: theme.textMuted, fontFamily: FONTS.medium }}>
          Content coming soon
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {category === "body" && (
        <View
          style={[
            styles.badgeContainer,
            { backgroundColor: "rgba(46, 204, 113, 0.1)" },
          ]}
        >
          <Text
            style={{ color: "#2ecc71", fontSize: 11, fontFamily: FONTS.medium }}
          >
            Natural Max — No TRT · No PEDs · No Steroids
          </Text>
        </View>
      )}

      {programs.map((prog) => {
        const progExercises = exercises[prog.id] || [];
        return (
          <View key={prog.id} style={{ marginBottom: SPACING.lg }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => (prog.locked ? handleGate(prog.required_plan || 'grind') : null)}
            >
              <Card
                style={StyleSheet.flatten([
                  styles.progCard,
                  {
                    borderColor: prog.locked ? theme.border : theme.gold,
                    opacity: prog.locked ? 0.6 : 1,
                  },
                ])}
              >
                <View style={styles.progHeader}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.progTitle,
                        {
                          color: theme.textPrimary,
                          fontFamily: FONTS.semiBold,
                        },
                      ]}
                    >
                      {prog.title}
                    </Text>
                    <Text style={[styles.progSub, { color: theme.textMuted }]}>
                      {prog.duration_weeks
                        ? prog.duration_weeks + " weeks"
                        : ""}{" "}
                      · {prog.difficulty}
                    </Text>
                    {prog.subtitle ? (
                      <Text
                        style={{
                          color: theme.textSecondary,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        {prog.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  {prog.locked ? (
                    <Feather name="lock" size={18} color={theme.textMuted} />
                  ) : (
                    <Badge label="ACTIVE" />
                  )}
                </View>
              </Card>
            </TouchableOpacity>

            {/* Exercise cards */}
            {!prog.locked &&
              progExercises.map((ex: any) => (
                <View
                  key={ex.id}
                  style={[
                    styles.exerciseCard,
                    {
                      backgroundColor: theme.bgSurface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.exerciseHeader}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.exerciseName,
                          {
                            color: theme.textPrimary,
                            fontFamily: FONTS.semiBold,
                          },
                        ]}
                      >
                        {ex.name || ex.title}
                      </Text>
                      <Text
                        style={[
                          styles.exerciseMeta,
                          { color: theme.textMuted },
                        ]}
                      >
                        {ex.sets ? `${ex.sets} sets` : ""}
                        {ex.reps ? ` × ${ex.reps} reps` : ""}
                        {ex.duration_seconds
                          ? ` · ${ex.duration_seconds}s`
                          : ""}
                      </Text>
                    </View>
                    {ex.xp_reward ? (
                      <View
                        style={[
                          styles.xpPill,
                          { backgroundColor: theme.bgElevated },
                        ]}
                      >
                        <Text
                          style={{
                            color: theme.gold,
                            fontSize: 11,
                            fontFamily: FONTS.semiBold,
                          }}
                        >
                          +{ex.xp_reward} XP
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {ex.coach_note || ex.description ? (
                    <View
                      style={[
                        styles.coachNote,
                        { borderLeftColor: theme.gold },
                      ]}
                    >
                      <Text
                        style={{
                          color: theme.gold,
                          fontFamily: FONTS.medium,
                          fontSize: 12,
                          fontStyle: "italic",
                        }}
                      >
                        {ex.coach_note || ex.description}
                      </Text>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    onPress={() =>
                      router.push(
                        `/exercise?id=${ex.id}&programId=${prog.id}&name=${encodeURIComponent(ex.name || ex.title)}&sets=${ex.sets || 3}&hold=${ex.hold_seconds || 45}&rest=${ex.rest_seconds || 30}&xp=${ex.xp_reward || 30}&description=${encodeURIComponent(ex.description || "")}&coach_note=${encodeURIComponent(ex.coach_note || "")}&pro_tip=${encodeURIComponent(ex.pro_tip || "")}`,
                      )
                    }
                    style={[styles.startBtn, { backgroundColor: theme.gold }]}
                  >
                    <Text
                      style={{
                        color: "#0A0A0A",
                        fontFamily: FONTS.bold,
                        fontSize: 13,
                      }}
                    >
                      START
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

            {!prog.locked && progExercises.length === 0 && (
              <View
                style={[
                  styles.exerciseCard,
                  {
                    backgroundColor: theme.bgSurface,
                    borderColor: theme.border,
                    alignItems: "center",
                    paddingVertical: 20,
                  },
                ]}
              >
                <Text
                  style={{ color: theme.textMuted, fontFamily: FONTS.medium }}
                >
                  Content coming soon
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Nutrition Tab ────────────────────────────────────────────────────────────
function NutritionTab({ theme }: { theme: any }) {
  const router = useRouter();
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("nutrition_guides")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");
        setGuides(data || []);
      } catch (e) {
        console.error("Nutrition fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.gold} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View
        style={[
          styles.captainBox,
          {
            backgroundColor: "rgba(200,169,110,0.08)",
            borderColor: theme.gold,
          },
        ]}
      >
        <Text
          style={{
            color: theme.gold,
            fontFamily: FONTS.cinzelBold,
            fontSize: 13,
            marginBottom: 6,
          }}
        >
          Your gym bro says:
        </Text>
        <Text
          style={{
            color: theme.textSecondary,
            fontFamily: FONTS.regular,
            fontSize: 13,
            fontStyle: "italic",
          }}
        >
          "You are what you eat. If you eat processed junk food, you look like
          you eat processed junk food. Fuel the machine with clean whole foods."
        </Text>
      </View>

      <Card
        style={{
          ...StyleSheet.flatten(styles.guideCard),
          borderColor: theme.error,
          marginTop: 10,
        }}
      >
        <Text
          style={[
            styles.guideTitle,
            { color: theme.error, fontFamily: FONTS.cinzelBold },
          ]}
        >
          FOODS TO AVOID
        </Text>
        <Text
          style={{
            color: theme.textSecondary,
            marginTop: 6,
            lineHeight: 20,
            fontFamily: FONTS.regular,
          }}
        >
          Unhealthy, processed or highly sugary foods and drinks engineered to
          keep you weak. Cut it out entirely.
        </Text>
        <View style={{ marginTop: 10, gap: 4 }}>
          {[
            "Monster Energy",
            "Red Bull",
            "Prime Energy",
            "Mountain Dew",
            "Coca-Cola",
            "Doritos & Chips",
            "Candy & Gummy Bears",
            "Fast Food (McDonalds, KFC)",
            "Seed Oils (Canola, Soybean)",
            "Margarine & Fake Butter",
            "Instant Noodles",
            "Frozen Pizza",
            "Sugary Cereals",
            "Diet Soda (Aspartame)",
            "Pre-made Sauces",
          ].map((item, i) => (
            <Text
              key={i}
              style={{
                color: theme.textMuted,
                fontSize: 12,
                fontFamily: FONTS.regular,
              }}
            >
              ❌ {item}
            </Text>
          ))}
        </View>
      </Card>

      <Card
        style={{
          ...StyleSheet.flatten(styles.guideCard),
          borderColor: theme.green,
          marginTop: 10,
          marginBottom: 10,
        }}
      >
        <Text
          style={[
            styles.guideTitle,
            { color: theme.green, fontFamily: FONTS.cinzelBold },
          ]}
        >
          FUEL YOUR BODY
        </Text>
        <Text
          style={{
            color: theme.textSecondary,
            marginTop: 6,
            lineHeight: 20,
            fontFamily: FONTS.regular,
          }}
        >
          Whole, nutrient-dense foods that boost testosterone and build raw
          power. Eat for dominance.
        </Text>
        <View style={{ marginTop: 10, gap: 4 }}>
          {[
            "Grass-Fed Red Meat & Steak",
            "Free-Range Eggs (Whole)",
            "Raw Dairy & Milk",
            "Organ Meats (Liver, Heart)",
            "Wild Salmon & Sardines",
            "Sweet Potatoes & Rice",
            "Honey (Raw, Unprocessed)",
            "Butter & Ghee",
            "Bone Broth",
            "Garlic, Onion, Ginger",
            "Dark Leafy Greens",
            "Nuts & Seeds (Almonds, Walnuts)",
            "Avocados & Olive Oil",
            "Berries (Blueberry, Açaí)",
          ].map((item, i) => (
            <Text
              key={i}
              style={{
                color: theme.textSecondary,
                fontSize: 12,
                fontFamily: FONTS.regular,
              }}
            >
              ✅ {item}
            </Text>
          ))}
        </View>
      </Card>

      <Card
        style={{
          ...StyleSheet.flatten(styles.guideCard),
          borderColor: theme.gold,
          marginTop: 10,
          marginBottom: 10,
          alignItems: 'center',
          backgroundColor: 'rgba(200, 169, 110, 0.05)',
        }}
      >
        <Feather name="zap" size={24} color={theme.gold} style={{ marginBottom: 8 }} />
        <Text
          style={[
            styles.guideTitle,
            { color: theme.gold, fontFamily: FONTS.cinzelBold, textAlign: 'center' },
          ]}
        >
          SUPPLEMENTATION
        </Text>
        <Text
          style={{
            color: theme.textSecondary,
            marginTop: 6,
            lineHeight: 20,
            fontFamily: FONTS.regular,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          Optimize your physical and mental edge. Access the full MAXX supplement catalog and get your unique, personalized AI-generated stack.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/supplements')}
          style={{
            backgroundColor: theme.gold,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#0A0A0A', fontFamily: FONTS.bold, fontSize: 13, letterSpacing: 1 }}>
            VIEW SUPPLEMENTS
          </Text>
        </TouchableOpacity>
      </Card>

      {guides.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Text style={{ color: theme.textMuted }}>Content coming soon</Text>
        </View>
      ) : (
        guides.map((g: any) => (
          <TouchableOpacity
            key={g.id}
            onPress={() => setExpanded(expanded === g.id ? null : g.id)}
            activeOpacity={0.9}
          >
            <Card
              style={StyleSheet.flatten([
                styles.guideCard,
                { borderColor: expanded === g.id ? theme.gold : theme.border },
              ])}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.guideTitle,
                      { color: theme.gold, fontFamily: FONTS.cinzelBold },
                    ]}
                  >
                    {g.title}
                  </Text>
                  <Text style={[styles.guideSub, { color: theme.textMuted }]}>
                    {g.subtitle}
                  </Text>
                </View>
                <Feather
                  name={expanded === g.id ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={theme.textMuted}
                />
              </View>
              {expanded === g.id && (
                <View style={{ marginTop: 12 }}>
                  {g.body_text ? (
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: 13,
                        lineHeight: 20,
                        marginBottom: 10,
                      }}
                    >
                      {g.body_text}
                    </Text>
                  ) : null}
                  {g.eat_foods && g.eat_foods.length > 0 && (
                    <View>
                      <Text
                        style={{
                          color: "#2ECC71",
                          fontFamily: FONTS.semiBold,
                          fontSize: 12,
                          marginBottom: 4,
                        }}
                      >
                        EAT MORE
                      </Text>
                      {g.eat_foods.map((f: any, i: number) => (
                        <Text
                          key={i}
                          style={{
                            color: theme.textSecondary,
                            fontSize: 12,
                            marginBottom: 2,
                          }}
                        >
                          ✅{" "}
                          {typeof f === "string"
                            ? f
                            : `${f.food || ""}${f.why ? ` - ${f.why}` : ""}`}
                        </Text>
                      ))}
                    </View>
                  )}
                  {g.avoid_foods && g.avoid_foods.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text
                        style={{
                          color: "#E74C3C",
                          fontFamily: FONTS.semiBold,
                          fontSize: 12,
                          marginBottom: 4,
                        }}
                      >
                        AVOID
                      </Text>
                      {g.avoid_foods.map((f: any, i: number) => (
                        <Text
                          key={i}
                          style={{
                            color: theme.textSecondary,
                            fontSize: 12,
                            marginBottom: 2,
                          }}
                        >
                          ❌{" "}
                          {typeof f === "string"
                            ? f
                            : `${f.food || ""}${f.why ? ` - ${f.why}` : ""}`}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </Card>
          </TouchableOpacity>
        ))
      )}

      <View style={{ marginTop: SPACING.xl }}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
          SUPPLEMENT STACK
        </Text>
        <Card style={styles.stackCard}>
          <Text
            style={[
              styles.stackTitle,
              { color: theme.gold, fontFamily: FONTS.cinzelBold },
            ]}
          >
            Generate My Stack
          </Text>
          <Text style={[styles.stackDesc, { color: theme.textSecondary }]}>
            {" "}
            AI-customized supplements based on your goals.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/supplements")}
            style={[styles.genBtn, { backgroundColor: theme.bgElevated }]}
          >
            <Text style={{ color: theme.gold, fontFamily: FONTS.bold }}>
              BUILD STACK
            </Text>
          </TouchableOpacity>
        </Card>
      </View>
    </ScrollView>
  );
}

// ─── Guides Tab ────────────────────────────────────────────────────────────
function GuidesTab({ theme }: { theme: any }) {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("looksmaxx_guides")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");
        setGuides(data || []);
      } catch (e) {
        console.error("Guides fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.gold} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View
        style={[
          styles.captainBox,
          {
            backgroundColor: "rgba(200,169,110,0.08)",
            borderColor: theme.gold,
          },
        ]}
      >
        <Text
          style={{
            color: theme.textSecondary,
            fontFamily: FONTS.regular,
            fontSize: 13,
            fontStyle: "italic",
          }}
        >
          "Knowledge is only power if applied. Read these, then execute."
        </Text>
      </View>

      {guides.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Text style={{ color: theme.textMuted }}>Content coming soon</Text>
        </View>
      ) : (
        guides.map((g: any) => (
          <TouchableOpacity
            key={g.id}
            onPress={() => setExpanded(expanded === g.id ? null : g.id)}
            activeOpacity={0.9}
          >
            <Card
              style={StyleSheet.flatten([
                styles.guideCard,
                { borderColor: expanded === g.id ? theme.gold : theme.border },
              ])}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.guideTitle,
                      { color: theme.textPrimary, fontFamily: FONTS.semiBold },
                    ]}
                  >
                    {g.title}
                  </Text>
                  <Text style={[styles.guideSub, { color: theme.textMuted }]}>
                    {g.subtitle || g.category}
                  </Text>
                </View>
                <Feather
                  name={expanded === g.id ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={theme.textMuted}
                />
              </View>
              {expanded === g.id && g.content && (
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 13,
                    lineHeight: 20,
                    marginTop: 12,
                  }}
                >
                  {g.content}
                </Text>
              )}
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  title: { fontSize: 24 },
  captainBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tabScroll: { marginTop: SPACING.md, maxHeight: 48 },
  tabRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  tabPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  tabText: { fontSize: 13 },
  contentWrap: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  badgeContainer: {
    padding: 8,
    borderRadius: 8,
    marginBottom: SPACING.md,
    alignItems: "center",
  },
  progCard: { padding: SPACING.lg, borderWidth: 1, marginBottom: SPACING.sm },
  progHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progTitle: { fontSize: 16 },
  progSub: { fontSize: 12, marginTop: 2 },
  exerciseCard: {
    padding: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  exerciseName: { fontSize: 16 },
  exerciseMeta: { fontSize: 12, marginTop: 2 },
  xpPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  coachNote: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 12 },
  startBtn: { paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  sectionTitle: { fontSize: 11, letterSpacing: 1, marginBottom: SPACING.sm },
  guideCard: { padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1 },
  guideTitle: { fontSize: 15 },
  guideSub: { fontSize: 12, marginTop: 2 },
  stackCard: { padding: SPACING.lg, alignItems: "center" },
  stackTitle: { fontSize: 18, marginBottom: 4 },
  stackDesc: { fontSize: 12, textAlign: "center", marginBottom: SPACING.md },
  genBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: SPACING.sm,
  },
  captainBox: {
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  nofapFloat: {
    position: "absolute",
    bottom: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 5,
  },
});
