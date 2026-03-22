export const MOCK_USER = {
  id: 'user_001',
  email: 'user@example.com',
  full_name: 'Member',
  date_of_birth: '2000-01-01',
};

export const MOCK_PROFILE = {
  user_id: 'user_001',
  goals: ['jaw', 'nofap', 'muscle', 'confidence'],
  weak_spots: ['weak_jaw', 'low_energy', 'porn_habit'],
  height_cm: 178,
  weight_kg: 75,
  sleep_hours: 7,
  stress_level: 4,
  activity_level: 'moderate',
  power_level: 347,
  xp: 2450,
  level_title: 'Rising Alpha',
  avatar_url: null,
};

export const MOCK_SUBSCRIPTION = {
  plan: 'alpha',
  status: 'trialing',
  trial_start: new Date(Date.now() - 4 * 86400000).toISOString(),
  trial_end: new Date(Date.now() + 3 * 86400000).toISOString(),
  trial_days_remaining: 3,
};

export const MOCK_STREAKS = {
  daily: { current_streak: 7, longest_streak: 14 },
  nofap: { current_streak: 12, longest_streak: 22, start_date: new Date(Date.now() - 12 * 86400000).toISOString() },
  workout: { current_streak: 5, longest_streak: 10 },
};

export const MOCK_DAILY_MISSIONS = [
  { id: 'm1', name: '10 min jaw exercise', xp: 40, completed: false },
  { id: 'm2', name: 'Read today\'s wisdom card', xp: 30, completed: false },
  { id: 'm3', name: '30 push-ups', xp: 50, completed: false },
];

export const MOCK_WISDOM = {
  quote: 'Discipline is choosing between what you want now and what you want most.',
  author: 'Abraham Lincoln',
  category: 'discipline',
};

export const MOCK_PROGRESS_CARDS = [
  { label: 'Jaw', value: '12', unit: 'days', icon: 'target' as const },
  { label: 'NoFap', value: '12d 4h', unit: '', icon: 'shield' as const },
  { label: 'Body', value: '5', unit: 'workouts', icon: 'activity' as const },
  { label: 'XP', value: '550', unit: 'to next', icon: 'zap' as const },
];

export const GOAL_OPTIONS = [
  { key: 'jaw', label: 'Jaw & Facial Sculpting', icon: 'target' as const },
  { key: 'spine', label: 'Spinal Alignment', icon: 'align-center' as const },
  { key: 'sexual', label: 'Sexual Performance', icon: 'heart' as const },
  { key: 'nofap', label: 'NoFap & Confidence', icon: 'shield' as const },
  { key: 'social', label: 'Social Presence', icon: 'users' as const },
  { key: 'muscle', label: 'Build Muscle', icon: 'activity' as const },
  { key: 'digital', label: 'Digital Identity', icon: 'smartphone' as const },
  { key: 'more', label: 'More Goals', icon: 'plus' as const },
];

export const WEAK_SPOT_OPTIONS = [
  { key: 'weak_jaw', label: 'Weak jaw / no definition', icon: 'frown' as const },
  { key: 'bad_posture', label: 'Bad posture / hunched', icon: 'align-center' as const },
  { key: 'low_energy', label: 'Low energy / brain fog', icon: 'battery' as const },
  { key: 'porn_habit', label: 'Porn / masturbation habit', icon: 'eye-off' as const },
  { key: 'no_confidence', label: 'No confidence with girls', icon: 'user-x' as const },
  { key: 'weak_social', label: 'Weak social media', icon: 'smartphone' as const },
  { key: 'low_motivation', label: 'Low motivation', icon: 'trending-down' as const },
  { key: 'skincare', label: 'Skincare / grooming gaps', icon: 'droplet' as const },
];

