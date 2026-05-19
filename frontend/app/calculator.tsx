import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { FONTS, SPACING, RADIUS } from '../src/constants/theme';

const cs = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: 8 },
  headerTitle: { fontSize: 16 },
  formCard: { borderWidth: 0.5, borderRadius: 14, padding: SPACING.lg },
  stepLabel: { fontSize: 13, marginBottom: SPACING.md, fontFamily: FONTS.semiBold, letterSpacing: 0.5 },
  inputLabel: { fontSize: 13, fontFamily: FONTS.semiBold, letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 0.5, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, fontFamily: FONTS.semiBold },
  optionPill: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  goldBtn: { paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: SPACING.xl },
  prefill: { borderWidth: 0.5, borderRadius: 10, padding: SPACING.md, marginBottom: SPACING.md, alignItems: 'center' },
  resultCard: { borderWidth: 1, borderRadius: 16, padding: SPACING.xl, alignItems: 'center' },
  macroBox: { borderWidth: 1, borderRadius: 16, padding: SPACING.lg, alignItems: 'center', flex: 1 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 0.5, borderRadius: 10, padding: SPACING.md, marginBottom: 8 },
  saveNote: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: SPACING.md, marginTop: SPACING.lg },
  animatedResultContainer: { opacity: 1, transform: [{ translateY: 0 }] }
});

type CalcType = 'calorie' | 'hydration' | 'sleep' | 'ffmi' | 'bmi_bodyfat' | 'macro';

