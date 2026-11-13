/** A figure of a logbook page: label, large value, and a line under it in a tone. */
export function KpiTile({
  label,
  value,
  sub,
  subClass = "text-muted",
}: {
  label: string;
  value: string;
  sub: string;
  subClass?: string;
}) {
  return (
    <div className="rounded-panel border border-line bg-surface px-4 py-3.5">
      <div className="text-[13px] text-muted">{label}</div>
      <div className="mt-0.5 font-title text-[26px] tabular-nums">{value}</div>
      <div className={`text-[12.5px] ${subClass}`}>{sub}</div>
    </div>
  );
}
