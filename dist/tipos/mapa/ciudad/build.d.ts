export interface CityBundleData {
    edificios: {
        ids: string[];
        pisos: number[];
        tipos: number[];
        geometrias: number[][][][];
    };
    vias: number[][];
    /** Por vía (mismo orden): media calzada, fachada izquierda y derecha, en decímetros. */
    anchos?: number[][];
    arboles: number[];
    /** Suelo: áreas [tipo, x, y, ...] en decímetros, edificios especiales y puntos de referencia. */
    suelo?: {
        areas: number[][];
        especiales: Record<string, string[]>;
        puntos: Record<string, number[]>;
        /** Polígonos de agua (anillos en decímetros) cerca de la ciudad. */
        agua?: number[][][];
        /** Ejes de ríos (x, y, ... en decímetros), como el Utcubamba junto a la ciudad. */
        rios?: number[][];
        /** Piscinas de OpenStreetMap (anillo en decímetros). */
        piscinas?: number[][];
    };
    fuentes?: Record<string, string | null>;
}
export declare const CHUNK = 250;
/** Fila de la tabla de bloques: x0, y0, x1, y1, z superior, primero, cantidad. */
export declare const CHUNK_STRIDE = 7;
export declare class ChunkSorter {
    private unit;
    private cells;
    constructor(unit: number);
    /** Registra el tramo [from, to) del búfer de origen y su caja. */
    add(from: number, to: number, x0: number, y0: number, x1: number, y1: number, z: number): void;
    /** Copia el origen ordenado por bloque; offset: unidades que ya ocupan el búfer. */
    finish<T extends Float32Array | Uint32Array>(source: Float32Array | Uint32Array, make: (n: number) => T, offset?: number): {
        data: T;
        table: Float32Array<ArrayBuffer>;
    };
}
/** Instancias (x, y, altura, radio, ...) ordenadas por bloque. */
export declare function sortInstances(data: Float32Array, stride: number): {
    data: Float32Array<ArrayBuffer>;
    table: Float32Array<ArrayBuffer>;
};
/** Código de calle del paquete: clase 1..4 + 10 sin pavimentar + 20 berma verde + 40 malecón. */
export declare function roadInfo(raw: number): {
    code: number;
    unpaved: boolean;
    green: boolean;
    malecon: boolean;
};
/**
 * Edificios con forma propia: mercado, coliseo, piscina (se dibuja como piscina), terminal y
 * volúmenes pequeños dentro de una plaza ("plaza": glorietas o copas de árboles detectadas como
 * techo; la plaza ya dibuja su monumento y sus jardines).
 */
export declare function specialBuildings(data: CityBundleData): Map<string, string>;
/** Vértice de edificio: pos 3 · normal 3 · uv 2 · info 4 (largo, alero, pisos, semilla) · estilo · índice. */
export declare const BUILDING_STRIDE = 14;
/** Instancia de objeto: x, y, z, escala, giro, color. */
export declare const PROP_STRIDE = 6;
/** Instancia de árbol: x, y, altura, radio de copa, semilla, tipo (0 copa, 1 florido). */
export declare const TREE_STRIDE = 6;
/** Marcas por edificio (se guardan en el estilo, multiplicadas por STYLE_FLAGS). */
export declare const FLAG: {
    simulated: number;
    unfinished: number;
    shop: number;
    upper: number;
    meter: number;
    earth: number;
    front: number;
};
/** Estilo = color + 16·material + 128·techo + 2048·marcas. */
export declare const STYLE_FLAGS = 2048;
/**
 * Materiales de pared. Censo 2017, viviendas urbanas de Bagua: ladrillo o bloque de cemento
 * 49,0 %, adobe 45,1 %, quincha 3,9 %; pocas de madera, triplay, calamina o estera.
 * "painted" es revoque pintado sobre ladrillo o sobre adobe (marca earth).
 */
export declare const MATERIAL: {
    painted: number;
    brick: number;
    wood: number;
    adobe: number;
    concrete: number;
    quincha: number;
    sheet: number;
    mat: number;
};
export type P = [number, number];
export declare const rand: (seed: number) => () => number;
export declare function ringArea(r: P[]): number;
/** Rectángulo orientado por la arista más larga: ejes (ax, ay) y extensión en u (largo) y v. */
export declare function orientedBox(ring: P[]): {
    ax: number;
    ay: number;
    u0: number;
    u1: number;
    v0: number;
    v1: number;
    at: (u: number, v: number) => P;
};
export declare function centroid(r: P[]): P;
export declare function buildBuildings(data: CityBundleData, hidden: ReadonlySet<string>): {
    vertices: Float32Array<ArrayBuffer>;
    indices: Uint32Array<ArrayBuffer>;
    chunks: Float32Array<ArrayBuffer>;
    skirtVertices: Float32Array<ArrayBuffer>;
    skirtIndices: Uint32Array<ArrayBuffer>;
    skirtChunks: Float32Array<ArrayBuffer>;
    tanks: Float32Array<ArrayBuffer>;
    rebars: Float32Array<ArrayBuffer>;
    works: Float32Array<ArrayBuffer>;
    shown: number;
};
export declare function buildTrees(data: CityBundleData): {
    trees: Float32Array<ArrayBuffer>;
    palms: Float32Array<ArrayBuffer>;
};
/** Grafo vial para el tráfico: tramos con sus puntos y nodos por extremos coincidentes (±1 m). */
export declare function buildRoads(data: CityBundleData): {
    points: Float32Array<ArrayBuffer>;
    edgeStart: Int32Array<ArrayBuffer>;
    edgeCount: Int32Array<ArrayBuffer>;
    edgeA: Int32Array<ArrayBuffer>;
    edgeB: Int32Array<ArrayBuffer>;
    edgeCode: Uint8Array<ArrayBuffer>;
    adjStart: Int32Array<ArrayBuffer>;
    adj: Int32Array<ArrayBuffer>;
};
export type RoadGraph = ReturnType<typeof buildRoads>;
export declare function buildPower(data: CityBundleData, hidden: ReadonlySet<string>): {
    poles: Float32Array<ArrayBuffer>;
    lamps: Float32Array<ArrayBuffer>;
    trafos: Float32Array<ArrayBuffer>;
    lines: Float32Array<ArrayBuffer>;
};
