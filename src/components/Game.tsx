"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PRESET_BOARDS, itemsAt, tiersOf } from "@/lib/boards";
import { isComplete, spent, togglePick } from "@/lib/rules";
import { DEFAULT_SETTINGS, TEAM_SIZE, type Board, type Item, type Settings } from "@/lib/types";
import { gradeTeam } from "@/lib/api-client";
import CreditsModal from "./CreditsModal";
import GradeModal, { type GradeState } from "./GradeModal";
import ItemImage from "./ItemImage";
import MakeBoardModal from "./MakeBoardModal";
import SettingsModal from "./SettingsModal";

type Notice = { itemId: string; text: string; key: number };

export default function Game() {
  const [board, setBoard] = useState<Board>(PRESET_BOARDS[0]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [picks, setPicks] = useState<Item[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingBoard, setPendingBoard] = useState<Board | null>(null);
  const [customBoard, setCustomBoard] = useState<Board | null>(null);
  const [makeOpen, setMakeOpen] = useState(false);
  const [grade, setGrade] = useState<{ key: string; state: GradeState } | null>(null);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const gradeAbort = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      clearTimeout(noticeTimer.current);
      gradeAbort.current?.abort();
    },
    [],
  );

  const left = settings.budget - spent(picks);
  const complete = isComplete(settings, picks);
  const tiers = tiersOf(board);
  const teamKey = `${board.id}|${settings.budget}|${picks.map((p) => p.id).sort().join(",")}`;
  const currentGrade = grade?.key === teamKey ? grade.state : null;
  const boardTabs = customBoard ? [...PRESET_BOARDS, customBoard] : PRESET_BOARDS;

  const runGrade = useCallback(async () => {
    gradeAbort.current?.abort();
    const ctrl = new AbortController();
    gradeAbort.current = ctrl;
    const key = teamKey;
    setGrade({ key, state: { status: "loading" } });
    setGradeOpen(true);
    const r = await gradeTeam(board, settings.budget, picks, ctrl.signal);
    if (ctrl.signal.aborted) return;
    setGrade({ key, state: r.ok ? { status: "done", grade: r.data } : { status: "error", message: r.message } });
  }, [board, settings.budget, picks, teamKey]);

  const openGrade = () => {
    if (currentGrade && currentGrade.status !== "error") setGradeOpen(true);
    else runGrade();
  };

  const autoGradedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!complete || settings.players !== 1 || !settings.autoGrade) return;
    if (autoGradedKey.current === teamKey) return;
    autoGradedKey.current = teamKey;
    runGrade();
  }, [complete, settings.players, settings.autoGrade, teamKey, runGrade]);

  const closeGrade = useCallback(() => setGradeOpen(false), []);
  const closeCredits = useCallback(() => setCreditsOpen(false), []);

  const onTap = (item: Item) => {
    const result = togglePick(settings, picks, item);
    if (result.ok) {
      setPicks(result.picks);
      setNotice(null);
      return;
    }
    clearTimeout(noticeTimer.current);
    setNotice({ itemId: item.id, text: result.reason, key: Date.now() });
    noticeTimer.current = setTimeout(() => setNotice(null), 2200);
  };

  const switchBoard = (b: Board) => {
    if (b.id === board.id) return;
    if (picks.length) setPendingBoard(b);
    else setBoard(b);
  };

  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  const blockedReason = (item: Item): string | null => {
    if (picks.some((p) => p.id === item.id)) return null;
    if (settings.rule === "onePerColumn") {
      const existing = picks.find((p) => p.column === item.column);
      if (existing) return item.price - existing.price > left ? "over" : null;
    }
    if (picks.length >= TEAM_SIZE) return "full";
    if (item.price > left) return "over";
    return null;
  };

  return (
    <div className="page">
      <header className="masthead">
        <div className="masthead-row">
          <div className="board-tabs" role="tablist" aria-label="Choose a board">
            {boardTabs.map((b) => (
              <button
                key={b.id}
                role="tab"
                aria-selected={b.id === board.id}
                className={`chip ${b.id === board.id ? "active" : ""}`}
                onClick={() => switchBoard(b)}
              >
                {b.title}
              </button>
            ))}
            <button className="chip make" onClick={() => setMakeOpen(true)}>
              + Make your own
            </button>
          </div>
          <button className="icon-btn gear" onClick={() => setSettingsOpen(true)} aria-label="Settings">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                fill="currentColor"
                d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.4 2.9a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.6 7.6 0 0 0 1.7 1L11 21h4l.4-2.9a7.6 7.6 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"
                transform="translate(-1 0)"
              />
            </svg>
          </button>
        </div>
        <h1 className="headline">
          Build a {board.noun} with ${settings.budget}
        </h1>
        <p className="edition">
          <span>{settings.rule === "onePerColumn" ? "One from each column" : "Free select"}</span>
        </p>
      </header>

      <main className="board-wrap">
        <div
          className={`board ${board.source === "generated" ? "text-board" : ""}`}
          style={{ gridTemplateColumns: `var(--price-col) repeat(${board.columns.length}, minmax(0, 1fr))` }}
        >
          <div className="corner" />
          {board.columns.map((c) => (
            <div key={c.id} className="col-head">
              {c.label}
            </div>
          ))}
          {tiers.map((price) => (
            <Row
              key={price}
              price={price}
              board={board}
              picks={picks}
              notice={notice}
              blockedReason={blockedReason}
              onTap={onTap}
            />
          ))}
        </div>
        {board.source === "preset" && (
          <p className="board-foot">
            <button className="link-btn" onClick={() => setCreditsOpen(true)}>
              Photo credits
            </button>
          </p>
        )}
      </main>

      <footer className="teambar" aria-live="polite">
        <div className="teambar-inner">
          <div className="slots">
            {Array.from({ length: TEAM_SIZE }, (_, i) => picks[i]).map((p, i) =>
              p ? (
                <button key={p.id} className="slot filled" onClick={() => onTap(p)} aria-label={`Remove ${p.name}`}>
                  <ItemImage name={p.name} src={p.image} />
                  <span className="slot-price">${p.price}</span>
                </button>
              ) : (
                <span key={`empty-${i}`} className="slot" aria-hidden="true" />
              ),
            )}
          </div>
          <div className="teambar-meta">
            <div className={`money ${left === 0 ? "zero" : ""}`}>
              <span className="money-num">${left}</span>
              <span className="money-label">left</span>
            </div>
            <div className="teambar-status">
              {complete ? "Team complete" : `${picks.length} of ${TEAM_SIZE} picked`}
            </div>
            {complete && settings.players === 1 && (
              <button className="btn primary small" onClick={openGrade}>
                {currentGrade?.status === "done" ? "See grade" : "Grade my team"}
              </button>
            )}
            <button className="btn ghost small" onClick={() => setPicks([])} disabled={!picks.length}>
              Clear
            </button>
          </div>
        </div>
      </footer>

      {settingsOpen && (
        <SettingsModal
          board={board}
          settings={settings}
          hasPicks={picks.length > 0}
          onClose={closeSettings}
          onSave={(s) => {
            if (s.budget !== settings.budget || s.rule !== settings.rule) setPicks([]);
            setSettings(s);
            setSettingsOpen(false);
          }}
        />
      )}

      {makeOpen && (
        <MakeBoardModal
          hasPicks={picks.length > 0}
          onClose={() => setMakeOpen(false)}
          onBoard={(b) => {
            setCustomBoard(b);
            setBoard(b);
            setPicks([]);
            setMakeOpen(false);
          }}
        />
      )}

      {creditsOpen && <CreditsModal board={board} onClose={closeCredits} />}

      {gradeOpen && currentGrade && <GradeModal state={currentGrade} onRetry={runGrade} onClose={closeGrade} />}

      {pendingBoard && (
        <div className="modal-backdrop" onClick={() => setPendingBoard(null)}>
          <div className="modal small" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Switch to {pendingBoard.title}?</h2>
            <p>Your current picks will be cleared.</p>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setPendingBoard(null)}>
                Keep picking
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  setBoard(pendingBoard);
                  setPicks([]);
                  setPendingBoard(null);
                }}
              >
                Switch board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type RowProps = {
  price: number;
  board: Board;
  picks: Item[];
  notice: Notice | null;
  blockedReason: (item: Item) => string | null;
  onTap: (item: Item) => void;
};

function Row({ price, board, picks, notice, blockedReason, onTap }: RowProps) {
  return (
    <>
      <div className="price-label">${price}</div>
      {board.columns.map((col) => {
        const [item] = itemsAt(board, col.id, price);
        if (!item) return <div key={col.id} className="cell empty" />;
        const picked = picks.some((p) => p.id === item.id);
        const blocked = blockedReason(item);
        const shaking = notice?.itemId === item.id;
        return (
          <button
            key={col.id}
            className={`cell ${picked ? "picked" : ""} ${blocked ? "blocked" : ""} ${shaking ? "shake" : ""}`}
            onClick={() => onTap(item)}
            aria-pressed={picked}
            aria-label={`${item.name}, ${col.label}, $${item.price}`}
          >
            <span className="tile">
              {board.source === "generated" ? (
                <span className="tile-text">{item.name}</span>
              ) : (
                <ItemImage name={item.name} src={item.image} />
              )}
              {picked && <span className="check">✓</span>}
            </span>
            <span className="cell-name">{item.name}</span>
            {shaking && (
              <span key={notice.key} className="bubble" role="status">
                {notice.text}
              </span>
            )}
          </button>
        );
      })}
    </>
  );
}
