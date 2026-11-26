import { NextResponse } from "next/server";
import { askForJson } from "@/lib/ai/claude";
import { judgePrompt, picksAreOnBoard } from "@/lib/ai/prompts";
import { JudgeRequest, JudgeSchema } from "@/lib/ai/schemas";
import { aiFailure, fail, limit, readBody } from "@/lib/server/http";

export async function POST(req: Request) {
  const body = await readBody(req, JudgeRequest);
  if (!body.ok) return body.res;
  const { board, budget, team1, team2 } = body.data;
  if (!picksAreOnBoard(board, team1) || !picksAreOnBoard(board, team2)) {
    return fail(400, "bad_request", "Those picks aren't all on this board.");
  }

  const limited = await limit(req);
  if (limited) return limited;

  try {
    const judgement = await askForJson(judgePrompt(board, budget, team1, team2), JudgeSchema, {
      effort: "medium",
      maxTokens: 2000,
      signal: req.signal,
    });
    return NextResponse.json({ judgement });
  } catch (err) {
    return aiFailure(err);
  }
}
