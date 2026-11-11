import { TrafficView } from "../../features/traffic/traffic-view.tsx";
import { config } from "../../server/console.ts";

export const metadata = { title: "Trafic simulé · Weems Admin" };

export default function TrafficPage() {
  const { apiUrl, siteUrl } = config();
  return <TrafficView apiUrl={apiUrl} siteUrl={siteUrl} />;
}
