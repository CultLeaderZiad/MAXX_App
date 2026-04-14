import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Animated, ActivityIndicator, Dimensions, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { safeBack } from '../lib/safeBack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { FONTS } from '../src/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.82;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.6;
const SPACING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

const CATEGORIES = ['All', 'Testosterone', 'Muscle Building', 'Fat Loss', 'Jaw & Bone', 'Energy', 'Focus', 'Sleep'];

export default function SupplementCatalog() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [supplements, setSupplements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'deck'>('deck');
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const { data, error } = await supabase
        .from('supplement_catalog')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setSupplements(data || []);
    } catch (err) {
      console.error('Catalog fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCatalog = selectedCategory === 'All' 
    ? supplements 
    : supplements.filter(item => item.category === selectedCategory);

  const recommendedSupps = supplements.slice(0, 5); // Just taking top 5 for recommendation

  const handleTabChange = (tab: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(tab);
  };

  const toggleViewMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(prev => prev === 'list' ? 'deck' : 'list');
  };

  const checkWishlist = async (itemId: string) => {
    if (!user) return false;
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .eq('item_type', 'supplement')
        .maybeSingle();
      return !!data;
    } catch (e) {
      return false;
    }
  };

  const toggleWishlist = async (item: any) => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const isFav = await checkWishlist(item.id);
      if (isFav) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('item_id', item.id);
      } else {
        await supabase.from('favorites').insert({
          user_id: user.id,
          item_type: 'supplement',
          item_id: item.id,
          item_title: item.name,
          item_subtitle: item.brand,
          item_image_url: item.image_url
        });
      }
      fetchCatalog(); // Refresh to show updated states if needed
    } catch (e) {
      console.log(e);
    }
  };

  const handleBuy = (link: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (link) {
          Linking.openURL(link);
      } else {
          Alert.alert("Coming Soon", "The direct link for this stack element is being verified by our pharma-partners.");
      }
  };

  const renderDeckItem = ({ item, index }: { item: any, index: number }) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + 20),
      index * (CARD_WIDTH + 20),
      (index + 1) * (CARD_WIDTH + 20),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.92, 1, 0.92],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.deckCardContainer, { transform: [{ scale }], opacity }]}>
        <View
          style={[styles.deckCard, { backgroundColor: theme.bgSurface, borderColor: theme.gold + '33' }]}
        >
          <LinearGradient
            colors={[theme.gold + '08', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={styles.deckBadge}>
            <Text style={[styles.deckBadgeText, { color: theme.gold, fontFamily: FONTS.bold }]}>ALPHA STACK RECORD</Text>
          </View>

          <View style={[styles.deckImageContainer, { backgroundColor: '#FFF' }]}>
             {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.deckImage} />
              ) : (
                <Feather name="zap" size={60} color={theme.gold} />
              )}
          </View>

          <View style={styles.deckContent}>
            <Text style={[styles.deckBrand, { color: theme.gold, fontFamily: FONTS.bold }]}>{item.brand?.toUpperCase() || 'PHARMA-GRADE'}</Text>
            <Text style={[styles.deckTitle, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]} numberOfLines={2}>{item.name}</Text>
            
            <View style={styles.deckStats}>
              <View style={styles.deckStat}>
                <Text style={[styles.deckStatLabel, { color: theme.textMuted }]}>GOAL</Text>
                <Text style={[styles.deckStatValue, { color: theme.textPrimary, fontFamily: FONTS.bold }]} numberOfLines={1}>{item.category}</Text>
              </View>
              <View style={[styles.deckStat, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', paddingLeft: 15 }]}>
                <Text style={[styles.deckStatLabel, { color: theme.textMuted }]}>EFFICIENCY</Text>
                <Text style={[styles.deckStatValue, { color: theme.gold, fontFamily: FONTS.bold }]}>★ {item.rating || '4.9'}</Text>
              </View>
            </View>

            <Text numberOfLines={3} style={[styles.deckDesc, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
              {item.what_it_does}
            </Text>

            <View style={styles.deckFooter}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => handleBuy(item.buy_link)} style={{ flex: 1 }}>
                  <LinearGradient
                    colors={[theme.gold || '#C8A96E', '#8A6420']}
                    style={styles.deckButton}
                  >
                    <Text style={[styles.deckButtonText, { fontFamily: FONTS.bold }]}>MAIN LINK</Text>
                  </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => toggleWishlist(item)}
                style={[styles.wishlistBtn, { borderColor: theme.border }]}
              >
                <Feather name="heart" size={20} color={theme.gold} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.headerTopRow}>
        <View>
          <Text style={[styles.headerTitle, { fontFamily: FONTS.cinzelBold, color: theme.textPrimary }]}>SUPPLEMENTS</Text>
          <Text style={[styles.headerSub, { fontFamily: FONTS.regular, color: theme.textMuted }]}>The Bio-Hacker''s Arsenal</Text>
        </View>
        <TouchableOpacity onPress={toggleViewMode} style={[styles.viewToggle, { backgroundColor: theme.bgElevated }]}>
          <Feather name={viewMode === 'list' ? 'layers' : 'list'} size={20} color={theme.gold} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          router.push('/stack-builder');
        }}
        style={styles.aiButtonCard}
      >
        <LinearGradient
          colors={[theme.gold || '#C8A96E', '#8A6420']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiButtonGradient}
        >
          <View style={styles.aiButtonTextContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="cpu" size={14} color="#0A0A0A" />
              <Text style={[styles.aiButtonTitle, { fontFamily: FONTS.bold }]}>GENERATE MY STACK (AI)</Text>
            </View>
            <Text style={[styles.aiButtonSub, { fontFamily: FONTS.medium }]}>Custom protocol based on Bio-Age & Goals</Text>
          </View>
          <View style={styles.aiPulseCircle}>
             <Feather name="zap" size={18} color="#0A0A0A" />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={item => item}
        style={styles.categoryList}
        renderItem={({ item: tab }) => (
          <TouchableOpacity
            onPress={() => handleTabChange(tab)}
            style={[
                styles.tabBtn, 
                { 
                    backgroundColor: selectedCategory === tab ? theme.gold + '22' : 'transparent',
                    borderColor: selectedCategory === tab ? theme.gold : 'transparent',
                    borderWidth: 1
                }
            ]}
          >
            <Text style={[
                styles.tabText, 
                { 
                    color: selectedCategory === tab ? theme.gold : theme.textMuted, 
                    fontFamily: selectedCategory === tab ? FONTS.bold : FONTS.semiBold 
                }
            ]}>{tab}</Text>
          </TouchableOpacity>
        )}
      />

      {viewMode === 'list' && (
        <View style={styles.sectionHeaderRow}>
          <Feather name="target" size={16} color={theme.gold} />
          <Text style={[styles.sectionLabel, { fontFamily: FONTS.bold, color: theme.textMuted }]}> RECOMMENDED FOR YOU</Text>
        </View>
      )}
    </View>
  );

  const renderListItem = ({ item }: { item: any }) => {
    const isFeatured = item.sort_order <= 3;
    const planRequired = item.required_plan || 'trial';
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          Haptics.selectionAsync();
          router.push({
            pathname: '/supplement-detail',
            params: { supplement: JSON.stringify(item) }
          });
        }}
        style={[
          styles.suppCard,
          { backgroundColor: theme.bgSurface, borderColor: isFeatured ? theme.gold + '44' : theme.border },
          isFeatured && { shadowColor: theme.gold, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }
        ]}
      >
        <View style={[styles.suppImageContainer, { backgroundColor: '#FFF' }]}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.suppImage} />
          ) : (
            <Feather name="package" size={24} color={theme.gold} />
          )}
        </View>
        
        <View style={styles.suppInfo}>
          <View style={styles.suppHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.suppName, { color: theme.textPrimary, fontFamily: FONTS.bold }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.suppCategory, { color: theme.gold, fontFamily: FONTS.bold }]}>{item.category.toUpperCase()}</Text>
            </View>
            <View style={styles.doseInfo}>
              <Text style={[styles.suppDoseValue, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>{item.dose_text}</Text>
              <Text style={[styles.suppDoseLabel, { color: theme.textMuted }]}>Protocol</Text>
            </View>
          </View>

          <Text numberOfLines={2} style={[styles.suppDesc, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>{item.what_it_does}</Text>

          <View style={styles.suppFooter}>
             <View style={[styles.planBadge, { backgroundColor: planRequired === 'alpha' ? 'rgba(200,169,110,0.2)' : 'rgba(74, 222, 128, 0.1)' }]}>
                <Text style={[styles.planBadgeText, { color: planRequired === 'alpha' ? theme.gold : '#4ADE80' }]}>{planRequired.toUpperCase()}</Text>
             </View>
             <View style={{ flex: 1 }} />
             <Feather name="chevron-right" size={16} color={theme.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} edges={['top']}>
      <View style={[styles.navBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { fontFamily: FONTS.cinzelBold, color: theme.textPrimary }]}>MAXX PHARMA</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.gold} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {viewMode === 'deck' ? (
            <View style={{ flex: 1 }}>
              {renderHeader()}
              <Animated.FlatList
                horizontal
                data={filteredCatalog}
                renderItem={renderDeckItem}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + 20}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: SPACING, paddingBottom: 50 }}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: true }
                )}
              />
            </View>
          ) : (
            <FlatList
              data={filteredCatalog}
              renderItem={renderListItem}
              keyExtractor={item => item.id}
              ListHeaderComponent={renderHeader}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    height: 60,
    borderBottomWidth: 1 
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  navTitle: { fontSize: 16, letterSpacing: 2 },
  listContent: { paddingBottom: 40 },
  headerContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, letterSpacing: 2 },
  headerSub: { fontSize: 13, marginTop: 4, opacity: 0.8 },
  viewToggle: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  aiButtonCard: { marginTop: 25, borderRadius: 20, overflow: 'hidden', height: 74 },
  aiButtonGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  aiButtonTextContainer: { flex: 1 },
  aiButtonTitle: { color: '#000', fontSize: 13, letterSpacing: 1 },
  aiButtonSub: { color: '#000', fontSize: 10, opacity: 0.7, marginTop: 2 },
  aiPulseCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  categoryList: { marginTop: 25, marginBottom: 15 },
  tabBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 12, marginRight: 8 },
  tabText: { fontSize: 12, letterSpacing: 0.5 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 15 },
  sectionLabel: { fontSize: 11, letterSpacing: 2, marginLeft: 8 },
  
  // List Styles
  suppCard: { 
    marginHorizontal: 20, 
    marginBottom: 16, 
    borderRadius: 20, 
    padding: 16, 
    flexDirection: 'row', 
    borderWidth: 1,
    alignItems: 'center'
  },
  suppImageContainer: { width: 70, height: 70, borderRadius: 15, justifyContent: 'center', alignItems: 'center', padding: 8 },
  suppImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  suppInfo: { flex: 1, marginLeft: 16 },
  suppHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  suppName: { fontSize: 16 },
  suppCategory: { fontSize: 10, marginTop: 2 },
  doseInfo: { alignItems: 'flex-end' },
  suppDoseValue: { fontSize: 13 },
  suppDoseLabel: { fontSize: 8, opacity: 0.6 },
  suppDesc: { fontSize: 12, marginTop: 8, lineHeight: 18, opacity: 0.8 },
  suppFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  planBadgeText: { fontSize: 9, fontWeight: 'bold' },

  // Deck Styles
  deckCardContainer: { 
    width: CARD_WIDTH + 20, 
    height: CARD_HEIGHT, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  deckCard: { 
    width: CARD_WIDTH, 
    height: CARD_HEIGHT, 
    borderRadius: 30, 
    backgroundColor: '#0A0A0A', 
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20
  },
  deckBadge: { 
    alignSelf: 'flex-start', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8, 
    backgroundColor: 'rgba(200,169,110,0.15)',
    marginBottom: 20
  },
  deckBadgeText: { fontSize: 10, letterSpacing: 1 },
  deckImageContainer: { 
    height: 160, 
    width: '100%', 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10
  },
  deckImage: { width: '70%', height: '70%', resizeMode: 'contain' },
  deckContent: { flex: 1 },
  deckBrand: { fontSize: 10, letterSpacing: 2, marginBottom: 4 },
  deckTitle: { fontSize: 26, lineHeight: 32, marginBottom: 16 },
  deckStats: { flexDirection: 'row', gap: 24, marginBottom: 20 },
  deckStat: { flex: 1 },
  deckStatLabel: { fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  deckStatValue: { fontSize: 12 },
  deckDesc: { fontSize: 14, lineHeight: 22, opacity: 0.7 },
  deckFooter: { marginTop: 'auto', paddingTop: 20 },
  deckButton: { height: 54, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  deckButtonText: { color: '#000', fontSize: 13, letterSpacing: 1.5 },
  wishlistBtn: {
    width: 54,
    height: 54,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: 'rgba(255,255,255,0.03)'
  }
});
