# Ymarq Revival 2026: Migration Plan & Feature Tracker

> Goal: rebuild the 2014 Ymarq Android prototype (Java, Holo, API 21, Gradle 2.1)
> as one modern **React Native + Expo (TypeScript)** codebase that ships to
> **Android (first), iOS and Web**, feature by feature.
>
> Branch: `revival-2026` · Started: 2026-09-30

**Legend:** ⏸️ deferred · ⬜ not started · 🟨 in progress · ✅ done · ⛔ blocked (see Open Questions) · 🗑️ dropped

---

## 1. What exists today (audit)

The whole app is 4 Java classes (~600 lines) and was built from the Udacity
"Sunshine" sample. Leftovers from that sample (`formatHighLows`,
`getReadableDateString`, the `forecast` variable names) are still in the code.

| Area | Current state |
|---|---|
| Language / UI | Java, `android.app.Fragment`, `ListView` + `ArrayAdapter<String>`, Holo theme |
| Build | AGP 0.13.2, Gradle 2.1, `jcenter()` (shut down), `runProguard` (removed), compile/target SDK 21, minSdk 15 |
| Async / network | `AsyncTask` + raw `HttpURLConnection`, manual `org.json` parsing, **cleartext HTTP** |
| Backends | `http://54.200.232.223:8080/photos/GetProducts/{code}` (AWS IP) and `http://ymarq.azurewebsites.net/home/*` (Azure). **Both down.** |
| Tests | Only the empty `ApplicationTest` template |
| Repo hygiene | A committed `app/app-release.apk`, `.iml` files and `.idea/` |

### Source files
- `MainActivity.java`: hosts `ProductsListFragment`. Its only menu item is a no-op "Settings".
- `ProductsListFragment.java`: contains every feature (list, refresh, camera, identity, logon).
- `DataProduct.java` / `DataUser.java`: POJOs that nothing uses (parsing goes straight to strings).
- `fragment_camera.xml` references a `CameraFragment` class that doesn't exist.

---

## 2. Feature map

Every behaviour found in the code, and what it becomes.

