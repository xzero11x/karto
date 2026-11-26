import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Compilación de la librería: dist/karto.js y dist/karto.css. React, MapLibre y las demás
// dependencias quedan fuera del paquete: las instala el proyecto que usa karto.
const externo = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'maplibre-gl',
  'pmtiles',
  'lucide-react',
  '@radix-ui/react-dropdown-menu',
];

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'karto.js',
      cssFileName: 'karto',
    },
    rolldownOptions: {
      external: (id) => externo.some((e) => id === e || id.startsWith(`${e}/`)),
    },
  },
});
