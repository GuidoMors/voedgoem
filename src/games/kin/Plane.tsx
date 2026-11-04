import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const DRAG_THRESHOLD = 4;
const INTERACTIVE = "button, input, select, textarea, a, label, [role='button']";

export interface PlaneView { x: number; y: number; k: number }
const HOME: PlaneView = { x: 0, y: 0, k: 0.75 };
const clamp = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

// An endless plane: drag anywhere that is not a control to pan, use the wheel or the buttons to zoom. Clicks on its contents still work.
export function Plane({ children, focusKey, initialView, onViewChange }: {
  children: ReactNode;
  focusKey?: string;
  initialView?: PlaneView;
  onViewChange?: (view: PlaneView) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<PlaneView>(initialView ?? HOME);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; startX: number; startY: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const homeView = (): PlaneView => {
    const element = viewport.current;
    if (!element || !content.current) return HOME;
    const bounds = element.getBoundingClientRect();
    const game = element.closest(".kin-main");
    const left = game?.querySelector(".kin-main-left:not(.collapsed)")?.getBoundingClientRect();
    const right = game?.querySelector(".kin-main-right:not(.collapsed)")?.getBoundingClientRect();
    const center = (Math.max(bounds.left, left?.right ?? bounds.left) + Math.min(bounds.right, right?.left ?? bounds.right)) / 2;
    return { x: center - bounds.left - content.current.scrollWidth * HOME.k / 2, y: 0, k: HOME.k };
  };

  useLayoutEffect(() => {
    if (!initialView) setView(homeView());
  }, []);

  useEffect(() => { onViewChange?.(view); }, [view, onViewChange]);

  useEffect(() => {
    if (focusKey === undefined) return;
    const frame = requestAnimationFrame(() => {
      const element = viewport.current;
      const target = element?.querySelector(".kc.selectable, .kin-army-pickable, .kin-spot, .kin-spot-line");
      if (!element || !target) return;
      const bounds = element.getBoundingClientRect();
      const game = element.closest(".kin-main");
      const left = game?.querySelector(".kin-main-left:not(.collapsed)")?.getBoundingClientRect();
      const right = game?.querySelector(".kin-main-right:not(.collapsed)")?.getBoundingClientRect();
      const bottom = game?.querySelector(".kin-main-bottom:not(.collapsed)")?.getBoundingClientRect();
      const x = (Math.max(bounds.left, left?.right ?? bounds.left) + Math.min(bounds.right, right?.left ?? bounds.right)) / 2;
      const y = (bounds.top + Math.min(bounds.bottom, bottom?.top ?? bounds.bottom)) / 2;
      const rect = target.getBoundingClientRect();
      setView(current => ({ ...current, x: current.x + x - (rect.left + rect.right) / 2, y: current.y + y - (rect.top + rect.bottom) / 2 }));
    });
    return () => cancelAnimationFrame(frame);
  }, [focusKey]);

  const zoomAt = (px: number, py: number, factor: number) => setView(current => {
    const k = clamp(current.k * factor);
    return { k, x: px - (px - current.x) * (k / current.k), y: py - (py - current.y) * (k / current.k) };
  });

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      // Let scrollable panels (like the court) scroll normally.
      if ((event.target as HTMLElement).closest("[data-no-zoom]")) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      zoomAt(event.clientX - rect.left, event.clientY - rect.top, Math.exp(-event.deltaY * 0.0015));
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  const zoomCenter = (factor: number) => {
    const rect = viewport.current?.getBoundingClientRect();
    if (rect) zoomAt(rect.width / 2, rect.height / 2, factor);
  };

  return (
    <div className="kin-plane">
      <div
        ref={viewport}
        className={`kin-plane-viewport ${dragging ? "dragging" : ""}`}
        onPointerDown={event => {
          if (event.button !== 0 || (event.target as HTMLElement).closest(INTERACTIVE)) return;
          drag.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: view.x, y: view.y, moved: false };
        }}
        onPointerMove={event => {
          const current = drag.current;
          if (!current || current.id !== event.pointerId) return;
          const dx = event.clientX - current.startX;
          const dy = event.clientY - current.startY;
          if (!current.moved) {
            if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
            current.moved = true;
            setDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          setView(previous => ({ ...previous, x: current.x + dx, y: current.y + dy }));
        }}
        onPointerUp={event => {
          const current = drag.current;
          drag.current = null;
          if (!current?.moved) return;
          suppressClick.current = true;
          setDragging(false);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          setTimeout(() => { suppressClick.current = false; }, 0);
        }}
        onPointerCancel={() => { drag.current = null; setDragging(false); }}
        onClickCapture={event => {
          if (suppressClick.current) { event.stopPropagation(); event.preventDefault(); }
        }}
      >
        <div ref={content} className="kin-plane-content" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
          {children}
        </div>
      </div>
      <div className="kin-zoom">
        <button type="button" onClick={() => zoomCenter(1 / 1.25)} aria-label="Zoom out">−</button>
        <span className="small">{Math.round(view.k * 100)}%</span>
        <button type="button" onClick={() => zoomCenter(1.25)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => setView(homeView())}>Reset</button>
      </div>
    </div>
  );
}
