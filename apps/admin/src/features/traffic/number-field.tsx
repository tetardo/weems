"use client";

export function NumberField(props: {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="f">
      <label>
        {props.label}
        <div className="with-unit">
          <input
            type="number"
            inputMode="numeric"
            min={props.min}
            max={props.max}
            value={props.value}
            onChange={(event) => props.onChange(Number(event.target.value))}
          />
          {props.unit && <span className="u">{props.unit}</span>}
        </div>
      </label>
    </div>
  );
}
