import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { FONTS, SPACING, RADIUS, GOLD } from '../src/constants/theme';

type CalcType = 'calorie' | 'hydration' | 'sleep' | 'ffmi' | 'bmi' | 'macros';

// ── Result display ─────────────────────────────────────────────────────────────
function ResultCard({ label, value, unit, color }: { label: string; value: string; unit?: string; color: string }) {
  return (
    <View style={[rcStyles.card, { borderColor: color + '40' }]}>
      <Text style={[rcStyles.label, { color: '#9A9A9A', fontFamily: FONTS.bold }]}>{label}</Text>
      <Text style={[rcStyles.value, { color, fontFamily: FONTS.cinzelBold }]}>{value}</Text>
      {unit && <Text style={[rcStyles.unit, { color: '#606060', fontFamily: FONTS.regular }]}>{unit}</Text>}
    </View>
  );
}

const rcStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#111111', borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.md, alignItems: 'center', gap: 4 },
  label: { fontSize: 9, letterSpacing: 1.5 },
  value: { fontSize: 26, lineHeight: 30 },
  unit: { fontSize: 11 },
});

// ── Input field ────────────────────────────────────────────────────────────────
function CalcInput({ label, value, onChangeText, placeholder, unit, keyboardType = 'numeric' }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; unit?: string; keyboardType?: 'numeric' | 'default';
}) {
  const { theme } = useTheme();
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={[{ fontSize: 10, letterSpacing: 1.5, marginBottom: 8, color: '#9A9A9A', fontFamily: FONTS.bold }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: '#111111', borderColor: '#2A2A2A' }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || '0'}
          placeholderTextColor="#606060"
          keyboardType={keyboardType}
          style={[{ flex: 1, color: '#FFFFFF', fontFamily: FONTS.semiBold, fontSize: 16 }]}
        />
        {unit && <Text style={[{ color: '#606060', fontFamily: FONTS.regular, fontSize: 13 }]}>{unit}</Text>}
      </View>
    </View>
  );
}

