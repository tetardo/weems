import type { ReactNode } from "react";
import { Icon } from "./icon.tsx";

/**
 * Title of a page (`main`, h1) or of a block of the page (h2), in Space Grotesk as on the
 * GameLab pages, with optional content on the right.
 */
export function SectionTitle({
  icon,
  title,
  main = false,
  children,
}: {
  icon: string;
  title: string;
  main?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`${main ? "" : "pt-6"} mb-4 flex flex-wrap items-end justify-between gap-3`}>
      <div className="flex items-center gap-2.5">
        <Icon path={icon} size={main ? 26 : 20} className="text-link" />
        {main ? (
          <h1 className="m-0 text-[1.9em]">{title}</h1>
        ) : (
          <h2 className="m-0 text-[1.5em]">{title}</h2>
        )}
      </div>
      {children}
    </div>
  );
}
