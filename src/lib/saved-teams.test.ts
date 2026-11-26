import { describe, expect, it } from "vitest";
import { addEntry, MAX_SAVED, parseSaved, removeEntry, sameTeam, type SavedEntry } from "./saved-teams";

const item = (id: string) => ({ id, name: id, price: 1, column: "c" });

function team(id: string): SavedEntry {
  return {
    kind: "team",
    id,
    savedAt: 0,
    boardId: "nba",
    boardTitle: "NBA",
    noun: "starting five",
    budget: 15,
    rule: "free",
    picks: [item("a")],
  };
}

describe("saved teams", () => {
  it("adds newest first and caps the list", () => {
    let list: SavedEntry[] = [];
    for (let i = 0; i < MAX_SAVED + 5; i++) list = addEntry(list, team(String(i)));
    expect(list).toHaveLength(MAX_SAVED);
    expect(list[0].id).toBe(String(MAX_SAVED + 4));
  });

  it("removes by id", () => {
    expect(removeEntry([team("a"), team("b")], "a").map((e) => e.id)).toEqual(["b"]);
  });

  it("ignores corrupt or foreign storage", () => {
    expect(parseSaved(null)).toEqual([]);
    expect(parseSaved("not json")).toEqual([]);
    expect(parseSaved('{"a":1}')).toEqual([]);
    expect(parseSaved(JSON.stringify([team("ok"), { id: 1 }, { kind: "team", id: "x" }]))).toHaveLength(1);
  });

  it("compares teams regardless of order", () => {
    expect(sameTeam([item("a"), item("b")], [item("b"), item("a")])).toBe(true);
    expect(sameTeam([item("a")], [item("b")])).toBe(false);
  });
});
