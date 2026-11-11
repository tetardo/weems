"use client";

import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react";
import {
  Button,
  ComboBox,
  type Key,
  Input,
  ListBox,
  ListBoxItem,
  Popover,
} from "react-aria-components";
import { ChevronIcon, DoneIcon } from "../icons.ts";
import { BARE_INPUT_CLASS, CONTROL_CLASS } from "./input-class.ts";

export interface SearchOption {
  value: string;
  label: string;
  /** Drawn before the label, in the list and in the field once chosen (a flag). */
  icon?: ReactNode;
}

/**
 * Tells the form that the choice changed: the list writes its value in a hidden input, which
 * sends no event of its own (the form counts its changes, fiche 008).
 */
function useChangeEvent(key: Key | null) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    ref.current?.dispatchEvent(new Event("change", { bubbles: true }));
  }, [key]);
  return ref;
}

/** The list under the field, as wide as it, filtered by what is typed. */
function OptionList({
  items,
  empty,
  frame,
}: {
  items: readonly SearchOption[];
  empty: string;
  frame: RefObject<HTMLDivElement | null>;
}) {
  return (
    <Popover
      triggerRef={frame}
      offset={6}
      className="max-h-72 w-(--trigger-width) overflow-auto rounded-xl border border-line bg-surface p-1.5 shadow-floating"
    >
      <ListBox
        items={items}
        renderEmptyState={() => <p className="m-0 px-2.5 py-2 text-sm text-muted">{empty}</p>}
        className="outline-none"
      >
        {(item) => (
          <ListBoxItem
            id={item.value}
            textValue={item.label}
            className="flex min-h-9.5 cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 text-sm outline-none data-focused:bg-ink/9 data-selected:font-semibold data-selected:text-link"
          >
            {({ isSelected }) => (
              <>
                {item.icon}
                <span className={item.value === "" ? "text-muted" : ""}>{item.label}</span>
                {isSelected && <DoneIcon size={16} aria-hidden="true" className="ml-auto" />}
              </>
            )}
          </ListBoxItem>
        )}
      </ListBox>
    </Popover>
  );
}

/**
 * A long list to search in, such as the countries (fiche 008): type a few letters, pick with the
 * mouse or the arrow keys. React Aria's combo box (keyboard, screen readers, mobile). The form
 * receives the value of the chosen option under `name`; `none` is the empty choice, listed first.
 */
export function SearchSelect({
  name,
  label,
  options,
  defaultValue,
  none,
  empty,
}: {
  name: string;
  label: string;
  options: readonly SearchOption[];
  defaultValue: string | null;
  none: string;
  empty: string;
}) {
  const [selected, setSelected] = useState<Key | null>(defaultValue ?? "");
  const ref = useChangeEvent(selected);
  const frame = useRef<HTMLDivElement>(null);
  const items = [{ value: "", label: none }, ...options];
  const icon = options.find((option) => option.value === selected)?.icon;
  return (
    <div ref={ref}>
      <ComboBox
        aria-label={label}
        name={name}
        formValue="key"
        menuTrigger="focus"
        defaultItems={items}
        selectedKey={selected}
        onSelectionChange={setSelected}
      >
        <div ref={frame} className={`${CONTROL_CLASS} border-line pr-1`}>
          {icon}
          <Input className={BARE_INPUT_CLASS} />
          <Button className="grid size-9 place-items-center rounded-[8px] text-muted hover:text-ink">
            <ChevronIcon size={16} aria-hidden="true" />
          </Button>
        </div>
        <OptionList items={items} empty={empty} frame={frame} />
      </ComboBox>
    </div>
  );
}
