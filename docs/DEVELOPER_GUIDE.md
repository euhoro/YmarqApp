# Ymarq developer guide

How to run the app, test it by hand, and work in this repo without breaking it.

- **What we're building and why:** [`REVIVAL_2026.md`](REVIVAL_2026.md) (plan, decisions, feature map)
- **What to work on next:** the pinned [Roadmap issue #22](https://github.com/euhoro/YmarqApp/issues/22) (dependency graph + waves)
- **Rules for code (humans and agents):** [`../AGENTS.md`](../AGENTS.md)

---

## 1. One-time setup

| Tool | Why | Install |
|---|---|---|
| Node 24 | Runs everything | `nvm install` (reads `.nvmrc`) |
| Git + GitHub CLI | Branches, PRs, issues | `brew install gh && gh auth login` |
| Xcode (optional) | iOS Simulator | Mac App Store |
| Playwright Chromium | Browser tests | `npx playwright install chromium` |

```bash
git clone https://github.com/euhoro/YmarqApp.git
cd YmarqApp
npm install
cp .env.example .env.local   # optional: the defaults use fake data
```

No Java, Android Studio or Firebase files are needed for day-to-day work: the app runs on fake data by default.

## 2. Run the app

| Target | Command | Opens |
|---|---|---|
| Web | `npm run web` | http://localhost:8081 |
| iOS Simulator | `npm run ios` | Needs Xcode (or use an EAS build, below) |
| Android | `npm run android` | Needs an emulator or phone (later) |

The dev server reloads on every save. Press `Ctrl+C` in the terminal to stop it.

**Starting signed out:** set `EXPO_PUBLIC_FAKE_AUTH_SIGNED_IN=false` in `.env.local` to open the app on the sign-in screen (the fake auth accepts any mobile number with code `123456`).

**Switching data sources:** set `EXPO_PUBLIC_DATA_SOURCE` in `.env.local` to `fake` (default), `api` (with `EXPO_PUBLIC_API_URL`) or `legacy` (with `EXPO_PUBLIC_LEGACY_API_URL`), then restart `npm run web`.

**Real Firebase sign-in (web):** set `EXPO_PUBLIC_AUTH=firebase` and the `EXPO_PUBLIC_FIREBASE_*` values in `.env.local`, then `npx expo start --web --clear`. Use the Firebase test number **+1 650-555-1234**, code **123456** (no SMS is sent). An invisible reCAPTCHA runs on **Send code**; automated browsers (Playwright) usually get an image challenge, so this step is checked by hand. The domain must be in Firebase console → Authentication → Settings → **Authorized domains** (`localhost` is there by default). Native iOS/Android sign-in is #13. Countries must also be allowed in Authentication → Settings → **SMS region policy** (even for test numbers); otherwise Firebase answers `auth/operation-not-allowed` and the app says SMS isn't available for this country. The browser console logs the exact Firebase error.

**App + local server, end to end:** in one terminal `cd server && AUTH_MODE=dev npm run dev`; in `.env.local` set `EXPO_PUBLIC_DATA_SOURCE=api` and `EXPO_PUBLIC_API_URL=http://localhost:3001`; then `npm run web`. The fake sign-in sends `dev:<userId>` tokens, which the server accepts only in `AUTH_MODE=dev` (never in production).

## 2a. Phone builds (EAS)

The iOS and Android apps are built in Expo's cloud (**EAS Build**, project `@ymarq/ymarq`), so no Android Studio is needed and Xcode is only needed for the iOS Simulator. Profiles live in `eas.json`:

| Profile | What you get | Use it for |
|---|---|---|
| `development` | Dev client: the app shell, which loads your code from `npx expo start` | Day-to-day work with native modules (Firebase, notifications) |
| `preview` | The whole app inside (iOS Simulator `.app`, Android `.apk`) | Trying a branch without a dev server |
| `production` | Store builds (needs Apple/Google accounts, #41) | Releases (#18, #19) |

**Start a build**, either way:
- From your Mac: `npx eas-cli@latest build -p ios --profile development` (or `-p android`, or `-p all`).
- From GitHub: **Actions → EAS build → Run workflow**, pick the profile and platform. Needs the repo secret `EXPO_TOKEN`.

Builds take about 10–20 minutes; follow them at https://expo.dev/accounts/ymarq/projects/ymarq/builds.

**iOS Simulator:** `npx eas-cli@latest build:run -p ios --latest` downloads the newest simulator build and installs it in the Simulator (it opens the Simulator if needed). For a `development` build, then run `npx expo start` and press `i`. The app connects to it.

**Android:** open the build page on the phone and tap **Install** (allow installs from the browser), or with an emulator running: `npx eas-cli@latest build:run -p android --latest`. A `development` build connects to `npx expo start` on the same Wi-Fi.

**When to rebuild:** only after adding a library with native code or changing `app.json`. JavaScript changes reach a development build through `npx expo start` without rebuilding.

## 2b. Run the API (`server/`)

The backend is a separate Node package in `server/` (Hono, TypeScript), deployed to Vercel as its own project (#31).

```bash
cd server
npm install
npm run dev        # http://localhost:3001/health → {"ok":true}
npm run verify     # lint, typecheck, format check, Vitest
```

- Storage is chosen with `STORE`: `memory` (default) or `postgres` (needs `DATABASE_URL`, set by the Vercel Neon integration). See `server/.env.example`.
- **Database schema** lives in `server/src/stores/postgres/schema.ts`. After changing it: `npm run db:generate` (writes a SQL migration to `server/drizzle/`, commit it). `npm run db:migrate` applies migrations to `DATABASE_URL`.
- **Sign-in:** every `/v1/*` route needs `Authorization: Bearer <token>`. `AUTH_MODE=firebase` (default, and the only mode allowed in production) accepts real Firebase ID tokens; `AUTH_MODE=dev` also accepts `Bearer dev:<userId>` for local work, e.g. `curl -H 'Authorization: Bearer dev:alice' localhost:3001/v1/whoami`.
- **Endpoints:** `GET /v1/products?q=` (list or search), `GET /v1/products/:id`, `POST /v1/products` (you become the publisher), `DELETE /v1/products/:id` (seller only), and the 2014 route `GET /photos/GetProducts/:userCode` (PascalCase). Try locally: `curl -H 'Authorization: Bearer dev:alice' localhost:3001/v1/products`.
- **Photo uploads:** `POST /v1/uploads` issues a Vercel Blob client token (images only, max 10 MB, path `listings/<userId>/<file>`). The app calls `upload()` from `@vercel/blob/client` with `handleUploadUrl: <API>/v1/uploads` and the bearer token in `headers`, then sends the returned `url` as `imageUrl`. Needs `BLOB_READ_WRITE_TOKEN` (set by the Vercel Blob integration).
- **Deploys:** the Vercel build runs `npm run db:deploy`. With `STORE=postgres` it applies migrations (and, with `SEED_SAMPLE_DATA=true`, adds sample listings to an empty table); otherwise it does nothing.
- Tests run the real migrations against **PGlite** (Postgres in-process), so no database server is needed locally or in CI.
- Every store implements `ProductStore` and must pass the shared contract tests in `server/src/stores/__tests__/productStoreContract.ts`, which is how Postgres (and DynamoDB later) stay interchangeable.
- CI runs the API checks in a separate `api` job.


## 3. Test it

### Automated (the same checks CI runs on every PR)

```bash
npm run verify                          # lint, typecheck, format, unit + integration tests
npm run build:web && npm run test:e2e   # production web build + browser smoke tests
```

| Layer | Tool | Where |
|---|---|---|
| Unit | Jest | `src/**/__tests__/*.test.ts` |
| Integration (real routes + providers) | Jest + `expo-router/testing-library` | `src/__tests__/` |
| End-to-end (real browser, mobile viewport) | Playwright | `e2e/` |

`npm run format` fixes formatting. `npx jest --watch` reruns tests as you edit.

### Manual checklist (web)

Run `npm run web` (or open the live build at https://ymarq-app.vercel.app) and check the app's current state:

| # | Check | Expected today | Changes with |
|---|---|---|---|
| 1 | Open http://localhost:8081 | "Ymarq" header, feed placeholder | #8 (real feed with products) |
| 2 | Click **Settings** | URL `/settings`; shows signed-in user `1111111111`, data source `fake`, version `1.0.0` | #8 (header icon) |
| 2c | Camera button (or open `/new-listing`) → type `Selling my Suzuki Swift 2012, 25,000 ₪, Tel Aviv` | Price 25000 ₪, category Vehicles, location Tel Aviv filled in; editing a field keeps your value | #52 (smarter extraction) |
| 2d | **Publish** | Back on the feed, the new listing first with "₪25,000 · Tel Aviv" (in memory until reload) | #36 (saved on the server) |
| 3 | Browser back | Returns to the feed | |
| 3a | Tap a listing (e.g. the MacBook) | Details: photo, price, category, location, "Sold by Dana", **Message Dana**; your own listings say "Your listing" (no Message button) | |
| 3c | **Message Dana** → type `Is it still available?` → **Send** | URL `/chats/<id>`; your message on the right; a moment later Dana's scripted reply on the left (the screen polls every 5 s). Going back and tapping **Message Dana** again opens the same chat | #49 (chat on the server) |
| 3d | Feed header **Messages** | URL `/chats`; one row per chat (listing photo, "Dana · MacBook…", last message, time), newest first; tap a row to open it. Chats live in memory until reload | #49 |
| 3b | Type `swift` (or `#vinyl`, `haifa`) in **Search listings** | Only matching listings; `zzz` shows "No results for “zzz”"; clearing the box brings the feed back | #34 (search on the server) |
| 4 | Settings → **Sign out** | Goes to **Sign in**; any other URL also lands there while signed out | |
| 4b | Sign in: +972, `050-123-4567`, **Send code**, code `000000` | "Wrong code" error | #10 (real SMS) |
| 4c | Enter code `123456` | First time for this number: **"What's your name?"** → type a name → **Continue** → feed; Settings shows the name and `+972501234567` | #48 (names saved on the server) |
| 5 | Toggle your OS dark mode | Colors follow the system theme | #7 (brand colors) |
| 6 | Narrow the window to phone width | No horizontal scrolling | |

When a PR changes behaviour, it must update this table and describe its own manual steps in the PR's "How to test manually" section.

## 4. How we work

### The flow

```
issue (spec) → branch → commits → PR (CI + preview) → review → squash-merge → issue closes → Summary comment
```

1. **Pick an issue** from the Roadmap whose "Blocked by" issues are all closed. Assign yourself.
2. **Branch** from an up-to-date `master`:
   ```bash
   git switch master && git pull
   git switch -c feat/3-use-products     # <type>/<issue>-<slug>; type = feat | fix | chore | docs
   ```
3. **Stay inside the issue's "Files in scope"**. Parallel issues are split so they don't touch the same files; going outside the list causes merge conflicts for others.
4. **Commit** small, clear messages (`Add useProducts hook`). Run `npm run verify` before pushing.
5. **Open a PR** (`gh pr create`). The template asks for `Closes #<n>`, manual test steps and the checklist.
6. **CI must be green** (`verify` + `e2e-web`). The `master-safe` ruleset enforces this: PRs only, both checks passing, branch up to date with `master`.
7. **Merge** with "Squash and merge", then delete the branch. The issue closes automatically.
8. **Write the Summary** comment on the closed issue (template below).

### Labels

| Label | Meaning |
|---|---|
| `agent-ready` | Fully specified; anyone (or later an agent, see #16) can do it without questions |
| `pairing` | Needs a human: console setup, secrets, a device, or approval |
| `blocked` | Has open "Blocked by" issues; remove the label when they close |
| `needs-decision` | An open question must be answered first |
| `deferred` | Planned for later |
| `epic` | Tracks other issues (the Roadmap) |
| `area:*` | Which part of the app: `app`, `ui`, `data`, `auth`, `ci`, `release` |

### Links between issues (the feature tree)

- **Parent/child:** every feature issue is a **sub-issue** of the Roadmap (#22).
- **Dependencies:** each issue lists them under "Depends on" *and* uses GitHub's **Relationships → Blocked by**, so the issue page shows what it waits for and what it unblocks.
- **Graph:** the Roadmap issue's dependency graph and "ready now / blocked / done" lists are generated from GitHub. After adding issues or changing *Blocked by* links, run `npm run roadmap -- --write`.

### Summaries in issues

Issues and comments are Markdown, so they can hold summaries. Our convention:

- **When an issue closes:** one comment starting with `## Summary`:
  ```markdown
  ## Summary
  **What changed:** …
  **How to test:** …
  **Follow-ups:** #…  (or "none")
  ```
- **When a wave finishes:** a short progress comment on the Roadmap (#22), and one PR that updates the statuses in `docs/REVIVAL_2026.md`. Feature PRs don't edit the tracker, so parallel PRs don't conflict.
- **Decisions** go into the Decisions log in `docs/REVIVAL_2026.md` (versioned with the code), and the issue links to it.

### Things that break the build (and how to avoid them)

| Don't | Do instead |
|---|---|
| `npm install <pkg>` | `npx expo install <pkg>` (picks versions matching the Expo SDK), and only if the issue allows new dependencies |
| Put tests or helpers in `src/app/` | Every file there becomes a route. Put tests in `__tests__/` elsewhere |
| Import Firebase or `fetch` in screens | Go through `useServices()` so the data-source switch and tests keep working |
| Commit `.env.local`, `google-services.json`, `GoogleService-Info.plist` | They're git-ignored; share values through GitHub/Vercel/EAS secrets |
| Edit `ios/` or `android/` folders | They are generated; configure through `app.json` |
| Push straight to `master` | Always open a PR, so CI runs first |
| Change the product data model | It mirrors the legacy backend; record a decision first |

## 5. Troubleshooting

| Symptom | Fix |
|---|---|
| Port 8081 already in use | Another dev server is running; stop it or run `npx expo start --web --port 8082` |
| Strange bundler errors after pulling | `npx expo start --web --clear` |
| `npx expo-doctor` reports version mismatches | `npx expo install --fix` in a PR. CI skips this check on PRs (so `master` can't turn red on the day Expo ships a patch); the weekly **Expo updates check** workflow opens an issue instead |
| e2e tests can't find a browser | `npx playwright install chromium` |
| Formatting check fails in CI | `npm run format`, commit, push |
