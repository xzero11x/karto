import type { Ciudad } from './tipos';
/** URL base por defecto de los datos. */
export declare const DATOS_POR_DEFECTO = "/karto/";
/** Ciudad por defecto. */
export declare const CIUDAD_POR_DEFECTO = "bagua";
/** URL absoluta (MapLibre y PMTiles la necesitan completa) de un archivo bajo la base de datos. */
export declare function dataUrl(file: string, base?: string): string;
/** Ubicación de los datos de una ciudad: base común + carpeta de la ciudad. */
export interface Origen {
    datos: string;
    ciudad: Ciudad;
}
export declare const TILES_URL: (o?: Origen) => string;
export declare const GLYPHS_URL: (o?: Origen) => string;
export declare const WORKER_URL: (datos?: string) => string;
export declare const ATTRIBUTION: (o?: Origen) => string;
