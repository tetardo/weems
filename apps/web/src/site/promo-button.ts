import { buttonClass } from "@weems/ui";

/**
 * The promotional button of the bar (« Pilot Pro », towards the offers): the shape of the other
 * buttons, filled with the accent gradient and a soft glow (utility promo-glow, global.css).
 */
export const promoClass = `${buttonClass("primary")} promo-glow bg-linear-to-r from-accent to-accent-2 font-semibold`;

/** « Pilot Pro » of the visitor's bar (bar A, 13/11): no frame, the gradient in the letters. */
export const promoTextClass =
  "promo-text inline-flex h-9 items-center gap-1.5 px-2.5 text-sm font-semibold whitespace-nowrap [&>svg]:text-accent";
