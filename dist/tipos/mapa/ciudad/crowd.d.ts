/** Recorridos del worker: puntos seguidos y por recorrido inicio, puntos, peso, z, medio ancho, tipo. */
export interface Walkways {
    points: Float32Array;
    index: Float32Array;
}
export declare class Crowd {
    private w;
    readonly buffer: Float32Array;
    private walkers;
    private random;
    private paths;
    private nearby;
    private nearbyWeights;
    private center;
    constructor(w: Walkways, count?: number);
    /** Persona nueva en un recorrido cercano, elegido según su peso y largo. */
    private spawn;
    /** Cuando la vista se mueve, quien quedó lejos reaparece en un recorrido cercano. */
    follow(x: number, y: number): void;
    get count(): number;
    update(dt: number): void;
}
