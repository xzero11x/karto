import type { FeatureCollection } from 'geojson';
import type { Ciudad, Correcciones } from './tipos';
/** Perfil de la ciudad: centro, límites, zoom y atribución. */
export declare const useCiudad: (datos: string, ciudad: string) => {
    reintentar: () => void;
    datos?: Ciudad | undefined;
    error: boolean;
    cargando: boolean;
};
/** Alturas de los edificios para 2.5D y 3D: se piden al activar una de esas vistas. */
export declare const useAlturas: (datos: string, ciudad: string, activo: boolean) => {
    reintentar: () => void;
    datos?: FeatureCollection<import("geojson").Geometry, import("geojson").GeoJsonProperties> | undefined;
    error: boolean;
    cargando: boolean;
};
/** Huellas complementarias de otras fuentes abiertas. */
export declare const useComplemento: (datos: string, ciudad: string) => {
    reintentar: () => void;
    datos?: FeatureCollection<import("geojson").Geometry, import("geojson").GeoJsonProperties> | undefined;
    error: boolean;
    cargando: boolean;
};
/** Correcciones locales sobre Overture. */
export declare const useCorrecciones: (datos: string, ciudad: string) => {
    reintentar: () => void;
    datos?: Correcciones | undefined;
    error: boolean;
    cargando: boolean;
};
