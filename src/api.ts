const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const TOKEN_KEY = "voedgoem-token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string | null) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = void>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, (body as { error?: string }).error ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function lobbySocketUrl(lobbyId: string) {
  const base = API_BASE || window.location.origin;
  return `${base.replace(/^http/, "ws")}/api/lobbies/${encodeURIComponent(lobbyId)}/ws?token=${encodeURIComponent(getToken() ?? "")}`;
}

export function hubChatSocketUrl() {
  const base = API_BASE || window.location.origin;
  return `${base.replace(/^http/, "ws")}/api/chat/hub/ws?token=${encodeURIComponent(getToken() ?? "")}`;
}
