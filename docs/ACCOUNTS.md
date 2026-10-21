# Accounts and external services

Every outside service Ymarq depends on: what it's for, where it lives, how it's wired to the code,
and where its keys are. **No secret values belong in this file**, only names and places.

Last checked: 2026-10-21.

**Sign-in email:** all accounts below were created with the owner's email labelled **e98**.

## At a glance

| Service | Used for | Account / project | Console |
|---|---|---|---|
| **GitHub** | Code, issues, PRs, CI | repo `euhoro/YmarqApp` | https://github.com/euhoro/YmarqApp |
| **Vercel** | Hosts the website and the API; database and photo storage through integrations | team `ymarq`, projects `ymarq-app` (web) and `ymarq-app-api` (API) | https://vercel.com/ymarq |
| **Neon** (through Vercel) | Postgres database for the API | created by the Vercel integration on `ymarq-app-api` | https://vercel.com/ymarq/~/stores |
| **Vercel Blob** | Listing photos | store `ymarq-photos` (public) | https://vercel.com/ymarq/~/stores |
| **Firebase** (Google) | Phone-number sign-in (SMS codes) | project `ymarq-35862` | https://console.firebase.google.com/project/ymarq-35862/overview |
| **Expo / EAS** | Builds the iOS and Android apps; delivers push notifications | account `ymarq`, project `@ymarq/ymarq` | https://expo.dev/accounts/ymarq/projects/ymarq |
| **Apple Developer** | iPhone builds on real devices, App Store, iPhone push | not yet (#41) | https://developer.apple.com/account |
| **Google Play Console** | Play Store | not yet (#41) | https://play.google.com/console |

```
 phone / browser ──► website (Vercel: ymarq-app) or app (built by Expo EAS)
        │                         │
        │ sign-in (SMS code)      │ every request carries the Firebase sign-in token
        ▼                         ▼
   Firebase Auth ◄── checks ── API (Vercel: ymarq-app-api) ──► Postgres (Neon)
                                  │                       └──► photos (Vercel Blob)
                                  └──► Expo push service ──► Apple (APNs) / Google (FCM) ──► phones
```

## GitHub

- **Repo:** https://github.com/euhoro/YmarqApp. Rules for `master` (PRs only, checks must be green): Settings → Rules → `master-safe`.
- **CI:** `.github/workflows/` (`ci.yml` runs on every PR; `eas-build.yml` builds the apps on demand; `expo-updates.yml` checks Expo versions weekly).
- **Secrets** (Settings → Secrets and variables → Actions): `EXPO_TOKEN`, needed only by `eas-build.yml` (see Expo below). Not set yet.
- Vercel and Expo are connected as GitHub apps (they comment on PRs and deploy previews).

## Vercel

Team `ymarq`, logged in on the owner's Mac (`npx vercel@latest … --scope ymarq`). Plan: Hobby (free; Pro, $20/month, is needed for commercial use, #41).

| Project | What | Production URL | Root folder |
|---|---|---|---|
| `ymarq-app` | The website (Expo web export) | https://ymarq-app.vercel.app | repo root (`vercel.json`) |
| `ymarq-app-api` | The API (`server/`, Hono) | https://ymarq-app-api.vercel.app/health | `server` |

- **Deploys:** every merge to `master` deploys both to production; every PR gets preview URLs, which are behind Vercel's login.
- **Settings (Environment Variables)** for the website, `ymarq-app` → Settings → Environment Variables (Production only, since 2026-10-21):
  - `EXPO_PUBLIC_DATA_SOURCE=api` and `EXPO_PUBLIC_API_URL=https://ymarq-app-api.vercel.app`
  - `EXPO_PUBLIC_AUTH=firebase` and the six `EXPO_PUBLIC_FIREBASE_*` values (public identifiers, saved as *Config*)
  - A production build without them is refused on purpose (`scripts/check-release-env.mjs`). Previews have none, so they run on fake data.
- **Settings for the API**, `ymarq-app-api` → Settings → Environment Variables:
  - `STORE=postgres` (Production)
  - `DATABASE_URL` and the other `PG*` / `POSTGRES_*` values: added by the Neon integration. **Preview and Production use the same database.**
  - `BLOB_READ_WRITE_TOKEN`: added by connecting the `ymarq-photos` store with a token
  - optional: `CORS_ORIGINS` (default `*`), `FIREBASE_PROJECT_ID` (default `ymarq-35862`), `EXPO_ACCESS_TOKEN` (only if Expo's "enhanced push security" is turned on)
- **Storage** (https://vercel.com/ymarq/~/stores):
  - the Neon database
  - Blob store `ymarq-photos` (public, in use)
  - the old private Blob store `ymarq-app-api-blob`: unused, safe to delete (`npx vercel blob delete-store store_E4zTv12JHhd3JW5r --scope ymarq`)

## Firebase (phone sign-in)

Project `ymarq-35862` (Google account of the owner). Only **Authentication** is used.

| What | Where in the console |
|---|---|
| Sign-in method (Phone: on), **test numbers** | [Authentication → Sign-in method](https://console.firebase.google.com/project/ymarq-35862/authentication/providers) |
| **Allowed domains** (`localhost`, `ymarq-app.vercel.app`, …) | [Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/ymarq-35862/authentication/settings) |
| **SMS region policy** (which countries can get codes; now Israel and US) | Authentication → Settings → SMS region policy |
| Billing plan (Blaze: real SMS) and budget alert (#39) | [Usage and billing](https://console.firebase.google.com/project/ymarq-35862/usage/details) |
| The registered apps: Web, iOS and Android (`com.ymarq.app`) | [Project settings → General](https://console.firebase.google.com/project/ymarq-35862/settings/general) |
| Admin key (service account) | [Project settings → Service accounts](https://console.firebase.google.com/project/ymarq-35862/settings/serviceaccounts/adminsdk) |

**Test number:** `+1 650-555-1234`, code `123456`. No SMS is sent, but its country must still be allowed in the SMS region policy.

**Files downloaded from Firebase** (keep them in `~/Downloads/ymarq-important/`, never in git):

| File | From | Used for |
|---|---|---|
| `GoogleService-Info.plist` | Project settings → General → iOS app | Native sign-in on iOS (#13); uploaded to EAS as a file variable |
| `google-services.json` | Project settings → General → Android app | Native sign-in and push on Android (#13, #47); uploaded to EAS as a file variable |
| `ymarq-35862-firebase-adminsdk-….json` | Project settings → Service accounts → *Generate new private key* | Lets Expo send Android push (uploaded to EAS as the FCM V1 key); also lets Claude read Firebase settings |

**How it's wired:**
- **Website:** the `EXPO_PUBLIC_FIREBASE_*` values (public identifiers, from Project settings → General → Web app) live in your `.env.local` and, for the live site, in Vercel.
- **API:** it checks every sign-in token against project `ymarq-35862`, and needs no key for that.

## Expo / EAS (app builds and push)

Account `ymarq` (you are Owner; also `ymarqs-team`). Logged in on the owner's Mac (`npx eas-cli@latest whoami`).

- **Project:** `@ymarq/ymarq`, id `6743d061-dfaa-4d8e-9a26-3ff114aec9e8` (in `app.json` → `extra.eas.projectId`).
- **Builds:** https://expo.dev/accounts/ymarq/projects/ymarq/builds. Profiles are in `eas.json`; how to build and install is in [DEVELOPER_GUIDE § 2a](DEVELOPER_GUIDE.md#2a-phone-builds-eas).
- **Credentials:** https://expo.dev/accounts/ymarq/projects/ymarq/credentials
  - the Android signing key (generated by EAS, stored there)
  - the FCM V1 key (Android push)
  - later, the Apple push key and certificates
- **Environment variables (files):** https://expo.dev/accounts/ymarq/projects/ymarq/environment-variables. The two Firebase config files go here for #13.
- **Access tokens** (for `EXPO_TOKEN` in GitHub):
  - Go to https://expo.dev/accounts/ymarq/settings/access-tokens (avatar, top right → account `ymarq` → Settings → Access tokens).
  - Create a token there, or create a **robot user** under Settings → Robot users and give it a token.
  - Only needed to start builds from GitHub; builds from the Mac don't need it.
- **Push notifications:** the API sends through Expo's push service. Expo hands them to Google (FCM, using the FCM V1 key above) and Apple (APNs, needs the Apple account). Test sender: https://expo.dev/notifications

## Apple and Google stores (not yet)

- **Apple Developer Program** ($99/year): needed for real iPhones, TestFlight, the App Store and iPhone push. #41, then #18.
- **Google Play Console** ($25 once): needed for the Play Store. #41, then #19.

## Where things are on the owner's Mac

| What | Where |
|---|---|
| App settings for local development | `.env.local` in the repo folder (git-ignored); template in `.env.example` |
| Firebase files and admin key | `~/Downloads/ymarq-important/` |
| Vercel login | `npx vercel@latest whoami` |
| Expo login | `npx eas-cli@latest whoami` |
| GitHub login | `gh auth status` |

## Monthly cost today

All free tiers: Vercel Hobby, Neon free, Vercel Blob free, Expo free, and Firebase pay-as-you-go (only real SMS cost money, about $0.01–0.06 each). Details and launch costs: [STACK.md](STACK.md).
