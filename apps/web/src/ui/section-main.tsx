import type { ReactNode } from "react";

/** Content of a page: same width and margins everywhere (GameLab .gl-page, 1200 px). */
export function SectionMain({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-12 sm:px-6">{children}</main>;
}
