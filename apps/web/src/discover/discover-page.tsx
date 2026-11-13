import type { ThemePhotos } from "../ui/photo-background.tsx";
import { CardBox } from "../ui/card-box.tsx";
import { SectionMain } from "../ui/section-main.tsx";
import { DiscoverBanner } from "./discover-banner.tsx";
import { DiscoverClosing } from "./discover-closing.tsx";
import { DiscoverStepRow } from "./discover-step.tsx";
import { DISCOVER_STEPS } from "./discover-steps.ts";

/**
 * Page /discover (« Découvrir »): the principle of Weems for a visitor. The photo banner, then the
 * six steps along a dashed route (tracker, follow-up, community, simplicity, flying like a crew,
 * progress), then a closing slogan. The steps sit on one surface panel so the text
 * stands out from the airport plan drawn behind the site.
 */
export function DiscoverPage({ photos }: { photos: ThemePhotos }) {
  return (
    <SectionMain>
      <DiscoverBanner photos={photos} />
      <CardBox flush className="mt-12 px-5 py-6 max-md:mt-8 max-md:px-3 max-md:py-4">
        <ol className="relative m-0 list-none p-0 before:absolute before:top-2.5 before:bottom-2.5 before:left-1/2 before:-translate-x-px before:border-l-2 before:border-dashed before:border-line max-md:before:left-[21px]">
          {DISCOVER_STEPS.map((step, index) => (
            <DiscoverStepRow key={step.id} step={step} index={index} />
          ))}
        </ol>
      </CardBox>
      <DiscoverClosing />
    </SectionMain>
  );
}
