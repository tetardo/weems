import type { ReactNode } from "react";
import { Suspense } from "react";
import { Link } from "../i18n/navigation.ts";

interface Props {
  title: string;
  form: ReactNode;
  other: { href: "/login" | "/signup"; label: string };
}

/** Layout shared by the login and sign-up pages. */
export function AuthPage({ title, form, other }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Suspense>{form}</Suspense>
      <Link href={other.href} className="text-sm underline">
        {other.label}
      </Link>
    </main>
  );
}
