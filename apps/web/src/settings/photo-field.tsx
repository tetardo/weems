"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { OWN_PHOTO_URL } from "../site/api-relay.ts";
import { Button } from "../ui/button.tsx";
import { removePhotoAction } from "./profile-actions.ts";

const ACCEPTED = "image/jpeg,image/png,image/webp";
/** Same limit as the API: refused here before sending 5 MB for nothing. */
const MAX_BYTES = 5 * 1024 * 1024;

type Problem = "tooBig" | "wrongType" | "failed" | null;

/** What the API's answer to an upload means: 413 too big, 415 or 422 not a usable image. */
const problemOf = (status: number): Problem =>
  status === 413 ? "tooBig" : status === 415 || status === 422 ? "wrongType" : "failed";

/** Sends the photo; `version` changes after each upload so that the preview reloads. */
function usePhotoUpload() {
  const router = useRouter();
  const [version, setVersion] = useState(0);
  const [problem, setProblem] = useState<Problem>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (file.size > MAX_BYTES) return setProblem("tooBig");
    setBusy(true);
    const response = await fetch(OWN_PHOTO_URL, {
      method: "PUT",
      headers: { "content-type": file.type },
      body: file,
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) return setProblem(response ? problemOf(response.status) : "failed");
    setProblem(null);
    setVersion((v) => v + 1);
    router.refresh();
  }
  return { upload, version, problem, busy };
}

function Preview({ src, initials }: { src: string | null; initials: string }) {
  return (
    <span className="grid size-22 flex-none place-items-center overflow-hidden rounded-full border-3 border-line bg-accent font-title text-3xl text-on-accent">
      {/* Plain img: served by the API, already 256 px. */}
      {src ? <img src={src} alt="" className="size-full object-cover" /> : initials}
    </span>
  );
}

/**
 * Photo of the profile: sent as is to the API through the site's address (raw image body), which
 * crops it to a square, reduces it to 256 px and strips its metadata.
 */
export function PhotoField({ hasPhoto, initials }: { hasPhoto: boolean; initials: string }) {
  const t = useTranslations("Settings.photo");
  const input = useRef<HTMLInputElement>(null);
  const { upload, version, problem, busy } = usePhotoUpload();
  return (
    <div className="mt-1.5 flex items-center gap-4">
      <Preview src={hasPhoto ? `${OWN_PHOTO_URL}?v=${version}` : null} initials={initials} />
      <div>
        <p className="m-0 font-semibold">{t("label")}</p>
        <p className="m-0 text-sm text-muted">{t("help")}</p>
        <div className="mt-2 flex gap-2">
          <input
            ref={input}
            type="file"
            accept={ACCEPTED}
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <Button variant="outline" disabled={busy} onClick={() => input.current?.click()}>
            {hasPhoto ? t("change") : t("add")}
          </Button>
          {hasPhoto && (
            <Button
              variant="ghost"
              className="text-danger"
              onClick={() => void removePhotoAction()}
            >
              {t("remove")}
            </Button>
          )}
        </div>
        {problem && (
          <p role="alert" className="m-0 mt-2 text-sm text-danger">
            {t(problem)}
          </p>
        )}
      </div>
    </div>
  );
}
