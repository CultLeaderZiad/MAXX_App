import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../src/context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { FONTS, SPACING, RADIUS } from "../src/constants/theme";
import { supabase } from "../lib/supabase";

export default function FavoritesScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    fetchFavorites();
  }, [user?.id]);

  const fetchFavorites = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setFavorites(data);
      }
    } catch (e) {
      console.log("Error fetching favorites", e);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      await supabase.from("favorites").delete().eq("id", id);
      setFavorites(prev => prev.filter(f => f.id !== id));
    } catch (e) {
      console.log(e);
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "video": return "video";
      case "supplement": return "droplet";
      case "book": return "book-open";
      case "exercise": return "activity";
      default: return "star";
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>
          WISHLIST & BOOKMARKS
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={theme.gold} size="large" />
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Feather name="bookmark" size={60} color={theme.border} style={{ marginBottom: 20 }} />
          <Text style={[styles.emptyTitle, { color: theme.textSecondary, fontFamily: FONTS.cinzelBold }]}>
            NOTHING SAVED YET
          </Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            Your bookmarked videos, supplements, and guides will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {favorites.map((fav) => (
            <View key={fav.id} style={[styles.favCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
              {fav.item_image_url ? (
                <Image source={{ uri: fav.item_image_url }} style={styles.favImage} />
              ) : (
                <View style={[styles.favIconWrap, { backgroundColor: theme.bgElevated }]}>
                  <Feather name={renderIcon(fav.item_type)} size={24} color={theme.gold} />
                </View>
              )}
              <View style={styles.favInfo}>
                <Text style={[styles.favTitle, { color: theme.textPrimary, fontFamily: FONTS.bold }]} numberOfLines={1}>
                  {fav.item_title}
                </Text>
                <Text style={[styles.favSubtitle, { color: theme.textMuted, fontFamily: FONTS.regular }]} numberOfLines={1}>
                  {fav.item_type.toUpperCase()} {fav.item_subtitle ? `• ${fav.item_subtitle}` : ""}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeFavorite(fav.id)} style={styles.trashBtn}>
                <Feather name="trash-2" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SPACING.md },
  backBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 16, letterSpacing: 2 },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, letterSpacing: 1, marginBottom: 12, textAlign: "center" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  scroll: { padding: SPACING.md, paddingBottom: 100 },
  favCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  favImage: { width: 50, height: 50, borderRadius: RADIUS.md },
  favIconWrap: { width: 50, height: 50, borderRadius: RADIUS.md, justifyContent: "center", alignItems: "center" },
  favInfo: { flex: 1, paddingHorizontal: SPACING.md },
  favTitle: { fontSize: 16, marginBottom: 4 },
  favSubtitle: { fontSize: 12, letterSpacing: 1 },
  trashBtn: { padding: 8 },
});
