import type { ReactNode } from "react";
import { Button } from "./button.tsx";

/**
 * The one save button of a form (model C, fiche 008), at its foot. While something is unsaved,
 * the bar sticks to the bottom of the screen, above the mobile dock, so it stays in reach.
 * `unsaved`: the count of changes, said in words; `message`: result of the last save.
 */
export function SaveBar({
  unsaved,
  message,
  label,
  pending,
}: {
  unsaved: string | null;
  message: ReactNode;
  label: string;
  pending: boolean;
}) {
  return (
    <div
      className={`z-20 flex items-center justify-end gap-3 rounded-panel ${unsaved ? "sticky bottom-24 bg-surface border border-line px-4 py-3 shadow-floating md:bottom-4" : ""}`}
    >
      {unsaved && (
        <span className="mr-auto flex min-w-0 items-center gap-2 text-sm">
          <span aria-hidden="true" className="size-2 flex-none rounded-full bg-accent-2" />
          {unsaved}
        </span>
      )}
      {message}
      <Button type="submit" disabled={pending}>
        {label}
      </Button>
    </div>
  );
}
