import type { ReactNode } from "react";

/** White rounded block of the Admin One template. `flush`: no inner padding (tables). */
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
    <div className={`rounded-2xl bg-white shadow-soft ${flush ? "" : "p-6"} ${className}`}>
      {children}
    </div>
  );
}
