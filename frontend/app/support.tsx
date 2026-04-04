import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Linking, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { Button } from '../src/components/Button';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';

const CATEGORIES = ['Billing', 'Bug', 'Feature', 'Account', 'AI', 'Other'];

const FAQS = [
  { q: 'How does the 7-day Alpha Trial work?', a: 'You get full access to all Alpha and Sigma features for 7 days. This includes personalized AI coaching, high-fidelity genome scanning, and the full bio-mechanical workout library.' },
  { q: 'What happens after the trial finishes?', a: 'On Day 8, your premium protocols (Face Coach, Sigma Plans, AI Stack Builder) will enter an "Archive" state. Your data remains 100% safe, but features will lock until you choose your evolution path (Grind, Alpha, or Sigma).' },
  { q: 'Is my facial data secure?', a: 'Absolutely. We use ephemeral processing for scans, meaning your biological data is analyzed and then encrypted within your private Supabase vault. We never sell or share biometric information.' },
  { q: 'How do I switch between Claude and Gemini?', a: 'Navigate to Settings > Appearance > AI Engine. You can hot-swap between models. Claude is optimized for tactical mindset coaching, while Gemini excels at complex structural analysis.' },
  { q: 'Can I log custom missions?', a: 'Yes. In the Train tab, use the "Plan Builder" to create custom vectors. You earn XP for every set completed, contributing to your global power level.' },
  { q: 'How do I cancel my subscription?', a: 'Transmissions can be terminated anytime via Settings > Account > Subscription. No hidden hurdles, no questions asked. Your progress remains saved for your return.' },
];

const FAQItem = ({ q, a, index }: { q: string, a: string, index: number }) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => setExpanded(!expanded)}
      style={[styles.faqItem, { backgroundColor: theme.bgSurface, borderColor: expanded ? theme.gold + '44' : theme.border }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[styles.faqText, { color: expanded ? theme.gold : theme.textSecondary, fontFamily: FONTS.semiBold, flex: 1 }]}>{q}</Text>
        <Feather name={expanded ? "minus" : "plus"} size={16} color={expanded ? theme.gold : theme.textMuted} />
      </View>
      {expanded && (
        <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 12, lineHeight: 20, fontFamily: FONTS.regular }}>{a}</Text>
      )}
    </TouchableOpacity>
  );
};

export default function SupportScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState('Bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const openWhatsApp = () => {
    // International format: 201557242579
    Linking.openURL('https://wa.me/201557242579?text=Hello%20Ziad,%20I%20need%20tactical%20support%20with%20MAXX%20App');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>SUPPORT</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Founder Card */}
        <View style={[styles.founderCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <View style={styles.founderRow}>
            <View style={[styles.fakeAvatar, { backgroundColor: theme.bgElevated, borderColor: theme.gold }]}>
              <Text style={[styles.avatarText, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>ZS</Text>
            </View>
            <View>
              <Text style={[styles.founderName, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold, fontSize: 18 }]}>ZIAD SABRY</Text>
              <Text style={[styles.founderTitle, { color: theme.textMuted, fontFamily: FONTS.regular }]}>Founder · Lead Architect</Text>
            </View>
          </View>
          <Text style={[styles.founderBio, { color: theme.textSecondary, fontFamily: FONTS.regular, fontSize: 13 }]}>
            I built MAXX to empower the brotherhood. If you're facing any glitches or need a specific tactical feature, reach out to me directly. I monitor every transmission personally.
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.socialScroll} contentContainerStyle={styles.socialLinks}>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#0077b5' }]} onPress={() => Linking.openURL('https://www.linkedin.com/in/ziad-sabry-cl/')}>
              <FontAwesome5 name="linkedin" size={16} color="#FFF" />
              <Text style={[styles.socialText, { color: '#FFF' }]}>LinkedIn</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#333' }]} onPress={() => Linking.openURL('https://github.com/CultLeaderZiad/')}>
              <FontAwesome5 name="github" size={16} color="#FFF" />
              <Text style={[styles.socialText, { color: '#FFF' }]}>GitHub</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#25D366' }]} onPress={openWhatsApp}>
              <FontAwesome5 name="whatsapp" size={16} color="#FFF" />
              <Text style={[styles.socialText, { color: '#FFF' }]}>WhatsApp</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: theme.bgElevated, borderColor: theme.gold + '22', borderWidth: 1 }]} onPress={() => Linking.openURL('mailto:ziad@softcode.cloud')}>
              <MaterialCommunityIcons name="email-outline" size={18} color={theme.gold} />
              <Text style={[styles.socialText, { color: theme.textPrimary }]}>Email</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Categories */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted, fontFamily: FONTS.semiBold, marginBottom: 12 }]}>DIRECT TRANSMISSION</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCat(cat)}
              style={[
                styles.catPill,
                {
                  backgroundColor: selectedCat === cat ? theme.gold : theme.bgElevated,
                  borderColor: selectedCat === cat ? theme.gold : theme.border,
                }
              ]}
            >
              <Text style={[styles.catText, { color: selectedCat === cat ? '#0A0A0A' : theme.textSecondary, fontFamily: FONTS.semiBold }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary, fontFamily: FONTS.regular }]}
            placeholder="Mission Report Subject"
            placeholderTextColor={theme.textMuted}
            value={subject}
            onChangeText={setSubject}
          />
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary, fontFamily: FONTS.regular }]}
            placeholder="Transmission contents..."
            placeholderTextColor={theme.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity 
            style={[styles.mainBtn, { backgroundColor: theme.gold }]}
            onPress={() => {
              if(!subject || !message) return Alert.alert('Error', 'Please fill in all fields.');
              Alert.alert('Transmission Sent', 'Tactical support has received your report. Response within 24h.');
            }}
          >
            <Text style={{ color: '#0A0A0A', fontFamily: FONTS.bold, fontSize: 16 }}>SEND TRANSMISSION</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted, fontFamily: FONTS.cinzelBold, letterSpacing: 2, marginBottom: 20 }]}>TACTICAL KNOWLEDGE BASE</Text>
          {FAQS.map((f, i) => (
            <FAQItem key={i} q={f.q} a={f.a} index={i} />
          ))}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: Platform.OS === 'ios' ? 10 : 20, marginBottom: SPACING.md },
  backBtn: { padding: 8 },
  title: { fontSize: 24, letterSpacing: 1 },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  founderCard: { borderRadius: 24, borderWidth: 1, padding: 24, marginBottom: SPACING.xl },
  founderRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  fakeAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20 },
  founderName: { fontSize: 20, letterSpacing: 1 },
  founderTitle: { fontSize: 13, marginTop: 2, opacity: 0.7 },
  founderBio: { fontSize: 14, lineHeight: 22, opacity: 0.8 },
  socialScroll: { marginTop: 20, marginHorizontal: -24 },
  socialLinks: { flexDirection: 'row', gap: 10, paddingHorizontal: 24 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14 },
  socialText: { fontSize: 12, fontFamily: FONTS.semiBold },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  catPill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1 },
  catText: { fontSize: 12 },
  inputSection: { gap: 12 },
  input: { height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  textArea: { height: 140, paddingTop: 16, textAlignVertical: 'top' },
  mainBtn: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  faqSection: { marginTop: 40 },
  sectionTitle: { fontSize: 11, letterSpacing: 1.5, marginBottom: 16 },
  faqItem: { padding: 18, borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  faqText: { fontSize: 15 },
});
