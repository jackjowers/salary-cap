import type { Grade, Judgement } from "@/lib/ai/schemas";
import type { Board, Item, PickRule } from "@/lib/types";

export const STORAGE_KEY = "salary-cap.saved.v1";
export const MAX_SAVED = 50;

type Base = {
  id: string;
  savedAt: number;
  boardId: string;
  boardTitle: string;
  noun: string;
  budget: number;
  rule: PickRule;
  /** Generated boards can't be rebuilt from their id, so the whole board is kept to reopen it. */
  generatedBoard?: Board;
};

export type SavedTeam = Base & { kind: "team"; picks: Item[]; grade?: Grade };
export type SavedMatchup = Base & { kind: "matchup"; team1: Item[]; team2: Item[]; judgement?: Judgement };
export type SavedEntry = SavedTeam | SavedMatchup;

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function baseFor(board: Board, budget: number, rule: PickRule): Base {
  return {
    id: newId(),
    savedAt: Date.now(),
    boardId: board.id,
    boardTitle: board.title,
    noun: board.noun,
    budget,
    rule,
    generatedBoard: board.source === "generated" ? board : undefined,
  };
}

export function addEntry(list: SavedEntry[], entry: SavedEntry): SavedEntry[] {
  return [entry, ...list].slice(0, MAX_SAVED);
}

export function removeEntry(list: SavedEntry[], id: string): SavedEntry[] {
  return list.filter((e) => e.id !== id);
}

function isEntry(x: unknown): x is SavedEntry {
  if (!x || typeof x !== "object") return false;
  const e = x as Record<string, unknown>;
  if (typeof e.id !== "string" || typeof e.boardTitle !== "string" || typeof e.budget !== "number") return false;
  if (e.kind === "team") return Array.isArray(e.picks);
  if (e.kind === "matchup") return Array.isArray(e.team1) && Array.isArray(e.team2);
  return false;
}

export function parseSaved(raw: string | null): SavedEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(isEntry).slice(0, MAX_SAVED) : [];
  } catch {
    return [];
  }
}

export function loadSaved(): SavedEntry[] {
  try {
    return parseSaved(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

/** Returns false when the browser refuses to store (private mode, storage full). */
export function storeSaved(list: SavedEntry[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function sameTeam(a: Item[], b: Item[]): boolean {
  if (a.length !== b.length) return false;
  const ids = new Set(a.map((i) => i.id));
  return b.every((i) => ids.has(i.id));
}
