"use client";

import type { HomeImage, HomeTheme } from "@weems/contrats";
import { Field, Segmented, TextInput } from "@weems/ui";
import { useRef } from "react";
import { DarkThemeIcon, DefaultImageIcon, LightThemeIcon, UploadIcon } from "../../ui/icons.ts";
import type { ThemeDraft } from "./plan.ts";
import { Preview } from "./preview.tsx";

const NAMES: Record<HomeTheme, string> = { light: "Thème clair", dark: "Thème sombre" };
const FOCUS = [
  { value: "left", label: "Gauche" },
  { value: "center", label: "Centre" },
  { value: "right", label: "Droite" },
] as const;
/** Below this width the image looks blurred on a Retina screen (spec, part 1). */
const SHARP_WIDTH = 2560;

interface Props {
  theme: HomeTheme;
  image: HomeImage | null;
  draft: ThemeDraft;
  /** Image shown in the preview: the file just chosen, the saved one, or the default. */
  src: string;
  /** With « même image », the dark theme follows the light one. */
  follows: boolean;
  onDraft: (draft: ThemeDraft) => void;
  onFile: (file: File | null) => void;
}

function Status({ image, draft }: { image: HomeImage | null; draft: ThemeDraft }) {
  if (draft.file) return <span className="badge new">nouvelle image : {draft.file}</span>;
  if (draft.reset || !image) return <span className="badge">image par défaut</span>;
  const blurred = image.width < SHARP_WIDTH;
  return (
    <span className={blurred ? "badge warn" : "badge ok"}>
      {image.width} × {image.height} px{blurred ? " · floue sur écran Retina" : ""}
    </span>
  );
}

function ImageButtons({ theme, draft, onDraft, onFile }: Omit<Props, "image" | "src" | "follows">) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="hrow">
      <label className="btn ghost">
        <UploadIcon size={16} /> Remplacer
        <input
          ref={input}
          type="file"
          name={`${theme}.file`}
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            onFile(file);
            onDraft({ ...draft, file: file?.name ?? null, reset: false });
          }}
        />
      </label>
      <button
        type="button"
        className="btn ghost"
        onClick={() => {
          if (input.current) input.current.value = "";
          onFile(null);
          onDraft({ ...draft, file: null, reset: true });
        }}
      >
        <DefaultImageIcon size={16} /> Image par défaut
      </button>
      <input type="hidden" name={`${theme}.reset`} value={draft.reset ? "1" : ""} />
    </div>
  );
}

function Settings({ theme, draft, onDraft }: Pick<Props, "theme" | "draft" | "onDraft">) {
  const set = (change: Partial<ThemeDraft>) => onDraft({ ...draft, ...change });
  return (
    <>
      <Field
        label="Point important de l'image"
        help="Reste visible sur téléphone, où l'image est recadrée (aperçu en bas à droite)."
      >
        <Segmented
          name={`${theme}.focus`}
          label="Point important de l'image"
          options={FOCUS}
          value={draft.focus}
          onChange={(focus) => set({ focus: focus as ThemeDraft["focus"] })}
        />
      </Field>
      <Field label="Crédit" htmlFor={`${theme}-credit`} help="Auteur et source, obligatoires.">
        <TextInput
          id={`${theme}-credit`}
          name={`${theme}.credit`}
          value={draft.credit}
          maxLength={120}
          placeholder="Image maison Weems"
          onChange={(event) => set({ credit: event.target.value })}
        />
      </Field>
      <Field label="Licence" htmlFor={`${theme}-licence`}>
        <TextInput
          id={`${theme}-licence`}
          name={`${theme}.licence`}
          value={draft.licence}
          maxLength={120}
          placeholder="Tous droits réservés"
          onChange={(event) => set({ licence: event.target.value })}
        />
      </Field>
    </>
  );
}

/** One theme of the page Personnalisation: preview, image buttons, focus, credit and licence. */
export function ThemeCard(props: Props) {
  const { theme, image, draft, src, follows } = props;
  const Icon = theme === "light" ? LightThemeIcon : DarkThemeIcon;
  return (
    <div className="hcol">
      <div className="hhead">
        <Icon size={18} /> {NAMES[theme]}
        {!follows && <Status image={image} draft={draft} />}
      </div>
      <Preview theme={theme} src={src} focus={draft.focus} />
      {follows ? (
        <p className="muted">Même image que le thème clair.</p>
      ) : (
        <>
          <ImageButtons {...props} />
          <Settings {...props} />
        </>
      )}
    </div>
  );
}
