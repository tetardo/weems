import { ActivityView } from "../../features/activity/activity-view.tsx";
import { config } from "../../server/console.ts";
import "./activity.css";

export const metadata = { title: "Activité simulée · Weems Admin" };

export default function ActivityPage() {
  const { apiUrl, siteUrl } = config();
  return <ActivityView apiUrl={apiUrl} siteUrl={siteUrl} />;
}
