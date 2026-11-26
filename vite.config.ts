import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { karto } from './vite.mjs';

// Demo para desarrollar el mapa: `npm run dev`. La librería se compila con vite.lib.config.ts.
export default defineConfig({
  root: 'demo',
  plugins: [react(), karto()],
  server: { port: 5180 },
});
