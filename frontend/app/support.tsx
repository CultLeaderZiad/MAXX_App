import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Linking, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { safeBack } from '../lib/safeBack';
import { supabase } from '../lib/supabase';
import { FONTS, SPACING, RADIUS, GOLD } from '../src/constants/theme';

const BG = '#0A0A0A';
const SURFACE = '#111111';
const TEXT = '#FFFFFF';
const TEXT2 = '#CECECE';
const MUTED = '#9A9A9A';
const BORDER = '#2A2A2A';

const CATEGORIES = ['Account', 'Billing', 'Bug Report', 'Feature Request', 'Other'];

const FAQ = [
  { q: 'How does the 7-day free trial work?', a: 'You get full Alpha-tier access for 7 days from account creation. No charge until Day 8. Cancel anytime.' },
  { q: 'How do I cancel my subscription?', a: 'Email us at cultleaderziad.dev@gmail.com with your account email to cancel. We\'ll process it within 24 hours.' },
  { q: 'My videos are not loading. What do I do?', a: 'Make sure you have a stable internet connection. Exercise videos use YouTube embeds which require internet access.' },
  { q: 'How do I reset my password?', a: 'Go to the login screen and tap "Forgot Password". Enter your email to receive a reset link.' },
  { q: 'What is the AI Supplement Stack?', a: 'It\'s an AI-powered feature that creates a personalized supplement protocol based on your goals, stats, and weak points.' },
  { q: 'How is XP calculated?', a: 'You earn XP by completing workouts (+15 XP), reading wisdom cards (+10 XP), and engaging with the app daily.' },
];

