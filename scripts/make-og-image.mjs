/**
 * Generate the default Open Graph / social share image (1200×630)
 * from a licensed clinic photo. Run: node scripts/make-og-image.mjs
 */
import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const source = join(
  ROOT,
  'src',
  'assets',
  'legacy',
  'wp-content-uploads-2022-06-doctor-showing-patient-where-to-sit-Tampa-Florida-2-2-174dec96ab.webp'
);

await sharp(source)
  .resize(1200, 630, { fit: 'cover', position: 'attention' })
  .jpeg({ quality: 82, progressive: true })
  .toFile(join(ROOT, 'public', 'og-default.jpg'));

console.log('wrote public/og-default.jpg (1200x630)');
