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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { safeBack } from "../lib/safeBack";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../src/context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { FONTS, SPACING, RADIUS } from "../src/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LibraryScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"books" | "videos">("books");
  const [books, setBooks] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const fetchLibraryData = async () => {
    setLoading(true);
    try {
      const [booksRes, videosRes] = await Promise.all([
        supabase.from("library_books").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("library_videos").select("*").eq("is_active", true).order("sort_order"),
      ]);

      if (booksRes.data) setBooks(booksRes.data);
      if (videosRes.data) setVideos(videosRes.data);
    } catch (e) {
      console.error("Library fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleBookPress = (book: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/library-book",
      params: { id: book.id, title: book.title },
    });
  };

  const handleVideoPress = (video: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/library-video",
      params: { id: video.id, title: video.title },
    });
  };

  const renderBookItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={0.8}
      onPress={() => handleBookPress(item)}
      style={[
        styles.card,
        { backgroundColor: theme.bgSurface, borderColor: theme.border },
      ]}
    >
      <Image
        source={{ uri: item.cover_url || "https://via.placeholder.com/150" }}
        style={styles.bookCover}
      />
      <View style={styles.cardInfo}>
        <Text
          style={[
            styles.itemCategory,
            { color: theme.gold, fontFamily: FONTS.bold },
          ]}
        >
          {item.category?.toUpperCase() || "LITERATURE"}
        </Text>
        <Text
          style={[styles.itemTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.itemAuthor, { color: theme.textMuted }]}
          numberOfLines={1}
        >
          By {item.author}
        </Text>
        <View style={styles.ratingRow}>
          <Feather name="star" size={14} color={theme.gold} />
          <Text style={[styles.ratingText, { color: theme.gold }]}>
            {item.rating || "4.8"} / 5.0
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderVideoItem = (item: any) => {
    const thumbUrl =
      item.thumbnail_url ||
      (item.youtube_id
        ? `https://img.youtube.com/vi/${item.youtube_id}/maxresdefault.jpg`
        : "https://via.placeholder.com/300x169");

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.8}
        onPress={() => handleVideoPress(item)}
        style={[
          styles.card,
          { backgroundColor: theme.bgSurface, borderColor: theme.border, flexDirection: 'column', padding: SPACING.md },
        ]}
      >
        <View style={styles.videoThumbContainer}>
          <Image source={{ uri: thumbUrl }} style={styles.videoThumb} />
          <View style={[styles.durationBadge, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
            <Text style={styles.durationText}>{item.duration_min} MIN</Text>
          </View>
          <View style={styles.playOverlay}>
            <Feather name="play" size={24} color="#FFF" />
          </View>
        </View>
        <View style={[styles.cardInfo, { paddingLeft: 0, marginTop: 12, flex: undefined }]}>
          <Text
            style={[
              styles.itemCategory,
              { color: theme.gold, fontFamily: FONTS.bold },
            ]}
          >
            {item.category?.toUpperCase() || "ARCHIVE"}
          </Text>
          <Text
            style={[styles.itemTitle, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.itemAuthor, { color: theme.textMuted }]}
            numberOfLines={1}
          >
            {item.creator}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bgPrimary }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => safeBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
          THE LIBRARY
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.tabContainer, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.tabBtn, activeTab === "books" && { backgroundColor: theme.bgElevated }]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab("books");
          }}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === "books" ? theme.gold : theme.textMuted,
                fontFamily: activeTab === "books" ? FONTS.bold : FONTS.medium,
              },
            ]}
          >
            READING
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.tabBtn, activeTab === "videos" && { backgroundColor: theme.bgElevated }]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab("videos");
          }}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === "videos" ? theme.gold : theme.textMuted,
                fontFamily: activeTab === "videos" ? FONTS.bold : FONTS.medium,
              },
            ]}
          >
            WATCHING
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={theme.gold} />
          </View>
        ) : activeTab === "books" ? (
          books.length > 0 ? (
            books.map(renderBookItem)
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="book" size={48} color={theme.textMuted} style={{ marginBottom: 16 }} />
              <Text style={{ color: theme.textSecondary, fontFamily: FONTS.regular }}>
                No books in the archive yet.
              </Text>
            </View>
          )
        ) : videos.length > 0 ? (
          videos.map(renderVideoItem)
        ) : (
          <View style={styles.emptyContainer}>
            <Feather name="video" size={48} color={theme.textMuted} style={{ marginBottom: 16 }} />
            <Text style={{ color: theme.textSecondary, fontFamily: FONTS.regular }}>
              No videos in the archive yet.
            </Text>
          </View>
        )}
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
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: { fontSize: 18, letterSpacing: 2 },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: SPACING.xl,
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontSize: 13, letterSpacing: 1 },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: RADIUS.sm,
    backgroundColor: "#222",
  },
  cardInfo: { flex: 1, paddingLeft: SPACING.lg, justifyContent: "center" },
  itemCategory: { fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  itemTitle: { fontSize: 16, marginBottom: 4, lineHeight: 22 },
  itemAuthor: { fontSize: 13, marginBottom: 12 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingText: { fontSize: 12, fontFamily: FONTS.medium },
  videoThumbContainer: { position: "relative", width: "100%", height: (SCREEN_WIDTH - SPACING.lg * 2) * (9 / 16), borderRadius: RADIUS.md, overflow: "hidden" },
  videoThumb: { width: "100%", height: "100%", backgroundColor: "#222" },
  playOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" },
  durationBadge: { position: "absolute", bottom: 8, right: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  durationText: { color: "#FFF", fontSize: 10, fontFamily: FONTS.bold },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
});
