/**
 * Route helpers — language pairing + URL building.
 * Every page entry carries an explicit `slug` that matches the existing URL
 * byte-for-byte (e.g. "primary-care", "es/cuidados-primarios").
 */
import type { CollectionEntry } from 'astro:content';

export type PageEntry = CollectionEntry<'pages'>;

/** Build the canonical href for a content entry slug. */
export function pageHref(slug: string): string {
  return slug ? `/${slug}/` : '/';
}

/** Find the twin (other-language) entry for a page via its translationKey. */
export function findTranslation(
  page: PageEntry,
  pages: PageEntry[]
): PageEntry | undefined {
  return pages.find(
    (candidate) =>
      candidate.data.translationKey === page.data.translationKey &&
      candidate.data.lang !== page.data.lang
  );
}

/** Twin URL for the language toggle (falls back to the locale home). */
export function translationHref(page: PageEntry, pages: PageEntry[]): string {
  const twin = findTranslation(page, pages);
  if (twin) return pageHref(twin.data.slug);
  return page.data.lang === 'en' ? '/es/inicio/' : '/';
}

/** Absolute canonical URL for a slug. */
export function canonicalUrl(slug: string): string {
  return `https://www.tampabayfamilyclinics.com${pageHref(slug)}`;
}
