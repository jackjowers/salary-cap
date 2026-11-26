"use client";

import type { Judgement } from "@/lib/ai/schemas";
import type { Item } from "@/lib/types";
import ItemImage from "./ItemImage";

export type JudgeState = { status: "loading" } | { status: "error"; message: string } | { status: "done"; judgement: Judgement };

type Props = {
  state: JudgeState;
  team1: Item[];
  team2: Item[];
  textOnly: boolean;
  onRetry: () => void;
  onPlayAgain: () => void;
};

export default function JudgeModal({ state, team1, team2, textOnly, onRetry, onPlayAgain }: Props) {
  const j = state.status === "done" ? state.judgement : null;
  const sides = [
    { label: "Player 1", team: team1, score: j?.score1, reasoning: j?.reasoning1, won: j?.winner === "1" },
    { label: "Player 2", team: team2, score: j?.score2, reasoning: j?.reasoning2, won: j?.winner === "2" },
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal judge-modal" role="dialog" aria-modal="true" aria-labelledby="judge-title">
        <h2 id="judge-title">{j ? (j.winner === "tie" ? "It's a tie" : `Player ${j.winner} wins`) : "Head to head"}</h2>
        {j && <p className="grade-headline">{j.headline}</p>}

        <div className="judge-sides">
          {sides.map((s) => (
            <section key={s.label} className={`judge-side ${s.won ? "won" : ""}`}>
              <header>
                <span>{s.label}</span>
                {s.score !== undefined && <span className="judge-score">{s.score}</span>}
              </header>
              <ul className="judge-team">
                {s.team.map((p) => (
                  <li key={p.id}>
                    {!textOnly && (
                      <span className="judge-thumb">
                        <ItemImage name={p.name} src={p.image} />
                      </span>
                    )}
                    <span className="judge-name">{p.name}</span>
                    <span className="judge-price">${p.price}</span>
                  </li>
                ))}
              </ul>
              {s.reasoning && <p className="judge-reason">{s.reasoning}</p>}
            </section>
          ))}
        </div>

        {state.status === "loading" && (
          <p className="loading-line" role="status">
            <span className="spinner" aria-hidden="true" /> Claude is judging the matchup…
          </p>
        )}
        {state.status === "error" && (
          <p className="field-error" role="alert">
            {state.message}
          </p>
        )}

        <div className="modal-actions">
          {state.status === "error" && (
            <button className="btn ghost" onClick={onRetry}>
              Try again
            </button>
          )}
          <button className="btn primary" onClick={onPlayAgain} disabled={state.status === "loading"}>
            Play again
          </button>
        </div>
      </div>
    </div>
  );
}
