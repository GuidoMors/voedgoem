import type { ReactNode } from "react";

export function HostControlsTab({ children, showHeading = true }: { children: ReactNode; showHeading?: boolean }) {
  return (
    <section className="host-controls-tab">
      <div className="card host-controls-panel">
        {children}
      </div>
    </section>
  );
}
