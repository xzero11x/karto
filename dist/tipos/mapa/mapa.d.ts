import type { FeatureCollection } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { type Origen } from '../config';
import type { Correcciones, Modo3d, Seleccion, Vista } from '../tipos';
import { type MapTheme } from './themes';
import { type CityStats } from './ciudad/city-layer';
/** Estado de la ciudad 3D detallada (se descarga y arma en segundo plano). */
export interface EstadoCiudad {
    estado: 'cargando' | 'lista' | 'error';
    stats?: CityStats;
}
export interface MapaProps {
    /** Dónde están los datos y qué ciudad se muestra (centro, límites, zoom, atribución). */
    origen: Origen;
    seleccion: Seleccion | null;
    vista: Vista;
    tema: MapTheme;
    /** Edificios en 2.5D/3D: volúmenes simples ('clasico') o ciudad detallada ('ciudad'). */
    modo3d: Modo3d;
    alturas?: FeatureCollection;
    mostrarSimuladas: boolean;
    complemento?: FeatureCollection;
    correcciones?: Correcciones;
    onSeleccion: (seleccion: Seleccion | null) => void;
    onMapa: (map: MapLibreMap | null) => void;
    onFallo: () => void;
    onCiudad?: (estado: EstadoCiudad) => void;
}
export declare function Mapa({ origen, seleccion, vista, tema, modo3d, alturas, mostrarSimuladas, complemento, correcciones, onSeleccion, onMapa, onFallo, onCiudad, }: MapaProps): import("react").JSX.Element;
