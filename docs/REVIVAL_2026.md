# Ymarq Revival 2026: Migration Plan & Feature Tracker

> Goal: bring the 2014 Ymarq prototype (Java, Holo, API 21, Gradle 2.1) up to a
> modern, shippable Android app, feature by feature.
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
| Backends | `http://54.200.232.223:8080/photos/GetProducts/{code}` (AWS IP) and `http://ymarq.azurewebsites.net/home/*` (Azure) |
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

| # | Feature (legacy behaviour) | Legacy location | Modern replacement | Status |
|---|---|---|---|---|
| F0 | **Build & project setup**: Gradle 2.1 / AGP 0.13 / jcenter | `build.gradle`, `app/build.gradle` | Gradle Kotlin DSL, version catalog (`libs.versions.toml`), latest stable AGP + Kotlin 2.x, Compose BOM, `google()` + `mavenCentral()` | ⬜ |
| F1 | **App shell**: single Activity, "Ymarq" label, launcher icon, Holo/Material theme | `MainActivity`, `styles.xml`, `drawable-*` | `ComponentActivity` + Compose, Material 3 theme (dynamic color, dark mode, edge-to-edge), adaptive icon rebuilt from `ic_launcher-web.png` / `ym_logo.jpg` | ⬜ |
| F2 | **Product feed**: on screen open, GET products for a hardcoded user code `1111111111` and show `"Description - Hashtag"` text rows | `FetchProductsTask`, `getProductDataFromJson` | `ProductsScreen` (Compose `LazyColumn` with image cards) ← `ProductsViewModel` (`StateFlow` with loading/error/empty states) ← `ProductRepository` ← Retrofit/OkHttp + kotlinx.serialization. The user code comes from the signed-in user. | ⛔ D-A, D-B |
| F3 | **Refresh**: overflow-menu "Refresh" re-fetches, but with a *different* hardcoded code `1222222222` (bug) | `onOptionsItemSelected` | Pull-to-refresh plus a top-bar action, using the same user id as F2 | ⬜ |
| F4 | **Take a photo**: overflow "Camera" launches the system camera and writes to public `Pictures/picFolder/N.jpg` via a `file://` URI. The counter resets on every launch (so photos get overwritten). The result is ignored and nothing is uploaded. | `TakePicture`, `onActivityResult` | `ActivityResultContracts.TakePicture` + `FileProvider` (app-private) or a MediaStore insert. Runtime CAMERA permission. The photo feeds the F9 "create listing" flow. | ⬜ |
| F5 | **Identity detection**: scans `AccountManager` accounts for an email-shaped name and toasts "Loging in as …". Dead code that would read the phone number through `TelephonyManager`. | `onCreateView` | Removed: Android 8+ hides accounts, and `getLine1Number` is restricted. Replaced by real sign-in (F6). | ⛔ Q2 |
| F6 | **Logon**: POSTs the hardcoded form `Id=1091&Email=someval1091@gmail.com` to Azure `/home/Logon`, ignores the response, and always toasts "Logged in". | `LogonTask`, `requestUrl` | A real auth flow (Credential Manager / Sign in with Google, or whatever Q2 decides), session persisted in DataStore, and a sign-in screen for signed-out users. **Phone OTP first**, Google second. | ⛔ D-A |
| F7 | **Settings** menu item (no-op) | `menu_main.xml` | Settings screen: account/sign-out, theme, about/version. Kept minimal. | ⬜ |
| F8 | **Data models**: `Product(Description, Hashtag, Id, Image, PublisherId)`, `User(Id, Email)` | `DataProduct`, `DataUser` | Kotlin `@Serializable data class`es that map to the server's PascalCase JSON with `@SerialName`. The `Image` field is actually rendered (Coil). | ⬜ |
| F9 | *README-only, not implemented:* **manage classifieds** (create/edit/delete a listing with photo + description + hashtag) | README | New create-listing flow: F4 photo → form → upload | ⏸️ later (Q3) |
| F10 | *README-only, not implemented:* **communication between friends** (friends graph, sharing, messaging) | README | Phone-number contact linking (WhatsApp-style), then messaging | ⏸️ later (Q3) |

### Dropped (legacy code that won't be ported)
| Item | Reason |
|---|---|
| `GET_ACCOUNTS`, `READ_PHONE_STATE`, `WRITE_EXTERNAL_STORAGE` permissions | Obsolete or restricted on modern Android; replaced by F6 and app-private storage |
| Sunshine leftovers (`formatHighLows`, `getReadableDateString`, `connectMock`, `getProductMock`) | Dead code |
| Unused endpoint builders `getServerUrl2/3` (Azure `Login`, `getproducts`) | Folded into the API definition once Q1 settles which backend is real |
| `fragment_camera.xml`, unused `ListView` in `activity_main.xml` | Orphaned |
| Committed `app-release.apk`, `*.iml`, `.idea/` | Build outputs / IDE state don't belong in git |

---

## 3. Target stack (proposed)

