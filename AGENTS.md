# Ymarq: rules for agents

Ymarq is being rebuilt from a 2014 Android prototype. The plan, feature map, decisions and status live in
[`docs/REVIVAL_2026.md`](docs/REVIVAL_2026.md). Read it before starting work. Don't edit its statuses in feature PRs: they are updated once per wave,
so parallel PRs don't conflict.

## Project rules

- **Aim at the goal:** the launch [Definition of Done](docs/REVIVAL_2026.md#0-definition-of-done-launch) (register, log in, sell, search, chat, notifications, real server). Prefer `dod` issues, and keep every flow as simple for the user as possible.

- **Done means green:** `npm run verify` (lint + typecheck + format check + tests) must pass. Run `npm run format` to fix formatting. If you change screens or navigation, also run `npm run build:web && npm run test:e2e`.
- **Stay in scope:** only touch the files your GitHub issue names. Don't add dependencies unless the issue says so; they are pre-installed.
- **Services, not SDKs, in UI:** screens and hooks get data only through `useServices()` (`src/services/ServicesProvider.tsx`). Never import Firebase or `fetch` from UI code.
- **Data source switch:** `EXPO_PUBLIC_DATA_SOURCE` = `fake` (default) | `firestore` | `legacy`. Every source returns the domain `Product` type; stored/wire data uses the **legacy PascalCase model** (`LegacyProductSchema` in `src/domain/product.ts`). Don't change that model without a decision recorded in the tracker (2026-10-05 added optional `Price`, `Currency`, `Category`, `Location`).
- **Layout:** routes in `src/app/`: **screens for signed-in users go in `src/app/(app)/`** (protected automatically by `RootNavigator`), public screens such as `sign-in` stay directly in `src/app/`; feature UI + hooks in `src/features/<name>/`, services in `src/services/`, domain types in `src/domain/`. Tests go in `__tests__/` next to the code, never under `src/app/`. Route-level integration tests use `renderRouter` (see `src/__tests__/navigation.test.tsx`); browser smoke tests live in `e2e/`.
- **Platforms:** code must work on web, iOS and Android. Put platform-specific code in `*.web.ts` / `*.native.ts` files.
- **API (`api/`):** a separate npm package (Hono on Vercel). Done means `npm --prefix api run verify` passes. Routes get storage only through the `Stores` passed to `createApp`; new stores must pass the `productStoreContract` tests. Never import app code into `api/` or the reverse.
- **Secrets:** never commit secrets, `.env.local`, `google-services.json` or `GoogleService-Info.plist`.
- **Commits:** plain messages; no AI attribution/co-author trailers.

## Expo notes

This is an Expo/React Native application (Android, iOS and Web). Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
