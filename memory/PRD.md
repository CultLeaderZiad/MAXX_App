# MAXX App — PRD (Updated Feb 2026)

## Original Problem Statement
Premium mobile app for men's self-improvement (fitness, brotherhood/social, wisdom/focus, supplement tracking, AI coaching).
Platform: React Native (Expo Router) + FastAPI backend + Supabase Auth/Postgres.

## Design Tokens (NEVER change)
- bg: #0A0A0A · surface: #111111 · elevated: #1A1A1A
- gold: #C8A96E · text: #FFFFFF · muted: #9A9A9A · border: #2A2A2A
- Cinzel Bold (titles) · Inter (body)

## Architecture
```
/app/
├── backend/
│   ├── server.py            # FastAPI + Supabase Auth/DB
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── (tabs)/          # home, train, focus, social, profile
│   │   ├── auth/            # login, register, forgot-password, reset-password
│   │   ├── admin/           # layout, index (full redesign), users, content
│   │   ├── settings/        # index, edit-profile
│   │   ├── calculator.tsx   # 6 body calculators
│   │   ├── plans.tsx        # Upgrade/plans page
│   │   ├── support.tsx      # Support page (FAQ + contact)
│   │   ├── supplements.tsx  # Full supplement swipe deck
│   │   └── exercise.tsx     # Exercise guide with videos
│   ├── context/AuthContext.tsx
│   ├── hooks/usePlan.ts     # Trial system
│   └── src/constants/theme.ts
```

## Key DB Schema
- profiles: id, full_name, avatar_url, role, goals, plan, subscription_status, trial_end, xp, weight_kg, height_cm, banned, created_at
- community_posts, workout_completions, xp_log, wisdom_cards, calculator_results, library_videos, support_tickets, email_logs

## What's Been Implemented

### Phase 1-4: Foundation
- JWT Auth (Login/Register/Forgot Password/Reset)
- 4-tab navigation (Train, Social, Focus, Profile)
- Supplement Swipe Deck with Unsplash images
- AI Convo Lab, Profile Audit
- Admin Dashboard (basic)
- Global ErrorBoundary, Zero TS errors

### Phase 5: Major Redesign (Feb 2026)
- **5-tab layout**: Home, Train, Focus, Social, Profile
- **Home Dashboard**: Animated particles, greeting, trial countdown timer, daily missions, stats row, quick actions grid
- **Body Tab Redesign**: Your Stats (weight/height/BMI/BF), 6 Calculator Cards grid, Natural Max banner, Exercise cards with "gym bro says" notes + gold START button
- **6 Body Calculators**: Calorie, Hydration, Sleep, FFMI, BMI+BodyFat, Macros (all functional, saves to AsyncStorage + Supabase)
- **Plans Page** (/plans): Grind/Alpha/Sigma tiers with features comparison
- **Support Page** (/support): FAQ accordion + contact form + direct email
- **Supplements in Focus**: 3rd tab "Supps" in Focus screen with category cards
- **Creator Library in Social**: 4th tab "Library" with 8 curated YouTube creator videos
- **Admin Dashboard Redesign**: Full redesign with Users/Content/Email/Subscriptions/Logs tabs, ban/unban, +7 days trial, plan change
- **7-day Trial System**: usePlan.ts with isInTrial(), daysLeft(), trialExpired(), canAccess(), handleGate()
- **Trial set on signup**: trial_end = created_at + 7 days
- **Exercise Video Fix**: Web = YouTube thumbnail with tap-to-open; Native = YoutubeIframe
- **Backend**: New endpoints for ban/unban, extend-trial, library video CRUD, enhanced admin stats

## Prioritized Backlog

### P0 (Critical)
- [ ] Test Forgot Password with real email (Supabase SMTP config)
- [ ] Verify Supabase `library_videos` and `calculator_results` tables exist

### P1 (Important)
- [ ] Render/Railway backend deployment - Update EXPO_PUBLIC_BACKEND_URL
- [ ] Real payment integration (Stripe/Razorpay) for upgrade flow
- [ ] Profile streak calendar heatmap (90-day contribution graph)

### P2 (Enhancement)
- [ ] Push notifications for trial expiry
- [ ] Leaderboard (XP-based rankings)
- [ ] Custom workout program builder
- [ ] Face audit photo upload feature

### P3 (Future/Backlog)
- [ ] Expo Go compatibility testing (full native test)
- [ ] AI-powered personal coach chatbot
- [ ] Progress photos with AI body composition analysis
- [ ] Affiliate supplement store integration

## Admin Notes
- Super Admin: cultleaderzoz.dev@gmail.com / Ziad_2004_#
- Test User: testuser@maxxapp.com / TestMAXX_2024!
- Admin dashboard at /admin (role=admin required)
- Admin visible in Profile tab settings when role === 'admin'