// ── Option selector ────────────────────────────────────────────────────────────
function OptionGroup({ label, options, selected, onSelect, color = GOLD }: {
  label: string; options: string[]; selected: string; onSelect: (v: string) => void; color?: string;
}) {
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={[{ fontSize: 10, letterSpacing: 1.5, marginBottom: 8, color: '#9A9A9A', fontFamily: FONTS.bold }]}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map(o => (
          <TouchableOpacity
            key={o}
            onPress={() => onSelect(o)}
            style={[styles.optBtn, { backgroundColor: selected === o ? color + '20' : '#111111', borderColor: selected === o ? color : '#2A2A2A' }]}
          >
            <Text style={[{ fontSize: 12, fontFamily: FONTS.semiBold, color: selected === o ? color : '#9A9A9A' }]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function CalculatorScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const calcType = (params.type || 'calorie') as CalcType;
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuth();

  // Shared inputs
  const [weight, setWeight] = useState(String(profile?.weight_kg || ''));
  const [height, setHeight] = useState(String(profile?.height_cm || ''));
  const [age, setAge] = useState('22');
  const [gender, setGender] = useState('Male');
  const [activity, setActivity] = useState('Sedentary');
  const [goal, setGoal] = useState('Recomp');
  const [climate, setClimate] = useState('Normal');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepGoal, setSleepGoal] = useState('Standard Rest');
  const [bodyFat, setBodyFat] = useState('');
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [caloTarget, setCaloTarget] = useState('');

  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);

  const ACT_MULT: Record<string, number> = {
    'Sedentary': 1.2, 'Light (1-3x/week)': 1.375, 'Moderate (3-5x/week)': 1.55,
    'Very Active (6x/week)': 1.725, 'Athlete (2x/day)': 1.9,
  };

  const calculate = () => {
    const w = parseFloat(weight); const h = parseFloat(height);
    const a = parseFloat(age); const bf = parseFloat(bodyFat);
    const n = parseFloat(neck); const wst = parseFloat(waist);

    switch (calcType) {
      case 'calorie': {
        if (!w || !h || !a) { Alert.alert('Missing', 'Enter weight, height, and age.'); return; }
        const bmr = gender === 'Male'
          ? 10 * w + 6.25 * h - 5 * a + 5
          : 10 * w + 6.25 * h - 5 * a - 161;
        const mult = ACT_MULT[activity] || 1.2;
        const tdee = bmr * mult;
        const adj = goal === 'Cut Fat' ? -500 : goal === 'Bulk' ? 300 : 0;
        const cals = Math.round(tdee + adj);
        const protein = Math.round(w * 2.2);
        const fats = Math.round((cals * 0.25) / 9);
        const carbs = Math.round((cals - protein * 4 - fats * 9) / 4);
        setResult({ cals, protein, carbs, fats, tdee: Math.round(tdee), goal });
        break;
      }
      case 'hydration': {
        if (!w) { Alert.alert('Missing', 'Enter weight.'); return; }
        let base = w * 35;
        if (activity !== 'Sedentary') base += 500;
        if (climate === 'Hot') base += 300;
        const liters = (base / 1000).toFixed(1);
        setResult({ liters, morning: '500ml', preworkout: '400ml', postworkout: '500ml', evening: `${Math.round(base - 1400)}ml` });
        break;
      }
      case 'sleep': {
        const cycles = sleepGoal === 'Maximum T Production' ? 6 : sleepGoal === 'Deep Recovery' ? 6 : 5;
        const totalMin = cycles * 90;
        const totalH = totalMin / 60;
        const [wakeHr, wakeMin] = wakeTime.split(':').map(Number);
        const bedtimes = [5, 6, 7].map(c => {
          const mins = wakeHr * 60 + (wakeMin || 0) - c * 90;
          const h = Math.floor(((mins % 1440) + 1440) % 1440 / 60);
          const m = ((mins % 1440) + 1440) % 1440 % 60;
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        });
        setResult({ totalH, cycles, bedtimes, goal: sleepGoal });
        break;
      }
      case 'ffmi': {
        if (!w || !h || !bf) { Alert.alert('Missing', 'Enter weight, height, and body fat %.'); return; }
        const hm = h / 100;
        const leanMass = w * (1 - bf / 100);
        const ffmi = leanMass / (hm * hm);
        const normalized = ffmi + 6.1 * (1.8 - hm);
        let rating = '';
        if (normalized < 18) rating = 'Below Average';
        else if (normalized < 20) rating = 'Average Natural';
        else if (normalized < 22) rating = 'Above Average';
        else if (normalized < 23) rating = 'Excellent';
        else if (normalized < 26) rating = 'Upper Natural Limit';
        else rating = 'Suspected Enhanced';
        setResult({ ffmi: ffmi.toFixed(1), normalized: normalized.toFixed(1), leanMass: leanMass.toFixed(1), rating });
        break;
      }
      case 'bmi': {
        if (!w || !h) { Alert.alert('Missing', 'Enter weight and height.'); return; }
        const hm = h / 100;
        const bmi = w / (hm * hm);
        let bmiCat = '';
        if (bmi < 18.5) bmiCat = 'Underweight';
        else if (bmi < 25) bmiCat = 'Normal';
        else if (bmi < 30) bmiCat = 'Overweight';
        else bmiCat = 'Obese';
        let bfPct: number | null = null;
        if (n && wst && h) {
          bfPct = gender === 'Male'
            ? 495 / (1.0324 - 0.19077 * Math.log10(wst - n) + 0.15456 * Math.log10(h)) - 450
            : 495 / (1.29579 - 0.35004 * Math.log10(wst + parseFloat(String(0)) - n) + 0.22100 * Math.log10(h)) - 450;
        }
        let jawNote = '';
        if (bfPct !== null) {
          if (bfPct > 20) jawNote = 'Jaw barely visible';
          else if (bfPct > 15) jawNote = 'Jaw starting to show';
          else if (bfPct > 12) jawNote = 'Good jaw definition';
          else jawNote = 'Maximum jaw definition';
        }
        setResult({ bmi: bmi.toFixed(1), bmiCat, bfPct: bfPct ? bfPct.toFixed(1) : null, jawNote });
        break;
      }
      case 'macros': {
        const cals = parseFloat(caloTarget) || (w ? w * 33 : 0);
        if (!cals) { Alert.alert('Missing', 'Enter calorie target.'); return; }
        const protein = Math.round((w || 75) * 2.2);
        const fats = Math.round((cals * 0.25) / 9);
        const carbs = Math.round((cals - protein * 4 - fats * 9) / 4);
        setResult({ protein, carbs, fats, cals: Math.round(cals) });
        break;
      }
    }
  };

  const saveResult = async () => {
    if (!result || !user) return;
    setSaving(true);
    try {
      const key = `calc_${calcType}`;
      await AsyncStorage.setItem(key, JSON.stringify({ inputs: { weight, height, age, activity, goal }, results: result, savedAt: new Date().toISOString() }));
      try {
        await supabase.from('calculator_results').upsert({
          user_id: user.id,
          calc_type: calcType,
          inputs: { weight, height, age, activity, goal },
          results: result,
        }, { onConflict: 'user_id,calc_type' });
      } catch {}
      if (calcType === 'calorie' || calcType === 'bmi') {
        await supabase.from('profiles').update({
          weight_kg: parseFloat(weight) || null,
          height_cm: parseFloat(height) || null,
        }).eq('id', user.id);
      }
      Alert.alert('Saved!', 'Results saved to your profile.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save results.');
    } finally {
      setSaving(false);
    }
  };

  const CALC_META: Record<CalcType, { title: string; color: string; icon: string }> = {
    calorie: { title: 'CALORIE CALCULATOR', color: GOLD, icon: 'zap' },
    hydration: { title: 'HYDRATION CALCULATOR', color: '#4A90D9', icon: 'droplet' },
    sleep: { title: 'SLEEP CALCULATOR', color: '#9B59B6', icon: 'moon' },
    ffmi: { title: 'FAT-FREE MASS INDEX', color: '#2ECC71', icon: 'trending-up' },
    bmi: { title: 'BMI + BODY FAT', color: '#E67E22', icon: 'user' },
    macros: { title: 'MACRO NUTRIENTS', color: '#E74C3C', icon: 'pie-chart' },
  };

  const meta = CALC_META[calcType];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#0A0A0A' }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/train' as any)} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={[styles.calcIcon, { backgroundColor: meta.color + '20' }]}>
          <Feather name={meta.icon as any} size={16} color={meta.color} />
        </View>
        <Text style={[styles.title, { color: '#FFFFFF', fontFamily: FONTS.cinzelBold }]}>{meta.title}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Inputs */}
        <View style={[styles.card, { backgroundColor: '#111111', borderColor: '#2A2A2A' }]}>
          <Text style={[styles.cardTitle, { color: meta.color, fontFamily: FONTS.bold }]}>INPUTS</Text>

          {(calcType === 'calorie' || calcType === 'ffmi' || calcType === 'bmi') && (
            <>
              <CalcInput label="WEIGHT" value={weight} onChangeText={setWeight} unit="kg" />
              <CalcInput label="HEIGHT" value={height} onChangeText={setHeight} unit="cm" />
            </>
          )}
          {calcType === 'hydration' && <CalcInput label="WEIGHT" value={weight} onChangeText={setWeight} unit="kg" />}
          {(calcType === 'calorie' || calcType === 'bmi') && (
            <>
              <CalcInput label="AGE" value={age} onChangeText={setAge} unit="yrs" />
              <OptionGroup label="GENDER" options={['Male', 'Female']} selected={gender} onSelect={setGender} color={meta.color} />
            </>
          )}
          {(calcType === 'calorie' || calcType === 'hydration') && (
            <OptionGroup
              label="ACTIVITY LEVEL"
              options={['Sedentary', 'Light (1-3x/week)', 'Moderate (3-5x/week)', 'Very Active (6x/week)', 'Athlete (2x/day)']}
              selected={activity}
              onSelect={setActivity}
              color={meta.color}
            />
          )}
          {calcType === 'calorie' && (
            <OptionGroup label="GOAL" options={['Cut Fat', 'Recomp', 'Bulk']} selected={goal} onSelect={setGoal} color={meta.color} />
          )}
          {calcType === 'hydration' && (
            <OptionGroup label="CLIMATE" options={['Normal', 'Hot']} selected={climate} onSelect={setClimate} color={meta.color} />
          )}
          {calcType === 'sleep' && (
            <>
              <CalcInput label="WAKE UP TIME (HH:MM)" value={wakeTime} onChangeText={setWakeTime} placeholder="07:00" keyboardType="default" />
              <OptionGroup label="SLEEP GOAL" options={['Standard Rest', 'Deep Recovery', 'Maximum T Production']} selected={sleepGoal} onSelect={setSleepGoal} color={meta.color} />
            </>
          )}
          {calcType === 'ffmi' && <CalcInput label="BODY FAT %" value={bodyFat} onChangeText={setBodyFat} unit="%" />}
          {calcType === 'bmi' && (
            <>
              <CalcInput label="NECK CIRCUMFERENCE" value={neck} onChangeText={setNeck} unit="cm" />
              <CalcInput label="WAIST CIRCUMFERENCE" value={waist} onChangeText={setWaist} unit="cm" />
            </>
          )}
          {calcType === 'macros' && (
            <>
              <CalcInput label="WEIGHT" value={weight} onChangeText={setWeight} unit="kg" />
              <CalcInput label="DAILY CALORIE TARGET (leave blank to auto-calculate)" value={caloTarget} onChangeText={setCaloTarget} unit="kcal" />
            </>
          )}

          <TouchableOpacity
            onPress={calculate}
            style={[styles.calcBtn, { backgroundColor: meta.color }]}
            activeOpacity={0.85}
          >
            <Feather name="cpu" size={16} color="#000" />
            <Text style={[styles.calcBtnText, { fontFamily: FONTS.bold }]}>CALCULATE</Text>
          </TouchableOpacity>
        </View>

        {/* Result */}
        {result && (
          <View style={[styles.card, { backgroundColor: '#111111', borderColor: meta.color + '30' }]}>
            <Text style={[styles.cardTitle, { color: meta.color, fontFamily: FONTS.bold }]}>YOUR RESULTS</Text>

            {calcType === 'calorie' && (
              <>
                <View style={styles.bigResult}>
                  <Text style={[styles.bigNum, { color: '#2ECC71', fontFamily: FONTS.cinzelBold }]}>{result.cals}</Text>
                  <Text style={[styles.bigUnit, { color: '#9A9A9A', fontFamily: FONTS.regular }]}>kcal / day</Text>
                  <Text style={[styles.bigNote, { color: '#606060', fontFamily: FONTS.regular }]}>
                    {result.goal === 'Cut Fat' ? 'Caloric deficit for fat loss' : result.goal === 'Bulk' ? 'Caloric surplus for muscle gain' : 'Maintenance for body recomposition'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                  <ResultCard label="PROTEIN" value={`${result.protein}g`} unit="daily" color="#E74C3C" />
                  <ResultCard label="CARBS" value={`${result.carbs}g`} unit="daily" color="#F39C12" />
                  <ResultCard label="FATS" value={`${result.fats}g`} unit="daily" color="#9B59B6" />
                </View>
              </>
            )}

            {calcType === 'hydration' && (
              <>
                <View style={styles.bigResult}>
                  <Text style={[styles.bigNum, { color: '#4A90D9', fontFamily: FONTS.cinzelBold }]}>{result.liters}</Text>
                  <Text style={[styles.bigUnit, { color: '#9A9A9A', fontFamily: FONTS.regular }]}>L / day</Text>
                </View>
                {[['Morning (wake)', result.morning], ['Pre-workout', result.preworkout], ['Post-workout', result.postworkout], ['Evening', result.evening]].map(([k, v]) => (
                  <View key={k} style={[styles.tableRow, { borderColor: '#2A2A2A' }]}>
                    <Text style={[{ color: '#9A9A9A', fontFamily: FONTS.bold, fontSize: 11 }]}>{k}</Text>
                    <Text style={[{ color: '#FFFFFF', fontFamily: FONTS.semiBold, fontSize: 14 }]}>{v}</Text>
                  </View>
                ))}
              </>
            )}

            {calcType === 'sleep' && (
              <>
                <View style={styles.bigResult}>
                  <Text style={[styles.bigNum, { color: '#9B59B6', fontFamily: FONTS.cinzelBold }]}>{result.totalH}h</Text>
                  <Text style={[styles.bigUnit, { color: '#9A9A9A', fontFamily: FONTS.regular }]}>{result.cycles} sleep cycles</Text>
                </View>
                <Text style={[{ color: '#9A9A9A', fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1.5, marginTop: SPACING.md, marginBottom: 8 }]}>BEST BEDTIMES</Text>
                {result.bedtimes.map((t: string, i: number) => (
                  <View key={i} style={[styles.tableRow, { borderColor: '#2A2A2A' }]}>
                    <Text style={[{ color: '#9A9A9A', fontFamily: FONTS.regular, fontSize: 12 }]}>Option {i + 1}</Text>
                    <Text style={[{ color: '#9B59B6', fontFamily: FONTS.cinzelBold, fontSize: 18 }]}>{t}</Text>
                  </View>
                ))}
                <View style={[styles.noteBox, { backgroundColor: '#9B59B615', borderColor: '#9B59B640' }]}>
                  <Text style={[{ color: '#9B59B6', fontFamily: FONTS.regular, fontSize: 12 }]}>Testosterone peaks during hours 1-3 of deep sleep.</Text>
                </View>
              </>
            )}

            {calcType === 'ffmi' && (
              <>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <ResultCard label="FFMI" value={result.ffmi} color="#2ECC71" />
                  <ResultCard label="NORMALIZED" value={result.normalized} color={GOLD} />
                  <ResultCard label="LEAN MASS" value={`${result.leanMass}kg`} color="#3498DB" />
                </View>
                <View style={[styles.noteBox, { backgroundColor: '#2ECC7115', borderColor: '#2ECC7140', marginTop: SPACING.md }]}>
                  <Text style={[{ color: '#2ECC71', fontFamily: FONTS.bold, fontSize: 13 }]}>{result.rating}</Text>
                  <Text style={[{ color: '#9A9A9A', fontFamily: FONTS.regular, fontSize: 11, marginTop: 4 }]}>Natural ceiling ≈ 25-26 FFMI</Text>
                </View>
              </>
            )}

            {calcType === 'bmi' && (
              <>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <ResultCard label="BMI" value={result.bmi} color="#E67E22" />
                  {result.bfPct && <ResultCard label="BODY FAT" value={`${result.bfPct}%`} color="#E74C3C" />}
                </View>
                <View style={[styles.noteBox, { backgroundColor: '#E67E2215', borderColor: '#E67E2240', marginTop: SPACING.md }]}>
                  <Text style={[{ color: '#E67E22', fontFamily: FONTS.bold, fontSize: 13 }]}>{result.bmiCat}</Text>
                  {result.jawNote && <Text style={[{ color: '#9A9A9A', fontFamily: FONTS.regular, fontSize: 12, marginTop: 4 }]}>{result.jawNote}</Text>}
                </View>
              </>
            )}

            {calcType === 'macros' && (
              <>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <ResultCard label="PROTEIN" value={`${result.protein}g`} color="#E74C3C" />
                  <ResultCard label="CARBS" value={`${result.carbs}g`} color="#F39C12" />
                  <ResultCard label="FATS" value={`${result.fats}g`} color="#9B59B6" />
                </View>
                <View style={[styles.noteBox, { backgroundColor: '#11111180', borderColor: '#2A2A2A', marginTop: SPACING.md }]}>
                  <Text style={[{ color: '#9A9A9A', fontFamily: FONTS.regular, fontSize: 12 }]}>Based on {result.cals} kcal/day target</Text>
                </View>
              </>
            )}

            <TouchableOpacity
              onPress={saveResult}
              disabled={saving}
              style={[styles.saveBtn, { borderColor: meta.color, opacity: saving ? 0.7 : 1 }]}
            >
              {saving
                ? <ActivityIndicator color={meta.color} size="small" />
                : <>
                  <Feather name="save" size={14} color={meta.color} />
                  <Text style={[styles.saveBtnText, { color: meta.color, fontFamily: FONTS.bold }]}>SAVE RESULTS</Text>
                </>
              }
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, marginBottom: SPACING.sm, gap: SPACING.sm },
  backBtn: { padding: 8 },
  calcIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontSize: 14, letterSpacing: 2 },
  card: { borderRadius: RADIUS.xl, borderWidth: 1, padding: SPACING.lg, marginBottom: SPACING.md },
  cardTitle: { fontSize: 10, letterSpacing: 2, marginBottom: SPACING.md },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.md, height: 50, gap: 8 },
  optBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.sm, borderWidth: 1 },
  calcBtn: { flexDirection: 'row', gap: 8, paddingVertical: 16, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm },
  calcBtnText: { fontSize: 14, letterSpacing: 1, color: '#000' },
  bigResult: { alignItems: 'center', paddingVertical: SPACING.md },
  bigNum: { fontSize: 48, lineHeight: 52 },
  bigUnit: { fontSize: 14, marginTop: 4 },
  bigNote: { fontSize: 12, marginTop: 8, textAlign: 'center' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  noteBox: { padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1 },
  saveBtn: { flexDirection: 'row', gap: 8, paddingVertical: 14, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginTop: SPACING.md },
  saveBtnText: { fontSize: 13, letterSpacing: 1 },
});
