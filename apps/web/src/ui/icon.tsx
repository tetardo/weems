/** A Material Design icon (path from @mdi/js). */
export function Icon({
  path,
  size = 18,
  className = "",
}: {
  path: string;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path fill="currentColor" d={path} />
      </svg>
    </span>
  );
}
