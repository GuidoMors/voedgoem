import { createContext, memo, useContext, useEffect, useRef } from "react";
import { defaultAvatar, type Avatar as AvatarData, type AvatarView } from "./model";
import { renderAvatar } from "./render";

export const AvatarsContext = createContext<Record<string, AvatarData>>({});

interface AvatarProps {
  avatar: AvatarData;
  view?: AvatarView;
  size?: number;
  className?: string;
}

export const Avatar = memo(function Avatar({ avatar, view = "front", size = 36, className }: AvatarProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { body, bodyColor, face, faceColor, hat, hatColor } = avatar;

  useEffect(() => {
    let stale = false;
    void renderAvatar({ body, bodyColor, face, faceColor, hat, hatColor }, view).then(source => {
      const canvas = ref.current;
      if (stale || !canvas || !source) return;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    });
    return () => { stale = true; };
  }, [body, bodyColor, face, faceColor, hat, hatColor, view]);

  const ratio = Math.min((window.devicePixelRatio || 1) * 1.3, 3);
  const width = Math.round(size * ratio);
  const height = Math.round(size * 1.5 * ratio);
  return <canvas ref={ref} className={`avatar ${className ?? ""}`} width={width} height={height} style={{ width: size, height: size * 1.5 }} />;
});

// A name with the person's avatar beside it; avatars come from the lobby, falling back to a stable default.
export function Person({ id, name, size = 28, avatar }: { id: string; name: string; size?: number; avatar?: AvatarData | null }) {
  const avatars = useContext(AvatarsContext);
  return <span className="person"><Avatar avatar={avatar ?? avatars[id] ?? defaultAvatar(id)} size={Math.round(size * 1.3)} /><span className="person-name">{name}</span></span>;
}
