import { NextResponse } from "next/server";
import { askForJson } from "@/lib/ai/claude";
import { gradePrompt, picksAreOnBoard } from "@/lib/ai/prompts";
import { GradeRequest, GradeSchema } from "@/lib/ai/schemas";
import { aiFailure, fail, limit, readBody } from "@/lib/server/http";

export async function POST(req: Request) {
  const body = await readBody(req, GradeRequest);
  if (!body.ok) return body.res;
  const { board, budget, picks } = body.data;
  if (!picksAreOnBoard(board, picks)) return fail(400, "bad_request", "Those picks aren't all on this board.");

  const limited = await limit(req);
  if (limited) return limited;

  try {
    const grade = await askForJson(gradePrompt(board, budget, picks), GradeSchema, { effort: "low", maxTokens: 1500, signal: req.signal });
    return NextResponse.json({ grade });
  } catch (err) {
    return aiFailure(err);
  }
}
