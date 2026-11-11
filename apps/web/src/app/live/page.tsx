import { LiveView } from "../../live/live-view.tsx";

export const metadata = { title: "Weems · Carte en direct" };

/** Spec J1, part 4: the minimal live map. */
export default function LivePage() {
  return <LiveView apiUrl={process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3000"} />;
}
