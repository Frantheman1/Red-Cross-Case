# Red Cross Live

A responsive, accessible, and real-time social feed web app built with **React**, **TypeScript**, **Tailwind CSS**, and **Express**. It streams and displays live posts from a Mastodon instance, making it ideal for crisis monitoring or live event coverage.

---

## 📚 Table of Contents

- [Features](#features)
- [Quick Start (Docker)](#quick-start-docker)
- [Installation (Manual)](#installation-manual)
- [Usage](#usage)
- [Environment Configuration](#environment-configuration)
- [Scripts Reference](#scripts-reference)
- [Architecture](#architecture)
- [Testing and Quality](#testing-and-quality)
- [Troubleshooting](#troubleshooting)
- [Accessibility & Performance](#accessibility--performance)
- [Contributors](#contributors)

---

## 🚀 Features

- 🔴 **Live Feed:** Real-time streaming posts using WebSockets.
- 🔎 **Search & Filters:** Language and search filters reflected via URL.
- 📊 **Trends & Stats:** Sidebar displays trends and simple statistics.
- 🌙 **Dark Mode:** Fully themed dark-mode support.
- 🧹 **Content Cleaning:** Server-side HTML stripping and profanity filtering.
- ⚠️ **Banned Words Filtering:** Optional filtering via environment configuration.
- 📱 **Responsive Design:** Mobile-friendly layout with semantic HTML.

---

## 🐳 Quick Start (Docker)

```bash
docker compose up --build
```

- UI: [http://localhost:5173](http://localhost:5173)
- API & WebSocket: [http://localhost:8080](http://localhost:8080)

If you don’t use Docker, see the manual installation below.

---

## 🛠 Installation (Manual)

### Prerequisites

- Node.js ≥ 18
- `pnpm` (or use `npx pnpm` if not installed globally)

### Development Setup

Open two terminals in the project root:

#### Terminal A: Backend Server

```bash
pnpm install
pnpm run dev:server
```

#### Terminal B: Frontend UI

```bash
pnpm run dev:ui
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ▶️ Usage

- Start broad to ensure activity:
  - Language: Any
- Refine as needed:
  - Type in the search box to filter by keywords/hashtags.
  - Choose a language from the dropdown.
- Live posts appear immediately at the top of the feed. If the upstream is quiet, a “Connected…” and occasional demo posts confirm live flow.
- The URL encodes your filters; copy/paste the URL to share the current view.

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the project root:

```env
MASTODON_INSTANCE=mastodon.social
MASTODON_ACCESS_TOKEN=your_access_token_here
BANNED_WORDS=word1,word2,word3
```

### Notes

- 🔐 To generate an access token:
  - Mastodon → Preferences → Development → New application → Scope = `read` (or `read:statuses`).
- Some instances require a token for streaming. Without one, the server logs HTTP 401 and streaming won’t start (REST can still work).
- `BANNED_WORDS` is optional (comma-separated, case-insensitive) and is applied after profanity cleaning.

---

## 📜 Scripts Reference

| Command              | Description                          |
|----------------------|--------------------------------------|
| `pnpm dev`           | Starts both UI and API in dev mode   |
| `pnpm dev:ui`        | Starts Vite dev server (UI on 5173)  |
| `pnpm dev:server`    | Starts Express API/WebSocket (8080)  |
| `pnpm build`         | Builds the frontend app              |
| `pnpm preview`       | Serves the built app locally         |
| `pnpm test`          | Runs unit tests (Vitest)             |
| `pnpm lint`          | Runs ESLint                          |
| `pnpm typecheck`     | Runs TypeScript validation           |

---

## 🧩 Architecture

```
Browser (React)
  ├── REST: /api/posts (initial feed)
  └── WebSocket: /ws/stream (live updates)

Express Server
  ├── Connects to Mastodon REST & WS APIs
  ├── Cleans & filters content (profanity, banned words)
  └── Broadcasts sanitized posts to UI
```

---

## ✅ Testing and Quality

- Unit Testing: `Vitest`
- Linting: `ESLint`
- Type Checking: `TypeScript strict mode`
- Prettier: For consistent code formatting

---

## 🧪 Troubleshooting

### No Live Posts?

- Ensure server is running and listening on port `8080`.
- Confirm valid `MASTODON_ACCESS_TOKEN` in `.env.local` (if your instance requires it).
- Use a more active Mastodon instance like `mstdn.social`.

### WebSocket Fails (502/499)?

- Make sure Terminal A (API server) is active.
- Check that `/api` and `/ws` are proxied correctly in `vite.config.ts`.
- Disable any interfering firewall or network restrictions.

### Windows/Vite Cache Errors?

```bash
rm -rf node_modules/.vite node_modules/.vite-cache
```

Then restart the development server.

---

## ♿ Accessibility & Performance

- Keyboard accessible with focus-visible outlines
- Semantic landmarks and aria-live for dynamic UI elements
- Color contrast ≥ 4.5:1 for text and key UI
- Lighthouse performance/accessibility ≥ 90 on local build

---

## 👥 Contributors

- Fran Cvitanovic