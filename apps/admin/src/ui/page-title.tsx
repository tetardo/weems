import type { ReactNode } from "react";

export function PageTitle(props: {
  icon: ReactNode;
  title: string;
  subtitle: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="ptitle">
      <div>
        <div className="t">
          {props.icon}
          <h1>{props.title}</h1>
        </div>
        <p>{props.subtitle}</p>
      </div>
      {props.actions && <div className="acts">{props.actions}</div>}
    </div>
  );
}
