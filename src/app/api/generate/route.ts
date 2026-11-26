import { NextResponse } from "next/server";
import { askForJson, AiError } from "@/lib/ai/claude";
import { boardFromGenerated, BoardShapeError } from "@/lib/ai/board-from-generated";
import { generatePrompt } from "@/lib/ai/prompts";
import { GeneratedBoardSchema, GenerateRequest } from "@/lib/ai/schemas";
import { MemoryCache, type Cache } from "@/lib/server/limits";
import { aiFailure, fail, limit, readBody } from "@/lib/server/http";
import type { Board } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;
const g = globalThis as unknown as { boardCache?: Cache<Board> };
const cache: Cache<Board> = g.boardCache ?? (g.boardCache = new MemoryCache<Board>(DAY));

export async function POST(req: Request) {
  const body = await readBody(req, GenerateRequest);
  if (!body.ok) return body.res;
  const topic = body.data.topic.replace(/\s+/g, " ");
  const key = topic.toLowerCase();

  const cached = await cache.get(key);
  if (cached) return NextResponse.json({ board: cached, cached: true });

  const limited = await limit(req);
  if (limited) return limited;

  try {
    let lastShapeError = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      const gen = await askForJson(generatePrompt(topic), GeneratedBoardSchema, { effort: "low", maxTokens: 4000, signal: req.signal });
      if (gen.rejected) throw new AiError("refused", gen.rejected);
      try {
        const board = boardFromGenerated(gen, topic);
        await cache.set(key, board);
        return NextResponse.json({ board, cached: false });
      } catch (e) {
        if (!(e instanceof BoardShapeError)) throw e;
        lastShapeError = e.message;
      }
    }
    console.error("Generated board had the wrong shape twice", lastShapeError);
    return fail(502, "bad_output", "Claude couldn't build a clean board for that topic. Try rewording it.");
  } catch (err) {
    return aiFailure(err);
  }
}
