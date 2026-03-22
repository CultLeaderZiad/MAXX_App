# MAXX App — Project Status for Incoming Agent

## What This App Is
MAXX is a premium self-improvement and "looksmaxxing" application designed specifically for men. It focuses on physical and psychological optimization through specialized training (Jaw & Face, Body, Health), habit tracking (NoFap), and AI-driven tools like profile auditing and a "Dating IQ" lab. The app monetizes through tiered premium subscriptions (Grind, Alpha, Sigma) that unlock advanced features and unlimited AI usage.

## Tech Stack
### Frontend
- **Framework:** Expo 54.0.33 (React Native 0.81.5)
- **Navigation:** Expo Router v6
- **Language:** TypeScript
- **Styling:** Vanilla React Native StyleSheet
- **State Management:** Context API (Auth, Theme)
- **Storage:** @react-native-async-storage/async-storage
- **Icons:** @expo/vector-icons (Feather, Lucide via Feather)
- **Fonts:** Expo Google Fonts (Cinzel, Inter)
- **Feedback:** React Native Haptic Feedback

### Backend
- **Framework:** Python 3.x with FastAPI
- **Database:** MongoDB (via Motor async driver)
- **Models:** Pydantic
- **Security:** JWT (jose), Passlib (bcrypt pending)
- **Server:** Uvicorn

## Supabase Project
**URL:** https://kfnizyhcanjrymjwukqz.supabase.co
*Note: Infrastructure exists but is not yet fully integrated into the code; the backend currently points to MongoDB.*

**Existing Tables (identified from types/DB calls):**
- `users`, `profiles`, `subscriptions`
- `exercises`, `training_programs`, `user_programs`, `workout_completions`
- `daily_missions`, `habit_completions`, `streaks`, `xp_log`
- `nofap_log`, `mood_log`, `badges`
- `pricing_config`, `plan_features`, `support_tickets`
- `community_posts`, `post_respects`
- `profile_audits`, `face_coach_sessions`, `conversation_sessions`
- `looksmaxx_guides`, `habit_education`, `nutrition_guides`, `supplement_catalog`, `supplement_stacks`
- `mentors`, `wisdom_cards`, `wisdom_favorites`, `notifications`, `body_measurements`, `admin_logs`

## What Is Already Built
| Screen/Feature | File Path | What it does | State | Known Issues |
| :--- | :--- | :--- | :--- | :--- |
| Welcome / Auth | `app/index.tsx` | Landing, Login, and Signup forms | **Working** | None |
| OTP Verification | `app/otp.tsx` | Submits 6-digit code for signup | **Working** | OTP is hardcoded to "123456" in backend |
| Goals Selection | `app/goals.tsx` | Onboarding Goal selection | **Working** | UI selection only; not yet saved to DB |
| Weak Spots | `app/weakspots.tsx` | Onboarding Weak spot assessment | **Working** | UI selection only; not yet saved to DB |
| Physical Stats | `app/stats.tsx` | Height, Weight, Sleep, Activity level | **Working** | UI selection only; not yet saved to DB |
| Subscription Plans | `app/plans.tsx` | Tier selection (Grind/Alpha/Sigma) | **Working** | Checkout flow is mocked |
| Home Dashboard | `app/(tabs)/index.tsx` | XP progress, Missions, Wisdom | **Working** | XP Toast logic is local; not synced to DB |
| Training Hub | `app/(tabs)/train.tsx` | Jaw/Face, Body, Health, NoFap | **Working** | NoFap tracker is active; others are UI-only |
| Exercise Session | `app/exercise.tsx` | Hold/Rest timer UI for training | **Working** | Completion XP is local-only |
| Emergency Mode | `app/emergency.tsx` | Panic mode breathing/task checklist | **Working** | None |
| Brotherhood Feed | `app/(tabs)/social.tsx` | Basic community post grid | **Working** | Mock data only; no real posting yet |
| Profile Audit UI | `app/(tabs)/social.tsx` | Bio input and AI audit result mockup | **Working** | No real AI analysis integrated yet |
| User Profile | `app/(tabs)/profile.tsx` | User stats, levels, and badges | **Working** | Data is largely pulled from `mockData.ts` |
| Settings | `app/settings.tsx` | Account, Security, Appearance toggles | **Working** | Sign out, Theme toggle work; others UI-only |
| Supplements | `app/supplements.tsx` | Display list of recommended stacks | **Working** | Static content |
| Support | `app/support.tsx` | Contact info and Ticket form UI | **Partial** | Form does not yet submit to backend |

