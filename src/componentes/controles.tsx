import type { Map as MapLibreMap } from 'maplibre-gl';
import { Box, Compass, Crosshair, Maximize2, Minus, Orbit, Plus } from 'lucide-react';
import type { Ciudad, Vista } from '../tipos';

// Controles: zoom, centrar en la ciudad, extensión urbana, norte arriba y vistas 2.5D / 3D.
export function Controles({
  ciudad,
  mapa,
  vista,
  onVista,
}: {
  ciudad: Ciudad;
  mapa: MapLibreMap | null;
  vista: Vista;
  onVista: (vista: Vista) => void;
}) {
  const off = !mapa;
  return (
    <div className="karto-controls" role="toolbar" aria-label="Navegación del mapa">
      <button
        type="button"
        aria-label="Acercar"
        title="Acercar"
        disabled={off}
        onClick={() => mapa?.zoomIn({ duration: 350 })}
      >
        <Plus size={18} />
      </button>
      <button
        type="button"
        aria-label="Alejar"
        title="Alejar"
        disabled={off}
        onClick={() => mapa?.zoomOut({ duration: 350 })}
      >
        <Minus size={18} />
      </button>
      <span className="karto-controls-sep" aria-hidden="true" />
      <button
        type="button"
        aria-label={`Centrar en ${ciudad.nombre}`}
        title={`Centrar en ${ciudad.nombre}`}
        disabled={off}
        onClick={() =>
          mapa?.flyTo({ center: ciudad.centro, zoom: 16.2, duration: 900, essential: true })
        }
      >
        <Crosshair size={18} />
      </button>
      <button
        type="button"
        aria-label="Ver la extensión urbana"
        title="Ver la extensión urbana"
        disabled={off}
        onClick={() => mapa?.fitBounds(ciudad.extensionUrbana, { padding: 24, duration: 900 })}
      >
        <Maximize2 size={17} />
      </button>
      <button
        type="button"
        aria-label="Norte arriba"
        title="Norte arriba"
        disabled={off}
        onClick={() => mapa?.easeTo({ bearing: 0, duration: 600 })}
      >
        <Compass size={18} />
      </button>
      <span className="karto-controls-sep" aria-hidden="true" />
      <button
        type="button"
        className="karto-controls-3d"
        aria-pressed={vista === '2.5d'}
        aria-label="Vista 2.5D"
        title="Vista 2.5D · inclinación fija, se puede girar"
        disabled={off}
        onClick={() => onVista(vista === '2.5d' ? '2d' : '2.5d')}
      >
        <Box size={16} />
        <span>2.5D</span>
      </button>
      <button
        type="button"
        className="karto-controls-3d"
        aria-pressed={vista === '3d'}
        aria-label="Vista 3D libre"
        title="Vista 3D libre · clic derecho o Ctrl + arrastrar para girar e inclinar"
        disabled={off}
        onClick={() => onVista(vista === '3d' ? '2d' : '3d')}
      >
        <Orbit size={16} />
        <span>3D</span>
      </button>
    </div>
  );
}
