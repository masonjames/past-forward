<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1vRTvK2wjxONatcS9kmFaMxWszfsRU8z4

## Run Locally

**Prerequisites:** Node.js 20+ (or Bun 1.1+), access to a Gemini API key.

1. Install dependencies: `npm install` (or `bun install`).
2. Copy `.env.example` to `.env` and set `API_KEY` to your Gemini API key.
3. Start the API server (new terminal): `npm run dev:server`.
4. Start the Vite dev server: `npm run dev` and open http://localhost:3000.

The Vite server proxies `/api/*` requests to the Express server on port 8080. If you change ports, update `VITE_API_PROXY_TARGET` in your `.env`.

## Production Build & Local Preview

1. Generate the static assets: `npm run build`.
2. Serve them with the same Express app used in Cloud Run: `npm start`.
3. Visit http://localhost:8080 to verify the production bundle.

## Cloud Run Deployment Notes

This app now ships an Express server that serves the built assets and proxies Gemini requests on the server side.

- Ensure the Cloud Run revision sets `API_KEY` to a valid Gemini API key (rotate the key if the one logged previously is compromised).
- When deploying with Cloud Build/source deployments, the default launch command uses `npm start`, which now runs `node index.js`.
- If you override the container command manually, set it explicitly to `node index.js` and keep the working directory at `/workspace`.
- The server serves static files from the `dist` directory generated at build time. The extra GCS volume mount is no longer required. If you retain it, point it to `/workspace/dist` or remove the mount from the service configuration.
- Example deploy command:

   ```bash
   gcloud run deploy past-forward \
     --source . \
     --region us-west1 \
     --project gen-lang-client-0056133339 \
     --set-env-vars API_KEY=YOUR_KEY \
     --allow-unauthenticated
   ```

## Retrieve the Gemini API Key

1. Go to https://makersuite.google.com/app/apikey and sign in with the project owner account (`masonjames@gmail.com`).
2. Select the Google Cloud project `gen-lang-client-0056133339`.
3. Create or copy the API key and update:
   - Cloud Run service (`gcloud run services update past-forward --set-env-vars API_KEY=...`).
   - Your local `.env` file for development.

Treat the key as a secret—rotate it if it was previously exposed.
