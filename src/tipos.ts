import type { FeatureCollection } from 'geojson';

export type Tabla =
  | 'red_vial'
  | 'conector'
  | 'edificio'
  | 'edificio_complemento'
  | 'uso_suelo'
  | 'equipamiento'
  | 'manzana'
  | 'agua'
  | 'terreno'
  | 'lugar';

/** Elemento elegido en el mapa, con las propiedades que trae su tesela o su GeoJSON. */
export interface Seleccion {
  tabla: Tabla;
  id: string;
  propiedades: Record<string, unknown>;
}

/** 2D plano; 2.5D con inclinación fija; 3D libre (inclinación hasta 85° y giro). */
export type Vista = '2d' | '2.5d' | '3d';

/** Cómo se dibujan los edificios en 2.5D/3D: volúmenes simples o la ciudad detallada. */
export type Modo3d = 'clasico' | 'ciudad';

/** Correcciones locales sobre Overture: elementos ocultos, lugares reubicados, edificaciones agregadas. */
export interface Correcciones {
  ocultos: { edificio: string[]; edificio_complemento: string[]; lugar: string[] };
  lugaresMovidos: FeatureCollection;
  edificiosAgregados: FeatureCollection;
}

type Par = [number, number];

/** Perfil de una ciudad (datos/<ciudad>/ciudad.json). */
export interface Ciudad {
  id: string;
  nombre: string;
  descripcion?: string;
  centro: Par;
  zoom: { inicial: number; minimo: number; maximo: number };
  /** Encuadre del botón «extensión urbana». */
  extensionUrbana: [Par, Par];
  /** Límite de navegación (con un pequeño margen). */
  limites: [Par, Par];
  /** Cambia al regenerar las teselas, para que el navegador no use una copia anterior. */
  revisionTeselas: string;
  overture?: string;
  /** HTML de atribución que se muestra en el mapa. */
  atribucion: string;
  /** Capa de alturas 2.5D/3D: fuente principal y atribución. */
  alturas?: { fuente: string; atribucion: string };
  /** Huellas complementarias de otras fuentes abiertas. */
  complemento?: { atribucion: string };
  /**
   * Ciudad 3D detallada (ciudad3d.json): techos, fachadas, árboles, suelo y tráfico. El paquete
   * se genera con el mismo `centro` de este perfil, que es su origen de coordenadas.
   */
  ciudad3d?: { atribucion: string };
}
