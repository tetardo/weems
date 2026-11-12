"use client";

import { useEffect, useState } from "react";

/** Key of the spectator's choice in the browser's local storage. */
const STORAGE_KEY = "weems-live-routes";

/**
 * Whether the routes of all flights are drawn: on by default (Greg, 11/11/2026), the spectator's
 * choice kept in the browser. Storage may be refused (private mode): the choice then lasts the page.
 */
export function useShowRoutes(): [boolean, (show: boolean) => void] {
  const [show, setShow] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "off") setShow(false);
    } catch {
      // Keep the default.
    }
  }, []);

  const choose = (next: boolean) => {
    setShow(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      // The choice lasts until the page is left.
    }
  };
  return [show, choose];
}
