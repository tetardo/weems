import type { ReactNode } from "react";

/** One block of a section: icon and title, optional hint on the right, then its content. */
export function Block(props: {
  icon: ReactNode;
  title: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`sv-block ${props.className ?? ""}`}>
      <div className="sv-block-head">
        <h3>
          <span className="sv-icon">{props.icon}</span>
          {props.title}
        </h3>
        {props.hint && <span className="muted">{props.hint}</span>}
      </div>
      {props.children}
    </div>
  );
}
