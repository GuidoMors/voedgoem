import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({ title, onClose, children, wide, gameTheme, themeGame, className = "" }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; gameTheme?: string | null; themeGame?: string | null; className?: string }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div className={`modal card ${wide ? "wide" : ""} ${gameTheme ? "stats-modal" : ""} ${className}`} data-game={themeGame ?? gameTheme ?? undefined} role="dialog" aria-modal="true" aria-label={title}>
        <div className="row between modal-head">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
