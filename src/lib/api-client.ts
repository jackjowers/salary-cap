import type { Grade, Judgement } from "@/lib/ai/schemas";
import type { Board, Item } from "@/lib/types";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string; aborted?: boolean };

async function post<T>(url: string, body: unknown, signal?: AbortSignal): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, message: json?.error?.message ?? `Request failed (${res.status}). Try again.` };
    return { ok: true, data: json as T };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return { ok: false, message: "Cancelled.", aborted: true };
    return { ok: false, message: "Couldn't reach the server. Check your connection and try again." };
  }
}

function slimBoard(board: Board) {
  return {
    title: board.title,
    columns: board.columns,
    items: board.items.map(({ id, name, price, column }) => ({ id, name, price, column })),
  };
}

export async function generateBoard(topic: string, signal?: AbortSignal) {
  const r = await post<{ board: Board }>("/api/generate", { topic }, signal);
  return r.ok ? { ok: true as const, data: r.data.board } : r;
}

export async function gradeTeam(board: Board, budget: number, picks: Item[], signal?: AbortSignal) {
  const r = await post<{ grade: Grade }>(
    "/api/grade",
    { board: slimBoard(board), budget, picks: picks.map((p) => p.id) },
    signal,
  );
  return r.ok ? { ok: true as const, data: r.data.grade } : r;
}

export async function judgeTeams(board: Board, budget: number, team1: Item[], team2: Item[], signal?: AbortSignal) {
  const r = await post<{ judgement: Judgement }>(
    "/api/judge",
    { board: slimBoard(board), budget, team1: team1.map((p) => p.id), team2: team2.map((p) => p.id) },
    signal,
  );
  return r.ok ? { ok: true as const, data: r.data.judgement } : r;
}
