/** Focus ring shared by every field: accent border and a soft halo (fiche 008). */
const FOCUS =
  "outline-none focus:border-accent focus:ring-3 focus:ring-accent/15 focus-visible:outline-none!";

/** Classes of a plain text, date or long text input: 44 px high at least (fiche 008). */
export const INPUT_CLASS = `min-h-11 [font:inherit] w-full max-w-full rounded-[10px] border border-line bg-bg px-3 py-2.5 font-normal text-ink ${FOCUS}`;

/**
 * Frame of a field made of several parts (icon, prefix, input, status): the frame draws the
 * border and the focus ring, the input inside has none. Exactly 44 px high, like every field.
 */
export const CONTROL_CLASS =
  "flex h-11 w-full min-w-0 items-center gap-2 rounded-[10px] border bg-bg px-3 text-ink focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/15";

/** The input inside a CONTROL_CLASS frame. */
export const BARE_INPUT_CLASS =
  "h-full min-w-0 flex-1 border-0 bg-transparent p-0 [font:inherit] font-normal text-ink outline-none placeholder:text-muted/70 focus-visible:outline-none!";
