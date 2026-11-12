/**
 * Small « i » with an explanation bubble (spec J4, « Aides »): shown on hover, and on tap on a
 * phone (the button takes the focus). `inline`: next to a text instead of the top right corner.
 */
export function InfoTip({
  text,
  label,
  inline = false,
}: {
  text: string;
  label: string;
  inline?: boolean;
}) {
  return (
    <span
      className={`group z-10 ${inline ? "relative ml-1.5 inline-flex align-middle" : "absolute top-3 right-3"}`}
    >
      <button
        type="button"
        aria-label={label}
        className="grid size-5 cursor-help place-items-center rounded-full border-[1.5px] border-muted font-semibold text-[11.5px] leading-none text-muted hover:border-link hover:text-link focus-visible:border-link focus-visible:text-link"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute top-7 right-[-6px] z-20 w-64 rounded-[10px] bg-ink px-3 py-2.5 text-left text-[12.5px] leading-snug font-normal text-bg opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
