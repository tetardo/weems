import type { ReactNode } from "react";

/** Title of a group of cards (« Vue d'ensemble », « En direct »…), then the cards. */
export function CardGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4">
      <h2 className="m-0 mt-2 text-[11px] font-bold tracking-[.08em] text-muted uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}
