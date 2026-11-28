import { type ReactNode } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { type MapTheme } from './mapa/themes';
import type { Modo3d, Seleccion, Vista } from './tipos';
export interface KartoProps {
    /** URL base de los datos (por defecto /karto/, la que publica el plugin `karto/vite`). */
    datos?: string;
    /** Carpeta de la ciudad dentro de los datos (por defecto bagua). */
    ciudad?: string;
    /** Tema inicial; con `tema` y `onTema` el tema lo controla la app. */
    temaInicial?: MapTheme;
    tema?: MapTheme;
    onTema?: (tema: MapTheme) => void;
    /** Vista inicial (2d, 2.5d, 3d); con `vista` y `onVista` la controla la app. */
    vistaInicial?: Vista;
    vista?: Vista;
    onVista?: (vista: Vista) => void;
    /**
     * Edificios en 2.5D/3D: 'clasico' (volúmenes simples, por defecto) o 'ciudad' (techos, fachadas,
     * árboles, suelo y tráfico; solo si la ciudad trae ciudad3d.json). Con `modo3d` y `onModo3d` lo
     * controla la app.
     */
    modo3dInicial?: Modo3d;
    modo3d?: Modo3d;
    onModo3d?: (modo: Modo3d) => void;
    /** Muestra la leyenda de colores (por defecto sí). */
    leyenda?: boolean;
    /** Muestra los controles de navegación y vistas (por defecto sí). */
    controles?: boolean;
    /** Muestra el selector de tema (por defecto sí). */
    selectorTema?: boolean;
    /** Muestra la ficha al tocar un elemento (por defecto sí). Desactívala para usar la tuya. */
    ficha?: boolean;
    /** Muestra las alturas modeladas además de las observadas (por defecto sí). */
    alturasModeladas?: boolean;
    /** Elemento tocado en el mapa (o null al tocar un espacio vacío). */
    onSeleccion?: (seleccion: Seleccion | null) => void;
    /** Instancia de MapLibre lista: sirve para añadir capas propias antes de 'bm-calles-texto'. */
    onMapa?: (map: MapLibreMap | null) => void;
    /** Contenido propio encima del mapa (paneles, leyendas…). */
    children?: ReactNode;
    className?: string;
}
export declare function Karto({ datos, ciudad: ciudadId, temaInicial, tema: temaControlado, onTema, vistaInicial, vista: vistaControlada, onVista, modo3dInicial, modo3d: modo3dControlado, onModo3d, leyenda, controles, selectorTema, ficha: conFicha, alturasModeladas, onSeleccion, onMapa, children, className, }: KartoProps): import("react").JSX.Element;
