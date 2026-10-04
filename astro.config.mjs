// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.tampabayfamilyclinics.com',
  output: 'static',
  // Existing URLs are canonical with a trailing slash (e.g. /primary-care/).
  // `ignore` lets dev serve both and keeps the build output as folder/index.html,
  // which Cloudflare Pages serves at the trailing-slash URL.
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          es: 'es',
        },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
