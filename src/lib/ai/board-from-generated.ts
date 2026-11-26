import { slug } from "@/lib/boards";
import { TEAM_SIZE, type Board, type Item } from "@/lib/types";
import type { GeneratedBoard } from "./schemas";

const PRICES = [5, 4, 3, 2, 1];

export class BoardShapeError extends Error {}

export function boardFromGenerated(gen: GeneratedBoard, topic: string): Board {
  if (gen.columns.length !== TEAM_SIZE) {
    throw new BoardShapeError(`Expected ${TEAM_SIZE} categories, got ${gen.columns.length}.`);
  }
  const boardId = `gen-${slug(topic).slice(0, 40) || "board"}`;
  const seenNames = new Set<string>();
  const seenCols = new Set<string>();
  const columns = gen.columns.map((c, i) => {
    let id = slug(c.label) || `col-${i + 1}`;
    if (seenCols.has(id)) id = `${id}-${i + 1}`;
    seenCols.add(id);
    return { id, label: c.label.trim() };
  });

  const items: Item[] = gen.columns.flatMap((col, i) => {
    const prices = col.items.map((it) => it.price).sort((a, b) => b - a);
    if (col.items.length !== PRICES.length || prices.some((p, j) => p !== PRICES[j])) {
      throw new BoardShapeError(`"${col.label}" must have one item at each price from $5 to $1.`);
    }
    return col.items.map((it) => {
      const nm = it.name.trim();
      const key = nm.toLowerCase();
      if (!nm || seenNames.has(key)) throw new BoardShapeError(`Duplicate or empty item "${nm}".`);
      seenNames.add(key);
      return { id: `${boardId}-${slug(nm) || seenNames.size}`, name: nm, price: it.price, column: columns[i].id };
    });
  });

  return {
    id: boardId,
    title: gen.title.trim() || topic,
    noun: gen.noun.trim().toLowerCase() || "team",
    source: "generated",
    columns,
    items,
  };
}
