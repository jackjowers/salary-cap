# salary-cap
Build a team under a salary cap. Pick NBA players, NFL players, or fast food chains. You can also type in any topic to get a generated board. AI can grade your picks and a friend's.

## How to play

- Pick a board: NBA, NFL, Fast food, or **+ Make your own** to have Claude build one from any topic.
- Fill 5 slots without going over your budget. Prices run from $5 at the top of the grid to $1 at the bottom.
- The gear opens settings: number of players, budget ($5 to $50), pick rule (free select, or one from each column), and auto-grading.
- **1 player:** tap **Grade my team** for Claude's verdict.
- **2 players:** Player 1 locks in, passes the device, and Player 2 builds a team without seeing Player 1's picks. Claude then picks a winner.
- **Save** keeps a team, or a 2-player matchup, in **My teams**. Saves live in this browser only.

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

### Turn on the Claude features

"Make your own" boards and team grading call Claude. They need an Anthropic API key:

```bash
cp .env.local.example .env.local
# then paste your key after ANTHROPIC_API_KEY=
```

Restart `npm run dev` after editing `.env.local`. Without a key the preset boards still work, and the AI buttons show a message saying AI is off.

## How it's built

- Next.js (App Router) with TypeScript. The game runs in the browser. The server serves pages and three AI endpoints (`/api/generate`, `/api/grade`, and `/api/judge`). The API key stays on the server and never reaches the browser.
- Every board is a grid: categories across the top, price tiers down the side, one item per cell.
- Board data lives in `src/lib/boards.ts`. Game rules (budget, pick rules, team of 5) live in `src/lib/rules.ts` and are covered by unit tests.
- AI code lives in `src/lib/ai/`. Every Claude response is checked against a schema, and generated boards are checked for shape (5 categories, one item at each price, no duplicates) before they reach the player.
- AI endpoints are rate limited per visitor, and generated boards are cached by topic for a day. Both are in memory for now (`src/lib/server/limits.ts`), behind small interfaces so they can move to Redis when the game is hosted.

## Play on your phone

To play on a phone on the same Wi-Fi network, run `npm run dev -- -H 0.0.0.0`. Then open `http://<your computer's local IP>:3000` on the phone.

## Preset images

Photos and logos come from Wikimedia Commons. Credits are listed in the game under "Photo credits". To change an image, edit its entry in `scripts/image-sources.json` and run:

```bash
NODE_USE_ENV_PROXY=1 node scripts/fetch-images.mjs --only=<board>-<item-slug>
```

`NODE_USE_ENV_PROXY=1` is only needed behind a proxy.

## Checks

```bash
npm test       # unit tests
npm run lint   # type check
npm run build  # production build
```
