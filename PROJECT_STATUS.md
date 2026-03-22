# MAXX App — Project Status for Incoming Agent

## What This App Is
MAXX is a high-performance self-improvement and "looksmaxxing" mobile application designed for men. It combines habit tracking (NoFap), specialized training (Jaw & Face, Body, Health), and psychological focus tools. The app aims to monetize through premium "Prime" subscriptions and specialized workout programs, targeting users who want to optimize their physical appearance, discipline, and social performance.

## Tech Stack
- **Frontend**:
  - React Native (0.81.5) via Expo (54.0.33)
  - Expo Router (v6) for file-based navigation
  - Context API for State Management (Auth, Theme)
  - AsyncStorage for persistence
  - Expo Linear Gradient & Vector Icons (Feather)
  - TypeScript (v5.9)
- **Backend**:
  - Python (FastAPI v0.110.1)
  - MongoDB (via Motor/Pymongo)
  - Pydantic for data validation
  - Uvicorn (ASGI server)
  - JWT (Python-jose) & Passlib (Bcrypt)
- **Monorepo / DX**:
  - Root `package.json` for task automation (`npm run dev:frontend`, `npm run dev:backend`).

## What Is Already Built (working code exists)
| Screen/Feature | File Path | Current State | Known Issues |
| :--- | :--- | :--- | :--- |
| Welcome / Auth | `app/index.tsx` | **Refined** | UI matched to Image 1 (built tagline, gold built, greeting). |
| Home Dashboard | `app/(tabs)/index.tsx` | **Refined** | UI matched to Image 2 (Day 12, Power Level, Daily Missions list). |
| Training Hub | `app/(tabs)/train.tsx` | **Refined** | UI matched to Image 3 (Jaw & Face Level lock/unlock system). |
| Plans / Prime | `app/plans.tsx` | **Refined** | UI matched to Image 3 (Grind/Alpha/Sigma tiers + Free Trial). |
| Settings Screen | `app/settings.tsx` | **Working** | Grouped settings (Account, Security, etc.) per design. |
| User Profile | `app/(tabs)/profile.tsx`| **Working** | User dashboard stats, streak, power level and badge grid. |
| Social Section | `app/(tabs)/social.tsx`| **Working** | Sub-tabs for Audit (Platform/AI) and Brotherhood (Community feed). |
| Emergency Mode | `app/emergency.tsx` | **Working** | Breathing exercises and panic tasks for NoFap. |
| Exercise Session | `app/exercise.tsx` | **Working** | Premium timer UI with sets and XP logic. |
| Stats / Goals / OTP | `app/*.tsx` | **Working** | Onboarding screens for goal selection, weakspots, and OTP. |
| Global Audit & Stability | `GITHUB_ISSUE.md` | **Fixed** | Fixed critical dependency loss and implicit-any TypeScript errors. |

## What Is NOT Built Yet
- **AI Face Coach Backend**: The actual AI processing engine for face analysis (Gemini/Claude API backend).
- **Payment Gateway**: Final Stripe/Apple Pay integration for the "Prime" plans.
- **Dating IQ Sub-tab**: Currently shows a "Coming Soon" placeholder in Social.

## Database Schema
Implemented in `backend/server.py`:
- **`users`**:
  - `_id`: String (UUID)
  - `email`: String (Index)
  - `full_name`: String
  - `date_of_birth`: String
  - `password`: String (Hashed pending bcrypt integration)
  - `is_verified`: Boolean

## Environment Variables Needed
- **Frontend (`frontend/.env`)**:
  - `EXPO_PUBLIC_BACKEND_URL`: Usually `http://localhost:8000` or production URL.
- **Backend (`backend/.env`)**:
  - `MONGO_URL`: MongoDB connection string.
  - `DB_NAME`: `maxx_app`

## Automation Scripts
Run these from the root directory:
- `npm run dev:frontend`: Starts Expo.
- `npm run dev:backend`: Starts FastAPI server.
- `npm run install:all`: Installs both Frontend and Backend dependencies.

## Exact Next Steps for Incoming Agent
1. **Bcrypt Integration**: Enhance the `register` and `login` handlers in `server.py` with real password hashing.
2. **User Data Persistence**: Create `/api/user/progress` endpoints to save NoFap streaks and completed workouts.
3. **AI Module Setup**: Initialize the AI Engine (Claude/Gemini) logic for the "AI Face Coach" baseline analysis.
4. **Onboarding Sync**: Ensure the choices made in `goals.tsx` and `weakspots.tsx` are posted to the user's profile on first completion.

## Developer Info
App name: MAXX
Developer: Ziad Sabry
GitHub: https://github.com/CultLeaderZiad/maxx-app
LinkedIn: https://www.linkedin.com/in/ziad-sabry-cl/
