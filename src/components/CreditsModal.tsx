"use client";

import { useEffect } from "react";
import credits from "@/lib/credits.json";
import type { Board } from "@/lib/types";

type Credit = { name: string; artist: string; license: string; licenseUrl?: string; source: string };
const CREDITS = credits as Record<string, Credit>;

export default function CreditsModal({ board, onClose }: { board: Board; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows = board.items.map((i) => CREDITS[i.id]).filter((c): c is Credit => Boolean(c));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal credits-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="credits-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="credits-title">Photo credits</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="modal-note">
          Images from Wikimedia Commons, cropped and resized. Logos are trademarks of their owners and are used only to
          identify them.
        </p>
        <ul className="credits-list">
          {rows.map((c) => (
            <li key={c.source}>
              <strong>{c.name}</strong>
              <span>
                <a href={c.source} target="_blank" rel="noopener noreferrer">
                  {c.artist || "Unknown author"}
                </a>
                {", "}
                {c.licenseUrl ? (
                  <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer">
                    {c.license}
                  </a>
                ) : (
                  c.license
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
