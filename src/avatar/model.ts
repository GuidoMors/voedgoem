import { PARTS } from "./parts.generated";

export interface Avatar {
  body: string;
  bodyColor: string;
  face: string;
  faceColor: string;
  hat: string;
  hatColor: string;
}

export type AvatarView = "front" | "frontright" | "right" | "topright" | "top";
export const VIEWS: { id: AvatarView; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "frontright", label: "Front right" },
  { id: "right", label: "Right" },
  { id: "topright", label: "Top right" },
  { id: "top", label: "Top" }
];

export const SWATCHES = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#1abc9c", "#3498db", "#9b59b6", "#e84393", "#ecf0f1", "#95a5a6", "#34495e", "#8d5a3b"];

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomAvatar(next: () => number = Math.random): Avatar {
  const pick = <T,>(list: T[]) => list[Math.floor(next() * list.length)];
  const hats = PARTS.hats.filter(hat => hat.id !== "nohat");
  return {
    body: pick(PARTS.bodies).id, bodyColor: pick(SWATCHES),
    face: pick(PARTS.faces).id, faceColor: pick(SWATCHES),
    hat: pick(hats).id, hatColor: pick(SWATCHES)
  };
}

// Used until someone saves their own avatar; stable per id so a player always looks the same.
export function defaultAvatar(id: string): Avatar {
  return randomAvatar(rng(hash(id)));
}
