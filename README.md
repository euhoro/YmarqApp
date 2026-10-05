# Ymarq

Classifieds shared between friends. Being revived in 2026 as one **React Native + Expo (TypeScript)** app
for **Android, iOS and Web**.

- **Developer guide** (run, test, workflow): [`docs/DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md)
- **Tech stack** (what each part does, alternatives): [`docs/STACK.md`](docs/STACK.md)
- **Plan and decisions:** [`docs/REVIVAL_2026.md`](docs/REVIVAL_2026.md)
- **Launch goal:** [Definition of Done](docs/REVIVAL_2026.md#0-definition-of-done-launch): two users can register, log in, sell, search, chat and get notified, against the real server
- **Live web app:** https://ymarq-app.vercel.app (deploys from `master`)
- **Roadmap and what to work on next:** [issue #22](https://github.com/euhoro/YmarqApp/issues/22)

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
npm run verify     # lint + typecheck + format check + unit/integration tests (Jest)
npm run format     # auto-fix formatting
npm run build:web && npm run test:e2e   # browser smoke tests (Playwright; first run: npx playwright install chromium)
```

CI (`.github/workflows/ci.yml`) runs both on every pull request and on `master`.

## Data source

The feed can read from three sources, chosen by `EXPO_PUBLIC_DATA_SOURCE` in `.env.local`:

| Value | Source |
|---|---|
| `fake` (default) | Built-in sample products |
| `firestore` | Firebase project `ymarq-35862` (in progress) |
| `legacy` | The original backend's `GET /photos/GetProducts/{userCode}` at `EXPO_PUBLIC_LEGACY_API_URL` |

All three use the original data model (`Id`, `Description`, `Hashtag`, `Image`, `PublisherId`).

The 2014 Android (Java) prototype is preserved in git history (last commit before the rewrite: `7ace996`).
