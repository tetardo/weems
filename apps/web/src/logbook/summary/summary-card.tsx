import type { ReactNode } from "react";
import type { IconComponent } from "../../ui/icons.ts";

/** A block of the Résumé: icon, title, a muted note or link on the right, then its content. */
export function SummaryCard({
  icon: Icon,
  title,
  aside,
  className = "",
  children,
}: {
  icon: IconComponent;
  title: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-panel border border-line bg-surface px-5 py-4 ${className}`}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="m-0 flex items-center gap-2 text-[16px]">
          <Icon size={18} className="flex-none text-link" aria-hidden="true" />
          {title}
        </h2>
        {aside && <span className="text-[12.5px] text-muted">{aside}</span>}
      </div>
      {children}
    </section>
  );
}
