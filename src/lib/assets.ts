/**
 * Resolve content-authored image paths (e.g. "legacy/foo.webp") to Astro
 * ImageMetadata so they flow through `astro:assets` (resize/compress, no
 * visual change). Paths are relative to `src/assets/`.
 */
const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/**/*.{webp,png,jpg,jpeg,avif}',
  { eager: true }
);

export function asset(path: string): ImageMetadata | undefined {
  const clean = path.replace(/^\/+/, '').replace(/^assets\//, '');
  return images[`/src/assets/${clean}`]?.default;
}

/** Asset resolution that fails loudly at build time when a path is wrong. */
export function requireAsset(path: string): ImageMetadata {
  const resolved = asset(path);
  if (!resolved) {
    throw new Error(
      `[assets] Image not found: "${path}". Expected a file under src/assets/ (e.g. "legacy/<file>.webp").`
    );
  }
  return resolved;
}
