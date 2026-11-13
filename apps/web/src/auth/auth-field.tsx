"use client";

import { useTranslations } from "next-intl";
import { type InputHTMLAttributes, useId, useState } from "react";
import { BARE_INPUT_CLASS, CONTROL_CLASS, Field, type IconComponent } from "@weems/ui";
import { HideIcon, PrivateIcon, ShowIcon } from "../ui/icons.ts";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** A required field of the login pages: label above, icon inside the frame, optional end button. */
export function AuthField({
  label,
  icon: Icon,
  end,
  ...input
}: { label: string; icon: IconComponent; end?: React.ReactNode } & InputProps) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} className="mb-4">
      <span className={`${CONTROL_CLASS} h-12 border-line`}>
        <Icon size={18} aria-hidden="true" className="flex-none text-muted" />
        <input id={id} required className={BARE_INPUT_CLASS} {...input} />
        {end}
      </span>
    </Field>
  );
}

/** Password field with a button that shows or hides what was typed. */
export function PasswordField({ label, ...input }: { label: string } & InputProps) {
  const t = useTranslations("Auth");
  const [shown, setShown] = useState(false);
  const Icon = shown ? HideIcon : ShowIcon;
  return (
    <AuthField
      label={label}
      icon={PrivateIcon}
      type={shown ? "text" : "password"}
      end={
        <button
          type="button"
          onClick={() => setShown(!shown)}
          aria-label={t(shown ? "hidePassword" : "showPassword")}
          aria-pressed={shown}
          className="-mr-1 grid size-9 flex-none place-items-center rounded-control text-muted hover:text-ink"
        >
          <Icon size={18} aria-hidden="true" />
        </button>
      }
      {...input}
    />
  );
}
