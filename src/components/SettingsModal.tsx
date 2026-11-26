"use client";

import { useEffect, useRef, useState } from "react";
import { BUDGET_MAX, BUDGET_MIN, TEAM_SIZE, type Board, type Settings } from "@/lib/types";
import { boardProblem } from "@/lib/rules";

type Props = {
  board: Board;
  settings: Settings;
  hasPicks: boolean;
  onSave: (s: Settings) => void;
  onClose: () => void;
};

export default function SettingsModal({ board, settings, hasPicks, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(settings);
  const [budgetText, setBudgetText] = useState(String(settings.budget));
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    dialogRef.current?.querySelector<HTMLElement>("input, button")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const budgetNum = Number(budgetText);
  const budgetValid = Number.isInteger(budgetNum) && budgetNum >= BUDGET_MIN && budgetNum <= BUDGET_MAX;
  const next = { ...draft, budget: budgetValid ? budgetNum : draft.budget };
  const problem = budgetValid ? boardProblem(board, next) : null;
  const clearsPicks = next.budget !== settings.budget || next.rule !== settings.rule;
  const canSave = budgetValid && !problem;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="settings-title">Settings</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <label className="field">
          <span className="field-label">Budget</span>
          <span className="money-input">
            <span>$</span>
            <input
              id="budget"
              inputMode="numeric"
              value={budgetText}
              onChange={(e) => setBudgetText(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </span>
          {!budgetValid && (
            <span className="field-error">
              Enter a whole number from ${BUDGET_MIN} to ${BUDGET_MAX}.
            </span>
          )}
        </label>

        <fieldset className="field">
          <legend className="field-label">Pick rule</legend>
          <label className="radio">
            <input
              type="radio"
              name="rule"
              checked={draft.rule === "free"}
              onChange={() => setDraft({ ...draft, rule: "free" })}
            />
            <span>
              <strong>Free select</strong>
              <small>Any {TEAM_SIZE} picks, any categories.</small>
            </span>
          </label>
          <label className="radio">
            <input
              type="radio"
              name="rule"
              checked={draft.rule === "onePerColumn"}
              onChange={() => setDraft({ ...draft, rule: "onePerColumn" })}
            />
            <span>
              <strong>One from each column</strong>
              <small>
                One each from {board.columns.map((c) => c.label).join(", ").replace(/, ([^,]*)$/, ", and $1")}.
              </small>
            </span>
          </label>
        </fieldset>

        <fieldset className="field">
          <legend className="field-label">AI analysis</legend>
          <label className="radio">
            <input
              type="checkbox"
              checked={draft.autoGrade}
              onChange={(e) => setDraft({ ...draft, autoGrade: e.target.checked })}
            />
            <span>
              <strong>Grade my team automatically</strong>
              <small>Claude grades your {board.noun} as soon as all {TEAM_SIZE} picks are in. Off means you tap Grade.</small>
            </span>
          </label>
        </fieldset>

        {problem && <p className="field-error">{problem}</p>}
        {clearsPicks && hasPicks && canSave && <p className="modal-note">Saving clears your current picks.</p>}

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={!canSave} onClick={() => onSave(next)}>
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
}
