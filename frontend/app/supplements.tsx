import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder, Dimensions,
  TouchableOpacity, Image, ScrollView, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../src/context/ThemeContext';
import { FONTS, SPACING, RADIUS, GOLD } from '../src/constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');
const CARD_W = Math.min(SW - SPACING.lg * 2, 400);
const CARD_H = CARD_W * 1.45;
const SWIPE_THRESHOLD = SW * 0.28;
const ROTATION_FACTOR = 10;

interface Supplement {
  id: string;
  name: string;
  brand: string;
  category: string;
  tagline: string;
  dose: string;
  timing: string;
  color: string;
  warning: string | null;
  why: string;
  stack: string[];
  image: string;
  price: { size: string; amount: string; per_serving: string }[];
  rating: number;
  reviews: number;
  priority: number;
  amazon_url: string;
  iherb_url: string;
}

const SUPPLEMENTS: Supplement[] = [
  {
    id: 'creatine', name: 'Creatine Monohydrate', brand: 'Optimum Nutrition',
    category: 'Performance', tagline: 'The most studied supplement in history.',
    dose: '5g daily, any time', timing: 'Post-workout or with food',
    color: '#2ECC71', warning: null, priority: 1,
    why: 'Increases ATP synthesis → more strength, faster recovery, better cognition.',
    stack: ['whey', 'beta_alanine'],
    image: 'https://images.unsplash.com/photo-1693996045899-7cf0ac0229c7?w=800&q=80',
    price: [
      { size: '300g (60 srv)', amount: '$19.99', per_serving: '$0.33' },
      { size: '600g (120 srv)', amount: '$32.99', per_serving: '$0.27' },
      { size: '1kg (200 srv)', amount: '$44.99', per_serving: '$0.22' },
    ],
    rating: 4.8, reviews: 12843,
    amazon_url: 'https://www.amazon.com/s?k=creatine+monohydrate',
    iherb_url: 'https://www.iherb.com/c/creatine',
  },
  {
    id: 'whey', name: 'Whey Protein Isolate', brand: 'Myprotein',
    category: 'Muscle', tagline: 'Complete amino profile for maximum growth.',
    dose: '25-40g per serving', timing: 'Post-workout or any meal',
    color: '#3498DB', warning: null, priority: 1,
    why: 'Fast-digesting complete protein. Leucine triggers mTOR for muscle synthesis.',
    stack: ['creatine'],
    image: 'https://images.unsplash.com/photo-1664787020149-ebb836adcf3c?w=800&q=80',
    price: [
      { size: '1lb (14 srv)', amount: '$24.99', per_serving: '$1.79' },
      { size: '2lb (28 srv)', amount: '$39.99', per_serving: '$1.43' },
      { size: '5lb (71 srv)', amount: '$69.99', per_serving: '$0.99' },
    ],
    rating: 4.7, reviews: 9201,
    amazon_url: 'https://www.amazon.com/s?k=whey+protein+isolate',
    iherb_url: 'https://www.iherb.com/c/whey-protein',
  },
  {
    id: 'vitamin_d3', name: 'Vitamin D3 + K2', brand: 'Sports Research',
    category: 'Hormones', tagline: 'Testosterone, immunity, mood — all depend on this.',
    dose: '5000 IU D3 + 100mcg K2 daily', timing: 'With fatty meal',
    color: '#F39C12',
    warning: 'Get blood test first. Target 60-80 ng/mL.',
    priority: 1,
    why: 'D3 is a steroid hormone precursor. Deficiency → low T, poor mood, weak immunity.',
    stack: ['omega3', 'magnesium'],
    image: 'https://images.unsplash.com/photo-1601302030807-8cfadb191a24?w=800&q=80',
    price: [
      { size: '30 softgels', amount: '$14.99', per_serving: '$0.50' },
      { size: '60 softgels', amount: '$24.99', per_serving: '$0.42' },
      { size: '120 softgels', amount: '$34.99', per_serving: '$0.29' },
    ],
    rating: 4.9, reviews: 7654,
    amazon_url: 'https://www.amazon.com/s?k=vitamin+d3+k2',
    iherb_url: 'https://www.iherb.com/c/vitamin-d',
  },
  {
    id: 'omega3', name: 'Omega-3 Fish Oil', brand: 'Nordic Naturals',
    category: 'Recovery', tagline: 'Anti-inflammatory. Brain. Heart. Joints.',
    dose: '2-4g EPA+DHA daily', timing: 'With meals',
    color: '#9B59B6', warning: 'High doses can thin blood. Take with food.',
    priority: 2,
    why: 'Reduces systemic inflammation. EPA cuts cortisol. DHA densifies brain.',
    stack: ['vitamin_d3'],
    image: 'https://images.unsplash.com/photo-1668417421159-e6dacfad76a7?w=800&q=80',
    price: [
      { size: '60 softgels', amount: '$22.99', per_serving: '$0.77' },
      { size: '120 softgels', amount: '$38.99', per_serving: '$0.65' },
      { size: '180 softgels', amount: '$49.99', per_serving: '$0.56' },
    ],
    rating: 4.8, reviews: 11200,
    amazon_url: 'https://www.amazon.com/s?k=omega+3+fish+oil',
    iherb_url: 'https://www.iherb.com/c/omega-3-fish-oil',
  },
  {
    id: 'magnesium', name: 'Magnesium Glycinate', brand: 'Thorne',
    category: 'Sleep', tagline: 'Sleep deeper. Recover harder. Stress less.',
    dose: '300-400mg elemental before bed', timing: '30-60 min before sleep',
    color: '#1ABC9C', warning: null, priority: 2,
    why: 'Cofactor in 300+ reactions. Glycinate form is most bioavailable. Raises sleep quality.',
    stack: ['vitamin_d3', 'zinc'],
    image: 'https://images.unsplash.com/photo-1544829894-eb023ba95a38?w=800&q=80',
    price: [
      { size: '60 caps', amount: '$19.99', per_serving: '$0.67' },
      { size: '120 caps', amount: '$32.99', per_serving: '$0.55' },
      { size: '240 caps', amount: '$52.99', per_serving: '$0.44' },
    ],
    rating: 4.7, reviews: 8432,
    amazon_url: 'https://www.amazon.com/s?k=magnesium+glycinate',
    iherb_url: 'https://www.iherb.com/c/magnesium',
  },
  {
    id: 'ashwagandha', name: 'Ashwagandha KSM-66', brand: 'KSM-66',
    category: 'Stress', tagline: 'Cortisol down. Testosterone up. Anxiety crushed.',
    dose: '300-600mg KSM-66 extract', timing: 'Morning with food',
    color: '#E74C3C',
    warning: 'Cycle 8 weeks on, 4 off. Not for autoimmune conditions.',
    priority: 3,
    why: 'Clinically proven +17% testosterone, -28% cortisol. Adaptogen — not addictive.',
    stack: ['omega3', 'magnesium'],
    image: 'https://images.unsplash.com/photo-1729949127879-2d6556e2aee8?w=800&q=80',
    price: [
      { size: '60 caps', amount: '$24.99', per_serving: '$0.83' },
      { size: '120 caps', amount: '$39.99', per_serving: '$0.67' },
      { size: '180 caps', amount: '$54.99', per_serving: '$0.61' },
    ],
    rating: 4.6, reviews: 6891,
    amazon_url: 'https://www.amazon.com/s?k=ashwagandha+ksm-66',
    iherb_url: 'https://www.iherb.com/c/ashwagandha',
  },
  {
    id: 'zinc', name: 'Zinc + Copper Balance', brand: 'Thorne',
    category: 'Hormones', tagline: 'Testosterone synthesis depends on zinc.',
    dose: '15-30mg zinc + 1-2mg copper', timing: 'With food, away from iron',
    color: '#E67E22',
    warning: 'Always pair with copper. Long-term zinc alone depletes copper.',
    priority: 2,
    why: 'Required for T-synthesis, immune function, and skin repair. Especially vital for heavy sweaters.',
    stack: ['magnesium'],
    image: 'https://images.unsplash.com/photo-1763747958224-7726941b0b15?w=800&q=80',
    price: [
      { size: '60 caps', amount: '$17.99', per_serving: '$0.60' },
      { size: '120 caps', amount: '$29.99', per_serving: '$0.50' },
    ],
    rating: 4.7, reviews: 4567,
    amazon_url: 'https://www.amazon.com/s?k=zinc+copper+supplement',
    iherb_url: 'https://www.iherb.com/c/zinc',
  },
  {
    id: 'beta_alanine', name: 'Beta-Alanine', brand: 'BulkSupplements',
    category: 'Performance', tagline: 'Extended sets. Delayed fatigue. More volume.',
    dose: '3.2-6.4g daily (split doses)', timing: 'Pre-workout or throughout day',
    color: '#2980B9',
    warning: 'Causes harmless tingling (paresthesia). Reduces with daily use.',
    priority: 3,
    why: 'Increases carnosine → buffers lactic acid → more reps at high intensity.',
    stack: ['creatine', 'whey'],
    image: 'https://images.unsplash.com/photo-1693996045838-980674653385?w=800&q=80',
    price: [
      { size: '100g', amount: '$9.99', per_serving: '$0.31' },
      { size: '500g', amount: '$24.99', per_serving: '$0.16' },
      { size: '1kg', amount: '$39.99', per_serving: '$0.13' },
    ],
    rating: 4.5, reviews: 3210,
    amazon_url: 'https://www.amazon.com/s?k=beta+alanine+powder',
    iherb_url: 'https://www.iherb.com/c/beta-alanine',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Feather
          key={i}
          name="star"
          size={12}
          color={i <= Math.round(rating) ? GOLD : '#3A3A3A'}
        />
      ))}
    </View>
  );
}

