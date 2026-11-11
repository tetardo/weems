import type { ReactNode } from "react";

/** Content of a page: same width and margins everywhere (Admin One). */
export function SectionMain({ children }: { children: ReactNode }) {
  return <main className="w-full p-6 xl:mx-auto xl:max-w-6xl">{children}</main>;
}
