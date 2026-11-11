import type { ReactNode } from "react";
import type { IconComponent } from "../icons.ts";

/**
 * One subject of a form, in its own card (model C, fiche 008): title and explanation on the left
 * when the card is wide enough, above the fields otherwise. The card is a size container, so the
 * layout follows its own width, not the screen's. `dashed`: what is never shown to anyone.
 */
export function FormSection({
  title,
  about,
  icon: Icon,
  dashed = false,
  children,
}: {
  title: string;
  about?: string;
  icon?: IconComponent;
  dashed?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`@container rounded-2xl border border-line bg-surface px-6 py-5 ${dashed ? "border-dashed" : ""}`}
    >
      <div className="grid gap-4 @3xl:grid-cols-[15rem_minmax(0,1fr)] @3xl:gap-8">
        <header>
          <h2 className="m-0 flex items-center gap-2 text-[1.1em]">
            {Icon && <Icon size={18} aria-hidden="true" />}
            {title}
          </h2>
          {about && <p className="m-0 mt-1 text-sm text-muted">{about}</p>}
        </header>
        <div className="flex min-w-0 flex-col gap-5">{children}</div>
      </div>
    </section>
  );
}

/** Fields of a section side by side, two per row when the card is wide enough. */
export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid items-start gap-x-4 gap-y-5 @xl:grid-cols-2">{children}</div>;
}
