import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Ciudad, Modo3d, Vista } from '../tipos';
export declare function Controles({ ciudad, mapa, vista, onVista, modo3d, onModo3d, }: {
    ciudad: Ciudad;
    mapa: MapLibreMap | null;
    vista: Vista;
    onVista: (vista: Vista) => void;
    modo3d: Modo3d;
    onModo3d: (modo: Modo3d) => void;
}): import("react").JSX.Element;
