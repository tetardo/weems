"use client";

import { useRef, useState } from "react";
import { MenuIcon } from "../../ui/icons.ts";
import { useDismiss } from "../../ui/use-dismiss.ts";

export interface MenuItem {
  label: string;
  danger?: boolean;
  onSelect: () => void;
}

/** The « … » menu of a row; closes on a click elsewhere or Escape. */
export function RowMenu({
  title,
  items,
  note,
}: {
  title: string;
  items: MenuItem[];
  note?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  useDismiss(open, box, () => setOpen(false));
  return (
    <span ref={box}>
      <button
        className="iconbtn"
        aria-label={title}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <MenuIcon size={18} />
      </button>
      {open && (
        <div className="pop" role="menu">
          <div className="pt">{title}</div>
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              className={item.danger ? "dg" : ""}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
          {note && <div className="pn">{note}</div>}
        </div>
      )}
    </span>
  );
}