export const PLAN_OPTIONS = [
  {
    key: 'grind',
    name: 'GRIND',
    price: '$9.99',
    priceAmount: 9.99,
    badge: null,
    features: [
      { name: 'Jaw & Body Training', included: true },
      { name: 'Daily Missions & XP', included: true },
      { name: 'Wisdom Cards', included: true },
      { name: 'NoFap Tracker', included: true },
      { name: 'AI Face Coach', included: false },
      { name: 'Profile Audit', included: false },
      { name: 'Convo Simulator', included: false },
      { name: 'Brotherhood Access', included: false },
    ],
  },
  {
    key: 'alpha',
    name: 'ALPHA',
    price: '$19.99',
    priceAmount: 19.99,
    badge: 'MOST POPULAR',
    features: [
      { name: 'Everything in Grind', included: true },
      { name: 'AI Face Coach (4/mo)', included: true },
      { name: 'Profile Audit (3/mo)', included: true },
      { name: 'Brotherhood Post Access', included: true },
      { name: 'Convo Simulator (3/mo)', included: true },
      { name: 'Unlimited Audits', included: false },
      { name: 'Unlimited Convo Lab', included: false },
      { name: 'AI Weekly Report', included: false },
    ],
  },
  {
    key: 'sigma',
    name: 'SIGMA',
    price: '$34.99',
    priceAmount: 34.99,
    badge: 'ULTIMATE',
    features: [
      { name: 'Everything in Alpha', included: true },
      { name: 'Unlimited Convo Lab', included: true },
      { name: 'Unlimited Profile Audit', included: true },
      { name: 'AI Weekly Report', included: true },
      { name: 'Priority Support', included: true },
      { name: 'Early Feature Access', included: true },
      { name: 'Sigma Badge', included: true },
      { name: 'All Future Features', included: true },
    ],
  },
];

export const JAW_EXERCISES = {
  level1: {
    title: 'Level 1 — Foundation',
    status: 'unlocked' as const,
    exercises: [
      { id: 'j1', name: 'Mewing Fundamentals', sets: 3, hold: 60, rest: 30, xp: 40, completed: false },
      { id: 'j2', name: 'Jaw Clenching', sets: 3, hold: 30, rest: 20, xp: 35, completed: false },
      { id: 'j3', name: 'Tongue Posture Hold', sets: 4, hold: 45, rest: 15, xp: 40, completed: true },
      { id: 'j4', name: 'Chin Tucks', sets: 3, hold: 20, rest: 15, xp: 30, completed: true },
    ],
  },
  level2: {
    title: 'Level 2 — Intermediate',
    status: 'locked' as const,
    daysToUnlock: 7,
    progress: 3,
    exercises: [
      { id: 'j5', name: 'Advanced Mewing', sets: 4, hold: 60, rest: 20, xp: 50 },
      { id: 'j6', name: 'Jaw Resistance', sets: 3, hold: 45, rest: 20, xp: 45 },
      { id: 'j7', name: 'Neck Strengthening', sets: 3, hold: 30, rest: 15, xp: 40 },
      { id: 'j8', name: 'Face Pulls', sets: 4, hold: 20, rest: 15, xp: 35 },
    ],
  },
  level3: {
    title: 'Level 3 — Advanced',
    status: 'locked' as const,
    daysToUnlock: 21,
    progress: 0,
    exercises: [
      { id: 'j9', name: 'Full Jaw Sculpting', sets: 5, hold: 60, rest: 20, xp: 60 },
      { id: 'j10', name: 'Symmetry Training', sets: 4, hold: 45, rest: 20, xp: 55 },
    ],
  },
};

export const BODY_PROGRAMS = [
  {
    key: 'beginner',
    title: 'Beginner',
    duration: '4 weeks',
    frequency: '3 days/week',
    exercises: 12,
    badge: 'Natural Max',
    sample: ['Push-ups', 'Squats', 'Planks', 'Rows'],
  },
  {
    key: 'intermediate',
    title: 'Intermediate',
    duration: '4 weeks',
    frequency: '4 days/week',
    exercises: 16,
    badge: 'Natural Max',
    sample: ['Weighted Push-ups', 'Lunges', 'Pull-ups', 'Dips'],
  },
  {
    key: 'advanced',
    title: 'Advanced',
    duration: '4 weeks',
    frequency: '5 days/week',
    exercises: 20,
    badge: 'Natural Max',
    sample: ['Muscle-ups', 'Pistol Squats', 'Dragon Flags', 'Handstands'],
  },
];

export const HEALTH_MODULES = [
  { id: 'h1', title: 'Testosterone Basics', duration: '5 min', locked: false, xp: 30 },
  { id: 'h2', title: 'Sleep Optimization', duration: '7 min', locked: false, xp: 30 },
  { id: 'h3', title: 'Nutrition for Performance', duration: '6 min', locked: false, xp: 30 },
  { id: 'h4', title: 'Stress & Cortisol', duration: '5 min', locked: true, xp: 30 },
  { id: 'h5', title: 'Recovery Protocols', duration: '6 min', locked: true, xp: 30 },
  { id: 'h6', title: 'Advanced Supplementation', duration: '8 min', locked: true, xp: 30 },
];

export const NOFAP_MILESTONES = [
  { day: 7, label: 'Day 7', reached: true },
  { day: 14, label: 'Day 14', reached: false },
  { day: 30, label: 'Day 30', reached: false },
  { day: 90, label: 'Day 90', reached: false },
];
