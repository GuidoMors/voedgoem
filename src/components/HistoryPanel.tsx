import { createContext, useContext, useEffect, type ReactNode } from "react";
import { Modal } from "./Modal";

interface HistoryState {
  open: boolean;
  setAvailable: (available: boolean) => void;
  close: () => void;
}

export const HistoryContext = createContext<HistoryState>({ open: false, setAvailable: () => undefined, close: () => undefined });

// A game lobby renders this with its move history; the top bar's History tab decides whether it is shown.
export function HistoryPanel({ title, children }: { title: string; children: ReactNode }) {
  const { open, setAvailable, close } = useContext(HistoryContext);
  useEffect(() => {
    setAvailable(true);
    return () => setAvailable(false);
  }, [setAvailable]);
  if (!open) return null;
  return <Modal title={title} onClose={close} wide>{children}</Modal>;
}
