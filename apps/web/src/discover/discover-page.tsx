import type { ThemePhotos } from "../ui/photo-background.tsx";
import { SectionMain } from "../ui/section-main.tsx";
import { DiscoverBanner } from "./discover-banner.tsx";
import { DiscoverNext } from "./discover-next.tsx";
import { DiscoverStepRow } from "./discover-step.tsx";
import { DISCOVER_STEPS } from "./discover-steps.ts";

/**
 * Page /discover (« Découvrir »): the principle of Weems for a visitor. The photo banner, then the
 * six steps along a dashed route (tracker, follow-up, community, simplicity, flying like a crew,
 * progress), then the way to the features and the plans.
 */
export function DiscoverPage({ photos }: { photos: ThemePhotos }) {
  return (
    <SectionMain>
      <DiscoverBanner photos={photos} />
      <ol className="relative m-0 mt-12 list-none p-0 before:absolute before:top-2.5 before:bottom-2.5 before:left-1/2 before:-translate-x-px before:border-l-2 before:border-dashed before:border-line max-md:mt-8 max-md:before:left-[21px]">
        {DISCOVER_STEPS.map((step, index) => (
          <DiscoverStepRow key={step.id} step={step} index={index} />
        ))}
      </ol>
      <DiscoverNext />
    </SectionMain>
  );
}
