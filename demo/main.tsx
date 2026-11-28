import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Karto, THEME_NAMES, type MapTheme, type Vista } from '../src';

// Demo de desarrollo: el mapa a pantalla completa. Parámetros opcionales de la URL:
// ?ciudad=bagua&tema=bagua&vista=3d&modo3d=ciudad
const query = new URLSearchParams(window.location.search);
const ciudad = query.get('ciudad') ?? undefined;
const tema = query.get('tema') as MapTheme | null;
const vista = query.get('vista') as Vista | null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Karto
      ciudad={ciudad}
      temaInicial={tema && THEME_NAMES.includes(tema) ? tema : undefined}
      vistaInicial={vista && ['2d', '2.5d', '3d'].includes(vista) ? vista : undefined}
      modo3dInicial={query.get('modo3d') === 'ciudad' ? 'ciudad' : undefined}
      // Acceso al mapa desde la consola del navegador (solo en la demo).
      onMapa={(m) => Object.assign(window, { mapa: m })}
    />
  </StrictMode>,
);
