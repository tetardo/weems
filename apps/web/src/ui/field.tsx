import type { ReactNode } from "react";
import type { IconComponent } from "./icons.ts";

/** Small pill after a label, such as « Private » (fiche 008). */
export function FieldBadge({ icon: Icon, children }: { icon: IconComponent; children: ReactNode }) {
  return (
    <span className="inline-flex h-5 items-center gap-1 rounded-full bg-accent-2/15 px-2 text-[11px] font-semibold text-accent-2">
      <Icon size={12} aria-hidden="true" />
      {children}
    </span>
  );
}

/**
 * A field of a form (fiche 008): label above, the control, then one help line. `htmlFor` names
 * the control when it is a single input; without it the label is plain text and the control
 * carries its own name (radio group, list with search). `className`: its place in a FieldGrid.
 */
export function Field({
  label,
  htmlFor,
  badge,
  help,
  className = "",
  children,
}: {
  label: string;
  htmlFor?: string;
  badge?: ReactNode;
  help?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const Label = htmlFor ? "label" : "span";
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="flex items-center gap-2">
        <Label htmlFor={htmlFor} className="font-semibold">
          {label}
        </Label>
        {badge}
      </span>
      {children}
      {help && <span className="text-[.9em] text-muted">{help}</span>}
    </div>
  );
}
