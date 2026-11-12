/**
 * Photo of a pilot (at `src`), or the first letter of the name when there is none.
 * `className` sets the size and the letter's font size.
 */
export function PilotAvatar({
  pilot,
  src,
  className,
}: {
  pilot: { name: string; hasPhoto: boolean };
  src: string;
  className: string;
}) {
  return (
    <span
      className={`grid flex-none place-items-center overflow-hidden rounded-full bg-accent font-title text-on-accent ${className}`}
    >
      {pilot.hasPhoto ? (
        // Plain img: served by the API through the site, already 256 px.
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        pilot.name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
