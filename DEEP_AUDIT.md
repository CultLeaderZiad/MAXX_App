# MAXX App — Deep Audit Report

## QUESTION 1 — AUTH BRIDGE
**Read `backend/server.py` completely. How does it currently validate JWT tokens?**
The backend uses a manual JWT validation system with a custom `JWT_SECRET`. It does **not** use the Supabase Auth bridge or generic Supabase JWT verification.

**Does it use Supabase JWT verification or its own JWT_SECRET?**
It uses its own `JWT_SECRET` (HS256 algorithm).

**Exact token validation code found in `backend/server.py`:**
```python
# Lines 89-102
async def get_current_user_email(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return email
```

---

## QUESTION 2 — SUPABASE TABLES
**Project ID:** `kfnizyhcanjrymjwukqz`

| Table Name | Row Count | Status |
| :--- | :--- | :--- |
| `public.plan_features` | 53 | Populated |
| `public.wisdom_cards` | 30 | Populated |
| `public.training_programs` | 10 | Populated |
| `public.streaks` | 10 | Populated |
| `public.supplement_catalog` | 11 | Populated |
| `public.mentors` | 9 | Populated |
| `public.profiles` | 2 | Populated |
| `public.subscriptions` | 2 | Populated |
| `public.notifications` | 2 | Populated |
| `public.pricing_config` | 3 | Populated |
| `public.exercises` | 3 | Populated |
| `public.looksmaxx_guides` | 2 | Populated |
| `public.nutrition_guides` | 2 | Populated |
| `public.habit_education` | 2 | Populated |
| `public.workout_completions` | 0 | Empty |
| `public.nofap_log` | 0 | Empty |
| `public.xp_log` | 0 | Empty |
| `public.badges` | 0 | Empty |
| `public.daily_missions` | 0 | Empty |
| `public.community_posts` | 0 | Empty |
| `public.face_coach_sessions` | 0 | Empty |
| `public.post_respects` | 0 | Empty |
| `public.profile_audits` | 0 | Empty |
| `public.conversation_sessions` | 0 | Empty |

---

## QUESTION 3 — FRONTEND SCREENS AUDIT
| Screen | Data Type | TODOs/Placeholders | Crash? |
| :--- | :--- | :--- | :--- |
| `index.tsx` (Welcome) | Static/Auth | Minor TODOs in auth flow | No |
| `login.tsx` | Auth | None | No |
| `register.tsx` | Auth | None | No |
| `otp.tsx` | Auth | Dev bypass placeholder | No |
| `goals.tsx` | Mock | None | No |
| `weakspots.tsx` | Mock | None | No |
| `stats.tsx` | Mixed | Broken API call placeholder | No |
| `(tabs)/index.tsx` | Real (Supabase) | None | No |
| `(tabs)/train.tsx` | Real (Supabase) | None | No |
| `(tabs)/focus.tsx` | Mock | AI Engine integration pending | No |
| `(tabs)/social.tsx` | Mixed | Audit & Dating IQ are placeholders | No |
| `(tabs)/profile.tsx` | Real (Supabase) | None | No |
| `plans.tsx` | Mock | Static pricing lists | No |
| `payment.tsx` | Mock/Real | Mock payment delay | No |
| `exercise.tsx` | Real (Supabase) | None | No |
| `emergency.tsx` | Mock | Audio logic placeholder | No |
| `supplements.tsx` | Mixed | AI generation placeholder | No |

---

## QUESTION 4 — ONBOARDING FLOW
**Step 1: Goals (`goals.tsx`)**
- User selects goals.
- Data saved to `AsyncStorage` (`onboarding_goals`).

**Step 2: Weakspots (`weakspots.tsx`)**
- User selects weak spots.
- Data saved to `AsyncStorage` (`onboarding_weak_spots`).

**Step 3: Stats (`stats.tsx`)**
- User enters height, weight, sleep, activity.
- Logic: Attempts to save via `api.post('/api/user/onboarding')`.
- **Status:** **BROKEN**. The backend expects a custom JWT, but the frontend uses Supabase Auth. The sync fails with a 401.

**Step 4: Plans & Payment (`plans.tsx` -> `payment.tsx`)**
- User selects a plan and "pays".
- Logic: Updates `profiles.plan` in Supabase directly.
- **Data Persistence:** Goals, weakspots, and stats are currently **LOST** because the backend sync fails. Only the Plan is persisted to Supabase.

---

