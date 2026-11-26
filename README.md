# salary-cap
Build a team under a salary cap. Pick NBA players, NFL players, or fast food chains. You can also type in any topic to get a generated board. AI can grade your picks and a friend's.

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

## Checks

```bash
npm test       # unit tests
npm run lint   # type check
npm run build  # production build
```
