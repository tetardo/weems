/**
 * A choice among a few options, all in sight (fiche 008): radio buttons drawn as one bar.
 * Plain inputs, so the form reads it like any field and the arrow keys move the choice.
 */
export function Segmented({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: readonly { value: string; label: string }[];
  defaultValue: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex min-h-11 flex-wrap gap-1 rounded-[10px] border border-line bg-bg p-1"
    >
      {options.map((option) => (
        <label
          key={option.value}
          className="grid min-h-8.5 flex-1 cursor-pointer place-items-center rounded-[7px] px-3 text-sm whitespace-nowrap text-muted transition-colors hover:text-ink has-checked:bg-surface has-checked:font-semibold has-checked:text-ink has-checked:shadow-[0_0_0_1px_var(--color-line)] has-focus-visible:outline-2 has-focus-visible:outline-link"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={option.value === defaultValue}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
