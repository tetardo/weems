"use client";

import { Field, TextInput } from "@weems/ui";
import { useId } from "react";

/** A whole number with its unit on the right (form model C, fiche 008). */
export function NumberField(props: {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <Field label={props.label} htmlFor={id}>
      <TextInput
        id={id}
        type="number"
        inputMode="numeric"
        min={props.min}
        max={props.max}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
        end={
          props.unit && <span className="text-sm whitespace-nowrap text-muted">{props.unit}</span>
        }
      />
    </Field>
  );
}