interface CardProps {
  supplement: Supplement;
  index: number;
  isTop: boolean;
  translateX: Animated.Value;
  translateY: Animated.Value;
  rotation: Animated.AnimatedInterpolation<string | number>;
  overlayOpacity: Animated.AnimatedInterpolation<string | number>;
  overlayType: 'add' | 'skip' | 'none';
  panHandlers: Record<string, any>;
  onFlip: () => void;
  flipped: boolean;
}

function SupCard({
  supplement, index, isTop, translateX, translateY, rotation,
  overlayOpacity, overlayType, panHandlers, onFlip, flipped,
}: CardProps) {
  const { theme } = useTheme();
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = isFlipped ? 0 : 180;
    Animated.spring(flipAnim, { toValue, useNativeDriver: true, tension: 50, friction: 8 }).start();
    setIsFlipped(v => !v);
    onFlip();
  };

  const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backInterpolate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  const cardScale = isTop ? 1 : Math.max(0.92 - (index - 1) * 0.04, 0.85);
  const cardTranslateY = isTop ? 0 : (index - 1) * 12;

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: isTop
            ? [{ translateX }, { translateY }, { rotate: rotation }]
            : [{ scale: cardScale }, { translateY: cardTranslateY }],
          zIndex: 10 - index,
        },
      ]}
      {...(isTop ? panHandlers : {})}
    >
      {/* Front */}
      <Animated.View style={[styles.card, { transform: [{ rotateY: frontInterpolate }] }]}>
        <TouchableOpacity activeOpacity={0.95} onPress={handleFlip} style={{ flex: 1 }}>
          {/* Product Image */}
          <View style={[styles.imageWrap, { backgroundColor: supplement.color + '18' }]}>
            <Image
              source={{ uri: supplement.image }}
              style={styles.image}
              resizeMode="cover"
            />
            {/* Category badge */}
            <View style={[styles.catBadge, { backgroundColor: supplement.color }]}>
              <Text style={styles.catBadgeText}>{supplement.category.toUpperCase()}</Text>
            </View>
            {/* Swipe overlays */}
            {isTop && (
              <>
                <Animated.View style={[styles.overlayAdd, { opacity: overlayOpacity }]}>
                  <View style={styles.overlayBadge}>
                    <Feather name="plus-circle" size={24} color="#2ECC71" />
                    <Text style={[styles.overlayText, { color: '#2ECC71' }]}>ADD TO STACK</Text>
                  </View>
                </Animated.View>
                <Animated.View style={[styles.overlaySkip, { opacity: overlayOpacity }]}>
                  <View style={styles.overlayBadge}>
                    <Feather name="x-circle" size={24} color="#E74C3C" />
                    <Text style={[styles.overlayText, { color: '#E74C3C' }]}>SKIP</Text>
                  </View>
                </Animated.View>
              </>
            )}
          </View>

          {/* Info */}
          <View style={[styles.cardInfo, { backgroundColor: theme.bgSurface }]}>
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.supName, { color: theme.textPrimary }]} numberOfLines={1}>{supplement.name}</Text>
                <Text style={[styles.brand, { color: theme.textMuted }]}>{supplement.brand}</Text>
              </View>
              <View style={styles.ratingCol}>
                <StarRating rating={supplement.rating} />
                <Text style={[styles.reviewCount, { color: theme.textMuted }]}>{supplement.reviews.toLocaleString()}</Text>
              </View>
            </View>

            <Text style={[styles.tagline, { color: theme.textSecondary }]} numberOfLines={2}>{supplement.tagline}</Text>

            {/* Pricing */}
            <View style={styles.priceRow}>
              {supplement.price.slice(0, 2).map(p => (
                <View key={p.size} style={[styles.priceCard, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}>
                  <Text style={[styles.priceAmt, { color: supplement.color }]}>{p.amount}</Text>
                  <Text style={[styles.priceSize, { color: theme.textMuted }]}>{p.size}</Text>
                  <Text style={[styles.pricePerServ, { color: theme.textMuted }]}>{p.per_serving}/srv</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.tapHint, { color: theme.textMuted }]}>Tap card to see details</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Back */}
      <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backInterpolate }], backgroundColor: theme.bgSurface }]}>
        <ScrollView contentContainerStyle={styles.backContent} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.sm }}>
            <View style={[styles.colorDot, { backgroundColor: supplement.color }]} />
            <Text style={[styles.backTitle, { color: theme.textPrimary }]}>{supplement.name}</Text>
          </View>

          {supplement.warning && (
            <View style={[styles.warningBox, { backgroundColor: '#E74C3C22', borderColor: '#E74C3C55' }]}>
              <Feather name="alert-triangle" size={14} color="#E74C3C" />
              <Text style={[styles.warningText, { color: '#E74C3C' }]}>{supplement.warning}</Text>
            </View>
          )}

          <Text style={[styles.backLabel, { color: supplement.color }]}>WHY IT WORKS</Text>
          <Text style={[styles.backText, { color: theme.textSecondary }]}>{supplement.why}</Text>

          <Text style={[styles.backLabel, { color: supplement.color }]}>PROTOCOL</Text>
          <View style={[styles.table, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableKey, { color: theme.textMuted }]}>DOSE</Text>
              <Text style={[styles.tableVal, { color: theme.textPrimary }]}>{supplement.dose}</Text>
            </View>
            <View style={[styles.tableRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
              <Text style={[styles.tableKey, { color: theme.textMuted }]}>TIMING</Text>
              <Text style={[styles.tableVal, { color: theme.textPrimary }]}>{supplement.timing}</Text>
            </View>
          </View>

          {/* All pricing */}
          <Text style={[styles.backLabel, { color: supplement.color }]}>PRICING</Text>
          {supplement.price.map(p => (
            <View key={p.size} style={[styles.priceRow2, { borderColor: theme.border }]}>
              <Text style={[{ color: theme.textSecondary, fontFamily: FONTS.regular, fontSize: 13 }]}>{p.size}</Text>
              <Text style={[{ color: supplement.color, fontFamily: FONTS.bold, fontSize: 15 }]}>{p.amount}</Text>
              <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 11 }]}>{p.per_serving}/srv</Text>
            </View>
          ))}

          {/* Buy buttons */}
          <View style={styles.buyRow}>
            <TouchableOpacity
              onPress={() => Linking.openURL(supplement.amazon_url)}
              style={[styles.buyBtn, { backgroundColor: '#FF9900', flex: 1 }]}
            >
              <Feather name="shopping-cart" size={14} color="#000" />
              <Text style={[styles.buyBtnText, { color: '#000' }]}>Amazon</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL(supplement.iherb_url)}
              style={[styles.buyBtn, { backgroundColor: '#8FBF3C', flex: 1 }]}
            >
              <Feather name="external-link" size={14} color="#000" />
              <Text style={[styles.buyBtnText, { color: '#000' }]}>iHerb</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleFlip} style={styles.flipBack}>
            <Feather name="rotate-ccw" size={14} color={GOLD} />
            <Text style={[{ color: GOLD, fontFamily: FONTS.semiBold, fontSize: 13 }]}>Flip back</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

