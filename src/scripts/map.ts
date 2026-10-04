/**
 * Map lazy loader — renders a lightweight placeholder and injects the
 * Google Maps iframe when the block scrolls into view. Keeps the initial
 * page load free of third-party requests.
 */
export function initMaps() {
  const maps = document.querySelectorAll<HTMLElement>('[data-map]');
  if (!maps.length) return;

  const load = (map: HTMLElement) => {
    const src = map.dataset.mapSrc;
    if (!src || map.dataset.mapLoaded) return;
    map.dataset.mapLoaded = 'true';

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = map.dataset.mapTitle || 'Google Maps';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    iframe.className = 'absolute inset-0 h-full w-full border-0';
    map.replaceChildren(iframe);
  };

  if (!('IntersectionObserver' in window)) {
    maps.forEach(load);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          load(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '200px' }
  );

  maps.forEach((map) => observer.observe(map));
}
