# SyncNote

A lightweight, password-protected note-taking app with real-time cross-device sync, built on [EdgeOne Pages](https://pages.edgeone.ai/) (React Router v7 + EdgeOne KV).

[中文文档](./README_zh-CN.md)

---

## ✨ Features

- **Password protection** — Single shared password guards all notes; session persists for 30 days
- **Real-time sync** — Notes sync instantly across devices via WebSocket push + HTTP polling fallback
- **Auto-save** — Changes are saved automatically 800 ms after you stop typing
- **Image attachments** — Attach images by clicking, dragging, or **pasting** (supports screenshots)
  - Double-click any image to open a full-screen lightbox
  - Right-click for: view full size, download, remove
- **Weather settings** — Configure weather location behavior in the settings panel
  - Supports **Auto mode** (browser geolocation first, IP-based fallback)
  - Supports **Manual city** input with persistence
  - IP, location, and weather are displayed in one vertical column (weather below location)
- **Resizable sidebar** — Drag the sidebar edge to adjust its width
- **Dark / Light theme** — Persisted in `localStorage`
- **Bilingual UI** — Toggle between English and Chinese at any time
- **Mobile responsive** — Full-screen editor on small screens with a back button

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Router v7 (SSR) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Build | Vite |
| Storage | EdgeOne KV |
| Runtime | EdgeOne Pages Functions (Edge + Node.js) |
| Real-time | WebSocket (node-functions/sync.js) + polling |

## 📦 Quick Start

```bash
# Clone
git clone https://github.com/sxwzxc/syncnote.git
cd syncnote

# Install dependencies
npm install

# Start local dev server (EdgeOne CLI required)
edgeone pages dev
```

Set the following environment variables in your EdgeOne Pages project:

| Variable | Description |
|---|---|
| `PASSWORD` | Login password for the app |
| `notesKV` | Bound KV namespace for storing notes |

Deploy:

```bash
edgeone pages deploy
```

> Learn more: [EdgeOne CLI docs](https://pages.edgeone.ai/document/edgeone-cli)

## 📁 Project Structure

```
app/
├── routes/
│   └── home.tsx          # Main notes UI (auth + editor + sidebar)
├── components/
│   └── ui/button.tsx     # Reusable button component
├── lib/utils.ts           # cn() utility
├── root.tsx               # Root layout
└── routes.ts              # Route definitions
edge-functions/
├── api/
│   ├── auth.js            # POST /api/auth — password verification
│   ├── settings.js        # GET / PUT /api/settings — weather settings + IP info
│   ├── notes.js           # GET / POST /api/notes
│   └── notes/[id].js      # GET / PUT / DELETE /api/notes/:id
node-functions/
└── sync.js                # WebSocket server for real-time sync
public/                    # Static assets
```

## 🔧 Architecture Notes

- **KV storage** — Each note is stored as a JSON value under its UUID key. An index key (`__index`) holds the list of note IDs and metadata.
- **Settings persistence** — Weather mode and manual location are stored in EdgeOne KV via `/api/settings`.
- **Auto-save conflict resolution** — If a remote update arrives while the user has pending local changes, the local version wins (the next auto-save will overwrite the remote).
- **Note size limit** — 25 MB per note (including base64-encoded images). A size indicator is shown in the editor.

## 📄 License

MIT License

