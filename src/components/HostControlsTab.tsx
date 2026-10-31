import type { ReactNode } from "react";

export function HostControlsTab({ children }: { children: ReactNode }) {
  return (
    <section className="host-controls-tab">
      <div className="card host-controls-panel">
        <h2>Host controls &amp; rules</h2>
        {children}
      </div>
    </section>
  );
}
