import { redirect } from "../../../i18n/navigation.ts";

/** Home: the pilot's logbook (a dashboard may come later). */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  redirect({ href: "/flights", locale: (await params).locale });
}
