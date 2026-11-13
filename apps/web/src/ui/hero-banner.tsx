import type { ReactNode } from "react";
import type { IconComponent } from "./icons.ts";
import { PhotoBackground, type ThemePhotos } from "./photo-background.tsx";
import { RouteFlourish } from "./route-flourish.tsx";

interface HeroChip {
  icon: IconComponent;
  label: string;
}

interface Props {
  photos: ThemePhotos;
  eyebrow: string;
  title: string;
  /** End of the title, on its own line in the accent gradient. */
  highlight: string;
  lead: string;
  actions: ReactNode;
  /** Glass chips under the actions: what the page holds. */
  chips: readonly HeroChip[];
  /** The two airports of the route drawn on the right. */
  route: [string, string];
}

type TextProps = Omit<Props, "photos" | "route">;

/** Text column of the banner, in a glass card on phones. */
function HeroText({ eyebrow, title, highlight, lead, actions, chips }: TextProps) {
  return (
    <div className="flex max-w-[640px] flex-col gap-5 max-md:gap-3 max-md:rounded-box max-md:p-4 max-md:hero-glass">
      <p className="m-0 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-[.08em] uppercase hero-glass">
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-success motion-safe:animate-pulse"
        />
        {eyebrow}
      </p>
      <h1 className="m-0 text-[54px] leading-[1.02] tracking-[-.025em] max-md:text-[32px]">
        {title}{" "}
        <span className="block bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent">
          {highlight}
        </span>
      </h1>
      <p className="m-0 max-w-[540px] text-[18px] text-hero-muted max-md:text-base">{lead}</p>
      <div className="flex flex-wrap gap-3">{actions}</div>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {chips.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] hero-glass"
          >
            <Icon size={15} aria-hidden="true" className="text-accent" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Photo banner of the public pages (Découvrir, Fonctionnalités; 13/11/2026): photo of the home
 * page, live eyebrow, title ending in the accent gradient, actions, glass chips, and the dashed
 * route of the site, small, in the top right corner (13/11, Greg; plane removed).
 */
export function HeroBanner({ photos, route, ...text }: Props) {
  return (
    <section className="relative isolate overflow-hidden rounded-hero text-hero-ink shadow-floating">
      <PhotoBackground photos={photos} phoneVeil={false} />
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 -z-0 size-[420px] rounded-full bg-accent/25 blur-3xl"
      />
      <RouteFlourish
        from={route[0]}
        to={route[1]}
        className="pointer-events-none absolute top-5 right-6 w-[28%] max-w-[320px] max-md:top-3 max-md:right-2 max-md:w-[52%] max-md:opacity-70"
      />
      <div className="relative flex min-h-[440px] flex-col justify-center px-12 py-14 max-md:min-h-[580px] max-md:justify-end max-md:p-3">
        <HeroText {...text} />
      </div>
    </section>
  );
}
