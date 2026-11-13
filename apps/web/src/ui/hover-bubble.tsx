import type { ReactNode } from "react";

/**
 * A bubble above an element, shown on hover and when it has the keyboard focus (airports and
 * pilots of the Boarding page): solid, in the board's colours, with a small arrow towards the
 * element. `label`, in amber split-flap letters, comes before the text (an airport's code). The
 * caller gives the element its accessible name.
 */
export function HoverBubble({
  text,
  label,
  children,
}: {
  text: string;
  label?: string;
  children: ReactNode;
}) {
  return (
    <span className="group/bubble relative inline-flex max-w-full min-w-0">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-max max-w-72 items-center gap-2 rounded-control border border-board-edge bg-board-head px-3 py-2 font-sans text-[13px] leading-snug font-semibold tracking-normal whitespace-normal text-board-title normal-case shadow-floating group-focus-within/bubble:flex group-hover/bubble:flex"
      >
        {label && (
          <span className="rounded-tag bg-board px-1.5 py-0.5 font-mono text-xs font-bold tracking-[.12em] text-board-ink">
            {label}
          </span>
        )}
        {text}
        <span
          aria-hidden="true"
          className="absolute top-full left-3 -mt-[5px] size-2.5 rotate-45 border-r border-b border-board-edge bg-board-head"
        />
      </span>
    </span>
  );
}
