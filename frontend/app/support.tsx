import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { Button } from '../src/components/Button';
import { FONTS, SPACING } from '../src/constants/theme';

const CATEGORIES = ['Billing', 'Bug', 'Feature', 'Account', 'AI', 'Other'];

const FAQS = [
  { q: 'How does the 7-day trial work?', a: 'You get full access to Alpha features. No charge until Day 8.' },
  { q: 'How do I switch Claude vs Gemini?', a: 'Go to Settings > Appearance > AI Engine.' },
  { q: 'Is my selfie private?', a: 'Yes, all AI analysis is processed securely and never shared.' },
];

export default function SupportScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState('Billing');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} testID="support-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="support-back-btn">
          <Feather name="chevron-left" size={24} color={theme.gold} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary, fontFamily: FONTS.cinzelBold }]}>Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Founder Card */}
        <View style={[styles.founderCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <View style={styles.founderRow}>
            <View style={[styles.fakeAvatar, { backgroundColor: theme.bgElevated, borderColor: theme.gold }]}>
              <Text style={[styles.avatarText, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>ZS</Text>
            </View>
            <View>
              <Text style={[styles.founderName, { color: theme.textPrimary, fontFamily: FONTS.semiBold }]}>Ziad Sabry</Text>
              <Text style={[styles.founderTitle, { color: theme.textMuted, fontFamily: FONTS.regular }]}>Developer & Founder · MAXX</Text>
            </View>
          </View>
          <Text style={[styles.founderBio, { color: theme.textSecondary, fontFamily: FONTS.regular }]}>
            Real support from the person who built this. I read every message personally.
          </Text>
          <View style={styles.socialLinks}>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: theme.bgElevated }]} onPress={() => Linking.openURL('https://linkedin.com')}>
              <Feather name="linkedin" size={14} color="#0077b5" />
              <Text style={[styles.socialText, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>LinkedIn</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: theme.bgElevated }]} onPress={() => Linking.openURL('https://github.com')}>
              <Feather name="github" size={14} color="#FFF" />
              <Text style={[styles.socialText, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>GitHub</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: theme.bgElevated }]}>
              <Feather name="alert-circle" size={14} color={theme.gold} />
              <Text style={[styles.socialText, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>Issues</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
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
              <Text style={[styles.catText, { color: selectedCat === cat ? '#0A0A0A' : theme.textSecondary, fontFamily: FONTS.medium }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inputs */}
        <View style={styles.inputSection}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary, fontFamily: FONTS.regular }]}
            placeholder="Subject (max 100 chars)"
            placeholderTextColor={theme.textMuted}
            value={subject}
            onChangeText={setSubject}
            maxLength={100}
            testID="support-subject-input"
          />
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.bgSurface, borderColor: theme.border, color: theme.textPrimary, fontFamily: FONTS.regular }]}
            placeholder="Describe your issue..."
            placeholderTextColor={theme.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            testID="support-message-input"
          />
          <Button title="SEND MESSAGE" onPress={() => {}} testID="support-send-btn" />
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted, fontFamily: FONTS.semiBold }]}>FREQUENTLY ASKED</Text>
          {FAQS.map((f, i) => (
            <TouchableOpacity key={i} style={[styles.faqItem, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
              <Text style={[styles.faqText, { color: theme.textSecondary, fontFamily: FONTS.medium }]}>{f.q}</Text>
              <Feather name="chevron-right" size={14} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, marginBottom: SPACING.md },
  backBtn: { padding: 8 },
  title: { fontSize: 24, marginLeft: SPACING.xs },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  founderCard: { borderRadius: 16, borderWidth: 1, padding: SPACING.lg, marginBottom: SPACING.xl },
  founderRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  fakeAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18 },
  founderName: { fontSize: 16 },
  founderTitle: { fontSize: 12, marginTop: 2 },
  founderBio: { fontSize: 13, lineHeight: 20 },
  socialLinks: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
  socialBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  socialText: { fontSize: 11 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.xl },
  catPill: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
  catText: { fontSize: 12 },
  inputSection: { gap: SPACING.md },
  input: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: SPACING.md, fontSize: 14 },
  textArea: { height: 120, paddingTop: SPACING.md, textAlignVertical: 'top' },
  faqSection: { marginTop: SPACING.xl },
  sectionTitle: { fontSize: 11, letterSpacing: 1.2, marginBottom: SPACING.md },
  faqItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  faqText: { fontSize: 13 },
});
