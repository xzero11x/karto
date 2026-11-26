import type { Plugin } from 'vite';

export interface OpcionesKarto {
  /** URL donde se publican los datos (por defecto /karto/; debe coincidir con la prop `datos`). */
  base?: string;
  /** Ciudades a incluir en la compilación (por defecto todas). */
  ciudades?: string[];
}
/** Publica los datos de karto y el worker de MapLibre en desarrollo y al compilar. */
export function karto(opciones?: OpcionesKarto): Plugin;
export default karto;
/** Copia los datos (fuentes, worker y ciudades) a una carpeta, para servidores sin Vite. */
export function copiarDatos(
  destino: string,
  opciones?: { ciudades?: string[]; root?: string },
): string[];
export function ciudadesDisponibles(): string[];
export function rutaWorker(root?: string): string;
export const DATOS: string;
