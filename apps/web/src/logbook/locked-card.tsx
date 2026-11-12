import { buttonClass } from "@weems/ui";
import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { PrivateIcon } from "../ui/icons.ts";

/** Grey bars standing for a result: a locked card never shows a real figure (spec, § 2). */
function FakeRows() {
  return (
    <div aria-hidden="true" className="grid gap-4 blur-[3px] select-none">
      {[78, 54, 66].map((width) => (
        <div key={width} className="grid gap-1.5">
          <div className="h-3 rounded-tag bg-line" style={{ width: `${width / 2}%` }} />
          <div className="h-2 rounded-tag bg-accent/30" style={{ width: `${width}%` }} />
        </div>
      ))}
    </div>
  );
}

/**
 * A Pilot Pro block seen by a free pilot (spec carnet privé, § 2): blurred fictitious preview,
 * padlock, what the block brings and the way to the offers.
 */
export function LockedCard({ title, text }: { title: string; text: string }) {
  const t = useTranslations("Logbook.locked");
  return (
    <div className="relative overflow-hidden rounded-box border border-dashed border-line p-4">
      <FakeRows />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-surface/70 px-4 text-center">
        <PrivateIcon size={18} className="text-accent-2" aria-hidden="true" />
        <b className="text-[14px]">{title}</b>
        <p className="m-0 max-w-[34ch] text-[12.5px] text-muted">{text}</p>
        <Link href="/plans" className={`${buttonClass()} mt-1 min-h-9 text-[13px]`}>
          {t("discover")}
        </Link>
      </div>
    </div>
  );
}
