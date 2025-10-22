# Past Forward – Agent Ops Playbook

## Repository Snapshot (2025-10-21)
- Frontend: React 19 + Vite 6 (`npm run dev` on port 3000).
- Backend/API: Express (`index.js`) serving `dist` and proxying `/api/generate` to Google Gemini via `@google/genai`.
- Build output lives in `dist/`; Cloud Run invokes `npm start` → `node index.js`.
- TypeScript source under project root; aliases use `@/`.

## Environment & Secrets
- Gemini API key exposed as `API_KEY` (server) and **must not** be bundled client-side.
- Local development: copy `.env.example` to `.env`, set `API_KEY`, optionally override `VITE_API_PROXY_TARGET`.
- Backend rejects requests if `API_KEY` missing; expect immediate crash on startup.

## Cloud Run Deployment
- Project: `gen-lang-client-0056133339` (active `gcloud` project required).
- Region: `us-west1`; service name: `past-forward`.
- Deployment command:  
  `gcloud run deploy past-forward --source . --region us-west1 --project gen-lang-client-0056133339 --set-env-vars API_KEY=$GEMINI_KEY --allow-unauthenticated`
- Startup probes expect listener on `$PORT` (default 8080). `/healthz` returns 200 for readiness.
- Optional GCS volume mount from earlier revisions is no longer required; the app serves from `/workspace/dist`.

## Local Workflow Tips
- Start API: `npm run dev:server` (loads `.env` automatically via `node --env-file=.env`; defaults to 8080).
- Start Vite: `npm run dev`; proxy forwards `/api/*` to backend (configurable via `VITE_API_PROXY_TARGET`).
- Production smoke test: `npm run build && npm start`, visit http://localhost:8080.

## Platform Quirks & Fallbacks
- Individual photo download now generates a `Blob` and attempts `navigator.share`; iOS Safari falls back to opening the image in a new tab if automatic download is blocked.

## Task Tracking with Beads (bd)
- Initialized at `.beads/past-forward.db`; prefix `past-forward` (first issue is `past-forward-1`).
- Use `bd create`, `bd list`, `bd update`, etc. Prefer Beads over ad-hoc markdown TODOs.
- Current open work to monitor: `past-forward-1` – investigate iPhone single-photo download failures.

## Useful References
- Gemini PCI: https://makersuite.google.com/app/apikey (ensure correct project selected when rotating keys).
- Logs: https://console.cloud.google.com/run/detail/us-west1/past-forward/logs?project=gen-lang-client-0056133339

Keep this file updated when workflows, tooling, or environments change.
