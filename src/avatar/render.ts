import type { Avatar, AvatarView } from "./model";

const images = new Map<string, Promise<HTMLImageElement | null>>();

function load(url: string): Promise<HTMLImageElement | null> {
  let found = images.get(url);
  if (!found) {
    found = new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => { images.delete(url); resolve(null); };
      image.src = url;
    });
    images.set(url, found);
  }
  return found;
}

const SIZE = { width: 300, height: 450 };

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const luminance = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

// Recolours a mask. Pixels at the mask's typical brightness take the colour exactly; darker or
// lighter detail inside the mask (eyes, ears, shading) keeps its relative brightness.
function tint(mask: HTMLImageElement, color: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE.width;
  canvas.height = SIZE.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(mask, 0, 0, SIZE.width, SIZE.height);
  const data = ctx.getImageData(0, 0, SIZE.width, SIZE.height);
  const px = data.data;
  const values: number[] = [];
  for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 200) values.push(luminance(px[i], px[i + 1], px[i + 2]));
  if (!values.length) return canvas;
  values.sort((a, b) => a - b);
  const reference = Math.max(values[Math.floor(values.length / 2)], 1);
  const [cr, cg, cb] = hexToRgb(color);
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const factor = Math.min(luminance(px[i], px[i + 1], px[i + 2]) / reference, 1.2);
    px[i] = Math.min(255, cr * factor);
    px[i + 1] = Math.min(255, cg * factor);
    px[i + 2] = Math.min(255, cb * factor);
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

const url = (kind: string, id: string, view: AvatarView, file: string) => `${import.meta.env.BASE_URL}avatars/${kind}/${id}/${view}/${file}.png`;

const cache = new Map<string, HTMLCanvasElement>();

// Resolves to a 300x450 canvas, or null if any artwork failed to load.
export async function renderAvatar(avatar: Avatar, view: AvatarView): Promise<HTMLCanvasElement | null> {
  const key = `${view}|${avatar.body}${avatar.bodyColor}|${avatar.face}${avatar.faceColor}|${avatar.hat}${avatar.hatColor}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const layers: [string, string, string][] = [
    ["bodies", avatar.body, avatar.bodyColor],
    ["faces", avatar.face, avatar.faceColor],
    ["hats", avatar.hat, avatar.hatColor]
  ];
  const loaded = await Promise.all(layers.map(async ([kind, id, color]) => ({
    color, mask: await load(url(kind, id, view, "mask")), outline: await load(url(kind, id, view, "outline"))
  })));
  if (loaded.some(layer => !layer.mask || !layer.outline)) return null;

  const out = document.createElement("canvas");
  out.width = SIZE.width;
  out.height = SIZE.height;
  const ctx = out.getContext("2d")!;
  for (const layer of loaded) {
    ctx.drawImage(tint(layer.mask!, layer.color), 0, 0);
    ctx.drawImage(layer.outline!, 0, 0, SIZE.width, SIZE.height);
  }
  cache.set(key, out);
  if (cache.size > 200) cache.delete(cache.keys().next().value!);
  return out;
}