| Concern | Choice | Why |
|---|---|---|
| Language | Kotlin 2.x (K2 compiler), **Kotlin Multiplatform** (Q5) | Google-supported for sharing code between Android and iOS; Android ships first |
| Modules | `shared` (domain, data, ViewModels, UI) + `androidApp` (+ `iosApp` stub later) | Android-specific code stays behind `expect`/`actual` |
| UI | Compose Multiplatform + Material 3 | Same API as Jetpack Compose; the UI can later be reused on iOS. Replaces XML/ListView/Holo. |
| Architecture | Single activity, Navigation Compose (multiplatform), MVVM (`androidx.lifecycle` ViewModel + `StateFlow`), repository layer | Official "app architecture" guidance; all of these libraries support KMP |
| Async | Kotlin coroutines / Flow | Replaces `AsyncTask` (removed in API 33) |
| Networking | Ktor client + kotlinx.serialization, HTTPS only | Retrofit/OkHttp are JVM-only, so Ktor is the KMP choice |
| Images | Coil 3 | Multiplatform, Compose-native image loading for `Product.Image` |
| Camera | Android `actual`: `ActivityResultContracts.TakePicture` + `FileProvider` | Least code, no storage permission |
| DI | Koin | Hilt is Android-only; Koin is the common KMP choice |
| Local storage | DataStore (session/prefs); Room (KMP) only if we want an offline feed | Needed for F6 |
| Auth | Phone OTP first, then Google sign-in. Provider depends on D-A (proposed: Firebase Auth). | See §6 |
| SDK levels | `minSdk 26`, `compileSdk`/`targetSdk` = the latest level Google Play requires at submission time | minSdk 26 covers ~all active devices and removes many compat branches |
| Quality | JUnit + Turbine + MockWebServer, Compose UI tests, ktlint/detekt, GitHub Actions CI (build + test + lint) | There's no safety net today |

`applicationId`: a new id (the signing key for `com.ymarq.eu.ymarq` is probably lost; see D-C).

---

## 4. Phased plan

### Phase 0: Decisions (now)
- [x] Resolve Open Questions Q1–Q5 (see Decisions log)
- [ ] Resolve round-2 questions D-A…D-D

### Phase 1: Foundation (not blocked)
- [ ] F0: New Gradle Kotlin DSL build, version catalog, wrapper upgrade, clean `.gitignore`, remove APK/IDE files
- [ ] F1: Compose app shell, Material 3 theme, adaptive icon, edge-to-edge
- [ ] F8: Kotlin data models + JSON (de)serialization tests against the legacy payload sample
- [ ] CI: GitHub Actions workflow (assembleDebug, unit tests, lint)
- [ ] Delete the legacy Java sources once the Kotlin equivalents land

### Phase 2: Port existing features (1:1 behaviour, done properly)
- [ ] F2: Product feed (UI + ViewModel + repository + fake API for tests)
- [ ] F3: Pull-to-refresh
- [ ] F4: Photo capture with FileProvider + permission handling
- [ ] F5/F6: Sign-in and session
- [ ] F7: Settings screen

### Phase 3: Complete the product vision (scope set by Q3)
- [ ] F9: Create/edit/delete listing with photo upload
- [ ] F10: Friends and communication

### Phase 4: Release
- [ ] R8/minify rules, baseline profile, signing config (keys outside git)
- [ ] Privacy policy + Play Data Safety form (camera, account data)
- [ ] Internal testing track → production

---

## 5. Open Questions (need answers before the ⛔ items)

| # | Question | Why it matters | Options |
|---|---|---|---|
| **Q1** | **Backend:** are `54.200.232.223:8080` (AWS) and `ymarq.azurewebsites.net` (Azure) still alive, and do you own their code? | F2, F3, F6, F9 all depend on an API. Both are HTTP-only, and the AWS one is a raw IP. | (a) revive the existing .NET/Azure API · (b) new managed backend such as Firebase (Auth + Firestore + Storage) or Supabase · (c) new custom API · (d) mock/local-only for now |
| **Q2** | **Identity:** how should users sign in? | The legacy "login" was device-email scraping plus a hardcoded POST, so it can't be ported as is. | Sign in with Google (Credential Manager) · email/password · phone OTP · a mix of these |
| **Q3** | **Scope:** port the prototype 1:1, or build out the README vision (post classifieds, friends, messaging)? | Decides whether F9/F10 happen and how large Phase 3 is | 1:1 port first, then vision (recommended) · go straight to the full vision |
| **Q4** | **Play Store:** was `com.ymarq.eu.ymarq` ever published? Do you still have the signing key? | If it's published, we must keep the applicationId and signing key (or use Play App Signing key upgrade) | Keep the id · new id |
| **Q5** | **Other platforms:** is iOS or web on the roadmap later? | If yes, Kotlin Multiplatform + Compose Multiplatform lets us share data/domain (and optionally UI) from day one at little Android cost | Android-only (plain Jetpack) · KMP-ready structure (shared module, Android app first) |

