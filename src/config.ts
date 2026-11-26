// Configuración de karto. Los datos se sirven como archivos estáticos bajo una URL base
// (por defecto /karto/, la publica el plugin `karto/vite`):
//
//   /karto/maplibre-gl-worker.mjs   worker de MapLibre (versión instalada)
//   /karto/fuentes/…                tipografías compartidas por todas las ciudades
//   /karto/<ciudad>/ciudad.json     centro, límites, zoom y atribución de la ciudad
//   /karto/<ciudad>/teselas.pmtiles alturas.geojson, complemento.geojson, correcciones.json
import type { Ciudad } from './tipos';

/** URL base por defecto de los datos. */
export const DATOS_POR_DEFECTO = '/karto/';
/** Ciudad por defecto. */
export const CIUDAD_POR_DEFECTO = 'bagua';

/** URL absoluta (MapLibre y PMTiles la necesitan completa) de un archivo bajo la base de datos. */
export function dataUrl(file: string, base = DATOS_POR_DEFECTO) {
  const dir = base.endsWith('/') ? base : `${base}/`;
  return new URL(`${dir}${file}`, window.location.href).toString();
}

/** Ubicación de los datos de una ciudad: base común + carpeta de la ciudad. */
export interface Origen {
  datos: string;
  ciudad: Ciudad;
}

export const TILES_URL = (o?: Origen) =>
  o
    ? `pmtiles://${dataUrl(`${o.ciudad.id}/teselas.pmtiles`, o.datos)}?v=${o.ciudad.revisionTeselas}`
    : `pmtiles://${dataUrl(`${CIUDAD_POR_DEFECTO}/teselas.pmtiles`)}`;
export const GLYPHS_URL = (o?: Origen) => `${dataUrl('fuentes', o?.datos)}/{fontstack}/{range}.pbf`;
export const WORKER_URL = (datos?: string) => dataUrl('maplibre-gl-worker.mjs', datos);
export const ATTRIBUTION = (o?: Origen) =>
  o?.ciudad.atribucion ??
  '© <a href="https://overturemaps.org" target="_blank" rel="noreferrer">Overture Maps Foundation</a> · © OpenStreetMap (ODbL)';
