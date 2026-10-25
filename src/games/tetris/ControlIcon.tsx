const PATHS: Record<string, string> = {
  left: "M15 5 L7 12 L15 19 Z",
  right: "M9 5 L17 12 L9 19 Z",
  down: "M5 9 L12 17 L19 9 Z",
  drop: "M5 4 H19 M5 10 L12 18 L19 10 Z",
  rotateLeft: "M5 12 A7 7 0 1 0 8 6 M8 2 V7 H3",
  rotateRight: "M19 12 A7 7 0 1 1 16 6 M16 2 V7 H21"
};

export type ControlName = keyof typeof PATHS;

export function ControlIcon({ name }: { name: ControlName }) {
  const solid = name === "left" || name === "right" || name === "down";
  return (
    <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true" fill={solid ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} fill={name === "drop" ? "currentColor" : undefined} />
    </svg>
  );
}
