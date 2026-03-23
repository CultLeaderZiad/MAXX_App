# MAXX App — Handoff Status

## Current State Summary
The MAXX App is currently in a "split-brain" state. The frontend (Expo) has been successfully transitioned to use **Supabase** for Authentication and core data fetching (Profiles, Streaks, Missions). However, several key AI-powered features and the Onboarding sync logic still point to a **FastAPI backend (Railway)** which uses a separate authentication system (JWT/MongoDB). Because the frontend does not currently synchronize these two auth systems, any request from the frontend to the Railway backend (e.g., saving stats or generating AI stacks) fails with an authentication error. The UI is high-quality and premium, but several screens remain as functional placeholders or mocks.

## What Actually Works Right Now
List only features confirmed working with file paths:
- Supabase Client Initialization | `frontend/lib/supabase.ts` | Base for all Supabase operations.
- Supabase Auth (Sign Up / Login) | `frontend/app/register.tsx`, `frontend/app/login.tsx` | Full integration with Supabase Auth.
- OTP Verification | `frontend/app/otp.tsx` | Verification via Supabase (supports 8-digit codes).
- Admin/Tester Bypass | `frontend/app/otp.tsx`, `frontend/context/AuthContext.tsx` | Allows immediate access to dashboard for testing.
- Dashboard (Real Data) | `frontend/app/(tabs)/index.tsx` | Fetches real stats, missions, and wisdom from Supabase.
- Training Catalog | `frontend/app/(tabs)/train.tsx` | Fetches training programs from Supabase `training_programs` table.
- Exercise Session + Timer | `frontend/app/exercise.tsx` | Functional timer, sets, and logging to Supabase `workout_completions`.
- Social (Brotherhood) | `frontend/app/(tabs)/social.tsx` | Real-time post feed and posting functionality using Supabase.
- NoFap Counter | `frontend/app/(tabs)/index.tsx` | Live calculation based on profile data.

## What Is Broken or Empty
List every broken feature, empty screen, or non-functional button with exact file path and what the issue is:
- **Onboarding Sync** | `frontend/app/stats.tsx` | Calls `/api/user/onboarding` on Railway without a token; fails with 401.
- **AI Supplement Generation** | `frontend/app/supplements.tsx` | Calls Railway backend; fails with 401. Use fallback data instead.
- **Social Audit Tab** | `frontend/app/(tabs)/social.tsx` | UI only. Button triggers an alert placeholder.
- **Dating IQ Tab** | `frontend/app/(tabs)/social.tsx` | Static list of lessons with no content.
- **Goals Saving** | `frontend/app/goals.tsx` | Only saves to local `AsyncStorage`, never synced to DB until `stats.tsx` (which is broken).
- **Weakspots Saving** | `frontend/app/weakspots.tsx` | Only saves to local `AsyncStorage`.
- **Theme Issues** | `frontend/src/context/ThemeContext.tsx` | Some components don't respect theme changes fully.
- **Mixed Backends** | Multiple files | Files like `support.tsx` call Supabase directly, while `supplements.tsx` calls Railway. Inconsistent.

## Supabase Connection Status
- Is Supabase client initialized correctly? Yes | `frontend/lib/supabase.ts`
- Is auth using supabase.auth.signUp? Yes | `frontend/context/AuthContext.tsx`
- Is any screen fetching real data from Supabase? Yes | Dashboard, Train, Social, Exercise.
- List every Supabase table being queried in the code:
    - `profiles`
    - `streaks`
    - `daily_missions`
    - `wisdom_cards`
    - `training_programs`
    - `workout_completions`
    - `xp_log`
    - `community_posts`
    - `support_tickets`

## Backend Railway Status
URL: https://maxxapp-production.up.railway.app
- Which endpoints are called from frontend?
    - `POST /api/user/onboarding` (Stats)
    - `POST /api/supplement-stack` (Supplements)
- Which endpoints exist in backend/server.py?
    - `/api/auth/register`, `/api/auth/verify-otp`, `/api/auth/login` (Legacy/Mixed)
    - `/api/user/onboarding`
    - `/api/recalculate-power`, `/api/supplement-stack`, `/api/moderate-post`, `/api/profile-audit`
    - `/api/support`
- Which frontend calls have no matching backend endpoint? None, but authentication is mismatched.

## Auth Flow Status
1. Opens app: Works (Redirects to Welcome).
2. Enters email + password to register: Works (Supabase handles it).
3. Receives OTP: Works (Supabase sends code).
4. Enters OTP: Works (Calls `supabase.auth.verifyOtp`).
5. Completes onboarding: **Breaks at the last step (Stats)**. The POST request to Railway fails, so the user never has `onboarding_completed=true` set in their profile unless manually updated.

## Navigation Status
- Welcome | `app/index.tsx` | Works
- Register | `app/register.tsx` | Works
- OTP | `app/otp.tsx` | Works
- Goals | `app/goals.tsx` | Works
- Weakspots | `app/weakspots.tsx` | Works
- Stats | `app/stats.tsx` | **Broken** (API call)
- Dashboard | `app/(tabs)/index.tsx` | Works
- Train | `app/(tabs)/train.tsx` | Works
- Social | `app/(tabs)/social.tsx` | Brotherhood (Works), Others (Empty)
- Profile | `app/(tabs)/profile.tsx` | Partial (UI exists)
- Settings | `app/settings/index.tsx` | Works

## Known Errors
- **TypeScript Errors**: Many files contain old TS errors in `ts_errors.log` (Property 'table' does not exist, variant errors). Some are stale but some in `ApiService` and `AuthContext` need resolving.
- **Runtime Errors**: 401 Unauthorized when hitting Railway backend from any authenticated frontend screen.

## Emergent-Related Cleanup Needed
- References to "Emergent" in past splash screens have been mostly removed.
- Need to verify if any remaining background logic or temporary files from the initial "Emergent" generation still exist (none found in current core files).

## Environment Variables
- Frontend (`.env`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_BACKEND_URL`.
- Backend (`.env`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MONGO_URL` (Placeholder), `JWT_SECRET`, `GEMINI_API_KEY` (Placeholder).
- Confirm which ones have real values vs placeholders: `MONGO_URL` and `GEMINI_API_KEY` in backend are currently placeholders.

## Exact Priority List for Incoming Agent
1. **Fix Backend Auth Sync**: Modify `backend/server.py` to validate Supabase JWTs instead of its own, OR update `ApiService.ts` to log into the FastAPI backend separately after Supabase auth.
2. **Fix Onboarding Flow**: Ensure `stats.tsx` can successfully update the user profile (ideally by moving logic to direct Supabase calls or fixing the backend bridge).
3. **Resolve AI Integration**: Connect the "Audit" and "Supplement Generation" features to Gemini via the backend once auth is fixed.
4. **Clean up Legacy Auth**: Remove `/auth` endpoints from `server.py` and MongoDB dependencies if Supabase is to be the single source of truth.
5. **Fill Empty Tabs**: Implement content for "Dating IQ" and the "Audit" analysis results.

## Tech Stack Confirmed
- **Frontend**: Expo 54, React 19, React Native 0.81, Supabase 2.99, Expo Router 6, TypeScript 5.9.
- **Backend**: FastAPI 0.110, Uvicorn 0.29, Motor/PyMongo (for MongoDB), Supabase 2.3.0, Pydantic 2.6.

## Developer
App: MAXX
Developer: Ziad Sabry
GitHub: https://github.com/CultLeaderZiad/MAXX_App
Supabase: https://kfnizyhcanjrymjwukqz.supabase.co