| # | Feature (legacy behaviour) | Legacy location | New implementation (Expo/TS) | Status |
|---|---|---|---|---|
| F0 | **Build & project setup**: Gradle 2.1 / AGP 0.13 / jcenter | `build.gradle`, `app/build.gradle` | Expo app (TypeScript strict), Expo Router, ESLint + Prettier + `tsc`, Jest. Legacy Android sources removed. | ✅ scaffold |
| F1 (#7) | **App shell**: single Activity, "Ymarq" label, launcher icon, Holo/Material theme | `MainActivity`, `styles.xml`, `drawable-*` | Expo Router root layout, React Native Paper (Material 3) theme with light/dark mode, app icon + splash rebuilt from `ic_launcher-web.png` / `ym_logo.jpg` | ⬜ |
| F2 (#3, #4, #9) | **Product feed**: on screen open, GET products for a hardcoded user code `1111111111` and show `"Description - Hashtag"` text rows | `FetchProductsTask`, `getProductDataFromJson` | `feed` route: a `FlatList` of product cards with image, description and hashtag, plus loading/empty/error states ← `useProducts()` (TanStack Query) ← `ProductRepository` interface (fake now, then Firestore; the legacy API later if its sources are found). The signed-in user replaces the hardcoded code. | ⬜ |
| F3 (#8) | **Refresh**: overflow-menu "Refresh" re-fetches, but with a *different* hardcoded code `1222222222` (bug) | `onOptionsItemSelected` | Pull-to-refresh (`RefreshControl`) plus a header action, using the same user as F2 | ⬜ |
| F4 (#5) | **Take a photo**: overflow "Camera" launches the system camera and writes to public `Pictures/picFolder/N.jpg` via a `file://` URI. The counter resets on every launch (so photos get overwritten). The result is ignored and nothing is uploaded. | `TakePicture`, `onActivityResult` | `expo-image-picker` `launchCameraAsync` (system camera on Android/iOS, file/camera input on web) with a runtime permission flow. Photos are kept in app storage. Later it feeds the F9 "create listing" flow. | ⬜ |
| F5 | **Identity detection**: scans `AccountManager` accounts for an email-shaped name and toasts "Loging in as …". Dead code that would read the phone number through `TelephonyManager`. | `onCreateView` | Removed: modern Android hides accounts, and phone-number access is restricted. Replaced by real sign-in (F6). | 🗑️ |
| F6 (#10) | **Logon**: POSTs the hardcoded form `Id=1091&Email=someval1091@gmail.com` to Azure `/home/Logon`, ignores the response, and always toasts "Logged in". | `LogonTask`, `requestUrl` | Firebase Auth: **phone OTP first** (no SMS permission needed), Google second. A sign-in route gates the app, and the session persists across restarts. | ⬜ |
| F7 (#6) | **Settings** menu item (no-op) | `menu_main.xml` | `settings` route: account/sign-out, theme, app version. Kept minimal. | ⬜ |
| F8 | **Data models**: `Product(Description, Hashtag, Id, Image, PublisherId)`, `User(Id, Email)` | `DataProduct`, `DataUser` | TypeScript types + `zod` schemas that parse the legacy PascalCase JSON into camelCase domain objects (`src/domain/`) | ✅ scaffold |
| F9 | *README-only, not implemented:* **manage classifieds** (create/edit/delete a listing with photo + description + hashtag) | README | New create-listing flow: F4 photo → form → upload to Firebase Storage | ⏸️ later (Q3) |
| F10 | *README-only, not implemented:* **communication between friends** (friends graph, sharing, messaging) | README | Phone-number contact linking (WhatsApp-style, `expo-contacts`), then messaging | ⏸️ later (Q3) |

### Dropped (legacy code that won't be ported)
| Item | Reason |
|---|---|
| `GET_ACCOUNTS`, `READ_PHONE_STATE`, `WRITE_EXTERNAL_STORAGE` permissions | Obsolete or restricted on modern Android; replaced by F6 and app-private storage |
| Sunshine leftovers (`formatHighLows`, `getReadableDateString`, `connectMock`, `getProductMock`) | Dead code |
| Unused endpoint builders `getServerUrl2/3` (Azure `Login`, `getproducts`) | These would become a `LegacyApiProductRepository` if the sources are found |
| All Java/Gradle/XML sources, `app-release.apk`, `*.iml`, `.idea/` | Replaced by the Expo project |

---

## 3. Target stack

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) | The standard for React; type errors are caught in CI |
| Framework | React Native (New Architecture) + **Expo** (latest stable SDK) | One codebase for Android, iOS and Web. Expo handles native config, builds and updates. |
| Navigation | Expo Router (file-based routes under `src/app/`) | Works identically on native and web, and gives real web URLs |
| UI kit | React Native Paper (Material 3) | Material look on Android, works on web, has a theming system |
| Server state | TanStack Query | Caching, loading/error states and refresh for free |
| Validation | zod | Parses untrusted API/Firestore data into typed objects |
| Auth + data | Firebase: Auth (phone + Google), Firestore, Storage. Native: `@react-native-firebase/*`; web: Firebase JS SDK. Both sit behind `src/services/*` interfaces with `.web.ts` variants. | The native SDKs are needed for phone auth on Android/iOS |
| Camera | `expo-image-picker` (in-app viewfinder via `expo-camera` only if needed later) | Least code and works on all three platforms |
| Images | `expo-image` | Caching, fast image display |
| Tests | Jest (`jest-expo`) + React Native Testing Library; Maestro E2E later | Unit/component tests run in CI without a device |
| Quality gates | `eslint`, `prettier --check`, `tsc --noEmit`, `jest` | The same commands run locally and in CI |
| Native builds / CD | **EAS Build** (cloud builds, managed signing keys), **EAS Update** (per-PR preview updates), **EAS Submit** (Play/App Store) | No local Java/Xcode needed, and keys are backed up |
| Web hosting | **Vercel** (static `expo export -p web`), preview URL per PR | Every parallel PR gets a clickable preview |
| Identifiers | Android package / iOS bundle id: `com.ymarq.app` | The legacy key is probably lost, so a new id is needed |

### Repository layout (created by the scaffold)
```
src/
  app/                 # Expo Router routes: (auth)/sign-in, (main)/feed, (main)/settings
  features/<name>/     # UI components + hooks per feature (feed, auth, camera, settings)
  services/            # interfaces + implementations: auth, products (fake, firestore, *.web.ts)
  domain/              # types + zod schemas (F8)
  theme/
docs/REVIVAL_2026.md   # this file
```

---

## 4. Phased plan

### Phase 0: Decisions
- [x] Q1–Q5, D-A…D-D resolved (see Decisions log)
- [x] Resolve D-B, D-C, D-D

### Phase 1: Foundation
- [x] F0: Expo scaffold (SDK 57), tooling, route stubs, service interfaces + fakes, data-source switch, legacy API repository, remove legacy Android
- [x] CI: GitHub Actions: lint, typecheck, format, Jest unit + router integration tests, expo-doctor, web build + Playwright smoke tests
- [x] Issue templates, labels, issues #3–#21, pinned Roadmap epic #22 with dependency graph, developer guide
- [ ] Agent automation (deferred, #16)
- [ ] Accounts and secrets (Firebase apps, Expo, Vercel)

### Phase 2: Port existing features (1:1 behaviour, done properly)
- [x] F8 (done in the scaffold)
- [ ] F1, F2, F3, F4, F6, F7

### Phase 3: Complete the product vision
- [ ] F9: Create/edit/delete listing with photo upload
- [ ] F10: Contact linking and messaging

### Phase 4: Release
- [ ] Android: Play internal testing → production (new listing, Data Safety form)
- [ ] iOS: TestFlight → App Store (requires an Apple Developer account)
- [ ] Web: production domain on Vercel, privacy policy page (Play and Apple both require one)

---

## 5. Decisions

### Decisions log
| Date | Decision | By |
|---|---|---|
| 2026-09-30 | Q1: Legacy backend is down. The owner is looking for its sources. The app talks to data only through repository interfaces, so the backend can be swapped in later. | owner |
| 2026-09-30 | Q2: A mix of sign-in methods. **Phone number comes first** (WhatsApp-style identity and contact linking), then Google. Must avoid restricted Play permissions (no SMS permissions). | owner |
| 2026-09-30 | Q3: Port the prototype 1:1 first; the full vision (F9/F10) comes later. CI/CD is wanted so parallel issues can be verified. | owner |
| 2026-09-30 | Q4: The app was published and later pulled. The signing key may be lost, so we plan for a new applicationId. | owner |
| 2026-09-30 | D-A: **Firebase** for auth and interim data. The owner created the Firebase project. | owner |
| 2026-09-30 | Q5 (revised): **React Native + Expo + TypeScript** instead of Kotlin Multiplatform. Targets: Android first, then iOS and Web from the same codebase. Vercel hosts the web build. | owner |
| 2026-09-30 | D-B: Feed reads **Firestore** sample data for now, behind a **switch** (`EXPO_PUBLIC_DATA_SOURCE` = `fake` \| `firestore` \| `legacy`). Firestore documents use the **exact legacy data model** (`Description`, `Hashtag`, `Id`, `Image`, `PublisherId`), so the legacy backend can be plugged in as a third `ProductRepository` without touching the UI. | owner |
| 2026-09-30 | D-C: App id `com.ymarq.app` (Android package + iOS bundle). | owner |
| 2026-09-30 | D-D: Claude Code GitHub Action is the agent runner, but **no paid API key yet** (cost control). Agents stay off until costs are reviewed (see §7). | owner |
| 2026-09-30 | Firebase project id `ymarq-35862` (Android, iOS and Web apps registered). Expo account `ymarq`. Vercel account connected. **Firebase Hosting not used**, since Vercel hosts the web app. | owner |
| 2026-09-30 | Test targets: **Web first, then iOS** (Simulator, then a real iPhone). Android device testing waits until an Android phone is available; Android stays the release priority. | owner |
| 2026-09-30 | Work is managed as GitHub Issues. "Agent-ready" issues are picked up by agents that open PRs; "pairing" issues are done together. | owner |

---

## 6. Working model: GitHub Issues + parallel agents

### Flow
1. **Define:** each issue follows a template that removes ambiguity: *Context · Goal · Files in scope · Out of scope · Acceptance criteria · Verification command(s) · Depends on #*.
2. **Classify** with labels:
   - `agent-ready`: fully specified, no human decisions, secrets, or device testing needed. Adding this label **triggers** an agent.
   - `pairing`: needs a human (secrets, console setup, product judgement, device testing).
   - `blocked`: waiting on a dependency; the label is removed when the dependency merges.
   - `needs-decision`: open question; never picked up by an agent.
   - Area labels: `area:app`, `area:ui`, `area:data`, `area:auth`, `area:ci`.
3. **Run:** *(automation deferred, see #16)* the agent workflow (`.github/workflows/agent.yml`, Claude Code GitHub Action) will start on `agent-ready`, works on an `agent/issue-<n>` branch, runs `npm run verify` (lint + typecheck + test), and opens a PR with `Closes #<n>`.
4. **Gate:** CI must be green, and the PR gets a Vercel web preview. A human reviews and merges. Review comments on the PR (`@claude …`) send the agent back for fixes.
5. **Track:** the pinned Roadmap epic (#22) with sub-issues, native *Blocked by* links and a dependency graph. Closed issues get a `## Summary` comment. This file mirrors the status of each feature and holds the decisions log.

### Rules that make parallel work safe
- **Wave 0 is serial.** The scaffold installs *every* dependency and creates route stubs, service interfaces and fakes, so parallel PRs don't collide on `package.json` or shared files.
- Each agent-ready issue owns a disjoint set of files (named in the issue).
- Issues communicate through interfaces that already exist on `master` (e.g., the feed UI uses the `useProducts()` contract; the data issue implements `ProductRepository`).
- No agent-ready issue touches secrets, the Firebase/Expo/Vercel consoles, signing, or the stores.

### Issues and dependency graph

The pinned [Roadmap epic #22](https://github.com/euhoro/YmarqApp/issues/22) is the live view: every issue is its sub-issue, and dependencies use GitHub's native *Blocked by* links. Arrow = "must be done before"; green = agent-ready, blue = pairing, grey = deferred.

```mermaid
flowchart LR
  nF2a["#3 F2a<br/>useProducts() data hook"]
  nF2b["#4 F2b<br/>Product list UI components"]
  nF4["#5 F4<br/>Take a photo with the camera"]
  nF7["#6 F7<br/>Settings screen"]
  nF1["#7 F1<br/>Brand: app icon, splash and theme"]
  nF3["#8 F3<br/>Feed screen: real data, refresh, camera button"]
  nF2c["#9 F2c<br/>Firestore product repository"]
  nF6["#10 F6<br/>Phone number sign-in (web)"]
  nCD_WEB["#11 CD-WEB<br/>Web deploys on Vercel (PR previews + production)"]
  nCD_EAS["#12 CD-EAS<br/>Native builds with EAS (iOS Simulator + Android)"]
  nF6b["#13 F6b<br/>Phone sign-in on iOS and Android (native)"]
  nF6c["#14 F6c<br/>Google sign-in"]
  nLEGACY["#15 LEGACY<br/>Plug in the legacy backend"]
  nAGENTS["#16 AGENTS<br/>Enable agent automation (Claude Code GitHub Action)"]
  nREL_WEB["#17 REL-WEB<br/>web production"]
  nREL_IOS["#18 REL-IOS<br/>iOS (TestFlight → App Store)"]
  nREL_AND["#19 REL-AND<br/>Android (Play internal track → production)"]
  nF9["#20 F9<br/>Create, edit and delete listings"]
  nF10["#21 F10<br/>Contacts linking and messaging"]
  nF2a --> nF3
  nF2b --> nF3
  nF4 --> nF3
  nF2c --> nF6
  nF3 --> nF6
  nF6 --> nF6b
  nCD_EAS --> nF6b
  nF6 --> nF6c
  nF1 --> nREL_WEB
  nF3 --> nREL_WEB
  nF6 --> nREL_WEB
  nCD_WEB --> nREL_WEB
  nF6b --> nREL_IOS
  nREL_WEB --> nREL_IOS
  nF4 --> nREL_IOS
  nF7 --> nREL_IOS
  nF6b --> nREL_AND
  nREL_WEB --> nREL_AND
  nF4 --> nREL_AND
  nF7 --> nREL_AND
  nF4 --> nF9
  nF2c --> nF9
  nF6 --> nF9
  nF6b --> nF10
  nF9 --> nF10
  classDef ready fill:#dff5e3,stroke:#0e8a16,color:#000
  classDef pairing fill:#dbe9fb,stroke:#1d76db,color:#000
  classDef later fill:#eeeeee,stroke:#999,color:#555
  class nF2a ready
  class nF2b ready
  class nF4 ready
  class nF7 ready
  class nF1 pairing
  class nF3 ready
  class nF2c pairing
  class nF6 pairing
  class nCD_WEB pairing
  class nCD_EAS pairing
  class nF6b pairing
  class nF6c later
  class nLEGACY pairing
  class nAGENTS later
  class nREL_WEB later
  class nREL_IOS later
  class nREL_AND later
  class nF9 later
  class nF10 later
```

| Wave | Issue | Type | Blocked by |
|---|---|---|---|
| 0 | ✅ #1 Expo scaffold · ✅ #2 CI | – | – |
| 1 | #3 F2a: useProducts() data hook | agent-ready | – |
| 1 | #4 F2b: Product list UI components | agent-ready | – |
| 1 | #5 F4: Take a photo with the camera | agent-ready | – |
| 1 | #6 F7: Settings screen | agent-ready | – |
| 1 | #7 F1: Brand: app icon, splash and theme | pairing | – |
| 2 | #8 F3: Feed screen: real data, refresh, camera button | agent-ready | #3, #4, #5 |
| 2 | #9 F2c: Firestore product repository | pairing | – |
| 2 | #10 F6: Phone number sign-in (web) | pairing | #9, #8 |
| 2 | #11 CD: Web deploys on Vercel (PR previews + production) | pairing | – |
| 2 | #12 CD: Native builds with EAS (iOS Simulator + Android) | pairing | – |
| 3 | #13 F6b: Phone sign-in on iOS and Android (native) | pairing | #10, #12 |
| 3 | #14 F6c: Google sign-in | pairing | #10 |
| 3 | #15 Plug in the legacy backend | pairing | – |
| 3 | #16 Enable agent automation (Claude Code GitHub Action) | pairing | – |
| 4 | #17 Release: web production | pairing | #7, #8, #10, #11 |
| 4 | #18 Release: iOS (TestFlight → App Store) | pairing | #13, #17, #5, #6 |
| 4 | #19 Release: Android (Play internal track → production) | pairing | #13, #17, #5, #6 |
| later | #20 F9: Create, edit and delete listings | needs-decision | #5, #9, #10 |
| later | #21 F10: Contacts linking and messaging | needs-decision | #13, #20 |

---

## 7. Later: costs and accounts (don't forget)

| Item | Cost | Needed for | Status |
|---|---|---|---|
| Agent runner auth: either a `CLAUDE_CODE_OAUTH_TOKEN` from the existing Claude subscription (`claude setup-token`; uses subscription limits, no extra bill) **or** an `ANTHROPIC_API_KEY` (pay per use) | $0 extra / usage-based | Agents picking up `agent-ready` issues automatically | ⏸️ deferred by owner |
| Claude GitHub App on the repo | Free | Agents (and Claude Code on the web) pushing branches and opening PRs | ⬜ check |
| Firebase **Blaze** plan (+ budget alert) | Pay-as-you-go; small at our scale | Real SMS for phone login (test numbers work without it), Cloud Storage for photos (F9) | ⏸️ |
| Apple Developer Program | $99 / year | Installing on a real iPhone via EAS, TestFlight, App Store | ⏸️ |
| Xcode (Mac App Store) | Free | iOS Simulator for native testing | ⬜ |
| Google Play developer account (reuse the old one if access exists) | $25 one-time (or $0 if reused) | Publishing the Android app | ⏸️ |
| Android test phone | Device | Real-device testing of the Android build | ⏸️ |
| Custom domain for the web app | ~$10–20 / year | Production web URL (optional; `*.vercel.app` is fine until launch) | ⏸️ |
