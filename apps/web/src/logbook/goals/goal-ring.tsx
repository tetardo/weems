/** Share of the goal reached, as a ring around its percent (maquette v12 B). */
export function GoalRing({ share, color }: { share: number; color: string }) {
  const r = 22;
  const length = 2 * Math.PI * r;
  const done = Math.min(Math.max(share, 0), 1);
  return (
    <svg viewBox="0 0 56 56" className="size-14 flex-none" aria-hidden="true">
      <circle cx={28} cy={28} r={r} fill="none" strokeWidth={5} className="stroke-line" />
      <circle
        cx={28}
        cy={28}
        r={r}
        fill="none"
        strokeWidth={5}
        strokeLinecap="round"
        stroke={color}
        strokeDasharray={`${done * length} ${length}`}
        transform="rotate(-90 28 28)"
      />
      <text x={28} y={32} textAnchor="middle" className="fill-ink text-[11px] font-semibold">
        {Math.round(share * 100)} %
      </text>
    </svg>
  );
}
