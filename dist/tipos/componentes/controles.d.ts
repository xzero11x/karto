import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Ciudad, Vista } from '../tipos';
export declare function Controles({ ciudad, mapa, vista, onVista, }: {
    ciudad: Ciudad;
    mapa: MapLibreMap | null;
    vista: Vista;
    onVista: (vista: Vista) => void;
}): import("react").JSX.Element;
