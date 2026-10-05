/** Derive favicon + apple-touch-icon from the licensed clinic logo. */
import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const logo = join(ROOT, 'src', 'assets', 'legacy', 'wp-content-uploads-2022-03-Tampa-Bay-Family-Clinic-logo-2-d15855e3b8.webp');

async function make(size, out) {
  await sharp(logo)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(join(ROOT, 'public', out));
  console.log('wrote public/' + out);
}

await make(32, 'favicon-32.png');
await make(48, 'favicon-48.png');
await make(180, 'apple-touch-icon.png');
await make(192, 'icon-192.png');
await make(512, 'icon-512.png');
