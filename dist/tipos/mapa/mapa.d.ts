import type { FeatureCollection } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { type Origen } from '../config';
import type { Correcciones, Seleccion, Vista } from '../tipos';
import type { MapTheme } from './themes';
export interface MapaProps {
    /** Dónde están los datos y qué ciudad se muestra (centro, límites, zoom, atribución). */
    origen: Origen;
    seleccion: Seleccion | null;
    vista: Vista;
    tema: MapTheme;
    alturas?: FeatureCollection;
    mostrarSimuladas: boolean;
    complemento?: FeatureCollection;
    correcciones?: Correcciones;
    onSeleccion: (seleccion: Seleccion | null) => void;
    onMapa: (map: MapLibreMap | null) => void;
    onFallo: () => void;
}
export declare function Mapa({ origen, seleccion, vista, tema, alturas, mostrarSimuladas, complemento, correcciones, onSeleccion, onMapa, onFallo, }: MapaProps): import("react").JSX.Element;
