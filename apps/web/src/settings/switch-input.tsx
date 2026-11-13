import type { ChangeEvent } from "react";

/**
 * A checkbox of the settings form drawn as a switch: sent as `name=on` when on, like any box.
 * Controlled with `checked` and `onChange`, or left to the form with `defaultChecked`.
 */
export function SwitchInput(props: {
  name: string;
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const { label, ...input } = props;
  return (
    <label className="relative inline-flex flex-none cursor-pointer items-center">
      <span className="sr-only">{label}</span>
      <input type="checkbox" role="switch" className="peer sr-only" {...input} />
      <span className="h-6.5 w-11.5 rounded-full bg-line transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-link" />
      <span className="absolute top-0.75 left-0.75 size-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
    </label>
  );
}
