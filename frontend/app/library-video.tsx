import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { useTheme } from "../src/context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { FONTS, SPACING, RADIUS } from "../src/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LibraryVideoScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const videoId = params.id as string;

  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (videoId) {
      fetchVideo();
      checkFavorite();
    }
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      const { data, error } = await supabase
        .from("library_videos")
        .select("*")
        .eq("id", videoId)
        .single();
      if (!error && data) {
        setVideo(data);
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
        .eq("item_id", videoId)
        .maybeSingle();
      if (data) setIsFavorite(true);
    } catch (e) {
      console.log(e);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !video) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    try {
      if (isFavorite) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", videoId);
        setIsFavorite(false);
      } else {
        await supabase.from("favorites").insert({
          user_id: user.id,
          item_type: "video",
          item_id: videoId,
          item_title: video.title,
          item_image_url: video.thumbnail_url || (video.youtube_id ? `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg` : null),
          item_subtitle: video.creator,
        });
        setIsFavorite(true);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.gold} />
      </SafeAreaView>
    );
  }

  if (!video) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.textSecondary, fontFamily: FONTS.regular }}>Video not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.gold, fontFamily: FONTS.medium }}>GO BACK</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            background-color: ${theme.bgPrimary}; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh;
          }
          iframe { 
            width: 100%; 
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        ${
          video.youtube_id 
          ? `<iframe src="https://www.youtube.com/embed/${video.youtube_id}?autoplay=0&playsinline=1&modestbranding=1&rel=0" allowfullscreen allow="autoplay; fullscreen"></iframe>`
          : `<div style="color: ${theme.gold}; font-family: sans-serif; text-align: center; padding: 20px;">VIDEO SOURCE UNAVAILABLE</div>`
        }
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]} numberOfLines={1}>
          ARCHIVE FEED
        </Text>
        <TouchableOpacity onPress={toggleFavorite} style={styles.backBtn} disabled={isSaving}>
          <Feather name="bookmark" size={24} color={isFavorite ? theme.gold : theme.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.videoContainer}>
          <WebView
            source={{ html: htmlContent }}
            style={styles.webview}
            scrollEnabled={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        </View>

        <View style={styles.content}>
          <Text style={[styles.category, { color: theme.gold, fontFamily: FONTS.bold }]}>
            {video.category?.toUpperCase() || "VISUAL MEDIA"}
          </Text>
          <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
            {video.title}
          </Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="user" size={14} color={theme.textMuted} />
              <Text style={[styles.metaText, { color: theme.textMuted, fontFamily: FONTS.medium }]}>
                {video.creator || "Unknown Creator"}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="clock" size={14} color={theme.textMuted} />
              <Text style={[styles.metaText, { color: theme.textMuted, fontFamily: FONTS.medium }]}>
                {video.duration_min || 0} min
              </Text>
            </View>
          </View>

          {video.tags && video.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {video.tags.map((tag: string, index: number) => (
                <View key={index} style={[styles.tagBadge, { backgroundColor: theme.bgElevated }]}>
                  <Text style={[styles.tagText, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>
                    #{tag.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider} />

          <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>DESCRIPTION</Text>
          <Text style={[styles.description, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
            {video.description || "No description available for this feed."}
          </Text>
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
  scroll: { paddingBottom: 100 },
  videoContainer: {
    width: "100%",
    height: SCREEN_WIDTH * (9 / 16),
    backgroundColor: "#000",
  },
  webview: { flex: 1, backgroundColor: "transparent" },
  content: { padding: SPACING.lg },
  category: { fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 22, lineHeight: 28, marginBottom: 16 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 14 },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: SPACING.xl },
  tagBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.round },
  tagText: { fontSize: 11, letterSpacing: 1 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 14, letterSpacing: 2, marginBottom: SPACING.md },
  description: { fontSize: 15, lineHeight: 24 },
});
