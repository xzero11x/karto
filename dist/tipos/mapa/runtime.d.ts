/** Carga MapLibre, fija su worker (la primera vez) y registra el protocolo pmtiles://. */
export declare function loadMapRuntime(workerUrl: string): Promise<typeof import("maplibre-gl")>;