export default function SupportScreen() {
  const { profile, user } = useAuth();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');
  const [name, setName] = useState(profile?.full_name || '');
  const [category, setCategory] = useState('Account');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing Fields', 'Please fill in subject and message.');
      return;
    }
    setSending(true);
    try {
      if (user) {
        await supabase.from('support_tickets').insert({
          name: name.trim() || 'Anonymous',
          email: user.email || '',
          category,
          subject: subject.trim(),
          message: message.trim(),
        });
      }
      Alert.alert('Sent!', 'Your support ticket has been submitted. We\'ll respond within 24-48 hours.', [
        { text: 'OK', onPress: () => { setSubject(''); setMessage(''); } },
      ]);
    } catch {
      // Fallback to email
      const mailBody = `Name: ${name}%0ACategory: ${category}%0ASubject: ${subject}%0AMessage: ${message}`;
      Linking.openURL(`mailto:cultleaderziad.dev@gmail.com?subject=${encodeURIComponent(subject)}&body=${mailBody}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#0A0A0A' }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={TEXT} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: TEXT, fontFamily: FONTS.cinzelBold }]}>SUPPORT</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:cultleaderziad.dev@gmail.com')}
            style={[styles.emailBtn, { backgroundColor: GOLD + '20', borderColor: GOLD + '40' }]}
          >
            <Feather name="mail" size={14} color={GOLD} />
            <Text style={[{ color: GOLD, fontFamily: FONTS.bold, fontSize: 11 }]}>Email Us</Text>
          </TouchableOpacity>
        </View>

        {/* Tab selector */}
        <View style={[styles.tabBar, { backgroundColor: SURFACE, borderColor: BORDER }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('faq')}
            style={[styles.tabBtn, activeTab === 'faq' && { backgroundColor: GOLD + '20' }]}
          >
            <Feather name="help-circle" size={14} color={activeTab === 'faq' ? GOLD : MUTED} />
            <Text style={[styles.tabText, { color: activeTab === 'faq' ? GOLD : MUTED, fontFamily: FONTS.bold }]}>FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('contact')}
            style={[styles.tabBtn, activeTab === 'contact' && { backgroundColor: GOLD + '20' }]}
          >
            <Feather name="send" size={14} color={activeTab === 'contact' ? GOLD : MUTED} />
            <Text style={[styles.tabText, { color: activeTab === 'contact' ? GOLD : MUTED, fontFamily: FONTS.bold }]}>Contact</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
          {activeTab === 'faq' ? (
            <View style={{ padding: SPACING.lg }}>
              <Text style={[styles.sectionTitle, { color: MUTED, fontFamily: FONTS.bold }]}>FREQUENTLY ASKED</Text>
              {FAQ.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setExpanded(expanded === i ? null : i)}
                  style={[styles.faqItem, { backgroundColor: SURFACE, borderColor: expanded === i ? GOLD + '50' : BORDER }]}
                  activeOpacity={0.8}
                >
                  <View style={styles.faqHeader}>
                    <Text style={[styles.faqQ, { color: TEXT, fontFamily: FONTS.semiBold }]}>{item.q}</Text>
                    <Feather name={expanded === i ? 'chevron-up' : 'chevron-down'} size={16} color={MUTED} />
                  </View>
                  {expanded === i && (
                    <Text style={[styles.faqA, { color: TEXT2, fontFamily: FONTS.regular }]}>{item.a}</Text>
                  )}
                </TouchableOpacity>
              ))}

              {/* Direct contact */}
              <View style={[styles.directCard, { backgroundColor: GOLD + '12', borderColor: GOLD + '30' }]}>
                <Text style={[styles.directTitle, { color: GOLD, fontFamily: FONTS.cinzelBold }]}>Direct Contact</Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL('mailto:cultleaderziad.dev@gmail.com')}
                  style={styles.directRow}
                >
                  <Feather name="mail" size={16} color={GOLD} />
                  <Text style={[styles.directText, { color: TEXT, fontFamily: FONTS.regular }]}>cultleaderziad.dev@gmail.com</Text>
                </TouchableOpacity>
                <Text style={[{ color: MUTED, fontFamily: FONTS.regular, fontSize: 11, marginTop: 4 }]}>
                  Response within 24-48 hours
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ padding: SPACING.lg }}>
              <Text style={[styles.sectionTitle, { color: MUTED, fontFamily: FONTS.bold }]}>SUBMIT TICKET</Text>

              {[
                { label: 'YOUR NAME', value: name, setter: setName, placeholder: 'John Doe', multi: false },
                { label: 'SUBJECT', value: subject, setter: setSubject, placeholder: 'Brief description of issue', multi: false },
                { label: 'MESSAGE', value: message, setter: setMessage, placeholder: 'Describe your issue in detail...', multi: true },
              ].map(f => (
                <View key={f.label} style={{ marginBottom: SPACING.md }}>
                  <Text style={[styles.inputLabel, { color: MUTED, fontFamily: FONTS.bold }]}>{f.label}</Text>
                  <TextInput
                    value={f.value}
                    onChangeText={f.setter}
                    placeholder={f.placeholder}
                    placeholderTextColor={MUTED}
                    multiline={f.multi}
                    numberOfLines={f.multi ? 5 : 1}
                    style={[
                      styles.input,
                      { backgroundColor: SURFACE, borderColor: BORDER, color: TEXT, fontFamily: FONTS.regular },
                      f.multi && { height: 120, textAlignVertical: 'top', paddingTop: 12 },
                    ]}
                  />
                </View>
              ))}

              {/* Category */}
              <Text style={[styles.inputLabel, { color: MUTED, fontFamily: FONTS.bold }]}>CATEGORY</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCategory(c)}
                    style={[styles.catBtn, { backgroundColor: category === c ? GOLD : SURFACE, borderColor: category === c ? GOLD : BORDER }]}
                  >
                    <Text style={[{ color: category === c ? '#000' : TEXT2, fontFamily: FONTS.bold, fontSize: 11 }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={sendTicket}
                disabled={sending}
                style={[styles.sendBtn, { backgroundColor: GOLD, opacity: sending ? 0.7 : 1 }]}
              >
                {sending
                  ? <ActivityIndicator color="#000" size="small" />
                  : <>
                    <Feather name="send" size={16} color="#000" />
                    <Text style={[styles.sendBtnText, { fontFamily: FONTS.bold }]}>SUBMIT TICKET</Text>
                  </>
                }
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, marginBottom: SPACING.md },
  backBtn: { padding: 8 },
  title: { fontSize: 20, letterSpacing: 4 },
  emailBtn: { flexDirection: 'row', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1, alignItems: 'center' },
  tabBar: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  tabText: { fontSize: 13 },
  sectionTitle: { fontSize: 10, letterSpacing: 1.5, marginBottom: SPACING.md },
  faqItem: { borderRadius: RADIUS.md, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.sm },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: SPACING.sm },
  faqQ: { flex: 1, fontSize: 14, lineHeight: 20 },
  faqA: { fontSize: 13, lineHeight: 21, marginTop: SPACING.sm },
  directCard: { padding: SPACING.lg, borderRadius: RADIUS.xl, borderWidth: 1, marginTop: SPACING.lg },
  directTitle: { fontSize: 16, marginBottom: SPACING.md },
  directRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  directText: { fontSize: 14 },
  inputLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  input: { borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.md, height: 46, fontSize: 14 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.lg },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1 },
  sendBtn: { flexDirection: 'row', gap: 10, paddingVertical: 16, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#000', fontSize: 14, letterSpacing: 1 },
});
