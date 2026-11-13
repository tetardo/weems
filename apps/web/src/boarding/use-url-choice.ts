"use client";

import { useCallback, useEffect, useState } from "react";

type Choose = (value: string | null) => void;

/**
 * A choice of the page kept in its address (/boarding?airport=LFML&aircraft=A320, a link that can
 * be shared): read once the page is open, written without a new history entry at each change.
 * `normalise` turns what the address says into a value, or null when it means nothing.
 */
export function useUrlChoice(
  param: string,
  normalise: (raw: string | null) => string | null,
): [value: string | null, choose: Choose] {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    setValue(normalise(new URLSearchParams(window.location.search).get(param)));
  }, [param, normalise]);
  const choose = useCallback<Choose>(
    (next) => {
      setValue(next);
      const url = new URL(window.location.href);
      if (next) url.searchParams.set(param, next);
      else url.searchParams.delete(param);
      window.history.replaceState(window.history.state, "", url);
    },
    [param],
  );
  return [value, choose];
}
