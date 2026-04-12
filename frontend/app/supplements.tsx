import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Animated, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { FONTS } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = ['All', 'Testosterone', 'Jaw & Bone', 'Energy', 'Focus', 'Sexual Health', 'Skin', 'Sleep'];
const BRANDS = [
  { name: 'Gorilla Mind', tag: 'Aesthetic' },
  { name: 'Thorne', tag: 'Clinical' },
  { name: 'MAXX', tag: 'Synergy' }
];

export default function SupplementCatalog() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [supplements, setSupplements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const scrollY = useRef(new Animated.Value(0)).current;

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

  const handleTabChange = (tab: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(tab);
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <Text style={[styles.headerTitle, { fontFamily: FONTS.cinzelBold, color: theme.textPrimary }]}>ALPHA PHARMA</Text>
      <Text style={[styles.headerSub, { fontFamily: FONTS.regular, color: theme.textMuted }]}>Science-backed · Bio-available · Optimized</Text>

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
            <Text style={[styles.aiButtonSub, { fontFamily: FONTS.medium }]}>Calibrate protocol to your genetics & goals</Text>
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
                    backgroundColor: selectedCategory === tab ? 'rgba(200,169,110,0.15)' : 'transparent',
                    borderColor: selectedCategory === tab ? (theme.gold || '#C8A96E') : 'transparent',
                    borderWidth: 1
                }
            ]}
          >
            <Text style={[
                styles.tabText, 
                { 
                    color: selectedCategory === tab ? (theme.gold || '#C8A96E') : theme.textMuted, 
                    fontFamily: selectedCategory === tab ? FONTS.bold : FONTS.semiBold 
                }
            ]}>{tab}</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.sectionHeaderRow}>
        <Feather name="award" size={16} color={theme.gold || '#C8A96E'} />
        <Text style={[styles.sectionLabel, { fontFamily: FONTS.bold, color: theme.textMuted }]}> PHARMA-GRADE STANDARDS</Text>
      </View>
      
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={BRANDS}
        keyExtractor={item => item.name}
        style={styles.brandList}
        renderItem={({ item }) => (
          <View style={[styles.brandCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <Text style={[styles.brandName, { fontFamily: FONTS.bold, color: theme.textPrimary }]}>{item.name}</Text>
            <Text style={[styles.brandTag, { color: theme.gold || '#C8A96E', fontFamily: FONTS.medium }]}>{item.tag}</Text>
          </View>
        )}
      />

      <View style={styles.sectionHeaderRow}>
        <Feather name="target" size={16} color={theme.gold || '#C8A96E'} />
        <Text style={[styles.sectionLabel, { fontFamily: FONTS.bold, color: theme.textMuted }]}> PROTOCOL CATALOG</Text>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => {
    const isFeatured = item.sort_order <= 3;
    const planRequired = item.required_plan || 'trial';
    
    return (
      <View>
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
            { backgroundColor: theme.bgSurface, borderColor: isFeatured ? (theme.gold || '#C8A96E') + '44' : theme.border },
            isFeatured && { shadowColor: theme.gold || '#C8A96E', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }
          ]}
        >
          <View style={[styles.suppImageContainer, { backgroundColor: '#FFF', overflow: 'hidden' }]}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.suppImage} />
            ) : (
              <View style={{ flex: 1, backgroundColor: 'rgba(200,169,110,0.1)', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <Feather name={
                  item.category.includes('Test') ? 'activity' :
                  item.category.includes('Bone') ? 'hexagon' :
                  item.category.includes('Sleep') ? 'moon' :
                  item.category.includes('Focus') ? 'target' : 'zap'
                } size={28} color={theme.gold || '#C8A96E'} />
              </View>
            )}
          </View>
          
          <View style={styles.suppInfo}>
            <View style={styles.suppHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.suppName, { color: theme.textPrimary, fontFamily: FONTS.bold }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.suppCategory, { color: theme.gold || '#C8A96E', fontFamily: FONTS.bold }]}>{item.category.toUpperCase()}</Text>
              </View>
              <View style={styles.doseInfo}>
                <Text style={[styles.suppDoseValue, { color: theme.textPrimary, fontFamily: FONTS.bold }]}>{item.dose_text}</Text>
                <Text style={[styles.suppDoseLabel, { color: theme.textMuted }]}>Daily Protocol</Text>
              </View>
            </View>

            <Text numberOfLines={2} style={[styles.suppDesc, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>{item.what_it_does}</Text>

            <View style={styles.suppFooter}>
              <View style={[styles.brandTagMini, { backgroundColor: theme.bgElevated }]}>
                <Text style={[styles.brandTagMiniText, { color: theme.textMuted }]}>PURE-TECH</Text>
              </View>
              
              <View style={[
                styles.planBadge,
                { backgroundColor: planRequired === 'alpha' ? 'rgba(122, 90, 44, 0.4)' : 'rgba(30, 70, 32, 0.4)' }
              ]}>
                <Text style={[styles.planBadgeText, { color: planRequired === 'alpha' ? (theme.gold || '#C8A96E') : '#4CAF50' }]}>{planRequired.toUpperCase()}</Text>
              </View>
              <Feather name="chevron-right" size={14} color={theme.textMuted} style={{ marginLeft: 8 }} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} edges={['top']}>
      <View style={[styles.navBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={theme.gold || '#C8A96E'} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { fontFamily: FONTS.cinzelBold, color: theme.textPrimary }]}>ALPHA PHARMA</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.gold || '#C8A96E'} />
        </View>
      ) : (
        <FlatList
          data={filteredCatalog}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
  headerTitle: { fontSize: 28, letterSpacing: 2 },
  headerSub: { fontSize: 13, marginTop: 6, opacity: 0.8 },
  aiButtonCard: { marginTop: 30, borderRadius: 20, overflow: 'hidden', height: 74 },
  aiButtonGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  aiButtonTextContainer: { flex: 1 },
  aiButtonTitle: { color: '#000', fontSize: 15, letterSpacing: 0.5 },
  aiButtonSub: { color: '#000', fontSize: 11, opacity: 0.7, marginTop: 2 },
  aiPulseCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  categoryList: { marginTop: 25, marginBottom: 20 },
  tabBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, marginRight: 10 },
  tabText: { fontSize: 13, letterSpacing: 0.5 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 15 },
  sectionLabel: { fontSize: 11, letterSpacing: 2, marginLeft: 8 },
  brandList: { marginBottom: 30 },
  brandCard: { width: 140, padding: 15, borderRadius: 16, borderWidth: 1, marginRight: 12 },
  brandName: { fontSize: 14 },
  brandTag: { fontSize: 10, marginTop: 4 },
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
  suppDesc: { fontSize: 12, marginTop: 8, lineHeight: 18 },
  suppFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  brandTagMini: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  brandTagMiniText: { fontSize: 9, fontWeight: 'bold' },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  planBadgeText: { fontSize: 9, fontWeight: 'bold' },
});
