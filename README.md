# ARTP Power Ranking

A public power-ranking tracker for the Association of Roblox Tennis Professionals.
Search a player, see their decayed PR, trajectory, event log, and the live top-32 ladder
for singles and doubles. All data is baked into the app — no server or database needed.

## Run it locally

You need Node.js (LTS) installed: https://nodejs.org

```bash
npm install      # one time, installs dependencies
npm run dev      # starts a local server at http://localhost:5173
```

Open the URL it prints. Edits to `src/App.jsx` hot-reload instantly.

## Put it on the internet (pick one)

### Option A — Vercel (recommended, auto-redeploys on every change)
1. Push this folder to a new GitHub repo.
2. Go to https://vercel.com, "Add New → Project", import the repo.
3. Vercel auto-detects Vite. Click Deploy. You get a public URL like `artp-pr.vercel.app`.
4. From then on, every `git push` redeploys automatically.

### Option B — Netlify drop (fastest, no GitHub)
1. `npm run build` — this creates a `dist/` folder.
2. Go to https://app.netlify.com/drop and drag the `dist` folder onto the page.
3. You get an instant public URL. To update, rebuild and drag again.

### Option C — GitHub Pages
1. Add `base: "/<repo-name>/"` to `vite.config.js` (inside `defineConfig({...})`).
2. `npm run build`, then publish the `dist/` folder to a `gh-pages` branch
   (e.g. with the `gh-pages` npm package).

## Updating the rankings after a tournament

Two ways:

- **In-app (preview only):** open the data panel in the header, paste new result rows,
  hit "Rebuild PR". This only changes what *you* see in that browser session.
- **For the live public site:** edit `DEFAULT_DATA` near the top of `src/App.jsx`
  (same `mode|date|tournament|tier|player|round|partner` format), then push / rebuild.
  That's what every visitor sees.

Round = how far the player got: `W F SF QF R16 R32 R64`. Tiers:
`Grand Slam | Masters | 500 | 250 | Challenger`. Finals rows carry an explicit points
value in an 8th column. Player name variants are merged via the `ALIASES` map at the top
of `src/App.jsx`.

## How PR works

Each result is worth its ARTP point value, then **decayed**: full credit for 90 days,
then a 180-day half-life. So PR reflects current form, not a career total, and differs
from the official ranking-points ladder (which uses a 26-week cliff for singles and a
season reset for doubles).
