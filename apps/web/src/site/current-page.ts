/**
 * True when `pathname` (without the language) is the page `href` or one of its sub-pages:
 * a page of the logbook (/logbook/…) keeps « Mon carnet de bord » highlighted.
 */
export function isCurrentPage(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
