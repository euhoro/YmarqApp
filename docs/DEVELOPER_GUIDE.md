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
| iOS Simulator | `npm run ios` | Needs Xcode |
| Android | `npm run android` | Needs an emulator or phone (later) |

The dev server reloads on every save. Press `Ctrl+C` in the terminal to stop it.

**Starting signed out:** set `EXPO_PUBLIC_FAKE_AUTH_SIGNED_IN=false` in `.env.local` to open the app on the sign-in screen (the fake auth accepts any mobile number with code `123456`).

**Switching data sources:** set `EXPO_PUBLIC_DATA_SOURCE` in `.env.local` to `fake` (default), `firestore` (after #9) or `legacy` (with `EXPO_PUBLIC_LEGACY_API_URL`), then restart `npm run web`.

## 2b. Run the API (`api/`)

The backend is a separate Node package in `api/` (Hono, TypeScript), deployed to Vercel as its own project (#31).

```bash
cd api
npm install
npm run dev        # http://localhost:3001/health → {"ok":true}
npm run verify     # lint, typecheck, format check, Vitest
```

- Storage is chosen with `STORE` (`memory` by default; `postgres` from #32). See `api/.env.example`.
- Every store implements `ProductStore` and must pass the shared contract tests in `api/src/stores/__tests__/productStoreContract.ts`, which is how Postgres (and DynamoDB later) stay interchangeable.
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
| 2c | Open `/new-listing` | "New listing" header, "No photo" | #8 (camera button on the feed) |
| 3 | Browser back | Returns to the feed | |
| 4 | Settings → **Sign out** | Goes to **Sign in**; any other URL also lands there while signed out | |
| 4b | Sign in: +972, `050-123-4567`, **Send code**, code `000000` | "Wrong code" error | #10 (real SMS) |
| 4c | Enter code `123456` | Lands on the feed; Settings shows `+972501234567` | |
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
| `npx expo-doctor` reports version mismatches | `npx expo install --fix` |
| e2e tests can't find a browser | `npx playwright install chromium` |
| Formatting check fails in CI | `npm run format`, commit, push |
