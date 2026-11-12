"use client";

import type { ActivityLaunch } from "../../server/activity/launch.ts";
import { InfoIcon, StartIcon } from "../../ui/icons.ts";

export interface FormProps {
  disabled: boolean;
  /** Why launching is refused, or a reminder; shown next to the button. */
  note: string;
  onLaunch: (launch: ActivityLaunch) => void;
}

export function Header(props: { icon: React.ReactNode; step: string; title: string }) {
  return (
    <div className="hd">
      <div className="ic">{props.icon}</div>
      <div>
        <span className="n">{props.step}</span>
        <h3>{props.title}</h3>
      </div>
    </div>
  );
}

export function Foot(props: {
  note: string;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="foot">
      <span className="note">
        <InfoIcon size={14} /> {props.note}
      </span>
      <button className="btn" disabled={props.disabled} onClick={props.onClick}>
        <StartIcon size={16} /> {props.label}
      </button>
    </div>
  );
}
