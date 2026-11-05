# Tazonix Mobile

Expo (SDK 58) + React Native app for **Talent** and **Talent Seeker** accounts.
Admin tools are not in this app; they live in `../web`.

- API contract: [`../CONTRACT.md`](../CONTRACT.md)
- Brand and product guide: [`../implementation.md`](../implementation.md) §4 and §11

## Stack

Expo Router (file-based, typed routes) · TanStack Query · Zustand · expo-secure-store (tokens) · expo-video / expo-image ·
expo-image-picker / expo-document-picker (uploads) · expo-linear-gradient · Montserrat · lucide-react-native.
Styling uses plain `StyleSheet` plus the brand tokens in `src/theme.ts` (dark-first navy, signature gradient).

## Run

```bash
cp .env.example .env          # set EXPO_PUBLIC_API_URL (no /v1 suffix)
npm install
npm start                     # then press i / a / w, or scan the QR code with Expo Go
```

- iOS simulator or web: `http://localhost:3000` works.
- Android emulator: use `http://10.0.2.2:3000`.
- Physical device: use your machine's LAN IP, e.g. `http://192.168.1.20:3000`.

You need the backend running (`../backend`) with seed data.

### Android: API reachable from ADB, but not from Expo Go

If `http://10.0.2.2:3000/v1/health` works from the emulator shell but the app's
requests fail with `java.net.ConnectException`, check Expo Go's **Nearby devices**
permission in Android Settings → Apps → Expo Go → Permissions. Local-network
restrictions on newer Android versions can block the app while allowing ADB shell requests.

For an Android 17 development emulator with Expo Go installed, grant its declared
local-network permission:

```bash
adb shell pm grant host.exp.exponent android.permission.ACCESS_LOCAL_NETWORK
```

With multiple devices connected, add `-s <device-id>` after `adb`. Reload the app
and retry. This changes only the installed Expo Go app's permission; it doesn't
require changing `EXPO_PUBLIC_API_URL`, disabling network protections, or rebuilding.

### Seed logins (password `Tazonix123!`)

| Email | Use it to try |
|---|---|
| `amara@tazonix.dev` | Talent (singer, Toronto): enter competitions, vote, wallet |
| `tomi@tazonix.dev` | Talent (dancer, Lagos) |
| `kofi@tazonix.dev` | Talent (saxophonist, Accra) |
| `agency@tazonix.dev` | Seeker + organizer on the Agency plan: discover, AI match, invite, book, post opportunities, create competitions |
| `pending@tazonix.dev` | Account still in admin review (pending-review screen) |

In development the API returns `devEmailToken` / `devResetToken`, and the verify-email and reset-password screens fill them in automatically, so no email provider is needed.

## Verify

```bash
npx tsc --noEmit                          # typecheck (run `npx expo start` once first to generate typed routes)
npx expo-doctor                           # dependency/config checks
npx expo export --platform android        # bundle check
npx expo export --platform web
```

## Structure

```
src/
├── app/                      # routes (Expo Router)
│   ├── _layout.tsx           # fonts, session hydrate, QueryClient, root stack
│   ├── index.tsx             # redirects by auth status / role
│   ├── (auth)/               # welcome, choose-role, sign-in, sign-up, verify-email,
│   │                         # forgot-password, reset-password, pending-review
│   ├── (talent)/             # tabs: home, discover, competitions, inbox, profile  (also the guest experience)
│   ├── (seeker)/             # tabs: dashboard, find-talent, shortlist, messages, account
│   ├── talent/[handle].tsx   # public profile, shortlist, invite/book (402 → plans)
│   ├── competition/          # [slug]/index (details, PIN, reminder, leaderboard), [slug]/enter, new
│   ├── entry/[id].tsx        # playback, vote, like, comments, edit/withdraw, report
│   ├── opportunity/          # [id]/index (apply), [id]/applications, new
│   ├── conversation/[id].tsx # chat (polls every 5s)
│   ├── invitation/new.tsx, booking/new.tsx
│   ├── wallet.tsx, points.tsx, plans.tsx, notifications.tsx, ai-match.tsx
│   ├── profile-edit.tsx (AI profile assist, portfolio), org-edit.tsx
│   └── my-entries, my-applications, my-opportunities, my-competitions, settings, report
├── api/                      # client.ts (envelope unwrap, Bearer, single-flight refresh), types.ts, hooks.ts
├── components/               # ui.tsx (GradientButton, Card, Input, Screen, Tag, Avatar, EmptyState…), cards.tsx, MediaView, Logo, TabsLayout
├── screens/Inbox.tsx         # shared by talent + seeker inbox tabs
├── lib/                      # session, upload, format, notify, useRequireAuth, secureStorage, queryClient
├── store/auth.ts             # zustand session store
└── theme.ts                  # brand tokens
```

## Behaviour notes

- **Guest browsing:** competitions, entries, opportunities and talent profiles load without auth. Protected actions call `useRequireAuth()`, which sends the user to sign-in with `returnTo` and brings them back afterwards.
- **Tokens:** stored in `expo-secure-store` (localStorage on web preview). A 401 triggers one shared refresh call; if the refresh fails, the user is signed out.
- **Entries:** uploads go to `POST /v1/media/upload` (multipart). A submission sends an `Idempotency-Key`; `409 ENTRY_ALREADY_EXISTS` opens the existing entry.
- **Votes:** `ALREADY_VOTED` and `WINDOW_CLOSED` errors show specific messages. Self-voting is hidden in the UI and enforced by the server.
- **Subscriptions:** `/subscriptions/checkout` opens `checkoutUrl` in an in-app browser if one is returned. Otherwise the mock provider has already activated the plan.
- **Money vs points:** wallet (cash ledger) and points (engagement) are separate screens.
