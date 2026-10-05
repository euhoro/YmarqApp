# Ymarq tech stack

Every part of the stack, what it does for us, why we chose it, and what we could use instead.
Decisions and their dates live in the Decisions log in [`REVIVAL_2026.md`](REVIVAL_2026.md).

**Status:** ✅ in use · 🟨 proposed (awaiting decision) · ⏸️ later · 🗑️ dropped

## At a glance

```
                 ┌──────────────── one TypeScript codebase (this repo) ────────────────┐
  iPhone/Android │  Expo app (React Native)  ──►  repositories  ──►  fake data (today) │
  Web browser    │                                     │                               │
                 └─────────────────────────────────────┼───────────────────────────────┘
                                                       ▼ (Wave 2)
   Firebase Auth ◄── phone sign-in        Ymarq API (TypeScript, Vercel Functions)
                                                       │  repository interface
                                                       ▼
                                          Postgres (Neon)      photos (Vercel Blob)
```

| Vendor | What we use it for | Cost now | Cost at launch |
|---|---|---|---|
| **GitHub** | Code, issues, CI (Actions) | $0 (public repo) | $0 |
| **Expo (EAS)** | Building and signing the iOS/Android apps, store submission | $0 (free tier) | $0–19/month depending on build volume |
| **Vercel** | Web app hosting, PR previews, API functions, Postgres (via Neon) and photo storage | $0 (Hobby) | **$20/month (Pro)**: Hobby is for non-commercial use only |
| **Firebase (Google)** | Phone-number sign-in only | $0 (test numbers) | Per SMS sent (roughly $0.01–0.06 each), Blaze plan |

## The parts

### App

| Part | Status | What it does | Why this | Alternatives |
|---|---|---|---|---|
| **Expo + React Native + TypeScript** | ✅ | One codebase that builds the Android app, the iOS app and the website | One language; cloud builds (no Java/Xcode needed day to day); large ecosystem; coding agents are strongest in TypeScript | Kotlin Multiplatform (best Android quality, more setup), Flutter (Dart), separate native apps (3× the work) |
| **Expo Router** | ✅ | Screens and navigation from files in `src/app/`; real URLs on the web | Same routing on all platforms, deep links for free | React Navigation directly (more code) |
| **React Native Paper** | ✅ | Material 3 components (cards, buttons, lists), light/dark theme | Mature, looks native on Android, works on web | Tamagui, NativeWind (Tailwind), gluestack |
| **TanStack Query** | ✅ | Loading/error/refresh/caching for server data | Removes hand-written loading logic | SWR, RTK Query |
| **zod** | ✅ | Checks data coming from servers before the app uses it | Catches bad data at the edge, gives TypeScript types | valibot, io-ts |
| **expo-image / expo-image-picker** | ✅ | Showing images; taking photos | Official Expo modules, work on all platforms | react-native-fast-image, react-native-vision-camera (in-app camera) |

### Quality and delivery

| Part | Status | What it does | Why this | Alternatives |
|---|---|---|---|---|
| **Jest + Testing Library** | ✅ | Unit and integration tests (`npm run verify`) | Standard for React Native; runs without a device | Vitest (limited React Native support) |
| **Playwright** | ✅ | Browser end-to-end tests on a phone-sized screen | Fast, reliable, runs in CI | Cypress; for native apps later: Maestro, Detox |
| **ESLint, Prettier, TypeScript** | ✅ | Code style and type checks | Expo's defaults | Biome |
| **GitHub Actions** | ✅ | Runs all checks on every PR; `master` only accepts green PRs | Free for public repos, next to the code | GitLab CI, CircleCI |
| **Vercel (web)** | ✅ | Hosts https://ymarq-app.vercel.app; a preview URL for every PR | Zero config, previews are great for reviewing parallel PRs | Firebase Hosting (free for commercial use), Netlify, Cloudflare Pages, EAS Hosting |
| **EAS Build / Submit / Update** | ⏸️ #12 | Builds and signs iOS/Android apps in the cloud, submits to stores, pushes small updates without store review | No local Xcode/Android Studio; keeps signing keys safe (the 2014 key was lost) | Local builds + Fastlane, Codemagic, Bitrise |
| **Claude Code GitHub Action** | ⏸️ #16 | Agents that pick up `agent-ready` issues and open PRs | Parallel work without babysitting | Running sessions manually (what we do now) |

### Backend

| Part | Status | What it does | Why this | Alternatives |
|---|---|---|---|---|
| **Firebase Authentication** | ✅ decided | Phone-number sign-in (SMS code); later Google sign-in | Best phone sign-in available: no SMS permissions needed on Android, built-in SMS-fraud protection, project already set up | AWS Cognito (SMS registration, own abuse protection), Supabase Auth (needs Twilio), Clerk, Auth0 |
| **Ymarq API (TypeScript on Vercel Functions)** | 🟨 | Products, listings, photos; checks the Firebase sign-in token on every request | Same language and repo as the app; same vendor as the web hosting; scales to zero | Python FastAPI on AWS Lambda (the earlier plan), Next.js route handlers, Firebase Cloud Functions |
| **Postgres (Neon, through Vercel)** | ✅ Postgres decided · 🟨 Neon | Stores users, products, later friends and messages | Relational data (friends, feeds) is simple in SQL; Neon has a free tier and costs nothing while idle | AWS RDS (~$15/month), Supabase, Google Cloud SQL; DynamoDB behind the same repository interface |
| **Vercel Blob** | 🟨 | Stores listing photos | Same vendor; direct uploads from the app | AWS S3, Firebase Storage, Cloudflare R2 |
| **Repository pattern** | ✅ | The app talks to `ProductRepository`, the API to a storage interface | Swapping fake ↔ API in the app, or Postgres ↔ DynamoDB in the API, touches one file | — |

### Dropped or deferred

| Part | Status | Why |
|---|---|---|
| Firestore, Firebase Hosting | 🗑️ | Postgres was chosen for data; Vercel hosts the web app |
| AWS (Lambda, RDS, S3) | ⏸️ | Not needed while Vercel covers API, database and storage; the repository pattern keeps the move possible |
| Legacy .NET server (`YmarqOrg/YMarqServ`) | 🗑️ | Its Ymarq endpoints were mocks; the only data is Windows sample photos. Its API shape lives on in the app's data model |

## Leaner options we compared

| Option | Vendors (besides GitHub/Expo) | Pros | Cons |
|---|---|---|---|
| **A. Vercel + Neon + Firebase Auth** (proposed) | Vercel, Firebase | Reuses what's set up; TypeScript everywhere; $0 while building; PR previews | Vercel Pro ($20/month) needed for commercial use |
| **B. All Google: Firebase Auth + Hosting + Cloud Functions + Data Connect (Postgres)** | Firebase only | One vendor; free commercial web hosting | Postgres (Cloud SQL) costs ~$10/month from day one; Blaze plan required; less flexible |
| **C. Supabase (Postgres + Auth + Storage + Functions)** | Supabase, Twilio (for SMS) | Postgres-first, one backend vendor | Phone sign-in needs Twilio; free projects pause when idle |
| **D. AWS + Python + Firebase Auth** (earlier plan) | AWS, Vercel, Firebase | Most control, scales furthest | Three vendors, second language, most setup |
