import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * `@tailwindcss/vite` must be registered here. It is the only thing that
 * compiles `@import 'tailwindcss'`, the `@theme` tokens in `src/index.css` and
 * the utility classes used across the app. With the plugin missing (as it was
 * before this fix) Vite serves the stylesheet verbatim: every design token is
 * undefined, no utility class exists, and the whole interface falls back to
 * defaults — the "old-looking", washed-out site.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
