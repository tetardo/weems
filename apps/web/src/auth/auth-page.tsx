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
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,#ff0080_0%,#7928ca_45%,#141727_100%)] p-4">
      <CardBox className="w-full rounded-3xl bg-white/90 backdrop-blur sm:w-[28rem]">
        <p className="mb-1 bg-gradient-fuchsia bg-clip-text text-sm font-black tracking-wide text-transparent uppercase">
          Weems
        </p>
        <h1 className="mb-6 text-2xl font-bold text-[#344767]">{title}</h1>
        <Suspense>{form}</Suspense>
        <hr className="my-6 border-gray-100" />
        <Link href={other.href} className="text-sm font-bold text-[#cb0c9f] hover:underline">
          {other.label}
        </Link>
      </CardBox>
    </main>
  );
}
