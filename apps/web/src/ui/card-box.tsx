import type { ReactNode } from "react";

/** Panel of the GameLab pages (.gl-panel): surface, thin border, 16 px corners. `flush`: no padding (tables). */
export function CardBox({
  children,
  flush = false,
  className = "",
}: {
  children: ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-panel border border-line bg-surface ${flush ? "overflow-hidden" : "px-6 py-5"} ${className}`}
    >
      {children}
    </div>
  );
}
