import { type CityBundleData } from './build';
/** Vértice de suelo: posición 3 · normal 3 · superficie · tres parámetros (u, v, w o color). */
export declare const GROUND_STRIDE = 10;
export declare const SURFACE: {
    readonly lot: 0;
    readonly asphalt: 1;
    readonly dirt: 2;
    readonly sidewalk: 3;
    readonly curb: 4;
    readonly grass: 5;
    readonly tiles: 6;
    readonly path: 7;
    readonly pitch: 8;
    readonly court: 9;
    readonly water: 10;
    readonly earth: 11;
    readonly concrete: 12;
    readonly zebra: 14;
    readonly river: 17;
    readonly riverBand: 18;
    readonly paint: 15;
    readonly wall: 16;
    readonly model: 100;
};
export declare function buildGround(data: CityBundleData): {
    vertices: Float32Array<ArrayBuffer>;
    tables: Float32Array<ArrayBufferLike>[];
    walks: {
        points: Float32Array<ArrayBuffer>;
        index: Float32Array<ArrayBuffer>;
    };
    trees: Float32Array<ArrayBuffer>;
    palms: Float32Array<ArrayBuffer>;
    stats: {
        calles: number;
        pavimentadas: number;
        conVereda: number;
        bancas: number;
        pare: number;
        puestos: number;
        buses: number;
        arbolesNuevos: number;
        recorridos: number;
    };
};
