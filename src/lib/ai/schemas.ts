import { z } from "zod";
import { BUDGET_MAX, BUDGET_MIN, TEAM_SIZE } from "@/lib/types";

const name = z.string().trim().min(1).max(60);

export const GeneratedBoardSchema = z.object({
  rejected: z
    .string()
    .nullable()
    .describe("null if the topic works. Otherwise a short, friendly reason it can't be made into a board."),
  title: z.string().describe("Short board name, 1 to 3 words, e.g. 'Ocean animals'"),
  noun: z.string().describe("What a team is called, e.g. 'team', 'lineup', 'starting five', 'menu'"),
  columns: z
    .array(
      z.object({
        label: z.string().describe("Category name, 1 to 2 words"),
        items: z.array(z.object({ name: z.string(), price: z.number().int() })),
      }),
    )
    .describe("Exactly 5 categories. Each has exactly 5 items priced 5, 4, 3, 2, and 1, one at each price."),
});
export type GeneratedBoard = z.infer<typeof GeneratedBoardSchema>;

export const GradeSchema = z.object({
  grade: z.string().describe("Letter grade from A+ to F"),
  headline: z.string().describe("One punchy sentence, under 12 words"),
  bestValue: z.string().describe("Exact name of the pick that is the best value for its price"),
  weakest: z.string().describe("Exact name of the weakest pick"),
  reasoning: z.string().describe("2 to 3 sentences explaining the grade"),
});
export type Grade = z.infer<typeof GradeSchema>;

export const JudgeSchema = z.object({
  winner: z.enum(["1", "2", "tie"]),
  score1: z.number().int().describe("Player 1 team score, 0 to 100"),
  score2: z.number().int().describe("Player 2 team score, 0 to 100"),
  headline: z.string().describe("One punchy sentence announcing the result, under 14 words"),
  reasoning1: z.string().describe("2 sentences on Player 1's team"),
  reasoning2: z.string().describe("2 sentences on Player 2's team"),
});
export type Judgement = z.infer<typeof JudgeSchema>;

export const GenerateRequest = z.object({
  topic: z.string().trim().min(2, "Enter a topic.").max(60, "Keep the topic under 60 characters."),
});

const BoardInput = z.object({
  title: name,
  columns: z.array(z.object({ id: name, label: name })).min(1).max(8),
  items: z
    .array(z.object({ id: z.string().max(120), name, price: z.number().int().min(1).max(10), column: name }))
    .min(TEAM_SIZE)
    .max(64),
});

const TeamInput = z.array(z.string().max(120)).length(TEAM_SIZE);

export const GradeRequest = z.object({
  board: BoardInput,
  budget: z.number().int().min(BUDGET_MIN).max(BUDGET_MAX),
  picks: TeamInput,
});

export const JudgeRequest = z.object({
  board: BoardInput,
  budget: z.number().int().min(BUDGET_MIN).max(BUDGET_MAX),
  team1: TeamInput,
  team2: TeamInput,
});

export type BoardInputType = z.infer<typeof BoardInput>;