## What Is NOT Built Yet
- **AI Face Coach Backend:** The logic to process face uploads for analysis is missing.
- **AI Profile Audit Backend:** Integration with Claude/Gemini API for bio analysis.
- **Dating IQ Tab:** Currently shows "Coming Soon" placeholder in `social.tsx`.
- **Payment Gateway:** Integration with Stripe or Apple Pay for actual purchases.
- **Convo Simulator:** Mocked in plans but screen file does not exist.
- **Persistent Progress:** Saving onboarding data, XP, and streaks from the frontend to the backend/Supabase.

## Auth System
- **Current State:** Functional logic but identity-mocked.
- **Registration:** Sends email/username to `/api/auth/register`. Stores data in MongoDB.
- **Verification:** Uses `/api/auth/verify-otp`. Correct OTP is `123456`.
- **Login:** Checks email in `/api/auth/login`. Returns JWT.
- **Mocked Parts:** Proper password hashing (Bcrypt) is not implemented; OTP is hardcoded; Password field in forms is just a string check.

## Navigation Structure
- **Root Stack (`_layout.tsx`)**
    - `index` (Welcome/Auth)
    - `otp` (Verify)
    - `goals` -> `weakspots` -> `stats` -> `plans` (Onboarding)
    - `(tabs)` (Main App)
        - `index` (Home)
        - `train` (Training Hub)
        - `social` (Community/Audit)
        - `profile` (Stats/Badges)
    - `exercise` (Modal)
    - `emergency` (Full Screen Modal)
    - `settings`, `support`, `supplements` (Nested Stack)

## Backend Endpoints
- `POST /api/auth/register`: Initiates signup, stores pending user.
- `POST /api/auth/verify-otp`: Confirms OTP, creates user record, issues JWT.
- `POST /api/auth/login`: Authenticates user, returns JWT.
- `GET /status`: Simple API health check.

## Database Tables
The project uses **MongoDB** currently via the FastAPI backend.
- `pending_users`: Temp storage for OTP verification.
- `users`: Core account data.

*Note: The user intends to migrate/sync with Supabase tables listed in the Supabase Project section.*

## Environment Variables
- **Frontend (`.env`):**
    - `EXPO_PUBLIC_BACKEND_URL`: URL for the Python API.
- **Backend (`.env`):**
    - `MONGO_URL`: Connection string.
    - `DB_NAME`: Database identifier.
    - `JWT_SECRET`: Used for token signing.

## Plan System
Tiers defined in `mockData.ts` and `plans.tsx`:
- **GRIND ($9.99/mo):** Base training and trackers.
- **ALPHA ($19.99/mo):** Adds limited AI audits, Face Coach, and Brotherhood.
- **SIGMA ($34.99/mo):** Unlimited everything, early access, Sigma badge.
*Current State: Locking is UI-based (displaying lock icons) but not yet enforced on the backend.*

## Known Issues
- No real password hashing (security risk).
- Hardcoded OTP (logic bypass).
- Onboarding choices don't persist after closing the app unless login is successful.
- "Dating IQ" and "Convo Simulator" are UI stubs.

## Next Steps for Incoming Agent
1. **Implement Bcrypt:** Replace the simple password check in `backend/server.py` with proper hashing.
2. **Persistence Layer:** Update `goals.tsx`, `weakspots.tsx`, and `stats.tsx` to POST data to a new `/api/user/profile` endpoint.
3. **Supabase Integration:** Connect the frontend and backend directly to Supabase to utilize the pre-defined table structure.
4. **AI Module:** Initialize the Gemini/Claude API integration for the Profile Audit feature.
5. **Real-time NoFap:** Ensure the NoFap counter in `(tabs)/train.tsx` syncs with the server so it doesn't reset on app reinstall.
6. **Payment Flow:** Hook up the `plans.tsx` buttons to a real Stripe/RevenueCat checkout.
