import type { ReactNode } from "react";

/**
 * A bubble above an element, shown on hover and when it has the keyboard focus (airport names and
 * pilots of the Boarding page). The text is also the element's accessible name, given by the
 * caller.
 */
export function HoverBubble({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="group/bubble relative inline-flex max-w-full min-w-0">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-0 z-20 mb-1.5 w-max max-w-64 rounded-control bg-ink px-2.5 py-1.5 font-sans text-xs leading-snug font-normal tracking-normal whitespace-normal text-bg normal-case opacity-0 shadow-lg transition-opacity group-focus-within/bubble:visible group-focus-within/bubble:opacity-100 group-hover/bubble:visible group-hover/bubble:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
