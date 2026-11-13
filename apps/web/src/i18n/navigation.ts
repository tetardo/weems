import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing.ts";

/** Links that keep the current language in the address. */
export const { Link, getPathname, usePathname, useRouter } = createNavigation(routing);
