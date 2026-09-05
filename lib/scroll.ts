/**
 * Smooth scroll to an element selector or a Y offset, using the browser's
 * native smooth scrolling. Respects reduced motion via the CSS
 * `scroll-behavior` rule in globals.css.
 */
export function scrollToTarget(target: string | number) {
  if (typeof window === "undefined") return;
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: "smooth" });
    return;
  }
  document
    .querySelector(target)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}