### Decisions log
| Date | Decision | By |
|---|---|---|
| 2026-09-30 | Q1: Legacy backend is down. The owner is looking for its sources. The app talks to data only through repository interfaces, so the backend can be swapped in later. | owner |
| 2026-09-30 | Q2: A mix of sign-in methods. **Phone number comes first** (WhatsApp-style identity and contact linking), then Google. Must avoid restricted Play permissions (no SMS permissions). | owner |
| 2026-09-30 | Q3: Port the prototype 1:1 first; the full vision (F9/F10) comes later. CI/CD is a bonus so parallel issues can be verified. | owner |
| 2026-09-30 | Q4: The app was published and later pulled. The signing key may be lost, so we plan for a new applicationId. | owner |
| 2026-09-30 | Q5: Kotlin Multiplatform from day one, Android first. | owner |
| 2026-09-30 | D-A: **Firebase** chosen; the owner created the Firebase project. | owner |
| 2026-09-30 | Work is managed as GitHub Issues. "Agent-ready" issues are picked up by agents that open PRs; "pairing" issues are done together. | owner |

### Still open (round 2)
| # | Question | Proposal |
|---|---|---|
| **D-B** | Where the ported feed reads data from until the legacy sources are found | Firestore seeded with sample products (a real end-to-end demo), with a fake repository for tests |
| **D-C** | New applicationId | `com.ymarq.app` (only set when first uploading to Play; easy to change before then) |
| **D-D** | Agent runner | Claude Code GitHub Action, triggered by the `agent-ready` label |

---

## 6. Working model: GitHub Issues + parallel agents

### Flow
1. **Define:** each issue follows a template that removes ambiguity: *Context · Goal · Files/modules in scope · Out of scope · Acceptance criteria · Verification command(s) · Depends on #*.
2. **Classify** with labels:
   - `agent-ready`: fully specified, no human decisions or secrets needed. Adding this label **triggers** an agent.
   - `pairing`: needs a human (secrets, console setup, product judgement, device testing).
   - `blocked`: waiting on a dependency; the label is removed when the dependency merges.
   - `needs-decision`: open question; never picked up by an agent.
   - Area labels: `area:build`, `area:ui`, `area:data`, `area:auth`, `area:ci`.
3. **Run:** the agent workflow (`.github/workflows/agent.yml`, Claude Code GitHub Action) starts on `agent-ready`, works on a `agent/issue-<n>` branch, runs the verification commands, and opens a PR with `Closes #<n>`.
4. **Gate:** CI (build + unit tests + lint) must be green. A human reviews and merges. Review comments on the PR (`@claude …`) send the same agent back for fixes.
5. **Track:** a GitHub Project board (Todo / Agent running / In review / Done), one milestone per wave. This file mirrors the status of each feature.

### Rules that make parallel work safe
- **Wave 0 is serial.** The KMP scaffold pre-declares *every* dependency in `libs.versions.toml` and creates empty packages/screens, so parallel PRs don't collide in shared files.
- Each agent-ready issue owns a disjoint set of files (named in the issue).
- Issues communicate through interfaces that already exist on `master` (e.g., the UI issue codes against the `ProductsUiState` contract; the data issue implements `ProductRepository`).
- No agent-ready issue touches secrets, Firebase console, signing, or Play Console.

### Proposed issue breakdown
| Wave | Issue | Type | Depends on |
|---|---|---|---|
| 0 | KMP scaffold: `shared` + `androidApp`, version catalog with every dependency, Koin, nav graph with empty screens, M3 theme, remove legacy Java/APK/`.idea` | pairing | – |
| 0 | CI: GitHub Actions build + unit tests + lint on PRs | agent-ready | scaffold |
| 0 | Agent workflow + issue templates + labels + Project board | pairing | – |
| 0 | Create Firebase project, add phone/Google providers, set CI secrets | pairing (human only) | D-A |
| 1 | F8: data models + serialization tests using the legacy JSON sample | agent-ready | scaffold |
| 1 | F2a: `ProductRepository` interface + fake + `ProductsViewModel` + tests | agent-ready | scaffold |
| 1 | F2b: Products list UI (cards, loading/empty/error) against `ProductsUiState` + screenshot/UI test | agent-ready | scaffold |
| 1 | F1: adaptive icon from `ym_logo`, edge-to-edge, dark mode | agent-ready | scaffold |
| 1 | F7: Settings screen (version, theme, sign-out stub) | agent-ready | scaffold |
| 1 | F4: photo capture (Android `actual`, FileProvider, CAMERA permission flow) | agent-ready | scaffold |
| 2 | F3: pull-to-refresh | agent-ready | F2a, F2b |
| 2 | F2c: Firestore `ProductRepository` + seed script | pairing | F2a, Firebase |
| 2 | F6: phone OTP sign-in + session (DataStore), sign-in gate | pairing | Firebase |
| 2 | F6b: Google sign-in via Credential Manager | agent-ready | F6 |
| 2 | CD: Firebase App Distribution on merge to `master` | pairing | CI, Firebase |
| 3 | Release: R8, new applicationId, Play App Signing, Data Safety, internal track | pairing | all above |
