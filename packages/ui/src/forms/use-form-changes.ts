"use client";

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { type FormSnapshot, countChanges, snapshotOf } from "./form-changes.ts";

/**
 * Number of fields changed since the form was shown or last saved, updated as the pilot types
 * (fiche 008, save bar). `markSaved`: the current values become the reference.
 */
export function useFormChanges(form: RefObject<HTMLFormElement | null>) {
  const reference = useRef<FormSnapshot>(new Map());
  const [changes, setChanges] = useState(0);
  const read = useCallback(
    () => (form.current ? snapshotOf(new FormData(form.current)) : new Map<string, string>()),
    [form],
  );
  useEffect(() => {
    const element = form.current;
    if (!element) return;
    reference.current = read();
    const update = () => setChanges(countChanges(reference.current, read()));
    element.addEventListener("input", update);
    element.addEventListener("change", update);
    return () => {
      element.removeEventListener("input", update);
      element.removeEventListener("change", update);
    };
  }, [form, read]);
  const markSaved = useCallback(() => {
    reference.current = read();
    setChanges(0);
  }, [read]);
  return { changes, markSaved };
}
