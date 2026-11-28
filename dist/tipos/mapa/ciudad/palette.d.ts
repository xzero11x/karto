/**
 * Techos: 0 calamina, 1 calamina oxidada, 2 teja, 3 losa, 4 calamina azul, 5 losa clara,
 * 6 calamina roja, 7 fibrocemento, 8 caña o estera.
 */
export declare const ROOF_COLORS: string[];
export declare const ROOF_LABELS: string[];
/** Techos ondulados (calamina y fibrocemento): se pueden inclinar a una o dos aguas. */
export declare const CORRUGATED: Set<number>;
/** Techos de concreto armado (losas): llevan tanque, fierros y muros de material noble. */
export declare const SLAB: Set<number>;
export declare const ROOF_BY_BUCKET: number[];
/** Fachadas pintadas (índice 0 = ladrillo, se usa solo para el material ladrillo). */
export declare const FACADE_COLORS: string[];
/** Colores de fachada que se reparten al azar entre las viviendas (1 a 10). */
export declare const FACADE_RANDOM = 10;
/** Letreros de tienda y toldos: colores vivos de comercio de barrio. */
export declare const SIGN_COLORS: string[];
/** Pintura de vehículos: mototaxis con toldo de color, motos y autos. */
export declare const VEHICLE_COLORS: string[];
export declare function hash(text: string): number;
export declare const roofIndex: (id: string) => number;
/** Expresión MapLibre equivalente a `roofIndex`, para colorear huellas 2D con el mismo techo. */
export declare const roofColorExpression: (colors?: readonly string[]) => (string | (string | (string | number | (string | string[])[])[])[])[];
export declare const rgb: (hex: string) => number[];
