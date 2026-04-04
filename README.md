# EXPO-PROTOCOL

A research command log system for tracking scientific projects, recording observations, and managing your research journey.

## Features

- **Welcome & Login** — Secure access with customizable credentials
- **Dashboard** — Physics-based sphere network graph showing all projects
- **Project Detail** — Collapsible description, T+ day tracking, log entries
- **Log Entries** — Write text, upload images, audio, and video per log
- **Cloud Sync** — Real-time sync across all devices via Firebase
- **Settings** — Change credentials, export/import data backups

## Quick Start

### Option 1: GitHub Pages (Recommended)
Just push to GitHub and enable Pages — it works instantly.

### Option 2: Local
```bash
# Python
python -m http.server 8000

# Node
npx serve .
```
Open `http://localhost:8000`

## Default Login
- **ID:** `admin`
- **Password:** `1234`

Change credentials anytime in Settings (⚙).

## Cloud Sync Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → Create project
2. Build → Realtime Database → Create Database → **Test mode** → Enable
3. Copy the Database URL
4. Project Settings (⚙) → Copy **Web API Key**
5. In Expo-Protocol Settings → Paste both → Enable Cloud Sync

Data auto-syncs across all devices after setup.

## Project Structure

```
expo-protocol/
├── index.html          ← HTML structure
├── css/
│   ├── base.css        ← Variables, reset, shared components
│   ├── auth.css        ← Login screen styles
│   ├── dashboard.css   ← Dashboard, header, graph styles
│   └── project.css     ← Project detail, log card styles
├── js/
│   ├── app.js          ← Utilities, data layer
│   ├── auth.js         ← Login, welcome animation
│   ├── dashboard.js    ← Graph physics, project creation
│   ├── project.js      ← Project detail, log entries
│   ├── settings.js     ← Settings, backup
│   └── sync.js         ← Firebase cloud sync
└── assets/
    └── globe.jpg       ← Login background
```

## License

MIT
