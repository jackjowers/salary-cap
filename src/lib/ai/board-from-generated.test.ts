import { describe, expect, it } from "vitest";
import { boardFromGenerated, BoardShapeError } from "./board-from-generated";
import type { GeneratedBoard } from "./schemas";

function gen(over: Partial<GeneratedBoard> = {}): GeneratedBoard {
  const cats = ["Mammals", "Predator fish", "Small fish", "Crustaceans", "Sea birds"];
  return {
    rejected: null,
    title: "Ocean animals",
    noun: "Pod",
    columns: cats.map((label) => ({
      label,
      items: [5, 4, 3, 2, 1].map((price) => ({ name: `${label} ${price}`, price })),
    })),
    ...over,
  };
}

describe("boardFromGenerated", () => {
  it("builds a 5x5 generated board", () => {
    const b = boardFromGenerated(gen(), "Ocean animals");
    expect(b.id).toBe("gen-ocean-animals");
    expect(b.source).toBe("generated");
    expect(b.noun).toBe("pod");
    expect(b.columns.map((c) => c.id)).toEqual(["mammals", "predator-fish", "small-fish", "crustaceans", "sea-birds"]);
    expect(b.items).toHaveLength(25);
    expect(new Set(b.items.map((i) => i.id)).size).toBe(25);
    expect(b.items.every((i) => i.image === undefined)).toBe(true);
  });

  it("rejects the wrong number of categories", () => {
    const g = gen();
    g.columns.pop();
    expect(() => boardFromGenerated(g, "x")).toThrow(BoardShapeError);
  });

  it("rejects a column with a repeated price", () => {
    const g = gen();
    g.columns[0].items[1].price = 5;
    expect(() => boardFromGenerated(g, "x")).toThrow(/one item at each price/);
  });

  it("rejects duplicate names across columns, ignoring case", () => {
    const g = gen();
    g.columns[1].items[0].name = "mammals 5";
    expect(() => boardFromGenerated(g, "x")).toThrow(/Duplicate/);
  });

  it("keeps column ids unique when labels collide", () => {
    const g = gen();
    g.columns[1].label = "Mammals";
    const b = boardFromGenerated(g, "x");
    expect(new Set(b.columns.map((c) => c.id)).size).toBe(5);
  });

  it("falls back to the topic and 'team' when title and noun are blank", () => {
    const b = boardFromGenerated(gen({ title: " ", noun: "" }), "Ocean animals");
    expect(b.title).toBe("Ocean animals");
    expect(b.noun).toBe("team");
  });
});
