import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Karto } from '../src';

// Demo de desarrollo: el mapa a pantalla completa, con la ciudad de la URL (?ciudad=bagua).
const ciudad = new URLSearchParams(window.location.search).get('ciudad') ?? undefined;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Karto ciudad={ciudad} />
  </StrictMode>,
);