## QUESTION 5 — PROFILE SCREEN
- **File:** `frontend/app/(tabs)/profile.tsx`
- **Real Data:** Yes, fetches from `profiles`, `streaks`, `workout_completions`, and `badges`.
- **Animations:** Uses `Animated` for Power Level bar and `animateNumbers` for counting stats.
- **Components:** Avatar (custom upload), Username, Title Pill (e.g., MASTER), Stats Row (Streak, Workouts, XP), Power Level Progress, Plan Card, Badges Grid (Locked/Unlocked).

---

## QUESTION 6 — TRAIN TAB
- **Functionality:** Functional.
- **Supabase Integration:** Charges `training_programs` and `exercises`.
- **Level Lock:** Logic confirmed: `program.required_level <= profile.power_level`.
- **Saving:** Workout completions correctly save to `workout_completions` and `xp_log` in Supabase.

---

## QUESTION 7 — SOCIAL TAB
- **Brotherhood Feed:** Real-time sync enabled via Supabase Realtime Channels.
- **Respect Button:** Functional. Optimistically updates UI and increments `likes` count in `community_posts` table.
- **Profile Audit:** Non-functional. Displays an alert for "Phase 10" and shows static mock analysis.

---

## QUESTION 8 — SETTINGS SCREEN
- **Account:** Edit Profile (Link only), Change Password (Functional), Delete Account (Mock Alert).
- **Security:** Face ID (Toggle only), Active Sessions (Static "2 devices").
- **Appearance:** Dark Mode (Functional theme toggle), AI Engine (Static "Claude").
- **Subscription:** Current Plan (Link to plans), Cancel Sub (Alert).
- **Support:** Functional links to Support and Supplement screens.

---

## QUESTION 9 — FOCUS TAB
- **Status:** Exists as `app/(tabs)/focus.tsx`.
- **Tabs:** Wisdom, Confidence, Convo Lab.
- **Data:** **Mock/Static**.
  - Wisdom: Hardcoded list of 4 mentors.
  - Confidence: Hardcoded list of modules.
  - Convo Lab: Mock UI flow with hardcoded "First Date" scenario. No real AI calls.

---

## QUESTION 10 — ADMIN SYSTEM
- **Admin Dashboard:** **Non-existent**. No screens found for admin management.
- **Role Checks:** `AuthContext.tsx` contains an `isAdmin` flag based on `profile.role === 'admin'`.
- **Admin Email:** `admin@maxx.app` is hardcoded in the `signInAsAdmin` bypass.

---

## QUESTION 11 — ANIMATIONS
- **Welcome Screen:** Real animations for letters ("M-A-X-X") and "Start" button pulse.
- **Power Level Bar:** Animated using `Animated.timing` in `HomeScreen.tsx` and `ProfileScreen.tsx`.
- **Particles:** Present on Welcome screen.
- **XP Floating:** Floating "+XP" labels animated upon mission completion.

---

## QUESTION 12 — TYPESCRIPT ERRORS
Fresh run failed due to system memory. Summary of recent `ts_errors.log`:
- `supabase.table` doesn't exist on `SupabaseClient` (Needs `.from()`).
- `Badge` component missing `variant` prop in some screens.
- `api` vs `axios` mixed usage causing type mismatches.
- `expo-router` type mismatches on `params` usage.

---

## QUESTION 13 — VERSIONS
**Frontend (`package.json`):**
- Expo: `54.0.33`
- React: `19.1.0`
- React Native: `0.81.5`
- Supabase-js: `2.99.3`

**Backend (`requirements.txt`):**
- FastAPI: `0.110.1`
- Supabase: `2.3.0`
- Pydantic: `2.6.4`
- Google Generative AI: `0.5.4`

---

## QUESTION 14 — SUMMARY OF ISSUES
- **Auth Mismatch:** Frontend (Supabase) vs Backend (FastAPI/JWT/Mongo). Critical blocker for onboarding and AI features.
- **Empty States:** Community posts, missions, and XP logs are currently empty in production DB.
- **Mock Features:** Focus Tab and Social Audit are completely hardcoded.
- **Onboarding Loss:** Data collected during onboarding is not persisted to Supabase because it routes through the failing backend API.

---

## QUESTION 15 — SPLASH & BRANDING
- **Splash Screen:** Currently uses `./assets/images/splash-image.png` with a black background (`#0A0A0A`).
- **Emergent Cleanup:** No visible "Emergent" references in UI text or branding metadata.
- **Welcome Screen:** Features "MAXX" animated logo, "developed by Ziad Sabry" footer, and a trial initiation button.
