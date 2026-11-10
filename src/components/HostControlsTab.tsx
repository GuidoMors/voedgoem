import type { ReactNode } from "react";

export function HostControlsTab({ children }: { children: ReactNode }) {
  return (
    <section className="host-controls-tab">
      <div className="card host-controls-panel">
        {children}
      </div>
    </section>
  );
}
