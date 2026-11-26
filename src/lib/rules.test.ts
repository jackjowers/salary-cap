import { describe, expect, it } from "vitest";
import { PRESET_BOARDS, itemsAt } from "./boards";
import { boardProblem, cheapestPossibleTeam, isComplete, togglePick } from "./rules";
import { DEFAULT_SETTINGS, type Item, type Settings } from "./types";

const nba = PRESET_BOARDS[0];
const at = (col: string, price: number) => itemsAt(nba, col, price)[0];
const ones = () => nba.columns.map((c) => at(c.id, 1));

function build(settings: Settings, ...wanted: Item[]) {
  let picks: Item[] = [];
  for (const item of wanted) {
    const r = togglePick(settings, picks, item);
    if (!r.ok) return r;
    picks = r.picks;
  }
  return { ok: true as const, picks };
}

describe("preset boards", () => {
  it.each(PRESET_BOARDS.map((b) => [b.id, b] as const))("%s is a full 5 by 5 grid with unique ids", (_, b) => {
    expect(b.columns).toHaveLength(5);
    expect(b.items).toHaveLength(25);
    expect(new Set(b.items.map((i) => i.id)).size).toBe(25);
    for (const c of b.columns) for (const p of [1, 2, 3, 4, 5]) expect(itemsAt(b, c.id, p)).toHaveLength(1);
  });
});

describe("free select", () => {
  const s = DEFAULT_SETTINGS;

  it("adds and removes a pick", () => {
    const added = build(s, at("pg", 5));
    expect(added.ok && added.picks).toHaveLength(1);
    const removed = added.ok && togglePick(s, added.picks, at("pg", 5));
    expect(removed && removed.ok && removed.picks).toHaveLength(0);
  });

  it("blocks a pick that goes over budget and says by how much", () => {
    expect(build(s, at("pg", 5), at("sg", 5), at("sf", 5), at("pf", 4))).toEqual({
      ok: false,
      reason: "Over budget by $4",
    });
  });

  it("blocks a sixth pick", () => {
    expect(build(s, ...ones(), at("pg", 2))).toEqual({ ok: false, reason: "Team is full. Remove a pick first." });
  });

  it("allows two picks from the same position", () => {
    expect(build(s, at("c", 3), at("c", 2)).ok).toBe(true);
  });

  it("is incomplete with 4 picks and complete with 5", () => {
    const four = build(s, ...ones().slice(0, 4));
    expect(four.ok && isComplete(s, four.picks)).toBe(false);
    const five = build(s, ...ones());
    expect(five.ok && isComplete(s, five.picks)).toBe(true);
  });
});

describe("one per column", () => {
  const s: Settings = { ...DEFAULT_SETTINGS, rule: "onePerColumn" };

  it("swaps when picking a second player at the same position", () => {
    const r = build(s, at("pg", 5), at("pg", 3));
    expect(r.ok && r.picks.map((p) => p.id)).toEqual([at("pg", 3).id]);
  });

  it("blocks a swap that would go over budget", () => {
    const r = build(s, at("pg", 1), at("sg", 5), at("sf", 5), at("pf", 2), at("c", 2), at("pg", 3));
    expect(r).toEqual({ ok: false, reason: "Over budget by $2" });
  });

  it("is complete with one per position", () => {
    const r = build(s, at("pg", 3), at("sg", 3), at("sf", 3), at("pf", 3), at("c", 3));
    expect(r.ok && isComplete(s, r.picks)).toBe(true);
    expect(cheapestPossibleTeam(nba, s)).toBe(5);
  });
});

describe("board checks", () => {
  it("flags a budget too low for a team of 5", () => {
    expect(boardProblem(nba, { ...DEFAULT_SETTINGS, budget: 4 })).toMatch(/cheapest possible team costs \$5/);
  });

  it("accepts the defaults", () => {
    expect(boardProblem(nba, DEFAULT_SETTINGS)).toBeNull();
  });
});
