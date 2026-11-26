import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

export const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ timeout: 60_000, maxRetries: 1 });
  return client;
}

export type AiErrorCode = "not_configured" | "busy" | "refused" | "bad_output" | "unavailable";

export class AiError extends Error {
  constructor(
    public code: AiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export async function askForJson<S extends z.ZodType>(
  prompt: string,
  schema: S,
  opts: { effort: "low" | "medium" | "high"; maxTokens: number; signal?: AbortSignal },
): Promise<z.infer<S>> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiError("not_configured", "AI features are off. Add an Anthropic API key to .env.local to turn them on.");
  }
  try {
    const res = await getClient().beta.messages.parse(
      {
      model: MODEL,
      max_tokens: opts.maxTokens,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: opts.effort, format: betaZodOutputFormat(schema) },
      messages: [{ role: "user", content: prompt }],
      },
      { signal: opts.signal },
    );
    if (res.stop_reason === "refusal") {
      throw new AiError("refused", "Claude declined this one. Try a different topic.");
    }
    if (res.stop_reason === "max_tokens" || res.parsed_output == null) {
      throw new AiError("bad_output", "Claude's answer came back incomplete. Try again.");
    }
    return res.parsed_output as z.infer<S>;
  } catch (err) {
    if (err instanceof AiError) throw err;
    if (err instanceof Anthropic.APIUserAbortError) throw new AiError("unavailable", "Request cancelled.");
    if (err instanceof Anthropic.RateLimitError) {
      throw new AiError("busy", "Claude is busy right now. Try again in a minute.");
    }
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      throw new AiError("not_configured", "The Anthropic API key was rejected. Check the key in .env.local.");
    }
    if (err instanceof Anthropic.APIError || err instanceof Anthropic.APIConnectionError) {
      console.error("Claude API error", err.message);
      throw new AiError("unavailable", "Couldn't reach Claude. Try again.");
    }
    console.error("Unexpected AI error", err);
    throw new AiError("bad_output", "Claude's answer couldn't be read. Try again.");
  }
}