// --- Shared UI Components to avoid re-renders ---
const InputField = React.memo(({ label, value, onChangeText, placeholder, keyboardType, theme }: any) => (
  <View style={{ marginBottom: SPACING.md }}>
    <Text style={[cs.inputLabel, { color: theme.textMuted }]}>{label.toUpperCase()}</Text>
    <TextInput
      style={[cs.input, { 
        backgroundColor: theme.bgElevated, 
        color: theme.textPrimary, 
        borderColor: theme.border,
        fontSize: 22, // Larger, more professional font
        fontFamily: FONTS.bold
      }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder || ''}
      placeholderTextColor={theme.textMuted}
      keyboardType={keyboardType || 'numeric'}
    />
  </View>
));

const OptionRow = React.memo(({ options, selected, onSelect, colors, theme }: any) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md }}>
    {options.map((opt: string) => (
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
));

const GoldButton = React.memo(({ label, onPress, theme }: any) => (
  <TouchableOpacity onPress={onPress} style={[cs.goldBtn, { backgroundColor: theme.gold }]}>
    <Text style={{ color: '#0A0A0A', fontFamily: FONTS.bold, fontSize: 14 }}>{label}</Text>
  </TouchableOpacity>
));

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
  const { profile, user, refreshProfile } = useAuth();
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

  useEffect(() => {
    // Fetch previous results for this calcType to pre-fill specific inputs
    const fetchPrevious = async () => {
      if (!user?.id) return;
      const { data } = await supabase.from('calculator_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('calc_type', calcType)
        .single();
      if (data && data.inputs) {
        const i = data.inputs;
        if (i.neck_cm) setNeckCm(String(i.neck_cm));
        if (i.waist_cm) setWaistCm(String(i.waist_cm));
        if (i.activity_level) setActivityLevel(i.activity_level);
        if (i.goal) setGoal(i.goal);
        if (i.calories_target) setCalorieTarget(String(i.calories_target));
      }
    };
    fetchPrevious();
  }, [calcType]);

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
      if (inputs.weight_kg) updates.weight_kg = parseFloat(inputs.weight_kg);
      if (inputs.height_cm) updates.height_cm = parseFloat(inputs.height_cm);
      if (inputs.age) updates.age = parseInt(inputs.age);
      if (inputs.gender) updates.gender = inputs.gender;
      
      // Award XP for calculation (limited to once per type per day? Or just always)
      const currentXP = profile?.xp || 0;
      updates.xp = currentXP + 25; // Small reward for using tools

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
        if (error) console.error('Profile update error:', error);
      }
      
      await refreshProfile(); 
      Alert.alert('Analysis Complete', 'Your results have been synchronized and you earned +25 XP!');
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

  // ── Pre-fill banner ──
  const renderPreFill = () => {
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
        <OptionRow options={['metric', 'imperial']} selected={unitSystem} onSelect={(v: any) => setUnitSystem(v)} theme={theme} />
        <GoldButton label="NEXT" onPress={() => setStep(1)} theme={theme} />
      </>);
      if (step === 1) return (<>
        {renderDots(4)}
        <Text style={[cs.stepLabel, { color: theme.textMuted }]}>Step 2 of 4 — Your Stats</Text>
        {renderPreFill()}
        <InputField label={`Weight (${unitSystem === 'metric' ? 'kg' : 'lbs'})`} value={weight} onChangeText={setWeight} theme={theme} />
        <InputField label={`Height (${unitSystem === 'metric' ? 'cm' : 'inches'})`} value={height} onChangeText={setHeight} theme={theme} />
        <InputField label="Age" value={age} onChangeText={setAge} theme={theme} />
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Gender</Text>
        <OptionRow options={['male', 'female']} selected={gender} onSelect={(v: any) => setGender(v)} theme={theme} />
        <GoldButton label="NEXT" onPress={() => setStep(2)} theme={theme} />
      </>);
      if (step === 2) return (<>
        {renderDots(4)}
        <Text style={[cs.stepLabel, { color: theme.textMuted }]}>Step 3 of 4 — Activity Level</Text>
        {renderPreFill()}
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Activity Level</Text>
        <OptionRow options={['sedentary', 'light', 'moderate', 'very_active', 'athlete']} selected={activityLevel} onSelect={setActivityLevel} theme={theme} />
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Your Goal</Text>
        <OptionRow options={['cut', 'recomp', 'bulk']} selected={goal} onSelect={setGoal} colors={{ cut: '#E74C3C', recomp: '#C8A96E', bulk: '#2ECC71' }} theme={theme} />
        <GoldButton label="CALCULATE MY CALORIES" onPress={calculateCalorie} theme={theme} />
      </>);
    }

    // ═══ HYDRATION ═══
    if (calcType === 'hydration') {
      if (step === 99 && result) return renderHydrationResult();
      return (<>
        {renderDots(1)}
        <InputField label="Weight (kg)" value={weight} onChangeText={setWeight} theme={theme} />
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Activity Level</Text>
        <OptionRow options={['sedentary', 'moderate', 'very_active']} selected={activityLevel} onSelect={setActivityLevel} theme={theme} />
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Climate</Text>
        <OptionRow options={['Normal', 'Hot']} selected={climate} onSelect={setClimate} theme={theme} />
        <GoldButton label="CALCULATE HYDRATION" onPress={calculateHydration} theme={theme} />
      </>);
    }

    // ═══ SLEEP ═══
    if (calcType === 'sleep') {
      if (step === 99 && result) return renderSleepResult();
      return (<>
        {renderDots(1)}
        <InputField label="Age" value={age} onChangeText={setAge} theme={theme} />
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Wake Time</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: SPACING.md }}>
          <TextInput style={[cs.input, { flex: 1, backgroundColor: theme.bgElevated, color: theme.textPrimary, borderColor: theme.border }]} value={wakeHour} onChangeText={setWakeHour} placeholder="7" placeholderTextColor={theme.textMuted} keyboardType="numeric" />
          <Text style={{ color: theme.textMuted, fontSize: 20, alignSelf: 'center' }}>:</Text>
          <TextInput style={[cs.input, { flex: 1, backgroundColor: theme.bgElevated, color: theme.textPrimary, borderColor: theme.border }]} value={wakeMinute} onChangeText={setWakeMinute} placeholder="00" placeholderTextColor={theme.textMuted} keyboardType="numeric" />
          <OptionRow options={['AM', 'PM']} selected={wakeAmPm} onSelect={(v: any) => setWakeAmPm(v)} theme={theme} />
        </View>
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Sleep Goal</Text>
        <OptionRow options={['standard', 'recovery', 'max_t']} selected={sleepGoal} onSelect={setSleepGoal} theme={theme} />
        <GoldButton label="CALCULATE SLEEP" onPress={calculateSleep} theme={theme} />
      </>);
    }

    // ═══ FFMI ═══
    if (calcType === 'ffmi') {
      if (step === 99 && result) return renderFFMIResult();
      return (<>
        {renderDots(1)}
        {renderPreFill()}
        <InputField label="Weight (kg)" value={weight} onChangeText={setWeight} theme={theme} />
        <InputField label="Height (cm)" value={height} onChangeText={setHeight} theme={theme} />
        <InputField label="Body Fat %" value={bodyFatPct} onChangeText={setBodyFatPct} theme={theme} />
        <GoldButton label="CALCULATE FFMI" onPress={calculateFFMI} theme={theme} />
      </>);
    }

    // ═══ BMI + BODY FAT ═══
    if (calcType === 'bmi_bodyfat') {
      if (step === 99 && result) return renderBMIResult();
      return (<>
        {renderDots(1)}
        {renderPreFill()}
        <InputField label="Weight (kg)" value={weight} onChangeText={setWeight} theme={theme} />
        <InputField label="Height (cm)" value={height} onChangeText={setHeight} theme={theme} />
        <InputField label="Age" value={age} onChangeText={setAge} theme={theme} />
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Gender</Text>
        <OptionRow options={['male', 'female']} selected={gender} onSelect={(v: any) => setGender(v)} theme={theme} />
        <InputField label="Neck (cm)" value={neckCm} onChangeText={setNeckCm} theme={theme} />
        <InputField label="Waist (cm)" value={waistCm} onChangeText={setWaistCm} theme={theme} />
        <GoldButton label="CALCULATE BMI + BODY FAT" onPress={calculateBMI} theme={theme} />
      </>);
    }

    // ═══ MACRO ═══
    if (calcType === 'macro') {
      if (step === 99 && result) return renderMacroResult();
      return (<>
        {renderDots(1)}
        <InputField label="Daily Calorie Target" value={calorieTarget} onChangeText={setCalorieTarget} placeholder="e.g. 2340" theme={theme} />
        <InputField label="Body Weight (kg)" value={weight} onChangeText={setWeight} theme={theme} />
        <Text style={[cs.inputLabel, { color: theme.textMuted }]}>Goal</Text>
        <OptionRow options={['cut', 'recomp', 'bulk']} selected={macroGoal} onSelect={setMacroGoal} theme={theme} />
        <GoldButton label="CALCULATE MACROS" onPress={calculateMacro} theme={theme} />
      </>);
    }

    return null;
  };

  // ── Result renderers with Animation ──
  const ResultWrapper = ({ children }: { children: React.ReactNode }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
      ]).start();
    }, []);

    return (
      <Animated.View style={[cs.animatedResultContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {children}
      </Animated.View>
    );
  };

  const renderCalorieResult = () => (
    <ResultWrapper>
      <View style={[cs.resultCard, { backgroundColor: theme.bgSurface, borderColor: theme.gold, borderLeftWidth: 4 }]}>
        <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>YOUR DAILY OPTIMAL TARGET</Text>
        <Text style={{ color: theme.gold, fontFamily: FONTS.cinzelBold, fontSize: 52 }}>{result.calories}</Text>
        <Text style={{ color: theme.gold, fontSize: 18, fontFamily: FONTS.bold, letterSpacing: 1 }}>KCAL / DAY</Text>
        <View style={{ height: 1, width: '100%', backgroundColor: theme.border, marginVertical: 16 }} />
        <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center', fontFamily: FONTS.medium }}>
          Optimized for <Text style={{ color: theme.textPrimary }}>{goal.toUpperCase()}</Text> protocols
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: SPACING.lg }}>
        {[
          { label: 'PROTEIN', value: `${result.protein}g`, color: '#2ECC71' },
          { label: 'CARBS', value: `${result.carbs}g`, color: '#C8A96E' },
          { label: 'FATS', value: `${result.fats}g`, color: '#E74C3C' },
        ].map(m => (
          <View key={m.label} style={[cs.macroBox, { backgroundColor: theme.bgSurface, borderColor: m.color + '44' }]}>
            <Text style={{ color: m.color, fontFamily: FONTS.cinzelBold, fontSize: 24 }}>{m.value}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 9, letterSpacing: 1, marginTop: 4 }}>{m.label}</Text>
          </View>
        ))}
      </View>
      <View style={[cs.saveNote, { backgroundColor: theme.bgElevated }]}>
        <Feather name="shield" size={16} color={theme.gold} />
        <Text style={{ color: theme.textMuted, fontSize: 11, fontStyle: 'italic', marginLeft: 8, flex: 1 }}>Data synchronized to your Alpha profile.</Text>
      </View>
      <GoldButton label="START NEW CALCULATION" onPress={() => { setResult(null); setStep(0); }} theme={theme} />
    </ResultWrapper>
  );

  const renderHydrationResult = () => (
    <ResultWrapper>
      <View style={[cs.resultCard, { backgroundColor: theme.bgSurface, borderColor: '#4A90D9', borderLeftWidth: 4 }]}>
        <Text style={{ color: '#4A90D9', fontFamily: FONTS.cinzelBold, fontSize: 44 }}>{result.liters} L / DAY</Text>
        <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>TOTAL VOLUME: {result.total_ml} ML</Text>
      </View>
      <View style={{ marginTop: SPACING.lg, gap: 10 }}>
        {[
          { time: 'Mornings (Immediate)', ml: `${result.morning}ml` },
          { time: 'Pre-workout Window', ml: `${result.pre_workout}ml` },
          { time: 'Post-workout Window', ml: `${result.post_workout}ml` },
          { time: 'Evening & Night', ml: `${result.evening}ml` },
        ].map(t => (
          <View key={t.time} style={[cs.timeRow, { backgroundColor: theme.bgSurface, borderColor: theme.border, paddingVertical: 14 }]}>
            <Text style={{ color: theme.textPrimary, fontSize: 14, fontFamily: FONTS.bold }}>{t.time}</Text>
            <Text style={{ color: '#4A90D9', fontFamily: FONTS.bold, fontSize: 14 }}>{t.ml}</Text>
          </View>
        ))}
      </View>
      <GoldButton label="START NEW CALCULATION" onPress={() => { setResult(null); setStep(0); }} theme={theme} />
    </ResultWrapper>
  );

  const renderSleepResult = () => (
    <ResultWrapper>
      <View style={[cs.resultCard, { backgroundColor: theme.bgSurface, borderColor: '#9B59B6', borderLeftWidth: 4 }]}>
        <Text style={{ color: '#9B59B6', fontFamily: FONTS.cinzelBold, fontSize: 44 }}>{result.total_hours} HRS</Text>
        <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>{result.cycles} ARCHITECTED SLEEP CYCLES</Text>
      </View>
      <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 2, marginTop: SPACING.lg, marginBottom: 12 }}>OPTIMIZED BEDTIMES</Text>
      {result.bedtimes.map((bt: string, i: number) => (
        <View key={i} style={[cs.timeRow, { backgroundColor: theme.bgSurface, borderColor: theme.border, paddingVertical: 16 }]}>
          <Text style={{ color: theme.textPrimary, fontSize: 18, fontFamily: FONTS.cinzelBold }}>{bt}</Text>
          <Text style={{ color: '#9B59B6', fontSize: 10, fontFamily: FONTS.bold }}>WINDOW {i + 1}</Text>
        </View>
      ))}
      <View style={[cs.saveNote, { backgroundColor: '#9B59B615', marginTop: SPACING.md }]}>
        <Feather name="moon" size={16} color="#9B59B6" />
        <Text style={{ color: '#9B59B6', fontSize: 12, marginLeft: 8, fontFamily: FONTS.medium }}>{result.note}</Text>
      </View>
      <GoldButton label="RE-OPTIMIZE SLEEP" onPress={() => { setResult(null); setStep(0); }} theme={theme} />
    </ResultWrapper>
  );

  const renderFFMIResult = () => {
    const nf = parseFloat(result.normalized_ffmi);
    const pct = Math.min(100, Math.max(0, (nf / 30) * 100));
    return (
      <ResultWrapper>
        <View style={[cs.resultCard, { backgroundColor: theme.bgSurface, borderColor: '#2ECC71', borderLeftWidth: 4 }]}>
          <Text style={{ color: '#2ECC71', fontFamily: FONTS.cinzelBold, fontSize: 44 }}>{result.normalized_ffmi}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>NORMALIZED FAT-FREE MASS INDEX</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 18, marginTop: 12, fontFamily: FONTS.cinzelBold, letterSpacing: 1 }}>{result.rating.toUpperCase()}</Text>
        </View>
        <View style={{ marginTop: SPACING.lg }}>
          <View style={{ height: 12, borderRadius: 6, backgroundColor: theme.border, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${pct}%`, backgroundColor: nf >= 26 ? '#E74C3C' : nf >= 22 ? '#C8A96E' : '#2ECC71', borderRadius: 6 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ color: theme.textMuted, fontSize: 8 }}>NATURAL</Text>
            <Text style={{ color: theme.textMuted, fontSize: 8 }}>ELITE</Text>
            <Text style={{ color: theme.textMuted, fontSize: 8 }}>UNLIKELY</Text>
          </View>
        </View>
        <View style={[cs.saveNote, { backgroundColor: '#C8A96E15', marginTop: SPACING.md }]}>
          <Feather name="info" size={16} color={theme.gold} />
          <Text style={{ color: theme.gold, fontSize: 12, marginLeft: 8, fontFamily: FONTS.medium }}>Elite natural potential usually peaks around 25 FFMI.</Text>
        </View>
        <GoldButton label="START NEW CALCULATION" onPress={() => { setResult(null); setStep(0); }} theme={theme} />
      </ResultWrapper>
    );
  };

  const renderBMIResult = () => {
    const bmi = parseFloat(result.bmi);
    const zoneColors = ['#E74C3C', '#E67E22', '#2ECC71', '#4A90D9', '#C8A96E'];
    return (
      <ResultWrapper>
        <View style={[cs.resultCard, { backgroundColor: theme.bgSurface, borderColor: '#E67E22', borderLeftWidth: 4 }]}>
          <Text style={{ color: '#E67E22', fontFamily: FONTS.cinzelBold, fontSize: 44 }}>{result.bmi}</Text>
          <Text style={{ color: theme.textPrimary, fontSize: 18, marginTop: 4, fontFamily: FONTS.cinzelBold, letterSpacing: 1 }}>{result.bmi_category.toUpperCase()}</Text>
        </View>
        
        <View style={{ height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden', marginTop: SPACING.lg }}>
          {zoneColors.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
        </View>

        {result.body_fat && (
          <View style={[cs.resultCard, { backgroundColor: theme.bgSurface, borderColor: theme.border, marginTop: SPACING.lg, paddingVertical: 20 }]}>
            <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 1.5 }}>ESTIMATED BODY FAT (NAVY)</Text>
            <Text style={{ color: '#E67E22', fontFamily: FONTS.cinzelBold, fontSize: 36 }}>{result.body_fat}%</Text>
          </View>
        )}
        {result.jaw_note ? (
          <View style={[cs.saveNote, { backgroundColor: theme.gold + '15', marginTop: SPACING.md }]}>
            <Feather name="target" size={16} color={theme.gold} />
            <Text style={{ color: theme.gold, fontSize: 12, marginLeft: 8, fontFamily: FONTS.medium }}>Visual Indicator: {result.jaw_note}</Text>
          </View>
        ) : null}
        <GoldButton label="START NEW CALCULATION" onPress={() => { setResult(null); setStep(0); }} theme={theme} />
      </ResultWrapper>
    );
  };

  const renderMacroResult = () => (
    <ResultWrapper>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[
          { label: 'PROTEIN', value: `${result.protein}g`, color: '#2ECC71' },
          { label: 'CARBS', value: `${result.carbs}g`, color: '#C8A96E' },
          { label: 'FATS', value: `${result.fats}g`, color: '#E74C3C' },
        ].map(m => (
          <View key={m.label} style={[cs.macroBox, { flex: 1, backgroundColor: theme.bgSurface, borderColor: m.color + '44' }]}>
            <Text style={{ color: m.color, fontFamily: FONTS.cinzelBold, fontSize: 26 }}>{m.value}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 9, letterSpacing: 1, marginTop: 4 }}>{m.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: SPACING.lg, gap: 10 }}>
        <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>NUTRITIONAL STRATEGY</Text>
        {[
          { time: 'Pre-workout Window', food: 'Complex Carbs + Lean Amino Source' },
          { time: 'Post-workout Window', food: 'Fast Glycemic Index Carbs + Whey' },
          { time: 'Nocturnal Window', food: 'Micellar Casein + Monounsaturated Fats' },
        ].map(t => (
          <View key={t.time} style={[cs.timeRow, { backgroundColor: theme.bgSurface, borderColor: theme.border, paddingVertical: 14 }]}>
            <Text style={{ color: theme.textPrimary, fontSize: 13, fontFamily: FONTS.bold }}>{t.time}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: FONTS.medium }}>{t.food}</Text>
          </View>
        ))}
      </View>
      <GoldButton label="START NEW CALCULATION" onPress={() => { setResult(null); setStep(0); }} theme={theme} />
    </ResultWrapper>
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
        <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
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

