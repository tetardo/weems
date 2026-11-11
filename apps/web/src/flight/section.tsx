import type { ReactNode } from "react";
import { CardBox } from "../ui/card-box.tsx";

/** A titled block of the flight page, in a card. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <CardBox className="mb-5">
      <h2 className="mt-0 mb-3 text-[1.2em]">{title}</h2>
      {children}
    </CardBox>
  );
}
