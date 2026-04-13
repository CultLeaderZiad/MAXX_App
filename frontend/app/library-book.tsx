import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { safeBack } from "../lib/safeBack";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../src/context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { FONTS, SPACING, RADIUS } from "../src/constants/theme";
import { Button } from "../src/components/Button";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LibraryBookScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookId = params.id as string;

  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (bookId) {
      fetchBook();
      checkFavorite();
    }
  }, [bookId]);

  const fetchBook = async () => {
    try {
      const { data, error } = await supabase
        .from("library_books")
        .select("*")
        .eq("id", bookId)
        .single();
      if (!error && data) {
        setBook(data);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", bookId)
        .maybeSingle();
      if (data) setIsFavorite(true);
    } catch (e) {
      console.log(e);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !book) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    try {
      if (isFavorite) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", bookId);
        setIsFavorite(false);
      } else {
        await supabase.from("favorites").insert({
          user_id: user.id,
          item_type: "book",
          item_id: bookId,
          item_title: book.title,
          item_image_url: book.cover_url,
          item_subtitle: book.author,
        });
        setIsFavorite(true);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenLink = async (url: string) => {
    if (!url) {
      Alert.alert("Link Unavailable", "Check back soon for the direct portal.");
      return;
    }
    Haptics.selectionAsync();
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Error", "Could not open link. Check your device settings.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.gold} />
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.textSecondary, fontFamily: FONTS.regular }}>Book not found.</Text>
        <TouchableOpacity onPress={() => safeBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.gold, fontFamily: FONTS.medium }}>GO BACK</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]} numberOfLines={1}>
          ARCHIVE DATA
        </Text>
        <TouchableOpacity onPress={toggleFavorite} style={styles.backBtn} disabled={isSaving}>
          <Feather name="bookmark" size={24} color={isFavorite ? theme.gold : theme.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Image source={{ uri: book.cover_url || "https://via.placeholder.com/300x450" }} style={styles.heroCover} />
          <View style={styles.heroInfo}>
            <Text style={[styles.category, { color: theme.gold, fontFamily: FONTS.bold }]}>
              {book.category?.toUpperCase() || "LITERATURE"}
            </Text>
            <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
              {book.title}
            </Text>
            <Text style={[styles.author, { color: theme.textMuted, fontFamily: FONTS.medium }]}>
              By {book.author}
            </Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={16} color={theme.gold} />
              <Text style={[styles.rating, { color: theme.gold }]}>{book.rating || "4.8"} / 5.0</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>SYNOPSIS</Text>
          <Text style={[styles.description, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
            {book.description || "No description available for this archive entry."}
          </Text>
        </View>

        {book.key_lessons && book.key_lessons.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>KEY PROTOCOLS</Text>
            {book.key_lessons.map((lesson: string, index: number) => (
              <View key={index} style={styles.lessonRow}>
                <View style={[styles.bullet, { backgroundColor: theme.gold }]} />
                <Text style={[styles.lessonText, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
                  {lesson}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionSection}>
          {book.free_summary_url ? (
            <Button
              title="READ SUMMARY"
              onPress={() => handleOpenLink(book.free_summary_url)}
              style={styles.actionBtn}
            />
          ) : null}
          {book.buy_link ? (
            <TouchableOpacity
              onPress={() => handleOpenLink(book.buy_link)}
              style={[styles.outlineBtn, { borderColor: theme.gold }]}
            >
              <Text style={[styles.outlineBtnText, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
                ACQUIRE TOME
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  backBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 16, letterSpacing: 2, flex: 1, textAlign: "center", marginHorizontal: SPACING.md },
  scroll: { padding: SPACING.lg, paddingBottom: 100 },
  heroSection: { flexDirection: "row", marginBottom: SPACING.xxl },
  heroCover: { width: 120, height: 180, borderRadius: RADIUS.md, backgroundColor: "#222" },
  heroInfo: { flex: 1, paddingLeft: SPACING.lg, justifyContent: "center" },
  category: { fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 22, lineHeight: 28, marginBottom: 8 },
  author: { fontSize: 14, marginBottom: 16 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rating: { fontSize: 14, fontFamily: FONTS.bold },
  section: { marginBottom: SPACING.xxl },
  sectionTitle: { fontSize: 14, letterSpacing: 2, marginBottom: SPACING.md },
  description: { fontSize: 15, lineHeight: 24 },
  lessonRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8, marginRight: 12 },
  lessonText: { flex: 1, fontSize: 15, lineHeight: 24 },
  actionSection: { gap: SPACING.md, marginTop: SPACING.lg },
  actionBtn: { width: "100%" },
  outlineBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: { fontSize: 14, letterSpacing: 2 },
});
