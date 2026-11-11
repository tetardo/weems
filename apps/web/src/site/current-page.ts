/**
 * True when `pathname` (without the language) is the page `href` or one of its sub-pages:
 * a flight page (/flights/…) keeps « My flights » highlighted.
 */
export function isCurrentPage(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