export default function SupplementsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [deck, setDeck] = useState(SUPPLEMENTS);
  const [stack, setStack] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const rotation = translateX.interpolate({
    inputRange: [-SW / 2, 0, SW / 2],
    outputRange: [`-${ROTATION_FACTOR}deg`, '0deg', `${ROTATION_FACTOR}deg`],
    extrapolate: 'clamp',
  });

  const addOverlay = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const skipOverlay = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const flyOut = useCallback((direction: 'left' | 'right') => {
    const toX = direction === 'right' ? SW * 1.5 : -SW * 1.5;
    Animated.parallel([
      Animated.timing(translateX, { toValue: toX, duration: 350, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: direction === 'right' ? -80 : 80, duration: 350, useNativeDriver: true }),
    ]).start(() => {
      setDeck(prev => {
        const [gone, ...rest] = prev;
        if (direction === 'right') setStack(s => [...s, gone.id]);
        return rest;
      });
      translateX.setValue(0);
      translateY.setValue(0);
    });
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !flipped,
      onMoveShouldSetPanResponder: (_, g) => !flipped && (Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8),
      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx);
        translateY.setValue(g.dy * 0.2);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          flyOut('right');
        } else if (g.dx < -SWIPE_THRESHOLD) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          flyOut('left');
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }).start();
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const reset = () => { setDeck(SUPPLEMENTS); setStack([]); };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Supplements</Text>
        <TouchableOpacity
          onPress={() => router.push('/stack-builder' as any)}
          style={[styles.aiBtn, { backgroundColor: theme.gold + '22', borderColor: theme.gold + '40' }]}
        >
          <Feather name="zap" size={14} color={theme.gold} />
          <Text style={[{ color: theme.gold, fontFamily: FONTS.bold, fontSize: 11 }]}>AI Stack</Text>
        </TouchableOpacity>
      </View>

      {/* Stack counter */}
      {stack.length > 0 && (
        <View style={[styles.stackBar, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Feather name="check-circle" size={14} color={theme.gold} />
          <Text style={[{ color: theme.textPrimary, fontFamily: FONTS.semiBold, fontSize: 13, flex: 1 }]}>
            {stack.length} supplement{stack.length > 1 ? 's' : ''} in your stack
          </Text>
          <TouchableOpacity onPress={() => router.push('/stack-builder' as any)}>
            <Text style={[{ color: theme.gold, fontFamily: FONTS.bold, fontSize: 12 }]}>View Stack →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instruction */}
      <View style={styles.hintRow}>
        <View style={styles.hintItem}>
          <Feather name="chevron-left" size={14} color="#E74C3C" />
          <Text style={[styles.hintText, { color: theme.textMuted }]}>Skip</Text>
        </View>
        <Text style={[styles.hintCenter, { color: theme.textMuted }]}>Swipe to explore</Text>
        <View style={styles.hintItem}>
          <Text style={[styles.hintText, { color: theme.textMuted }]}>Add to Stack</Text>
          <Feather name="chevron-right" size={14} color="#2ECC71" />
        </View>
      </View>

      {/* Card deck */}
      <View style={styles.deckArea}>
        {deck.length === 0 ? (
          <View style={styles.emptyDeck}>
            <Feather name="check-circle" size={48} color={theme.gold} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>That's all of them!</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              {stack.length > 0
                ? `${stack.length} supplement${stack.length > 1 ? 's' : ''} added to your stack.`
                : 'No supplements added to stack.'}
            </Text>
            <TouchableOpacity onPress={reset} style={[styles.resetBtn, { backgroundColor: theme.gold }]}>
              <Feather name="refresh-cw" size={14} color="#000" />
              <Text style={{ color: '#000', fontFamily: FONTS.bold, fontSize: 13 }}>Browse Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          deck.slice(0, 3).reverse().map((sup, rIdx) => {
            const actualIdx = Math.min(deck.length, 3) - 1 - rIdx;
            const isTop = actualIdx === 0;
            return (
              <SupCard
                key={sup.id}
                supplement={sup}
                index={actualIdx}
                isTop={isTop}
                translateX={isTop ? translateX : new Animated.Value(0)}
                translateY={isTop ? translateY : new Animated.Value(0)}
                rotation={isTop ? rotation : translateX.interpolate({ inputRange: [-1, 0, 1], outputRange: ['0deg', '0deg', '0deg'] })}
                overlayOpacity={isTop ? addOverlay : new Animated.Value(0)}
                overlayType="none"
                panHandlers={isTop ? panResponder.panHandlers : {}}
                onFlip={() => setFlipped(v => !v)}
                flipped={flipped}
              />
            );
          })
        )}
      </View>

      {/* Action buttons */}
      {deck.length > 0 && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); flyOut('left'); }}
            style={[styles.actionBtn, { backgroundColor: '#E74C3C22', borderColor: '#E74C3C55' }]}
          >
            <Feather name="x" size={22} color="#E74C3C" />
          </TouchableOpacity>
          <View style={[styles.countBadge, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <Text style={[{ color: theme.textPrimary, fontFamily: FONTS.cinzelBold, fontSize: 18 }]}>{deck.length}</Text>
            <Text style={[{ color: theme.textMuted, fontFamily: FONTS.regular, fontSize: 11 }]}>remaining</Text>
          </View>
          <TouchableOpacity
            onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); flyOut('right'); }}
            style={[styles.actionBtn, { backgroundColor: '#2ECC7122', borderColor: '#2ECC7155' }]}
          >
            <Feather name="plus" size={22} color="#2ECC71" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, marginBottom: SPACING.sm },
  backBtn: { padding: 8, marginRight: 8 },
  title: { flex: 1, fontSize: 24, fontFamily: FONTS.cinzelBold },
  aiBtn: { flexDirection: 'row', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1, alignItems: 'center' },
  stackBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1 },
  hintRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, marginBottom: SPACING.sm },
  hintItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hintText: { fontSize: 12, fontFamily: FONTS.regular },
  hintCenter: { fontSize: 12, fontFamily: FONTS.semiBold },
  deckArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  cardContainer: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
  },
  card: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    backgroundColor: '#111111',
  },
  cardBack: {
    backfaceVisibility: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: CARD_H * 0.52,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  catBadge: {
    position: 'absolute', top: SPACING.md, left: SPACING.md,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full,
  },
  catBadgeText: { color: '#000', fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1 },
  overlayAdd: {
    position: 'absolute', inset: 0,
    backgroundColor: '#2ECC7115',
    justifyContent: 'flex-start', alignItems: 'flex-end',
    paddingTop: SPACING.lg, paddingRight: SPACING.lg,
  },
  overlaySkip: {
    position: 'absolute', inset: 0,
    backgroundColor: '#E74C3C15',
    justifyContent: 'flex-start', alignItems: 'flex-start',
    paddingTop: SPACING.lg, paddingLeft: SPACING.lg,
  },
  overlayBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: RADIUS.md, backgroundColor: '#000000AA' },
  overlayText: { fontFamily: FONTS.bold, fontSize: 13, letterSpacing: 1 },
  cardInfo: { flex: 1, padding: SPACING.md },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  supName: { fontSize: 16, fontFamily: FONTS.bold, marginBottom: 2 },
  brand: { fontSize: 12, fontFamily: FONTS.regular },
  ratingCol: { alignItems: 'flex-end', gap: 2 },
  reviewCount: { fontSize: 10, fontFamily: FONTS.regular },
  tagline: { fontSize: 12, fontFamily: FONTS.regular, lineHeight: 18, marginBottom: SPACING.sm },
  priceRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: 4 },
  priceCard: { flex: 1, padding: SPACING.sm, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: 'center' },
  priceAmt: { fontSize: 15, fontFamily: FONTS.bold },
  priceSize: { fontSize: 10, fontFamily: FONTS.regular, marginTop: 1 },
  pricePerServ: { fontSize: 9, fontFamily: FONTS.regular },
  tapHint: { fontSize: 10, fontFamily: FONTS.regular, textAlign: 'center', marginTop: 4 },
  // Back
  backContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  backTitle: { fontSize: 17, fontFamily: FONTS.bold, flex: 1 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  backLabel: { fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1.5, marginBottom: 6, marginTop: SPACING.md },
  backText: { fontSize: 13, fontFamily: FONTS.regular, lineHeight: 21 },
  warningBox: { flexDirection: 'row', gap: 8, padding: SPACING.sm, borderRadius: RADIUS.sm, borderWidth: 1, marginBottom: SPACING.sm },
  warningText: { flex: 1, fontSize: 12, lineHeight: 18 },
  table: { borderRadius: RADIUS.md, borderWidth: 1, overflow: 'hidden', marginBottom: SPACING.sm },
  tableRow: { flexDirection: 'row', padding: SPACING.sm },
  tableKey: { width: 70, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 0.8 },
  tableVal: { flex: 1, fontSize: 13, fontFamily: FONTS.regular },
  priceRow2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1 },
  buyRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  buyBtn: { flexDirection: 'row', gap: 6, paddingVertical: 12, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  buyBtnText: { fontFamily: FONTS.bold, fontSize: 13 },
  flipBack: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: SPACING.md },
  // Empty state
  emptyDeck: { alignItems: 'center', padding: SPACING.xl, gap: SPACING.md },
  emptyTitle: { fontSize: 22, fontFamily: FONTS.cinzelBold },
  emptySub: { fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center', lineHeight: 22 },
  resetBtn: { flexDirection: 'row', gap: 8, paddingHorizontal: SPACING.xl, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.sm },
  // Bottom actions
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl, paddingTop: SPACING.sm },
  actionBtn: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  countBadge: { alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, minWidth: 70 },
});
