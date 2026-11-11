import type { ReactNode } from "react";
import { CardBox } from "../ui/card-box.tsx";

/** A titled block of the flight page, in a card. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <CardBox className="mb-6">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </CardBox>
  );
}
