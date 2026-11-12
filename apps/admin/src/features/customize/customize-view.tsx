"use client";

import type { HomeImages, HomeTheme } from "@weems/contrats";
import { SaveBar } from "@weems/ui";
import { useState } from "react";
import { type CustomizePage, saveCustomization } from "../../actions/customize.ts";
import { ErrorBox } from "../../ui/error-box.tsx";
import { CustomizeIcon, ExternalIcon, InfoIcon } from "../../ui/icons.ts";
import { PageTitle } from "../../ui/page-title.tsx";
import { THEMES, type ThemeDraft, changesOf, draftOf, missingLabels, planOf } from "./plan.ts";
import { ThemeCard } from "./theme-card.tsx";

type Drafts = Record<HomeTheme, ThemeDraft>;
type Files = Record<HomeTheme, string | null>;

const draftsOf = (images: HomeImages): Drafts => ({
  light: draftOf(images.light),
  dark: draftOf(images.dark),
});

/** Preview address of each theme: the file just chosen, the saved image, or the default one. */
function sourceOf(theme: HomeTheme, page: CustomizePage, draft: ThemeDraft, file: string | null) {
  if (file) return file;
  const image = page.images[theme];
  if (image && !draft.reset) return new URL(image.path, page.apiUrl).toString();
  return `${page.siteUrl}/home/default.jpg`;
}

/** Object URLs of the chosen files, for the previews; the old one is freed when replaced. */
function useFiles() {
  const [files, setFiles] = useState<Files>({ light: null, dark: null });
  const choose = (theme: HomeTheme, file: File | null) =>
    setFiles((old) => {
      if (old[theme]) URL.revokeObjectURL(old[theme]);
      return { ...old, [theme]: file ? URL.createObjectURL(file) : null };
    });
  return { files, choose };
}

function Title({ siteUrl }: { siteUrl: string }) {
  return (
    <PageTitle
      icon={<CustomizeIcon />}
      title="Accueil"
      subtitle="L'image de fond de la page d'accueil, une par thème. Elle est envoyée à l'API : elle vaut pour le site qui lit cette API."
      actions={
        <a className="btn ghost" href={`${siteUrl}/fr`} target="_blank" rel="noreferrer">
          <ExternalIcon size={16} /> Voir la page d&apos;accueil
        </a>
      }
    />
  );
}

function Rules() {
  return (
    <div className="note">
      <InfoIcon size={16} />
      <div>
        <b>
          JPEG, PNG ou WebP, 15 Mo au plus, 1 024 px de large au minimum (2 560 px pour un écran
          Retina).
        </b>{" "}
        L&apos;API la réduit à 2 560 px, la convertit en WebP et retire ses métadonnées. Le voile de
        l&apos;accueil garde le texte lisible. Sans crédit ni licence, l&apos;image n&apos;est pas
        enregistrée.
      </div>
    </div>
  );
}

function unsavedOf(count: number, blocked: boolean): string | null {
  if (count === 0) return null;
  const changes = count === 1 ? "1 thème modifié" : `${count} thèmes modifiés`;
  return blocked ? `${changes} · crédit et licence obligatoires` : changes;
}

interface SaveState {
  busy: boolean;
  error: string | null;
  saved: boolean;
}

/** Sends the form; on success the page starts again from what the API keeps. */
function useSave(onSaved: (images: HomeImages) => void) {
  const [state, setState] = useState<SaveState>({ busy: false, error: null, saved: false });
  async function save(form: FormData) {
    setState({ busy: true, error: null, saved: false });
    const result = await saveCustomization(form);
    if (!result.ok) return setState({ busy: false, error: result.error, saved: false });
    onSaved(result.value);
    setState({ busy: false, error: null, saved: true });
  }
  return { state, save };
}

interface Editor {
  page: CustomizePage;
  drafts: Drafts;
  setDrafts: (change: (old: Drafts) => Drafts) => void;
  files: Files;
  choose: (theme: HomeTheme, file: File | null) => void;
  same: boolean;
}

/** The two theme cards; with « même image », the dark one shows the light one's image. */
function ThemeCards({ page, drafts, setDrafts, files, choose, same }: Editor) {
  return (
    <div className="hcols">
      {THEMES.map((theme) => {
        const source = same && theme === "dark" ? "light" : theme;
        return (
          <ThemeCard
            key={theme}
            theme={theme}
            image={page.images[theme]}
            draft={drafts[theme]}
            src={sourceOf(source, page, drafts[source], files[source])}
            follows={same && theme === "dark"}
            onDraft={(draft) => setDrafts((old) => ({ ...old, [theme]: draft }))}
            onFile={(file) => choose(theme, file)}
          />
        );
      })}
    </div>
  );
}

/** Page Personnalisation (spec J4 personnalisation): one card per theme, one Enregistrer. */
export function CustomizeView({ initial }: { initial: CustomizePage }) {
  const [page, setPage] = useState(initial);
  const [drafts, setDrafts] = useState(() => draftsOf(initial.images));
  const [same, setSame] = useState(false);
  const { files, choose } = useFiles();
  const { state, save } = useSave((images) => {
    setPage({ ...page, images });
    setDrafts(draftsOf(images));
    THEMES.forEach((theme) => choose(theme, null));
    setSame(false);
  });
  const changes = changesOf(planOf(drafts, page.images, same));
  const shown = same ? (["light"] as const) : THEMES;
  const blocked = shown.some((theme) => missingLabels(drafts[theme], page.images[theme]));
  return (
    <>
      <Title siteUrl={page.siteUrl} />
      {!page.loggedIn && (
        <ErrorBox message="Connectez-vous d'abord dans la page Comptes : l'API n'accepte ces changements que d'un administrateur." />
      )}
      <ErrorBox message={state.error} />
      <form action={save} className="hform">
        <section className="panel">
          <ThemeCards {...{ page, drafts, setDrafts, files, choose, same }} />
          <label className="hsame">
            <input
              type="checkbox"
              name="same"
              checked={same}
              onChange={(event) => setSame(event.target.checked)}
            />
            Utiliser la même image pour les deux thèmes
          </label>
        </section>
        <Rules />
        <SaveBar
          unsaved={unsavedOf(changes, blocked)}
          message={state.saved ? <span className="muted">Enregistré.</span> : null}
          label={state.busy ? "Envoi…" : "Enregistrer"}
          pending={state.busy || blocked || changes === 0}
        />
      </form>
    </>
  );
}
