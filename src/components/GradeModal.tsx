"use client";

import { useEffect } from "react";
import type { Grade } from "@/lib/ai/schemas";

export type GradeState = { status: "loading" } | { status: "error"; message: string } | { status: "done"; grade: Grade };

type Props = {
  state: GradeState;
  onRetry: () => void;
  onClose: () => void;
};

export default function GradeModal({ state, onRetry, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal grade-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="grade-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="grade-title">The verdict</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {state.status === "loading" && (
          <p className="loading-line" role="status">
            <span className="spinner" aria-hidden="true" /> Claude is reviewing your picks…
          </p>
        )}

        {state.status === "error" && (
          <>
            <p className="field-error" role="alert">
              {state.message}
            </p>
            <div className="modal-actions">
              <button className="btn ghost" onClick={onClose}>
                Close
              </button>
              <button className="btn primary" onClick={onRetry}>
                Try again
              </button>
            </div>
          </>
        )}

        {state.status === "done" && (
          <>
            <div className="grade-top">
              <span className="grade-letter">{state.grade.grade}</span>
              <p className="grade-headline">{state.grade.headline}</p>
            </div>
            <dl className="grade-facts">
              <div>
                <dt>Best value</dt>
                <dd>{state.grade.bestValue}</dd>
              </div>
              <div>
                <dt>Weakest link</dt>
                <dd>{state.grade.weakest}</dd>
              </div>
            </dl>
            <p>{state.grade.reasoning}</p>
            <div className="modal-actions">
              <button className="btn primary" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
