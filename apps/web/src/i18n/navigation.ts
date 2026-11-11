import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing.ts";

/** Links and redirects that keep the current language in the address. */
export const { Link, redirect, usePathname } = createNavigation(routing);
