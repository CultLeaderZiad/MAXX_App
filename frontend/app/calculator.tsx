import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';

type CalcType = 'calorie' | 'hydration' | 'sleep' | 'ffmi' | 'bmi_bodyfat' | 'macro';

const CALC_TITLES: Record<CalcType, string> = {
  calorie: 'Calorie Calculator',
  hydration: 'Hydration Calculator',
  sleep: 'Sleep Calculator',
  ffmi: 'Fat-Free Mass Index',
  bmi_bodyfat: 'BMI + Body Fat',
  macro: 'Macro Nutrients',
};

export default function CalculatorScreen() {
  const { theme } = useTheme();
  const { profile, user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ type: string }>();
  const calcType = (params.type || 'calorie') as CalcType;

  const [step, setStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Shared inputs
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [weight, setWeight] = useState(String(profile?.weight_kg || ''));
  const [height, setHeight] = useState(String(profile?.height_cm || ''));
  const [age, setAge] = useState(String(profile?.age || ''));
  const [gender, setGender] = useState<'male' | 'female'>((profile?.gender as any) || 'male');

  // Calorie-specific
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goal, setGoal] = useState('recomp');

  // Hydration-specific
  const [climate, setClimate] = useState('Normal');

  // Sleep-specific
  const [wakeHour, setWakeHour] = useState('7');
  const [wakeMinute, setWakeMinute] = useState('00');
  const [wakeAmPm, setWakeAmPm] = useState<'AM' | 'PM'>('AM');
  const [sleepGoal, setSleepGoal] = useState('standard');

  // FFMI-specific
  const [bodyFatPct, setBodyFatPct] = useState('');

  // BMI+Body Fat specific
  const [neckCm, setNeckCm] = useState('');
  const [waistCm, setWaistCm] = useState('');

  // Macro-specific
  const [calorieTarget, setCalorieTarget] = useState('');
  const [macroGoal, setMacroGoal] = useState('recomp');

  const safeBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as any);
  };

  const saveResult = async (inputs: any, results: any) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      // Upsert: delete old then insert
      await supabase.from('calculator_results').delete()
        .eq('user_id', user.id).eq('calc_type', calcType);
      await supabase.from('calculator_results').insert({
        user_id: user.id,
        calc_type: calcType,
        inputs,
        results,
        unit_system: unitSystem,
      });
      // Update profile with weight/height if available
      const updates: any = {};
      if (inputs.weight_kg) updates.weight_kg = inputs.weight_kg;
      if (inputs.height_cm) updates.height_cm = inputs.height_cm;
      if (inputs.age) updates.age = inputs.age;
      if (inputs.gender) updates.gender = inputs.gender;
      if (Object.keys(updates).length > 0) {
        await supabase.from('profiles').update(updates).eq('id', user.id);
      }
      Alert.alert('Saved', 'Results saved to your profile.');
    } catch (e) {
      console.error('Save error:', e);
      Alert.alert('Error', 'Could not save results.');
    } finally {
      setSaving(false);
    }
  };

  const getWeightKg = (): number => {
    const w = parseFloat(weight);
    if (isNaN(w)) return 0;
    return unitSystem === 'imperial' ? w * 0.4536 : w;
  };
  const getHeightCm = (): number => {
    const h = parseFloat(height);
    if (isNaN(h)) return 0;
    return unitSystem === 'imperial' ? h * 2.54 : h;
  };

  // ── Calculation functions ──
  const calculateCalorie = () => {
    const w = getWeightKg(); const h = getHeightCm(); const a = parseInt(age);
    if (!w || !h || !a) { Alert.alert('Error', 'Please fill all fields.'); return; }
    const bmr = gender === 'male'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;
    const multipliers: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, very_active: 1.725, athlete: 1.9 };
    const tdee = bmr * (multipliers[activityLevel] || 1.55);
    const adjustments: Record<string, number> = { cut: -500, recomp: 0, bulk: 300 };
    const finalCal = Math.round(tdee + (adjustments[goal] || 0));
    const proteinG = Math.round(w * 2.2);
    const fatG = Math.round((finalCal * 0.25) / 9);
    const carbG = Math.round((finalCal - proteinG * 4 - fatG * 9) / 4);
    const res = { calories: finalCal, protein: proteinG, carbs: carbG, fats: fatG, bmr: Math.round(bmr), tdee: Math.round(tdee) };
    setResult(res);
    saveResult({ weight_kg: w, height_cm: h, age: a, gender, activity_level: activityLevel, goal }, res);
    setStep(99);
  };

  const calculateHydration = () => {
    const w = getWeightKg();
    if (!w) { Alert.alert('Error', 'Please enter weight.'); return; }
    let base = w * 35;
    if (activityLevel === 'very_active' || activityLevel === 'athlete') base += 500;
    if (climate === 'Hot') base += 300;
    const liters = (base / 1000).toFixed(1);
    const remainder = Math.max(0, base - 1400);
    const res = { total_ml: Math.round(base), liters, morning: 500, pre_workout: 400, post_workout: 500, evening: Math.round(remainder) };
    setResult(res);
    saveResult({ weight_kg: w, activity_level: activityLevel, climate }, res);
    setStep(99);
  };

  const calculateSleep = () => {
    let hr = parseInt(wakeHour); const mn = parseInt(wakeMinute) || 0;
    if (isNaN(hr)) { Alert.alert('Error', 'Enter wake time.'); return; }
    if (wakeAmPm === 'PM' && hr < 12) hr += 12;
    if (wakeAmPm === 'AM' && hr === 12) hr = 0;
    const wakeMin = hr * 60 + mn;
    const cycles = sleepGoal === 'recovery' ? 6 : 5;
    const totalMin = cycles * 90;
    const bedtimes: string[] = [];
    for (let c = cycles; c >= cycles - 2 && c >= 3; c--) {
      let bedMin = wakeMin - c * 90;
      if (bedMin < 0) bedMin += 1440;
      const bh = Math.floor(bedMin / 60) % 24;
      const bm = bedMin % 60;
      const ampm = bh >= 12 ? 'PM' : 'AM';
      const dispH = bh === 0 ? 12 : bh > 12 ? bh - 12 : bh;
      bedtimes.push(`${dispH}:${String(bm).padStart(2, '0')} ${ampm}`);
    }
    const totalHours = (totalMin / 60).toFixed(1);
    const res = { total_hours: totalHours, cycles, bedtimes, note: 'T peaks during hours 1-3 of sleep' };
    setResult(res);
    saveResult({ wake_time: `${wakeHour}:${wakeMinute} ${wakeAmPm}`, goal: sleepGoal }, res);
    setStep(99);
  };

  const calculateFFMI = () => {
    const w = getWeightKg(); const h = getHeightCm(); const bf = parseFloat(bodyFatPct);
    if (!w || !h || isNaN(bf)) { Alert.alert('Error', 'Fill all fields.'); return; }
    const hm = h / 100;
    const lean = w * (1 - bf / 100);
    const ffmi = lean / (hm * hm);
    const normalized = ffmi + 6.1 * (1.8 - hm);
    let rating = 'Below average';
    if (normalized >= 26) rating = 'Suspected enhanced';
    else if (normalized >= 23) rating = 'Upper natural limit';
    else if (normalized >= 22) rating = 'Excellent';
    else if (normalized >= 20) rating = 'Above average';
    else if (normalized >= 18) rating = 'Average natural';
    const res = { ffmi: ffmi.toFixed(1), normalized_ffmi: normalized.toFixed(1), lean_mass: lean.toFixed(1), rating };
    setResult(res);
    saveResult({ weight_kg: w, height_cm: h, body_fat_pct: bf }, res);
    setStep(99);
  };

  const calculateBMI = () => {
    const w = getWeightKg(); const h = getHeightCm(); const a = parseInt(age);
    const neck = parseFloat(neckCm); const waist = parseFloat(waistCm);
    if (!w || !h) { Alert.alert('Error', 'Fill weight and height.'); return; }
    const hm = h / 100;
    const bmi = w / (hm * hm);
    let bmiCat = 'Normal';
    if (bmi < 18.5) bmiCat = 'Underweight';
    else if (bmi >= 25 && bmi < 30) bmiCat = 'Overweight';
    else if (bmi >= 30) bmiCat = 'Obese';
    let bodyFat: number | null = null;
    let jawNote = '';
    if (gender === 'male' && !isNaN(waist) && !isNaN(neck) && waist > neck) {
      bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(h)) - 450;
      bodyFat = Math.max(3, Math.min(60, bodyFat));
      if (bodyFat > 20) jawNote = 'Jaw barely visible';
      else if (bodyFat > 15) jawNote = 'Jaw starting to show';
      else if (bodyFat > 12) jawNote = 'Good definition';
      else jawNote = 'Maximum definition';
    }
    const res = {
      bmi: bmi.toFixed(1), bmi_category: bmiCat,
      body_fat: bodyFat !== null ? bodyFat.toFixed(1) : null,
      jaw_note: jawNote,
    };
    setResult(res);
    saveResult({ weight_kg: w, height_cm: h, age: a, gender, neck_cm: neck, waist_cm: waist }, res);
    setStep(99);
  };

  const calculateMacro = () => {
    const cal = parseInt(calorieTarget); const w = getWeightKg();
    if (!cal || !w) { Alert.alert('Error', 'Enter calorie target and weight.'); return; }
    const proteinG = Math.round(w * 2.2);
    const fatG = Math.round((cal * 0.25) / 9);
    const carbG = Math.round((cal - proteinG * 4 - fatG * 9) / 4);
    const res = { calories: cal, protein: proteinG, carbs: Math.max(0, carbG), fats: fatG };
    setResult(res);
    saveResult({ calories_target: cal, weight_kg: w, goal: macroGoal }, res);
    setStep(99);
  };

  const renderDots = (total: number) => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: SPACING.md }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === step ? theme.gold : theme.border }} />
      ))}
    </View>
  );

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType }: any) => (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={[cs.inputLabel, { color: theme.textMuted }]}>{label}</Text>
      <TextInput
        style={[cs.input, { backgroundColor: theme.bgElevated, color: theme.textPrimary, borderColor: theme.border }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || ''}
        placeholderTextColor={theme.textMuted}
        keyboardType={keyboardType || 'numeric'}
      />
    </View>
  );

  const OptionRow = ({ options, selected, onSelect, colors }: { options: string[]; selected: string; onSelect: (v: string) => void; colors?: Record<string, string> }) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          onPress={() => onSelect(opt)}
          style={[cs.optionPill, {
            backgroundColor: selected === opt ? (colors?.[opt] || theme.gold) + '22' : theme.bgElevated,
            borderColor: selected === opt ? (colors?.[opt] || theme.gold) : theme.border,
          }]}
        >
          <Text style={{ color: selected === opt ? (colors?.[opt] || theme.gold) : theme.textMuted, fontSize: 11, fontWeight: '600' }}>
            {opt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const GoldButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={[cs.goldBtn, { backgroundColor: theme.gold }]}>
      <Text style={{ color: '#0A0A0A', fontFamily: FONTS.bold, fontSize: 14 }}>{label}</Text>
    </TouchableOpacity>
  );

  // ── Pre-fill banner ──
  const PreFill = () => {
    if (!profile?.weight_kg && !profile?.height_cm) return null;
    return (
      <View style={[cs.prefill, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}>
        <Text style={{ color: theme.textMuted, fontSize: 10, marginBottom: 4 }}>FROM YOUR PROFILE</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {profile?.weight_kg && <View style={{ alignItems: 'center' }}><Text style={{ color: theme.textPrimary, fontFamily: FONTS.cinzelBold, fontSize: 16 }}>{profile.weight_kg} kg</Text><Text style={{ color: theme.textMuted, fontSize: 9 }}>Weight</Text></View>}
          {profile?.height_cm && <View style={{ alignItems: 'center' }}><Text style={{ color: theme.textPrimary, fontFamily: FONTS.cinzelBold, fontSize: 16 }}>{profile.height_cm} cm</Text><Text style={{ color: theme.textMuted, fontSize: 9 }}>Height</Text></View>}
          {profile?.age && <View style={{ alignItems: 'center' }}><Text style={{ color: theme.textPrimary, fontFamily: FONTS.cinzelBold, fontSize: 16 }}>{profile.age} yrs</Text><Text style={{ color: theme.textMuted, fontSize: 9 }}>Age</Text></View>}
        </View>
      </View>
    );
  };

  // ── Render per calculator type ──
  const renderContent = () => {
    // ═══ CALORIE ═══
    if (calcType === 'calorie') {
      if (step === 99 && result) return renderCalorieResult();
      if (step === 0) return (<>
        {renderDots(4)}
        <Text style={[cs.stepLabel, { color: theme.textMuted }]}>Step 1 of 4 — Units</Text>
        <OptionRow options={['metric', 'imperial']} selected={unitSystem} onSelect={(v) => setUnitSystem(v as any)} />
        <GoldButton label="NEXT" onPress={() => setStep(1)} />
      </>);
      if (step === 1) return (<>
        {renderDots(4)}
        <Text style={[cs.stepLabel, { color: theme.textMuted }]}>Step 2 of 4 — Your Stats</Text>
        <PreFill />
        <InputField label={`Weight (${unitSystem === 'metric' ? 'kg' : 'lbs'})`} value={weight} onChangeText={setWeight} />
        <InputField label={`Height (${unitSystem === 'metric' ? 'cm' : 'inches'})`} value={height} onChangeText={setHeight} />
        <InputField label="Age" value={age} onChangeText={setAge} />
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Gender</Text>
        <OptionRow options={['male', 'female']} selected={gender} onSelect={(v) => setGender(v as any)} />
        <GoldButton label="NEXT" onPress={() => setStep(2)} />
      </>);
      if (step === 2) return (<>
        {renderDots(4)}
        <Text style={[cs.stepLabel, { color: theme.textMuted }]}>Step 3 of 4 — Activity Level</Text>
        <PreFill />
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Activity Level</Text>
        <OptionRow options={['sedentary', 'light', 'moderate', 'very_active', 'athlete']} selected={activityLevel} onSelect={setActivityLevel} />
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Your Goal</Text>
        <OptionRow options={['cut', 'recomp', 'bulk']} selected={goal} onSelect={setGoal} colors={{ cut: '#E74C3C', recomp: '#C8A96E', bulk: '#2ECC71' }} />
        <GoldButton label="CALCULATE MY CALORIES" onPress={calculateCalorie} />
      </>);
    }

    // ═══ HYDRATION ═══
    if (calcType === 'hydration') {
      if (step === 99 && result) return renderHydrationResult();
      return (<>
        {renderDots(1)}
        <InputField label="Weight (kg)" value={weight} onChangeText={setWeight} />
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Activity Level</Text>
        <OptionRow options={['sedentary', 'moderate', 'very_active']} selected={activityLevel} onSelect={setActivityLevel} />
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Climate</Text>
        <OptionRow options={['Normal', 'Hot']} selected={climate} onSelect={setClimate} />
        <GoldButton label="CALCULATE HYDRATION" onPress={calculateHydration} />
      </>);
    }

    // ═══ SLEEP ═══
    if (calcType === 'sleep') {
      if (step === 99 && result) return renderSleepResult();
      return (<>
        {renderDots(1)}
        <InputField label="Age" value={age} onChangeText={setAge} />
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Wake Time</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: SPACING.md }}>
          <TextInput style={[cs.input, { flex: 1, backgroundColor: theme.bgElevated, color: theme.textPrimary, borderColor: theme.border }]} value={wakeHour} onChangeText={setWakeHour} placeholder="7" placeholderTextColor={theme.textMuted} keyboardType="numeric" />
          <Text style={{ color: theme.textMuted, fontSize: 20, alignSelf: 'center' }}>:</Text>
          <TextInput style={[cs.input, { flex: 1, backgroundColor: theme.bgElevated, color: theme.textPrimary, borderColor: theme.border }]} value={wakeMinute} onChangeText={setWakeMinute} placeholder="00" placeholderTextColor={theme.textMuted} keyboardType="numeric" />
          <OptionRow options={['AM', 'PM']} selected={wakeAmPm} onSelect={(v) => setWakeAmPm(v as any)} />
        </View>
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Sleep Goal</Text>
        <OptionRow options={['standard', 'recovery', 'max_t']} selected={sleepGoal} onSelect={setSleepGoal} />
        <GoldButton label="CALCULATE SLEEP" onPress={calculateSleep} />
      </>);
    }

    // ═══ FFMI ═══
    if (calcType === 'ffmi') {
      if (step === 99 && result) return renderFFMIResult();
      return (<>
        {renderDots(1)}
        <PreFill />
        <InputField label="Weight (kg)" value={weight} onChangeText={setWeight} />
        <InputField label="Height (cm)" value={height} onChangeText={setHeight} />
        <InputField label="Body Fat %" value={bodyFatPct} onChangeText={setBodyFatPct} />
        <GoldButton label="CALCULATE FFMI" onPress={calculateFFMI} />
      </>);
    }

    // ═══ BMI + BODY FAT ═══
    if (calcType === 'bmi_bodyfat') {
      if (step === 99 && result) return renderBMIResult();
      return (<>
        {renderDots(1)}
        <PreFill />
        <InputField label="Weight (kg)" value={weight} onChangeText={setWeight} />
        <InputField label="Height (cm)" value={height} onChangeText={setHeight} />
        <InputField label="Age" value={age} onChangeText={setAge} />
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Gender</Text>
        <OptionRow options={['male', 'female']} selected={gender} onSelect={(v) => setGender(v as any)} />
        <InputField label="Neck (cm)" value={neckCm} onChangeText={setNeckCm} />
        <InputField label="Waist (cm)" value={waistCm} onChangeText={setWaistCm} />
        <GoldButton label="CALCULATE BMI + BODY FAT" onPress={calculateBMI} />
      </>);
    }

    // ═══ MACRO ═══
    if (calcType === 'macro') {
      if (step === 99 && result) return renderMacroResult();
      return (<>
        {renderDots(1)}
        <InputField label="Daily Calorie Target" value={calorieTarget} onChangeText={setCalorieTarget} placeholder="e.g. 2340" />
        <InputField label="Body Weight (kg)" value={weight} onChangeText={setWeight} />
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Goal</Text>
        <OptionRow options={['cut', 'recomp', 'bulk']} selected={macroGoal} onSelect={setMacroGoal} />
        <GoldButton label="CALCULATE MACROS" onPress={calculateMacro} />
      </>);
    }

    return null;
  };

  // ── Result renderers ──
  const renderCalorieResult = () => (
    <View>
      <View style={[cs.resultCard, { backgroundColor: theme.bgSurface, borderColor: theme.gold }]}>
        <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>YOUR DAILY TARGET</Text>
        <Text style={{ color: theme.gold, fontFamily: FONTS.cinzelBold, fontSize: 32 }}>{result.calories}</Text>
        <Text style={{ color: theme.gold, fontSize: 14 }}>kcal/day</Text>
        <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>
          Maintenance with body {goal === 'cut' ? 'fat loss' : goal === 'bulk' ? 'building' : 'recomposition'} goal
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: SPACING.md }}>
        {[
          { label: 'PROTEIN', value: `${result.protein}g`, color: '#2ECC71' },
          { label: 'CARBS', value: `${result.carbs}g`, color: '#C8A96E' },
          { label: 'FATS', value: `${result.fats}g`, color: '#E74C3C' },
        ].map(m => (
          <View key={m.label} style={[cs.macroBox, { backgroundColor: theme.bgSurface, borderColor: m.color }]}>
            <Text style={{ color: m.color, fontFamily: FONTS.cinzelBold, fontSize: 18 }}>{m.value}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 8, letterSpacing: 0.5 }}>{m.label}</Text>
          </View>
        ))}
      </View>
      <View style={[cs.saveNote, { backgroundColor: theme.bgElevated }]}>
        <Feather name="check-circle" size={14} color={theme.gold} />
        <Text style={{ color: theme.textMuted, fontSize: 11, marginLeft: 6 }}>Saved to your profile. Resets when you update weight or goal.</Text>
      </View>
      <GoldButton label="RECALCULATE" onPress={() => { setResult(null); setStep(0); }} />
    </View>
  );

  const renderHydrationResult = () => (
    <View>
      <View style={[cs.resultCard, { backgroundColor: theme.bgSurface, borderColor: '#4A90D9' }]}>
        <Text style={{ color: '#4A90D9', fontFamily: FONTS.cinzelBold, fontSize: 32 }}>{result.liters} L/day</Text>
        <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>Total: {result.total_ml} ml</Text>
      </View>
      <View style={{ marginTop: SPACING.md, gap: 8 }}>
        {[
          { time: 'Morning (wake)', ml: `${result.morning}ml` },
          { time: 'Pre-workout', ml: `${result.pre_workout}ml` },
          { time: 'Post-workout', ml: `${result.post_workout}ml` },
          { time: 'Evening', ml: `${result.evening}ml` },
        ].map(t => (
          <View key={t.time} style={[cs.timeRow, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <Text style={{ color: theme.textPrimary, fontSize: 12 }}>{t.time}</Text>
            <Text style={{ color: '#4A90D9', fontFamily: FONTS.bold, fontSize: 12 }}>{t.ml}</Text>
          </View>
        ))}
      </View>
      <GoldButton label="RECALCULATE" onPress={() => { setResult(null); setStep(0); }} />
    </View>
  );

  const renderSleepResult = () => (
    <View>
      <View style={[cs.resultCard, { backgroundColor: theme.bgSurface, borderColor: '#9B59B6' }]}>
        <Text style={{ color: '#9B59B6', fontFamily: FONTS.cinzelBold, fontSize: 32 }}>{result.total_hours} hrs</Text>
        <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>{result.cycles} sleep cycles recommended</Text>
      </View>
      <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 1, marginTop: SPACING.md, marginBottom: 8 }}>BEST BEDTIMES</Text>
      {result.bedtimes.map((bt: string, i: number) => (
        <View key={i} style={[cs.timeRow, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Text style={{ color: theme.textPrimary, fontSize: 13, fontFamily: FONTS.semiBold }}>{bt}</Text>
          <Text style={{ color: '#9B59B6', fontSize: 10 }}>Option {i + 1}</Text>
        </View>
      ))}
      <View style={[cs.saveNote, { backgroundColor: '#9B59B622' }]}>
        <Feather name="moon" size={14} color="#9B59B6" />
        <Text style={{ color: '#9B59B6', fontSize: 11, marginLeft: 6 }}>{result.note}</Text>
      </View>
      <GoldButton label="RECALCULATE" onPress={() => { setResult(null); setStep(0); }} />
    </View>
  );

  const renderFFMIResult = () => {
    const nf = parseFloat(result.normalized_ffmi);
    const pct = Math.min(100, Math.max(0, (nf / 30) * 100));
    return (
      <View>
        <View style={[cs.resultCard, { backgroundColor: theme.bgSurface, borderColor: '#2ECC71' }]}>
          <Text style={{ color: '#2ECC71', fontFamily: FONTS.cinzelBold, fontSize: 32 }}>{result.normalized_ffmi}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>Normalized FFMI</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 13, marginTop: 8, fontFamily: FONTS.semiBold }}>{result.rating}</Text>
        </View>
        {/* Scale bar */}
        <View style={{ marginTop: SPACING.md }}>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: theme.border, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${pct}%`, backgroundColor: nf >= 26 ? '#E74C3C' : nf >= 22 ? '#C8A96E' : '#2ECC71', borderRadius: 5 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={{ color: theme.textMuted, fontSize: 8 }}>Below avg</Text>
            <Text style={{ color: theme.textMuted, fontSize: 8 }}>Average</Text>
            <Text style={{ color: theme.textMuted, fontSize: 8 }}>Excellent</Text>
            <Text style={{ color: theme.textMuted, fontSize: 8 }}>Natural limit</Text>
          </View>
        </View>
        <View style={[cs.saveNote, { backgroundColor: '#C8A96E15' }]}>
          <Feather name="info" size={14} color={theme.gold} />
          <Text style={{ color: theme.gold, fontSize: 11, marginLeft: 6 }}>Natural ceiling is approximately 25-26 FFMI</Text>
        </View>
        <GoldButton label="RECALCULATE" onPress={() => { setResult(null); setStep(0); }} />
      </View>
    );
  };

  const renderBMIResult = () => {
    const bmi = parseFloat(result.bmi);
    const zoneColors = ['#E74C3C', '#E67E22', '#2ECC71', '#4A90D9', '#C8A96E'];
    const pct = Math.min(100, Math.max(0, ((bmi - 10) / 35) * 100));
    return (
      <View>
        <View style={[cs.resultCard, { backgroundColor: theme.bgSurface, borderColor: '#E67E22' }]}>
          <Text style={{ color: '#E67E22', fontFamily: FONTS.cinzelBold, fontSize: 32 }}>{result.bmi}</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 13, marginTop: 4, fontFamily: FONTS.semiBold }}>{result.bmi_category}</Text>
        </View>
        {/* BMI Bar */}
        <View style={{ height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden', marginTop: SPACING.md }}>
          {zoneColors.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
        </View>
        {result.body_fat && (
          <View style={[cs.resultCard, { backgroundColor: theme.bgSurface, borderColor: theme.border, marginTop: SPACING.md }]}>
            <Text style={{ color: theme.textMuted, fontSize: 10 }}>BODY FAT (US NAVY)</Text>
            <Text style={{ color: '#E67E22', fontFamily: FONTS.cinzelBold, fontSize: 24 }}>{result.body_fat}%</Text>
          </View>
        )}
        {result.jaw_note ? (
          <View style={[cs.saveNote, { backgroundColor: '#C8A96E15' }]}>
            <Feather name="eye" size={14} color={theme.gold} />
            <Text style={{ color: theme.gold, fontSize: 11, marginLeft: 6 }}>Jaw definition: {result.jaw_note}</Text>
          </View>
        ) : null}
        <GoldButton label="RECALCULATE" onPress={() => { setResult(null); setStep(0); }} />
      </View>
    );
  };

  const renderMacroResult = () => (
    <View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { label: 'PROTEIN', value: `${result.protein}g`, color: '#2ECC71' },
          { label: 'CARBS', value: `${result.carbs}g`, color: '#C8A96E' },
          { label: 'FATS', value: `${result.fats}g`, color: '#E74C3C' },
        ].map(m => (
          <View key={m.label} style={[cs.macroBox, { flex: 1, backgroundColor: theme.bgSurface, borderColor: m.color }]}>
            <Text style={{ color: m.color, fontFamily: FONTS.cinzelBold, fontSize: 22 }}>{m.value}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 8, letterSpacing: 0.5 }}>{m.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: SPACING.lg, gap: 8 }}>
        <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 1 }}>TIMING GUIDE</Text>
        {[
          { time: 'Pre-workout', food: 'Complex carbs + lean protein' },
          { time: 'Post-workout', food: 'Fast carbs + whey protein' },
          { time: 'Before bed', food: 'Casein protein + healthy fats' },
        ].map(t => (
          <View key={t.time} style={[cs.timeRow, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <Text style={{ color: theme.textPrimary, fontSize: 12 }}>{t.time}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 10 }}>{t.food}</Text>
          </View>
        ))}
      </View>
      <GoldButton label="RECALCULATE" onPress={() => { setResult(null); setStep(0); }} />
    </View>
  );

  return (
    <SafeAreaView style={[cs.container, { backgroundColor: theme.bgPrimary }]}>
      <View style={cs.header}>
        <TouchableOpacity onPress={safeBack} style={{ padding: 4 }}>
          <Feather name="arrow-left" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[cs.headerTitle, { color: theme.gold, fontFamily: FONTS.cinzelBold }]}>
          {CALC_TITLES[calcType] || 'Calculator'}
        </Text>
        <View style={{ width: 30 }} />
      </View>
      <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: 'center', marginBottom: SPACING.md }}>
        Based on your saved profile stats
      </Text>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}>
          <View style={[cs.formCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <Text style={{ color: theme.gold, fontFamily: FONTS.cinzelBold, fontSize: 14, marginBottom: 4 }}>
              {step === 99 ? 'YOUR RESULTS' : CALC_TITLES[calcType]?.toUpperCase()}
            </Text>
            {step !== 99 && (
              <Text style={{ color: theme.textMuted, fontSize: 10, marginBottom: SPACING.md }}>
                {calcType === 'calorie' && step < 3 ? `Step ${step + 1} of 3 — ${['Units', 'Your Stats', 'Activity Level'][step]}` : ''}
              </Text>
            )}
            {renderContent()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const cs = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: 8 },
  headerTitle: { fontSize: 16 },
  formCard: { borderWidth: 0.5, borderRadius: 14, padding: SPACING.lg },
  stepLabel: { fontSize: 10, marginBottom: SPACING.md },
  inputLabel: { fontSize: 10, letterSpacing: 0.5, marginBottom: 4 },
  input: { borderWidth: 0.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  optionPill: { borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  goldBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: SPACING.lg },
  prefill: { borderWidth: 0.5, borderRadius: 10, padding: SPACING.md, marginBottom: SPACING.md, alignItems: 'center' },
  resultCard: { borderWidth: 0.5, borderRadius: 12, padding: SPACING.lg, alignItems: 'center' },
  macroBox: { borderWidth: 1, borderRadius: 10, padding: SPACING.md, alignItems: 'center' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 0.5, borderRadius: 8, padding: SPACING.md, marginBottom: 6 },
  saveNote: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, padding: SPACING.md, marginTop: SPACING.md },
});
