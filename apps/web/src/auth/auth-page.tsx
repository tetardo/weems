import type { ReactNode } from "react";
import { Suspense } from "react";
import { Link } from "../i18n/navigation.ts";
import { CardBox } from "../ui/card-box.tsx";

interface Props {
  title: string;
  form: ReactNode;
  other: { href: "/login" | "/signup"; label: string };
}

/** Login and sign-up pages: a card on a full-screen gradient (Admin One login page). */
export function AuthPage({ title, form, other }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-tr from-sky-500 via-blue-600 to-indigo-800 p-4">
      <CardBox className="w-full shadow-2xl sm:w-[28rem]">
        <p className="mb-1 text-sm font-black tracking-wide text-blue-600 uppercase">Weems</p>
        <h1 className="mb-6 text-2xl">{title}</h1>
        <Suspense>{form}</Suspense>
        <hr className="my-6 border-gray-100" />
        <Link href={other.href} className="text-sm text-blue-600 hover:underline">
          {other.label}
        </Link>
      </CardBox>
    </main>
  );
}
