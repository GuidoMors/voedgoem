import type { ReactNode } from "react";

export function HostControlsTab({ children, showHeading = true }: { children: ReactNode; showHeading?: boolean }) {
  return (
    <section className="host-controls-tab">
      <div className="card host-controls-panel">
        {showHeading && <h2>Host controls &amp; rules</h2>}
        {children}
      </div>
    </section>
  );
}
