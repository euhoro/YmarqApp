# Ymarq

Classifieds shared between friends. Being revived in 2026 as one **React Native + Expo (TypeScript)** app
for **Android, iOS and Web**. The plan and progress tracker: [`docs/REVIVAL_2026.md`](docs/REVIVAL_2026.md).

## Run it

Requires Node 20+.

```bash
npm install
cp .env.example .env.local   # optional; defaults to fake data
npm run web                  # open in the browser
npm run ios                  # iOS Simulator (needs Xcode)
```

## Checks

```bash
npm run verify   # lint + typecheck + format check + tests (what CI runs)
npm run format   # auto-fix formatting
```

## Data source

The feed can read from three sources, chosen by `EXPO_PUBLIC_DATA_SOURCE` in `.env.local`:

| Value | Source |
|---|---|
| `fake` (default) | Built-in sample products |
| `firestore` | Firebase project `ymarq-35862` (in progress) |
| `legacy` | The original backend's `GET /photos/GetProducts/{userCode}` at `EXPO_PUBLIC_LEGACY_API_URL` |

All three use the original data model (`Id`, `Description`, `Hashtag`, `Image`, `PublisherId`).

The 2014 Android (Java) prototype is preserved in git history (last commit before the rewrite: `7ace996`).
