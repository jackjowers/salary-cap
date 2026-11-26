"use client";

import { useEffect, useState } from "react";
import type { SavedEntry } from "@/lib/saved-teams";
import type { Board, Item } from "@/lib/types";

type Props = {
  entries: SavedEntry[];
  onDelete: (id: string) => void;
  onOpenBoard: (b: Board) => void;
  onClose: () => void;
};

const fmtDate = (t: number) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const spent = (items: Item[]) => items.reduce((s, i) => s + i.price, 0);

function TeamLine({ items }: { items: Item[] }) {
  return (
    <p className="saved-picks">
      {items.map((p) => `${p.name} ($${p.price})`).join(", ")}
    </p>
  );
}

export default function MyTeamsModal({ entries, onDelete, onOpenBoard, onClose }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal myteams-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="myteams-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="myteams-title">My teams</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="empty-state">
            No saved teams yet. Fill all 5 slots and tap <strong>Save</strong> to keep a team here.
          </p>
        ) : (
          <>
            <p className="modal-note">Saved in this browser only. Clearing your browser data removes them.</p>
            <ul className="saved-list">
              {entries.map((e) => (
                <li key={e.id} className="saved-card">
                  <div className="saved-head">
                    <span className="saved-title">
                      {e.boardTitle} · ${e.budget}
                      {e.rule === "onePerColumn" ? " · one per column" : ""}
                    </span>
                    <span className="saved-date">{fmtDate(e.savedAt)}</span>
                  </div>

                  {e.kind === "team" ? (
                    <>
                      <div className="saved-row">
                        {e.grade && <span className="saved-grade">{e.grade.grade}</span>}
                        <div>
                          <TeamLine items={e.picks} />
                          <small>
                            Spent ${spent(e.picks)}
                            {e.grade ? `. ${e.grade.headline}` : ""}
                          </small>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {e.judgement && (
                        <p className="saved-result">
                          {e.judgement.winner === "tie" ? "Tie" : `Player ${e.judgement.winner} won`},{" "}
                          {e.judgement.score1} to {e.judgement.score2}
                        </p>
                      )}
                      <div className="saved-vs">
                        <strong>P1</strong> <TeamLine items={e.team1} />
                      </div>
                      <div className="saved-vs">
                        <strong>P2</strong> <TeamLine items={e.team2} />
                      </div>
                    </>
                  )}

                  <div className="saved-actions">
                    {e.generatedBoard && (
                      <button className="btn ghost small" onClick={() => onOpenBoard(e.generatedBoard!)}>
                        Play this board
                      </button>
                    )}
                    {confirmId === e.id ? (
                      <>
                        <span className="saved-confirm">Delete this team?</span>
                        <button className="btn ghost small" onClick={() => setConfirmId(null)}>
                          Keep
                        </button>
                        <button
                          className="btn primary small"
                          onClick={() => {
                            onDelete(e.id);
                            setConfirmId(null);
                          }}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button className="btn ghost small" onClick={() => setConfirmId(e.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
