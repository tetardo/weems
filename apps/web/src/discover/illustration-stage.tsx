import type { ReactNode } from "react";
import { SimpleIcon } from "../ui/icons.ts";

/**
 * Soft shapes drawn behind the illustrations (viewBox 0 0 100 100, stretched to the frame), so a
 * screen sits on a rounded patch of colour instead of a bare square. One per step, in turn.
 */
const BLOBS = [
  "M8 18 C20 2 62 0 84 8 C98 14 100 40 96 62 C92 86 70 100 44 96 C18 92 2 78 2 52 C2 36 0 26 8 18Z",
  "M14 8 C36 -2 76 4 92 20 C102 32 98 58 90 76 C80 96 50 100 28 92 C8 86 0 64 4 40 C6 26 4 14 14 8Z",
  "M4 30 C8 10 30 2 56 4 C82 6 98 20 98 46 C98 72 86 94 60 98 C34 100 10 90 4 68 C0 54 2 40 4 30Z",
] as const;
/** Smaller warm shape, offset from the first: gives the patch two tones. */
const ACCENT_BLOB =
  "M30 6 C52 -2 84 6 94 28 C102 48 88 70 66 74 C44 78 22 66 16 44 C12 28 16 12 30 6Z";

/**
 * Frame of one illustration: the screen is as wide as the text column, two soft shapes behind
 * (cyan and orange) spill a little towards the outer edge, a little drawn scene above it, the fictitious screen in front and a short warm note that says what the screen shows.
 * Decorative: the step text already says the same thing to screen readers.
 */
export function IllustrationStage({
  index,
  note,
  scene,
  children,
}: {
  index: number;
  note: string;
  /** Little drawn scene shown above the screen. */
  scene: ReactNode;
  children: ReactNode;
}) {
  const flipped = index % 2 === 1;
  return (
    <div aria-hidden="true" className="relative w-full max-w-[520px] pt-5 pb-14">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={`absolute top-0 bottom-0 h-full w-[calc(100%+40px)] ${flipped ? "-left-10" : "left-0"}`}
      >
        <path d={BLOBS[index % BLOBS.length]} className="fill-accent/16" />
        <path
          d={ACCENT_BLOB}
          className="fill-accent-2/14"
          transform={flipped ? "translate(-10 30)" : "translate(14 28)"}
        />
      </svg>
      <div className="relative">
        {scene}
        {children}
      </div>
      <p
        className={`absolute bottom-3 m-0 flex max-w-[85%] items-center gap-2 rounded-full border border-accent-2/40 bg-surface px-3.5 py-1.5 text-[13px] font-medium text-ink shadow-raised ${flipped ? "left-4" : "right-4"}`}
      >
        <SimpleIcon size={15} className="flex-none text-accent-2" />
        {note}
      </p>
    </div>
  );
}
