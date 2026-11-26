// karto: mapa urbano con temas, vistas 2D / 2.5D / 3D y alturas de edificios.
import 'maplibre-gl/dist/maplibre-gl.css';
import './estilos.css';

export { Karto, type KartoProps } from './karto';
export { Mapa, type MapaProps } from './mapa/mapa';
export { buildStyle, SELECTABLE_LAYERS, SOURCE } from './mapa/style';
export { DEFAULT_THEME, MAP_THEMES, THEME_NAMES, type MapTheme } from './mapa/themes';
export { loadMapRuntime } from './mapa/runtime';
export { CIUDAD_POR_DEFECTO, DATOS_POR_DEFECTO, dataUrl, WORKER_URL, type Origen } from './config';
export { useCiudad } from './datos';
export type { Ciudad, Correcciones, Seleccion, Tabla, Vista } from './tipos';
