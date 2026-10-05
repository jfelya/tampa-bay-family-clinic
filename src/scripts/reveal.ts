/**
 * Scroll reveal — lightweight MeCare-style fadeInUp.
 * Progressive enhancement: elements only hide once JS adds the `.reveal`
 * class, so no-JS users always see content. Honors prefers-reduced-motion.
 */
export function initReveal() {
  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (!elements.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('reveal', 'is-visible'));
    return;
  }

  elements.forEach((el) => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );

  elements.forEach((el) => observer.observe(el));
}
