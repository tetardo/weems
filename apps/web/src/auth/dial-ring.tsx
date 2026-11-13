import { DIAL, ringTicks } from "./route-dial-geometry.ts";

const HEADINGS = [
  { label: "360", x: 0, y: -1 },
  { label: "090", x: 1, y: 0 },
  { label: "180", x: 0, y: 1 },
  { label: "270", x: -1, y: 0 },
] as const;

const TICKS = ringTicks();

/** Static part of the login page's dial: heading ring and its ticks, horizon, pitch ladder. */
export function DialRing() {
  const [cx, cy] = DIAL.center;
  const r = DIAL.radius;
  return (
    <>
      <circle cx={cx} cy={cy} r={r + 60} fill="url(#dial-halo)" />
      <g fill="none" className="stroke-dial" strokeWidth={1}>
        <circle cx={cx} cy={cy} r={r} strokeOpacity={0.45} />
        <circle cx={cx} cy={cy} r={r - 46} strokeOpacity={0.14} />
        <circle cx={cx} cy={cy} r={r - 96} strokeOpacity={0.1} />
        <circle cx={cx} cy={cy} r={r + 30} strokeOpacity={0.12} strokeDasharray="1 6" />
        {TICKS.map((tick) => (
          <path key={tick.d} d={tick.d} strokeOpacity={tick.major ? 0.55 : 0.3} />
        ))}
        <path d={`M${cx - r} ${cy}H${cx + r}`} strokeOpacity={0.28} />
        <path
          d={`M${cx - 34} ${cy - 30}h68M${cx - 20} ${cy - 60}h40M${cx - 34} ${cy + 30}h68M${cx - 20} ${cy + 60}h40`}
          strokeOpacity={0.16}
        />
      </g>
      <g
        className="fill-dial font-mono text-[11px] tracking-[.08em]"
        fillOpacity={0.6}
        textAnchor="middle"
      >
        {HEADINGS.map(({ label, x, y }) => (
          <text key={label} x={cx + x * (r + 30)} y={cy + y * (r + 30) + (y === 0 ? 4 : y * 4)}>
            {label}
          </text>
        ))}
      </g>
    </>
  );
}
