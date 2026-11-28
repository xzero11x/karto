export declare const MODEL_STRIDE = 10;
type Vec3 = [number, number, number];
export declare class MeshBuilder {
    data: number[];
    private push;
    tri(a: Vec3, b: Vec3, c: Vec3, color: Vec3, flag: number, normal?: Vec3): void;
    quad(a: Vec3, b: Vec3, c: Vec3, d: Vec3, color: Vec3, flag: number): void;
    box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, hex: string, flag?: number): void;
    /** Cilindro vertical con tapa superior. */
    cylinderZ(cx: number, cy: number, r: number, z0: number, z1: number, hex: string, flag?: number, n?: number): void;
    /** Rueda: cilindro con eje transversal (y). */
    wheel(cx: number, cy: number, cz: number, r: number, w: number): void;
    /** Montículo cónico (arena, piedra) de radio r y altura h. */
    cone(cx: number, cy: number, r: number, h: number, hex: string, n?: number): void;
    /** Placa vertical regular de n lados en el plano x = x0, mirando hacia +x. */
    plate(x0: number, cy: number, cz: number, r: number, n: number, hex: string, back?: string): void;
    build(): Float32Array<ArrayBuffer>;
}
/** Árbol lejano: la misma forma con un icosaedro (20 caras) y tronco de 4 lados. */
export declare function treeLowModel(): Float32Array<ArrayBuffer>;
/** Palmera lejana: tronco de 4 lados y cinco hojas de un tramo. */
export declare function palmLowModel(): Float32Array<ArrayBuffer>;
/**
 * Peatón de 1,65 m mirando hacia +x. Partes animadas en el shader: 7 y 8 piernas, 9 y 10 brazos;
 * la camisa toma el color de la instancia (marca 4).
 */
export declare function personModel(): Float32Array<ArrayBuffer>;
/** Árbol de copa ancha: tronco unitario (parte 0) y copa esférica unitaria (parte 1). */
export declare function treeModel(): Float32Array<ArrayBuffer>;
/** Palmera: tronco (parte 0) y nueve hojas arqueadas (parte 2) de longitud unitaria. */
export declare function palmModel(): Float32Array<ArrayBuffer>;
/** Moto lineal con conductor. */
export declare function motoModel(): Float32Array<ArrayBuffer>;
/** Mototaxi de tres ruedas con cabina y toldo de color (pintura de la instancia). */
export declare function mototaxiModel(): Float32Array<ArrayBuffer>;
/** Auto sedán. */
export declare function carModel(): Float32Array<ArrayBuffer>;
/** Tanque de agua elevado (tipo Rotoplas de 1100 L) con tapa. */
export declare function tankModel(): Float32Array<ArrayBuffer>;
/** Columna de espera: dado de concreto con cuatro fierros oxidados hacia arriba. */
export declare function rebarModel(): Float32Array<ArrayBuffer>;
/**
 * Poste de concreto de 9 m con cruceta y bastidor de baja tensión. Variantes: con pastoral de
 * alumbrado (luz hacia la calzada, +y) o con transformador.
 */
export declare function poleModel(kind: 'pole' | 'lamp' | 'trafo'): Float32Array<ArrayBuffer>;
/** Mancha de luz del alumbrado en el suelo (cuadrado unitario; el shader la difumina). */
export declare function glowModel(): Float32Array<ArrayBuffer>;
/** Banca de plaza: patas de concreto y asiento y respaldar de listones (largo sobre x). */
export declare function benchModel(): Float32Array<ArrayBuffer>;
/**
 * Monumento de la plaza principal: basamento escalonado, pedestal de piedra y figura de bronce de
 * un militar (referencia documentada por el IIAP; la forma es representativa).
 */
export declare function monumentModel(): Float32Array<ArrayBuffer>;
/** Busto sobre columna (plazas secundarias). */
export declare function bustModel(): Float32Array<ArrayBuffer>;
/** Señal de PARE: poste y octógono rojo mirando hacia +x. */
export declare function stopSignModel(): Float32Array<ArrayBuffer>;
/** Puesto de mercado: mesa con mercadería y toldo de lona del color dado. */
export declare function stallModel(tarp: string, goods: string): Float32Array<ArrayBuffer>;
/** Bus interprovincial (12 m) con ventanas y franja del color de la empresa. */
export declare function busModel(body: string, stripe: string): Float32Array<ArrayBuffer>;
/** Arco de fútbol (ancho w, alto h) con su red, de frente hacia +x. */
export declare function goalModel(w: number, h: number): Float32Array<ArrayBuffer>;
/** Farol de malecón o plaza: poste verde oscuro y farola. */
export declare function lanternModel(): Float32Array<ArrayBuffer>;
/** Material de obra en la vereda: arena, piedra chancada y ladrillos apilados. */
export declare function worksModel(): Float32Array<ArrayBuffer>;
/** Remate de campanario: cornisa, cúpula amarilla, linterna blanca y cruz (base 3,4 m, z = 0). */
export declare function churchTopModel(): Float32Array<ArrayBuffer>;
/** Asta con la bandera del Perú (roja, blanca y roja), 9 m. */
export declare function flagModel(): Float32Array<ArrayBuffer>;
/** Letrero de salud en la azotea: panel blanco con cruz roja. */
export declare function healthSignModel(): Float32Array<ArrayBuffer>;
/**
 * Monumento de la Plaza de Armas de Bagua (fotografías 2022-2026): losas verticales de concreto
 * claro de distinta altura sobre una base elevada con escalones y baranda turquesa, tres astas
 * altas detrás (la central con la bandera del Perú) y una figura de bronce al frente.
 */
export declare function baguaMonumentModel(): Float32Array<ArrayBuffer>;
/** Poste de plaza con dos faroles esféricos blancos (Plaza de Armas de Bagua, 2026). */
export declare function doubleLampModel(): Float32Array<ArrayBuffer>;
export {};
