import type { ReactNode } from "react";

/** Pill of a state (« En marche », « Arrêté »…); tones of the mock-ups. */
export type Tone = "ok" | "off" | "live" | "warn" | "err" | "adm";

export function StatusBadge({
  tone,
  dot,
  children,
}: {
  tone: Tone;
  dot?: boolean;
  children: ReactNode;
}) {
  const dotClass =
    tone === "ok" || tone === "live" ? "dot" : tone === "warn" ? "dot warn" : "dot off";
  return (
    <span className={`st ${tone}`}>
      {dot && <i className={dotClass} />}
      {children}
    </span>
  );
}
