# Ymarq Revival 2026: Migration Plan & Feature Tracker

> Goal: bring the 2014 Ymarq prototype (Java, Holo, API 21, Gradle 2.1) up to a
> modern, shippable Android app, feature by feature.
>
> Branch: `revival-2026` · Started: 2026-09-30

**Legend:** ⬜ not started · 🟨 in progress · ✅ done · ⛔ blocked (see Open Questions) · 🗑️ dropped

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
| F2 | **Product feed**: on screen open, GET products for a hardcoded user code `1111111111` and show `"Description - Hashtag"` text rows | `FetchProductsTask`, `getProductDataFromJson` | `ProductsScreen` (Compose `LazyColumn` with image cards) ← `ProductsViewModel` (`StateFlow` with loading/error/empty states) ← `ProductRepository` ← Retrofit/OkHttp + kotlinx.serialization. The user code comes from the signed-in user. | ⛔ Q1, Q2 |
| F3 | **Refresh**: overflow-menu "Refresh" re-fetches, but with a *different* hardcoded code `1222222222` (bug) | `onOptionsItemSelected` | Pull-to-refresh plus a top-bar action, using the same user id as F2 | ⛔ Q1 |
| F4 | **Take a photo**: overflow "Camera" launches the system camera and writes to public `Pictures/picFolder/N.jpg` via a `file://` URI. The counter resets on every launch (so photos get overwritten). The result is ignored and nothing is uploaded. | `TakePicture`, `onActivityResult` | `ActivityResultContracts.TakePicture` + `FileProvider` (app-private) or a MediaStore insert. Runtime CAMERA permission. The photo feeds the F9 "create listing" flow. | ⬜ |
| F5 | **Identity detection**: scans `AccountManager` accounts for an email-shaped name and toasts "Loging in as …". Dead code that would read the phone number through `TelephonyManager`. | `onCreateView` | Removed: Android 8+ hides accounts, and `getLine1Number` is restricted. Replaced by real sign-in (F6). | ⛔ Q2 |
| F6 | **Logon**: POSTs the hardcoded form `Id=1091&Email=someval1091@gmail.com` to Azure `/home/Logon`, ignores the response, and always toasts "Logged in". | `LogonTask`, `requestUrl` | A real auth flow (Credential Manager / Sign in with Google, or whatever Q2 decides), session persisted in DataStore, and a sign-in screen for signed-out users | ⛔ Q1, Q2 |
| F7 | **Settings** menu item (no-op) | `menu_main.xml` | Settings screen: account/sign-out, theme, about/version. Kept minimal. | ⬜ |
| F8 | **Data models**: `Product(Description, Hashtag, Id, Image, PublisherId)`, `User(Id, Email)` | `DataProduct`, `DataUser` | Kotlin `@Serializable data class`es that map to the server's PascalCase JSON with `@SerialName`. The `Image` field is actually rendered (Coil). | ⬜ |
| F9 | *README-only, not implemented:* **manage classifieds** (create/edit/delete a listing with photo + description + hashtag) | README | New create-listing flow: F4 photo → form → upload | ⛔ Q3 |
| F10 | *README-only, not implemented:* **communication between friends** (friends graph, sharing, messaging) | README | TBD, depending on Q3 | ⛔ Q3 |

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
| Language | Kotlin 2.x (K2 compiler) | Google's Android-first language |
| UI | Jetpack Compose + Material 3 | The standard toolkit for new Android UI. Replaces XML/ListView/Holo. |
| Architecture | Single activity, Navigation Compose, MVVM (ViewModel + `StateFlow`), repository layer | Official "app architecture" guidance |
| Async | Kotlin coroutines / Flow | Replaces `AsyncTask` (removed in API 33) |
| Networking | Retrofit + OkHttp + kotlinx.serialization, HTTPS only | Mature, and easy to fake in tests |
| Images | Coil 3 | Compose-native image loading for `Product.Image` |
| Camera | `ActivityResultContracts.TakePicture` + `FileProvider` (CameraX only if an in-app viewfinder is wanted) | Least code, no storage permission |
| DI | Hilt | Standard, and plays well with ViewModels/tests |
| Local storage | DataStore (session/prefs); Room only if we want an offline feed | Replaces nothing today; needed for F6 |
| Auth | Credential Manager (depends on Q2) | The current Google-recommended sign-in API |
| SDK levels | `minSdk 26`, `compileSdk`/`targetSdk` = the latest level Google Play requires at submission time | minSdk 26 covers ~all active devices and removes many compat branches |
| Quality | JUnit + Turbine + MockWebServer, Compose UI tests, ktlint/detekt, GitHub Actions CI (build + test + lint) | There's no safety net today |

`applicationId` stays `com.ymarq.eu.ymarq` unless Q4 says otherwise.

---

## 4. Phased plan

### Phase 0: Decisions (now)
- [ ] Resolve Open Questions Q1–Q5 below

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
| | | |
