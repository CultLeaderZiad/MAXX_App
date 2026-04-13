import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  Alert,
  Image,
  Share,
} from "react-native";
import * as Sharing from "expo-sharing";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { safeBack } from "../lib/safeBack";
import { WebView } from "react-native-webview";
import { useTheme } from "../src/context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { FONTS, SPACING, RADIUS } from "../src/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// YouTube refinement logic: use URI source for better header handling
const getYoutubeUri = (id: string) => `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0&showinfo=0&mute=0&playsinline=1&origin=https://www.youtube.com`;

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
  const [webViewError, setWebViewError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

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
        .select("*, library_creators(*)")
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

  const handleShare = async () => {
      if (!video?.youtube_id) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const url = `https://youtu.be/${video.youtube_id}`;
      try {
          await Share.share({
              message: `${video.title}\nWatch here: ${url}\n\nShared from MAXX`,
              url: url // iOS only
          });
      } catch (e) {
          Linking.openURL(url);
      }
  };

  const openInYouTube = () => {
    if (!video?.youtube_id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ytUrl = `https://www.youtube.com/watch?v=${video.youtube_id}`;
    Linking.openURL(ytUrl).catch(() => {
      Alert.alert('Error', 'Could not open YouTube. Please try again.');
    });
  };

  const videoUri = video?.youtube_id ? getYoutubeUri(video.youtube_id) : null;

  // ─── Early returns (AFTER all hooks) ──────────────────────────────
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
        <TouchableOpacity onPress={() => safeBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.gold, fontFamily: FONTS.medium }}>GO BACK</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const creator = video.library_creators;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]} numberOfLines={1}>
          ARCHIVE FEED
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.videoContainer}>
          {webViewError ? (
            <TouchableOpacity onPress={openInYouTube} style={styles.errorFallback}>
              <Feather name="youtube" size={48} color={theme.gold} />
              <Text style={{ color: theme.gold, fontFamily: FONTS.bold, marginTop: 12, fontSize: 14 }}>OPEN IN YOUTUBE</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>Player failed to load — tap to watch externally</Text>
            </TouchableOpacity>
          ) : !isPlaying ? (
            <TouchableOpacity onPress={() => setIsPlaying(true)} style={{flex: 1, backgroundColor: '#000'}} activeOpacity={0.9}>
              <Image 
                source={{ uri: video?.thumbnail_url || `https://img.youtube.com/vi/${video?.youtube_id}/hqdefault.jpg` }}
                style={{ width: '100%', height: '100%', resizeMode: 'cover', opacity: 0.7 }}
              />
              <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.gold }}>
                  <Feather name="play" size={28} color={theme.gold} style={{ marginLeft: 4 }} />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <WebView
              source={{ 
                  uri: videoUri || '',
                  headers: {
                    'Referer': 'https://www.youtube.com',
                    'Origin': 'https://www.youtube.com'
                  }
              }}
              style={styles.webview}
              scrollEnabled={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              onError={() => setWebViewError(true)}
              onHttpError={() => setWebViewError(true)}
              startInLoadingState={true}
              renderLoading={() => <ActivityIndicator size="large" color={theme.gold} style={{ flex: 1, backgroundColor: '#000' }} />}
              userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
              allowsFullscreenVideo={true}
            />
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                  <Text style={[styles.category, { color: theme.gold, fontFamily: FONTS.bold }]}>
                    {video.category?.toUpperCase() || "VISUAL MEDIA"}
                  </Text>
                  <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
                    {video.title}
                  </Text>
              </View>
              <View style={{ alignItems: 'center', paddingLeft: 10 }}>
                <TouchableOpacity onPress={toggleFavorite} style={styles.loveBtn}>
                    <Feather name="heart" size={28} color={isFavorite ? theme.gold : theme.textMuted} fill={isFavorite ? theme.gold : "transparent"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={[styles.loveBtn, { marginTop: 8 }]}>
                    <Feather name="share-2" size={24} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
          </View>
          
          <View style={styles.creatorProfile}>
              <Image 
                source={{ uri: creator?.profile_image_url || "https://img.youtube.com/vi/" + video.youtube_id + "/default.jpg" }} 
                style={styles.creatorAvatar}
              />
              <View>
                  <Text style={[styles.creatorName, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>
                    {video.creator || "Unknown Creator"}
                  </Text>
                  <Text style={[styles.creatorHandle, { color: theme.textMuted }]}>
                    {creator?.handle || "@" + (video.creator?.replace(/\s/g, "") || "creator")}
                  </Text>
              </View>
              <View style={styles.durationBadge}>
                  <Feather name="clock" size={14} color={theme.textMuted} />
                  <Text style={[styles.metaText, { color: theme.textMuted, fontFamily: FONTS.medium }]}>
                    {video.duration_min || 0} min
                  </Text>
              </View>
          </View>

          <TouchableOpacity onPress={openInYouTube} style={[styles.ytFallbackBtn, { borderColor: theme.border }]}>
            <Feather name="external-link" size={16} color={theme.gold} />
            <Text style={{ color: theme.gold, fontFamily: FONTS.medium, fontSize: 13, marginLeft: 8 }}>Watch in YouTube App</Text>
          </TouchableOpacity>

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
  headerTitle: { fontSize: 16, letterSpacing: 2, flex: 1, textAlign: "center" },
  scroll: { paddingBottom: 100 },
  videoContainer: {
    width: "100%",
    height: SCREEN_WIDTH * (9 / 16),
    backgroundColor: "#000",
  },
  webview: { flex: 1, backgroundColor: "transparent" },
  content: { padding: SPACING.lg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  loveBtn: { padding: 8, marginTop: 4 },
  category: { fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 24, lineHeight: 30, marginBottom: 4 },
  creatorProfile: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: 'rgba(255,255,255,0.03)', 
      padding: 12, 
      borderRadius: RADIUS.lg,
      marginBottom: 20,
      gap: 12
  },
  creatorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#222' },
  creatorName: { fontSize: 15 },
  creatorHandle: { fontSize: 12, marginTop: 1 },
  durationBadge: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: SPACING.xl },
  sectionTitle: { fontSize: 13, letterSpacing: 2, marginBottom: SPACING.md, color: 'rgba(255,255,255,0.5)' },
  description: { fontSize: 15, lineHeight: 24 },
  errorFallback: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  ytFallbackBtn: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      paddingVertical: 14, 
      borderRadius: RADIUS.md, 
      borderWidth: 1,
      backgroundColor: 'rgba(255,215,0,0.05)'
  },
});

