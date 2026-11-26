# Container Tracker (iPhone PWA)

A simple, read-only iPhone web app that shows container tracking from your
[Tracktainer](https://tracktainer.com) account in plain language: where the
container is, which ship it is on, when it is expected, and every step of the
journey on a map.

- **Home**: animated container ship, search by container or booking number,
  "Current shipment" card with a 4-step progress bar, recent shipments.
- **Shipments**: all tracked shipments with simple filters.
- **Tracking**: map with the sea route and the ship's last known position,
  plus a dark detail sheet with status, dates, ship, voyage, ETA changes and
  the full journey timeline.
- **Help**: what each status means and how to install the app.
- Installable from Safari with **Share → Add to Home Screen**. Works offline
  with the last data it loaded. Desktop visitors see a "Made for iPhone" note.

## How the API key stays secret

```
iPhone app  ──►  /api/tracktainer  (your serverless function)  ──►  api.tracktainer.com
                 holds TRACKTAINER_API_KEY
```

The key only lives in your host's encrypted environment variables. The browser
never sees it and nobody using the app is asked for a key. The function only
allows three **read** requests (list, search by number, shipment detail) and
never creates, edits or deletes anything, so it can't spend Tracktainer
credits.

> **Privacy note:** anyone who has your app's web address can view the
> shipments in your Tracktainer account. If that matters, turn on
> *Vercel Deployment Protection* or *Cloudflare Access* (both let you require
> a login), or keep the link private.

## 1. Get a Tracktainer API key

1. Sign in at tracktainer.com.
2. Open **Dashboard → Integrations → API Keys** and click **Create API Key**.
3. Copy the key. You'll paste it into your host in the next step, nowhere else.

Containers you want to see must already be tracked in your Tracktainer account
(add them in the Tracktainer dashboard). This app only displays them.

## 2a. Deploy on Vercel (recommended)

1. Put this folder in a GitHub repository (or use `npx vercel` from the folder).
2. On vercel.com: **Add New → Project**, import the repo.
   Framework preset: **Other**. Leave build command empty. Output directory is
   already set to `public` by `vercel.json`.
3. **Settings → Environment Variables**: add
   `TRACKTAINER_API_KEY` = your key, for **Production** (and Preview if you like).
   Mark it **Sensitive**.
4. Redeploy. Open the `https://…vercel.app` address on your iPhone in Safari.

## 2b. Or deploy on Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Build command: *(none)*. Build output directory: `public`.
   Pages picks up the `functions/` folder automatically.
3. **Settings → Variables and Secrets**: add `TRACKTAINER_API_KEY` as type
   **Secret** (encrypted).
4. Redeploy and open the `https://…pages.dev` address on your iPhone.

With the Wrangler CLI you can also run:
`npx wrangler pages secret put TRACKTAINER_API_KEY --project-name <name>`

## 3. Install on iPhone

Open the site in **Safari → Share → Add to Home Screen → Add**. It then opens
full screen like a normal app.

## Try it without a key (demo mode)

Set `DEMO_MODE=true` as an environment variable on your host (or locally) and
the app shows five sample shipments covering every status. Remove it (or set
it to `false`) once your real key is in place.

Locally (Node 18+):

```bash
npm run demo          # sample data on http://localhost:5173
cp .env.example .env  # then paste your key into .env
npm run dev           # real data through the same proxy
```

`.env` is git-ignored. Never commit your key.

## Rotating the key

Create a new key in Tracktainer, replace `TRACKTAINER_API_KEY` on your host,
redeploy, check the app loads, then revoke the old key.

## Files

| Path | What it is |
|---|---|
| `public/` | The app: `index.html`, `styles.css`, `app.js`, service worker `sw.js`, `manifest.webmanifest`, icons, bundled Leaflet map library |
| `lib/proxy.js` | The secure read-only proxy (shared by both hosts) |
| `lib/demo-data.js` | Sample shipments for demo mode |
| `api/tracktainer.js` | Vercel function wrapper |
| `functions/api/tracktainer.js` | Cloudflare Pages function wrapper |
| `scripts/dev-server.js` | Local preview server |
| `scripts/make-icons.cjs` | Regenerates the PNG icons from `scripts/icon.svg` |

## Notes

- Data comes from Tracktainer's v1 API (`/ocean/shipments`, `/route`,
  `/eta-changes`). Responses are cached at the edge for 5 minutes to stay well
  under Tracktainer's 100 requests/minute limit.
- Map tiles: © OpenStreetMap contributors © CARTO. Map library: Leaflet (BSD-2).
