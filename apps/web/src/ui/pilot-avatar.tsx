import { pilotPhotoUrl } from "../site/api-relay.ts";

/**
 * Photo of a pilot with a public profile, or the first letter of the name when there is none.
 * `className` sets the size and the letter's font size.
 */
export function PilotAvatar({
  pilot,
  className,
}: {
  pilot: { handle: string; name: string; hasPhoto: boolean };
  className: string;
}) {
  return (
    <span
      className={`grid flex-none place-items-center overflow-hidden rounded-full bg-accent font-title text-on-accent ${className}`}
    >
      {pilot.hasPhoto ? (
        // Plain img: served by the API through the site, already 256 px.
        <img src={pilotPhotoUrl(pilot.handle)} alt="" className="size-full object-cover" />
      ) : (
        pilot.name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
