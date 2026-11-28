import type { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from 'maplibre-gl';
export declare const CITY_LAYER = "bm-ciudad-3d";
export interface CityTheme {
    night: number;
    saturation: number;
    selection: string;
    fog: string;
}
export interface CityStats {
    edificios: number;
    arboles: number;
    vehiculos: number;
    ms: {
        descarga: number;
        armado: number;
    };
}
export declare class CityLayer implements CustomLayerInterface {
    readonly id = "bm-ciudad-3d";
    readonly type: "custom";
    readonly renderingMode: "3d";
    private map?;
    private gl?;
    private worker;
    private programs;
    private building?;
    /** Oclusión de contacto alrededor de las casas. */
    private skirt?;
    /** Tablas de bloques de árboles y palmeras. */
    private chunks;
    private crowd?;
    /** El mapa de sombras se vuelve a dibujar solo si cambia la cámara o los datos. */
    private shadowKey;
    private dirty;
    private meshes;
    private ground?;
    /** Suelo: lotes (con mezcla), superficies planas y objetos que dan sombra, en un búfer. */
    private surface?;
    private shadow?;
    private pickTarget?;
    private lightMatrix;
    private shadowReady;
    private ids;
    private index;
    private selected;
    private hideSimulated;
    private theme;
    private riseStart;
    private last;
    private traffic?;
    private pending;
    private hidden;
    private loaded;
    private stats;
    private animTimer;
    onStats?: (stats: CityStats) => void;
    onError?: (message: string) => void;
    constructor(origin: readonly [number, number]);
    /** Descarga y arma la ciudad en segundo plano (se puede llamar antes de entrar en 3D). */
    load(url: string): void;
    setHidden(ids: string[]): void;
    private uploads;
    private flush;
    private receive;
    private setInstances;
    /** Dibuja rangos de instancias apuntando los atributos de instancia a cada rango. */
    private drawRanges;
    private compile;
    private use;
    private instanced;
    onAdd(map: MapLibreMap, gl: WebGL2RenderingContext): void;
    private initialized;
    /** Crea programas, búferes y el mapa de sombras en el primer cuadro visible. */
    private init;
    onRemove(_map: MapLibreMap, gl: WebGL2RenderingContext): void;
    rise(): void;
    setSelected(id: string): void;
    setHideSimulated(hide: boolean): void;
    setTheme(theme: CityTheme): void;
    /** Edificio bajo un punto de pantalla (píxeles CSS), leído de la GPU en el próximo cuadro. */
    pick(x: number, y: number): Promise<string | null>;
    /** Matriz local (metros) -> clip y datos de cámara para este cuadro. */
    private frame;
    prerender(gl: WebGL2RenderingContext): void;
    private draw;
    render(gl: WebGL2RenderingContext, options: CustomRenderMethodInput): void;
    private runPicks;
}
