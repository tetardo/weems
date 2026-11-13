/**
 * Emblem of the founder offer: a wing badge with the number, drawn in the founder colour
 * (global.css --color-founder), so the theme decides. Decorative.
 */
export function FounderEmblem({ label, className = "" }: { label: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={`text-founder ${className}`}>
      <circle cx={60} cy={60} r={52} fill="currentColor" fillOpacity={0.1} />
      <circle cx={60} cy={60} r={52} stroke="currentColor" strokeWidth={2} fill="none" />
      <circle
        cx={60}
        cy={60}
        r={44}
        stroke="currentColor"
        strokeOpacity={0.45}
        strokeDasharray="2 5"
        fill="none"
      />
      <path
        d="M14 58c12 2 22 6 30 12M106 58c-12 2-22 6-30 12M20 48c10 2 18 5 25 10M100 48c-10 2-18 5-25 10"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <text
        x={60}
        y={70}
        textAnchor="middle"
        fill="currentColor"
        className="font-title"
        fontSize={label.length > 3 ? 24 : 30}
        fontWeight={700}
      >
        {label}
      </text>
    </svg>
  );
}
