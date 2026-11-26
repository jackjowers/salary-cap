import { TEAM_SIZE, type Board, type Item, type Settings } from "./types";

export function spent(picks: Item[]): number {
  return picks.reduce((sum, p) => sum + p.price, 0);
}

export function cheapestPossibleTeam(board: Board, settings: Settings): number {
  if (settings.rule === "onePerColumn") {
    return board.columns.reduce((sum, col) => {
      const prices = board.items.filter((i) => i.column === col.id).map((i) => i.price);
      return prices.length ? sum + Math.min(...prices) : Infinity;
    }, 0);
  }
  const prices = board.items.map((i) => i.price).sort((a, b) => a - b);
  if (prices.length < TEAM_SIZE) return Infinity;
  return prices.slice(0, TEAM_SIZE).reduce((a, b) => a + b, 0);
}

export function boardProblem(board: Board, settings: Settings): string | null {
  if (settings.rule === "onePerColumn" && board.columns.length !== TEAM_SIZE) {
    return `One-per-category needs exactly ${TEAM_SIZE} categories, and this board has ${board.columns.length}.`;
  }
  const min = cheapestPossibleTeam(board, settings);
  if (min === Infinity) return `This board doesn't have enough picks for a team of ${TEAM_SIZE}.`;
  if (min > settings.budget) {
    return `The cheapest possible team costs $${min}, which is over your $${settings.budget} budget. Raise the budget.`;
  }
  return null;
}

export type ToggleResult = { ok: true; picks: Item[] } | { ok: false; reason: string };

export function togglePick(settings: Settings, picks: Item[], item: Item): ToggleResult {
  if (picks.some((p) => p.id === item.id)) {
    return { ok: true, picks: picks.filter((p) => p.id !== item.id) };
  }

  const left = settings.budget - spent(picks);

  if (settings.rule === "onePerColumn") {
    const existing = picks.find((p) => p.column === item.column);
    if (existing) {
      const delta = item.price - existing.price;
      if (delta > left) return { ok: false, reason: `Over budget by $${delta - left}` };
      return { ok: true, picks: picks.map((p) => (p.column === item.column ? item : p)) };
    }
  }

  if (picks.length >= TEAM_SIZE) return { ok: false, reason: "Team is full. Remove a pick first." };
  if (item.price > left) return { ok: false, reason: `Over budget by $${item.price - left}` };
  return { ok: true, picks: [...picks, item] };
}

export function isComplete(settings: Settings, picks: Item[]): boolean {
  return picks.length === TEAM_SIZE && spent(picks) <= settings.budget;
}
