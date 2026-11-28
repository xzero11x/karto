import type { StyleSpecification } from 'maplibre-gl';
import { type MapTheme } from './themes';
import { type Origen } from '../config';
export declare const SOURCE = "overture";
/** Estilo completo del mapa; `origen` indica dónde están las teselas y las fuentes de la ciudad. */
export declare function buildStyle(theme?: MapTheme, origen?: Origen): StyleSpecification;
/** Capas consultables al tocar el mapa, de la más específica a la más general, y el tipo de elemento. */
export declare const SELECTABLE_LAYERS: {
    layer: string;
    tabla: 'lugar' | 'conector' | 'red_vial' | 'edificio' | 'edificio_complemento' | 'agua' | 'uso_suelo' | 'equipamiento' | 'manzana' | 'terreno';
}[];
