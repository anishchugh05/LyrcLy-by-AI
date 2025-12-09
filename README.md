# AI Songwriting Assistant (LyricSmith)

This repo has two parts:
- Next.js (App Router) API at `src/app/api/*` for lyric generation, revision, and music suggestions.
- Vite + React UI in `src/frontend` that consumes the API and renders the experience.

## Quickstart

1) Install dependencies for the API (root):
```bash
npm install
```

2) Install dependencies for the UI:
```bash
cd src/frontend
npm install
```

3) Configure environment (examples in `.env.example` and `src/frontend/.env.example` if you create one):
- Root `.env.local`:
  - `LLM_PROVIDER=openai` or `anthropic`
  - `OPENAI_API_KEY=` / `ANTHROPIC_API_KEY=` (optional in development; mock responses are used when missing)
  - `DATABASE_URL=./data/lyricsmith.db`
  - `CORS_ORIGIN=http://localhost:3000,http://localhost:5173`
- Frontend `.env`:
  - `VITE_API_URL=http://localhost:3000/api`

4) Run the API:
```bash
npm run dev
```
This serves API routes on `http://localhost:3000/api`.

5) Run the UI in another terminal:
```bash
cd src/frontend
npm run dev -- --host --port 5173
```
The UI will call the API via `VITE_API_URL`.

## Notes
- In development without API keys, the backend returns mock lyrics/music data so the UI can function end-to-end.
- SQLite data is stored at `data/lyricsmith.db` (directory created automatically).
- CORS allows localhost:3000 and 5173 by default; adjust `CORS_ORIGIN` for other hosts.
