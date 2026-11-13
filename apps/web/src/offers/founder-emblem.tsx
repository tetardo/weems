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
        d="M30 84c8 4 18 6 30 6s22-2 30-6M38 94c7 3 14 4 22 4s15-1 22-4"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <text
        x={60}
        y={68}
        textAnchor="middle"
        fill="currentColor"
        className="font-title"
        fontSize={label.length > 3 ? 24 : 28}
        fontWeight={700}
      >
        {label}
      </text>
    </svg>
  );
}
