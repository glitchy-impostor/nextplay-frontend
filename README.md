# 🎮 Next Play — Sport-Agnostic Play Prediction Game

A full-stack interactive game that teaches the rules of sports through play prediction. Users watch a game scenario unfold, predict what happens next, and learn the relevant rule after each prediction.

Built as a software engineering assessment for [Next Play Games](https://www.nextplaygamesus.com/).

## How It Works

1. **Pick a sport** — Football, Baseball, or Soccer
2. **Read the game situation** — real scenarios with scoreboard context
3. **Predict what happens next** — choose from 4 options
4. **Learn the rule** — after locking in, the app explains why the correct answer is correct
5. **Track your score** — partial credit for plausible answers, full points for correct ones

## Architecture

The key design principle: **sports are data, not code.**

The entire game — UI, scoring, game flow — is sport-agnostic. Every sport is a JSON configuration file served by the backend API. The frontend renders whatever the API sends without knowing what sport it's displaying.

**Adding a new sport (e.g., hockey) requires zero frontend or backend code changes** — just a new JSON file on the server.

```
Frontend (React)                    Backend (Express.js)
┌──────────────┐    REST API     ┌──────────────────┐
│  Sport Select │◄──────────────►│  GET /api/sports  │
│  Game Play    │◄──────────────►│  POST /sessions   │
│  Score Summary│◄──────────────►│  POST /predict    │
└──────────────┘                 └────────┬─────────┘
                                          │
                                 ┌────────┴─────────┐
                                 │  /data directory   │
                                 │  football.json     │
                                 │  baseball.json     │
                                 │  soccer.json       │
                                 │  + drop new sport  │
                                 └───────────────────┘
```

## Tech Stack

| Layer | Tech | Rationale |
|-------|------|-----------|
| Frontend | React, Vite | Component-driven, fast dev server, matches Next Play's stack |
| Backend | Express.js, Node | Lightweight REST API, session management |
| Data | JSON config files | Zero-overhead for prototype; swappable for PostgreSQL/RDS |
| Deployment | GitHub Pages (frontend), Railway (API) | Free tier, instant deploys |

## Running Locally

**Prerequisites:** Node.js 18+

**Backend:**
```bash
git clone https://github.com/yourusername/nextplay-api.git
cd nextplay-api
npm install
npm start
# API running at http://localhost:3001
```

**Frontend:**
```bash
git clone https://github.com/yourusername/nextplay-frontend.git
cd nextplay-frontend
npm install
npm run dev
# App running at http://localhost:5173
```

The frontend automatically connects to `localhost:3001` in development.

## Project Structure

```
src/
├── App.jsx         # Main game component (menu, gameplay, summary)
├── main.jsx        # React entry point
└── index.css       # Global reset
```

The frontend is intentionally a single component file to demonstrate that the UI complexity lives in the architecture, not in component sprawl. The game state machine handles four phases: `menu → playing → feedback → summary`.

## Key Design Decisions

**Answer hiding** — The API strips point values from options when serving scenarios. Correct answers and points are only revealed after a prediction is submitted server-side. This prevents users from inspecting network requests to cheat.

**Session-based state** — Game progress lives on the server, not in client state. This prevents score manipulation and enables future features like leaderboards and multiplayer.

**Partial credit scoring** — Each option has a point value based on how reasonable it is, not just binary right/wrong. This keeps engagement high even on incorrect predictions.

**Dynamic theming** — Each sport config includes a color palette. The frontend applies it automatically, creating visual differentiation (green/gold for football, navy/red for baseball, dark/teal for soccer) without any sport-specific UI code.

## Production Upgrade Path

| Current (Prototype) | Production |
|---------------------|------------|
| JSON config files | PostgreSQL / AWS RDS |
| In-memory sessions | Redis |
| REST API | WebSocket for live game sync |
| React (web) | React Native (mobile) |

The interfaces (SportRegistry, SessionManager) stay the same — only the backing implementations change.

## Live Demo

- **Frontend:** [https://yourusername.github.io/nextplay-frontend/](https://yourusername.github.io/nextplay-frontend/)
- **API:** [https://nextplay-api-production.up.railway.app/api/health](https://nextplay-api-production.up.railway.app/api/health)

---

Built by Krish Shah · [LinkedIn](https://linkedin.com/in/yourprofile) · [Portfolio](https://yourportfolio.com)
