# salary-cap
Build a team under a salary cap. Pick NBA players, NFL players, or fast food chains. You can also type in any topic to get a generated board. AI can grade your picks and a friend's.

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## How it's built

- Next.js (App Router) with TypeScript. The game runs in the browser; the server only serves pages and, later, the AI endpoint.
- Every board is a grid: categories across the top, price tiers down the side, one item per cell.
- Board data lives in `src/lib/boards.ts`. Game rules (budget, pick rules, team of 5) live in `src/lib/rules.ts` and are covered by unit tests.

## Checks

```bash
npm test       # unit tests for the game rules
npm run lint   # type check
npm run build  # production build
```
