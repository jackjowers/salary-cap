import type { BoardInputType } from "./schemas";

export function generatePrompt(topic: string): string {
  return `You build boards for a "salary cap" party game. Players get a small budget and pick a team of 5 from a grid.

Make a board for this topic: <topic>${topic}</topic>

Rules:
- Exactly 5 categories (columns). Pick natural, distinct sub-groups of the topic. Example for "Ocean animals": Mammals, Predator fish, Small fish, Crustaceans, Sea birds.
- Each category has exactly 5 items: one priced $5, one $4, one $3, one $2, one $1.
- Price by how good, famous, or desirable the item is within the topic: $5 is the obvious best pick in that category, $1 is a decent but clearly weaker pick. Example: in Mammals, dolphin $5, whale $4.
- Every item must be real and recognizable to a general audience. No duplicates across the board.
- Keep names short (under 30 characters).
- If the topic is empty, nonsensical, hateful, sexual, about real private individuals, or otherwise not suitable for a family-friendly party game, set "rejected" to a one-sentence reason and return empty columns. Otherwise set "rejected" to null.`;
}

function describeBoard(board: BoardInputType): string {
  const lines = board.columns.map((c) => {
    const items = board.items
      .filter((i) => i.column === c.id)
      .sort((a, b) => b.price - a.price)
      .map((i) => `${i.name} ($${i.price})`)
      .join(", ");
    return `- ${c.label}: ${items}`;
  });
  return `Board "${board.title}":\n${lines.join("\n")}`;
}

function describeTeam(board: BoardInputType, ids: string[]): string {
  return ids
    .map((id) => board.items.find((i) => i.id === id)!)
    .map((i) => `${i.name} (${board.columns.find((c) => c.id === i.column)?.label ?? i.column}, $${i.price})`)
    .join("; ");
}

export function gradePrompt(board: BoardInputType, budget: number, picks: string[]): string {
  return `You are the judge of a "salary cap" party game. The player had $${budget} to build a team of 5 from this board:

${describeBoard(board)}

Their team: ${describeTeam(board, picks)}

Grade the team as a whole for this topic, as of today. Consider how good the picks are, how well they fit together as a team, and how well the budget was used. Be fun and direct, like a sports pundit, but fair. Use exact item names from the board for bestValue and weakest.`;
}

export function judgePrompt(board: BoardInputType, budget: number, team1: string[], team2: string[]): string {
  return `You are the judge of a "salary cap" party game. Two players each had $${budget} to build a team of 5 from this board:

${describeBoard(board)}

Player 1: ${describeTeam(board, team1)}
Player 2: ${describeTeam(board, team2)}

Decide which team is better for this topic, as of today, as if they faced off. Consider overall quality, how well each team fits together, and value for money. Only call a tie if the teams are genuinely even. Be fun and direct, like a sports pundit, but fair. Scores should reflect the margin.`;
}

export function picksAreOnBoard(board: BoardInputType, ids: string[]): boolean {
  return new Set(ids).size === ids.length && ids.every((id) => board.items.some((i) => i.id === id));
}
