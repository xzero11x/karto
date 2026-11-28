import type { Map as MapLibreMap } from 'maplibre-gl';
import { Box, Building2, Compass, Crosshair, Maximize2, Minus, Orbit, Plus } from 'lucide-react';
import type { Ciudad, Modo3d, Vista } from '../tipos';

// Controles: zoom, centrar en la ciudad, extensión urbana, norte arriba, vistas 2.5D / 3D y,
// si la ciudad trae su paquete, el modo de edificios en 3D (volúmenes simples o ciudad detallada).
export function Controles({
  ciudad,
  mapa,
  vista,
  onVista,
  modo3d,
  onModo3d,
}: {
  ciudad: Ciudad;
  mapa: MapLibreMap | null;
  vista: Vista;
  onVista: (vista: Vista) => void;
  modo3d: Modo3d;
  onModo3d: (modo: Modo3d) => void;
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
      {ciudad.ciudad3d && (
        <button
          type="button"
          className="karto-controls-3d"
          data-testid="karto-modo-ciudad"
          aria-pressed={modo3d === 'ciudad'}
          aria-label="Ciudad 3D detallada"
          title={
            modo3d === 'ciudad'
              ? 'Ciudad 3D detallada: techos, fachadas, árboles y suelo. Clic para volver a volúmenes simples'
              : 'Ciudad 3D detallada: techos, fachadas, árboles y suelo'
          }
          disabled={off}
          onClick={() => {
            const next = modo3d === 'ciudad' ? 'clasico' : 'ciudad';
            onModo3d(next);
            if (next === 'ciudad' && vista === '2d') onVista('3d');
          }}
        >
          <Building2 size={16} />
          <span>Ciudad</span>
        </button>
      )}
    </div>
  );
}
