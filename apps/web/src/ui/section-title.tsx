import type { ReactNode } from "react";
import { Icon } from "./icon.tsx";

/**
 * Title of a page (`main`, round icon, h1) or of a block of the page (small icon, h2),
 * with optional content on the right.
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
    <div className={`${main ? "" : "pt-6"} mb-6 flex items-center justify-between gap-3`}>
      <div className="flex items-center">
        {main ? (
          <Icon
            path={icon}
            size={24}
            className="mr-3 h-12 w-12 rounded-xl bg-gradient-fuchsia text-white shadow-soft-sm"
          />
        ) : (
          <Icon path={icon} size={20} className="mr-2" />
        )}
        {main ? (
          <h1 className="text-2xl leading-tight font-bold text-[#344767]">{title}</h1>
        ) : (
          <h2 className="text-lg leading-tight font-bold text-[#344767]">{title}</h2>
        )}
      </div>
      {children}
    </div>
  );
}
