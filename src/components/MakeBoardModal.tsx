"use client";

import { useEffect, useRef, useState } from "react";
import { generateBoard } from "@/lib/api-client";
import type { Board } from "@/lib/types";

const EXAMPLES = ["Ocean animals", "90s cartoons", "Breakfast foods", "Marvel heroes"];

type Props = {
  hasPicks: boolean;
  onBoard: (b: Board) => void;
  onClose: () => void;
};

export default function MakeBoardModal({ hasPicks, onBoard, onClose }: Props) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      abortRef.current?.abort();
    };
  }, []);

  const close = () => {
    abortRef.current?.abort();
    onClose();
  };

  const trimmed = topic.trim();
  const valid = trimmed.length >= 2 && trimmed.length <= 60;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!valid || loading) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    const r = await generateBoard(trimmed, ctrl.signal);
    if (ctrl.signal.aborted) return;
    setLoading(false);
    if (r.ok) onBoard(r.data);
    else setError(r.message);
  };

  const cancel = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  return (
    <div className="modal-backdrop" onClick={close}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="make-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="modal-head">
          <h2 id="make-title">Make your own</h2>
          <button type="button" className="icon-btn" onClick={close} aria-label="Close">
            ✕
          </button>
        </div>
        <p>Name any topic. Claude picks 5 categories and prices 5 options in each from $5 down to $1.</p>

        <label className="field">
          <span className="field-label">Topic</span>
          <input
            ref={inputRef}
            className="text-input"
            value={topic}
            maxLength={60}
            placeholder="e.g. Ocean animals"
            disabled={loading}
            onChange={(e) => setTopic(e.target.value)}
          />
        </label>

        {!loading && (
          <div className="example-chips">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" className="chip" onClick={() => setTopic(ex)}>
                {ex}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <p className="loading-line" role="status">
            <span className="spinner" aria-hidden="true" /> Building your board. This usually takes 10 to 20 seconds.
          </p>
        )}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        {hasPicks && !loading && <p className="modal-note">Your current picks will be cleared.</p>}

        <div className="modal-actions">
          {loading ? (
            <button type="button" className="btn ghost" onClick={cancel}>
              Cancel
            </button>
          ) : (
            <button type="button" className="btn ghost" onClick={close}>
              Close
            </button>
          )}
          <button type="submit" className="btn primary" disabled={!valid || loading}>
            {loading ? "Building…" : "Build board"}
          </button>
        </div>
      </form>
    </div>
  );
}
