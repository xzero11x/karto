import { useEffect, useMemo, useRef, useState } from 'react';
import type { FeatureCollection } from 'geojson';
import type {
  FilterSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
  PointLike,
} from 'maplibre-gl';
import { loadMapRuntime } from './runtime';
import { WORKER_URL, dataUrl, type Origen } from '../config';
import type { Correcciones, Modo3d, Seleccion, Tabla, Vista } from '../tipos';
import { MAP_THEMES, type MapTheme } from './themes';
import { CITY_LAYER, CityLayer, type CityStats } from './ciudad/city-layer';
import { buildStyle, SELECTABLE_LAYERS } from './style';

// Visor MapLibre de karto: teselas PMTiles propias, temas, 2D / 2.5D / 3D y alturas.
// Los id de capa (bm-*) son estables: quien use el mapa puede añadir capas antes de 'bm-calles-texto'.

/** Cámara recordada mientras la pestaña siga abierta (no persiste al recargar). */
let camera: {
  ciudad: string;
  center: [number, number];
  zoom: number;
  pitch: number;
} | null = null;

/** Filtro que excluye los elementos marcados como inexistentes por una corrección local. */
const notIn = (ids: string[]): FilterSpecification =>
  ['!', ['in', ['get', 'id'], ['literal', ids]]] as FilterSpecification;

/** Estado de la ciudad 3D detallada (se descarga y arma en segundo plano). */
export interface EstadoCiudad {
  estado: 'cargando' | 'lista' | 'error';
  stats?: CityStats;
}

/** En la ciudad 3D los lugares se eligen por símbolo; los edificios, por lo que se ve (GPU). */
const POINT_LAYERS = ['bm-lugares-movidos', 'bm-lugares'];
/** Volúmenes simples del 3D clásico. */
const CLASSIC_3D = [
  'bm-edificios-3d',
  'bm-alturas-3d',
  'bm-alturas-sombra',
  'bm-alturas-seleccion',
];

/** Límites de inclinación por vista: 2.5D fija la inclinación; 3D libre la deja mover. */
const PITCH: Record<Vista, readonly [number, number]> = {
  '2d': [0, 0],
  '2.5d': [58, 58],
  '3d': [0, 85],
};

/** Elemento seleccionable más prioritario bajo un punto de pantalla. */
function pickAt(map: MapLibreMap, point: PointLike): Seleccion | null {
  const layers = SELECTABLE_LAYERS.filter((s) => map.getLayer(s.layer));
  const features = map.queryRenderedFeatures(point, { layers: layers.map((s) => s.layer) });
  for (const candidate of layers) {
    const feature = features.find((f) => f.layer.id === candidate.layer);
    const id = feature?.properties?.id;
    if (typeof id === 'string')
      return { tabla: candidate.tabla as Tabla, id, propiedades: { ...feature!.properties } };
  }
  return null;
}

export interface MapaProps {
  /** Dónde están los datos y qué ciudad se muestra (centro, límites, zoom, atribución). */
  origen: Origen;
  seleccion: Seleccion | null;
  vista: Vista;
  tema: MapTheme;
  /** Edificios en 2.5D/3D: volúmenes simples ('clasico') o ciudad detallada ('ciudad'). */
  modo3d: Modo3d;
  alturas?: FeatureCollection;
  mostrarSimuladas: boolean;
  complemento?: FeatureCollection;
  correcciones?: Correcciones;
  onSeleccion: (seleccion: Seleccion | null) => void;
  onMapa: (map: MapLibreMap | null) => void;
  onFallo: () => void;
  onCiudad?: (estado: EstadoCiudad) => void;
}

export function Mapa({
  origen,
  seleccion,
  vista,
  tema,
  modo3d,
  alturas,
  mostrarSimuladas,
  complemento,
  correcciones,
  onSeleccion,
  onMapa,
  onFallo,
  onCiudad,
}: MapaProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const cityRef = useRef<CityLayer | null>(null);
  const callbacks = useRef({ onSeleccion, onMapa, onFallo, onCiudad });
  const ciudadRef = useRef(false);
  // El mapa se crea una sola vez con los valores iniciales; luego el tema cambia solo la pintura.
  const origenRef = useRef(origen);
  const temaRef = useRef(tema);
  const mode3d = vista !== '2d';
  const conCiudad = Boolean(origen.ciudad.ciudad3d) && modo3d === 'ciudad';
  const ciudad3d = mode3d && conCiudad;
  const [ready, setReady] = useState(false);
  // Propiedades de cada edificio con altura: la ciudad 3D elige por id y la ficha las necesita.
  const porId = useMemo(
    () => new Map((alturas?.features ?? []).map((f) => [String(f.properties?.id), f.properties])),
    [alturas],
  );
  const porIdRef = useRef(porId);

  useEffect(() => {
    callbacks.current = { onSeleccion, onMapa, onFallo, onCiudad };
    ciudadRef.current = ciudad3d;
    porIdRef.current = porId;
  }, [onSeleccion, onMapa, onFallo, onCiudad, ciudad3d, porId]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let disposed = false;
    let map: MapLibreMap | undefined;
    const observer = new ResizeObserver(() => map?.resize());
    observer.observe(element);
    void loadMapRuntime(WORKER_URL(origenRef.current.datos))
      .then((maplibre) => {
        if (disposed) return;
        const { ciudad } = origenRef.current;
        const [[w, s], [e, n]] = ciudad.limites;
        // La cámara recordada solo vale para la misma ciudad.
        const previa = camera?.ciudad === ciudad.id ? camera : null;
        map = new maplibre.Map({
          container: element,
          style: buildStyle(temaRef.current, origenRef.current),
          center: previa?.center ?? ciudad.centro,
          zoom: previa?.zoom ?? ciudad.zoom.inicial,
          pitch: previa?.pitch ?? 0,
          minZoom: ciudad.zoom.minimo,
          maxZoom: ciudad.zoom.maximo,
          maxPitch: 85,
          maxBounds: [
            [w - 0.01, s - 0.01],
            [e + 0.01, n + 0.01],
          ],
          attributionControl: { compact: true },
          dragRotate: false,
          // Arrastrar con el botón derecho (o Ctrl) gira e inclina; cada vista limita la inclinación.
          pitchWithRotate: true,
          fadeDuration: 250,
        });
        mapRef.current = map;
        map.touchZoomRotate.disableRotation();
        map
          .getCanvas()
          .setAttribute('aria-label', `Mapa urbano de ${origenRef.current.ciudad.nombre}`);
        map.on('load', () => {
          if (disposed) return;
          // Ciudad 3D detallada (capa propia sobre WebGL2): solo si la ciudad trae su paquete.
          if (ciudad.ciudad3d) {
            const city = new CityLayer(ciudad.centro);
            city.onStats = (stats) => callbacks.current.onCiudad?.({ estado: 'lista', stats });
            city.onError = () => callbacks.current.onCiudad?.({ estado: 'error' });
            map!.addLayer(city, 'bm-complemento-seleccion');
            map!.setLayoutProperty(CITY_LAYER, 'visibility', 'none');
            cityRef.current = city;
          }
          element.dataset.ready = 'true';
          setReady(true);
          callbacks.current.onMapa(map ?? null);
        });
        map.on('moveend', () => {
          if (!map) return;
          const center = map.getCenter();
          camera = {
            ciudad: origenRef.current.ciudad.id,
            center: [center.lng, center.lat],
            zoom: map.getZoom(),
            pitch: map.getPitch(),
          };
        });
        map.on('idle', () => {
          if (!map) return;
          element.dataset.zoom = map.getZoom().toFixed(2);
          element.dataset.pitch = map.getPitch().toFixed(0);
        });
        map.on('error', (event) => {
          if (!disposed && !map?.loaded()) callbacks.current.onFallo();
          console.warn('karto:', event.error?.message);
        });
        map.on('click', (event) => {
          if (!map) return;
          // En la ciudad 3D el edificio se elige por lo que se ve bajo el cursor, salvo que haya
          // un lugar encima.
          if (ciudadRef.current && cityRef.current) {
            const point = map.queryRenderedFeatures(event.point, {
              layers: POINT_LAYERS.filter((l) => map!.getLayer(l)),
            })[0];
            if (!point) {
              void cityRef.current.pick(event.point.x, event.point.y).then((id) => {
                callbacks.current.onSeleccion(
                  id
                    ? { tabla: 'edificio', id, propiedades: { ...porIdRef.current.get(id), id } }
                    : pickAt(map!, event.point),
                );
              });
              return;
            }
          }
          callbacks.current.onSeleccion(pickAt(map, event.point));
        });
        map.on('mousemove', (event) => {
          if (!map) return;
          const layers = SELECTABLE_LAYERS.map((s) => s.layer).filter(
            (l) => map!.getLayer(l) && l !== 'bm-terreno' && l !== 'bm-usos',
          );
          map.getCanvas().style.cursor = map.queryRenderedFeatures(event.point, { layers }).length
            ? 'pointer'
            : '';
        });
      })
      .catch(() => {
        if (!disposed) callbacks.current.onFallo();
      });
    return () => {
      disposed = true;
      observer.disconnect();
      callbacks.current.onMapa(null);
      map?.remove();
      mapRef.current = null;
      cityRef.current = null;
    };
  }, []);

  // El paquete de la ciudad 3D se pide al elegir ese modo y se arma en un worker.
  useEffect(() => {
    if (!ready || !conCiudad || !cityRef.current) return;
    callbacks.current.onCiudad?.({ estado: 'cargando' });
    cityRef.current.load(dataUrl(`${origen.ciudad.id}/ciudad3d.json`, origen.datos));
  }, [ready, conCiudad, origen]);

  // Resalta el elemento seleccionado (edificio, huella complementaria o vía).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const id = (tabla: Tabla) => (seleccion?.tabla === tabla ? seleccion.id : '');
    map.setFilter('bm-seleccion-area', ['==', ['get', 'id'], id('edificio')]);
    map.setFilter('bm-seleccion-via', ['==', ['get', 'id'], id('red_vial')]);
    map.setFilter('bm-complemento-seleccion', ['==', ['get', 'id'], id('edificio_complemento')]);
    cityRef.current?.setSelected(id('edificio'));
  }, [seleccion, ready]);

  // Cambia solo la pintura: conserva fuentes, cámara, filtros y selección.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const next = buildStyle(tema, origen);
    for (const layer of next.layers) {
      if (!map.getLayer(layer.id) || !('paint' in layer)) continue;
      for (const [property, value] of Object.entries(layer.paint ?? {}))
        map.setPaintProperty(
          layer.id,
          property as Parameters<MapLibreMap['setPaintProperty']>[1],
          value,
        );
    }
    const palette = MAP_THEMES[tema].palette;
    cityRef.current?.setTheme({
      night: palette.noche,
      saturation: palette.saturacion,
      selection: palette.seleccion,
      fog: palette.horizonte,
    });
    map.setLight(next.light!);
    map.setSky(next.sky!);
    if (container.current) container.current.dataset.theme = tema;
  }, [tema, origen, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && ready && alturas) (map.getSource('bm-alturas') as GeoJSONSource).setData(alturas);
  }, [alturas, ready]);

  // Huellas complementarias, sin las marcadas como inexistentes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !complemento) return;
    const hidden = new Set(correcciones?.ocultos.edificio_complemento ?? []);
    (map.getSource('bm-complemento') as GeoJSONSource).setData(
      hidden.size
        ? {
            ...complemento,
            features: complemento.features.filter((f) => !hidden.has(String(f.properties?.id))),
          }
        : complemento,
    );
  }, [complemento, correcciones, ready]);

  // Correcciones locales: ocultar edificios y lugares de Overture, reubicar lugares y agregar
  // edificaciones. Solo cambian filtros y fuentes propias; las teselas no se tocan.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const buildings = correcciones?.ocultos.edificio ?? [];
    for (const layer of ['bm-edificios', 'bm-edificios-borde', 'bm-edificios-sombra'])
      map.setFilter(layer, notIn(buildings));
    map.setFilter('bm-edificios-3d', [
      'all',
      ['has', 'altura_m'],
      notIn(buildings),
    ] as FilterSpecification);
    const moved = (correcciones?.lugaresMovidos.features ?? []).map((f) =>
      String(f.properties?.id),
    );
    const places = notIn([...(correcciones?.ocultos.lugar ?? []), ...moved]);
    map.setFilter('bm-lugares', places);
    map.setFilter('bm-lugares-texto', places);
    const empty: FeatureCollection = { type: 'FeatureCollection', features: [] };
    (map.getSource('bm-lugares-movidos') as GeoJSONSource).setData(
      correcciones?.lugaresMovidos ?? empty,
    );
    (map.getSource('bm-agregados') as GeoJSONSource).setData(
      correcciones?.edificiosAgregados ?? empty,
    );
    // La ciudad 3D se vuelve a armar sin los edificios marcados como inexistentes.
    cityRef.current?.setHidden(buildings);
  }, [correcciones, ready]);

  // Las alturas simuladas se pueden ocultar sin ocultar las estimadas por satélite.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const hidden = notIn(correcciones?.ocultos.edificio ?? []);
    const visible = (
      mostrarSimuladas ? ['all', hidden] : ['all', hidden, ['!=', ['get', 'tipo'], 'simulada']]
    ) as FilterSpecification;
    cityRef.current?.setHideSimulated(!mostrarSimuladas);
    map.setFilter('bm-alturas-3d', visible);
    map.setFilter('bm-alturas-sombra', visible);
    map.setFilter('bm-alturas-seleccion', [
      'all',
      visible,
      ['==', ['get', 'id'], seleccion?.tabla === 'edificio' ? seleccion.id : ''],
    ] as FilterSpecification);
  }, [mostrarSimuladas, seleccion, correcciones, ready]);

  // Vistas: 2D plano; 2.5D con inclinación fija y giro; 3D libre con inclinación (hasta 85°) y giro.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const layer of CLASSIC_3D)
      map.setLayoutProperty(layer, 'visibility', mode3d && !ciudad3d ? 'visible' : 'none');
    for (const layer of ['bm-complemento-3d', 'bm-agregados-3d'])
      map.setLayoutProperty(layer, 'visibility', mode3d ? 'visible' : 'none');
    if (map.getLayer(CITY_LAYER))
      map.setLayoutProperty(CITY_LAYER, 'visibility', ciudad3d ? 'visible' : 'none');
    // En la ciudad 3D los árboles y la sombra corta de las huellas los dibuja la ciudad.
    for (const layer of ['bm-arboles', 'bm-arboles-sombra', 'bm-edificios-sombra'])
      if (map.getLayer(layer))
        map.setLayoutProperty(layer, 'visibility', ciudad3d ? 'none' : 'visible');
    if (ciudad3d) cityRef.current?.rise();
    if (map.getLayer('bm-lugares')) map.setLayerZoomRange('bm-lugares', ciudad3d ? 18.4 : 15.5, 24);
    if (map.getLayer('bm-lugares-texto'))
      map.setLayerZoomRange('bm-lugares-texto', ciudad3d ? 18.4 : 16, 24);
    if (mode3d) {
      map.dragRotate.enable();
      map.touchZoomRotate.enableRotation();
      map.touchPitch.enable();
    } else {
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      map.touchPitch.disable();
    }
    const [minPitch, maxPitch] = PITCH[vista];
    const target = vista === '3d' ? Math.max(map.getPitch(), 68) : minPitch;
    // Se amplía el margen de inclinación, se anima la cámara y al terminar se fija el de la vista.
    map.setMinPitch(0);
    map.setMaxPitch(85);
    map.easeTo({
      pitch: target,
      // Entrada en perspectiva con un giro leve; si ya se giró el mapa, se respeta.
      bearing: mode3d ? map.getBearing() || -20 : 0,
      zoom: mode3d ? Math.max(16.2, map.getZoom()) : map.getZoom(),
      duration: 900,
    });
    map.once('moveend', () => {
      map.setMinPitch(minPitch);
      map.setMaxPitch(maxPitch);
    });
  }, [vista, mode3d, ciudad3d, ready]);

  return (
    <div
      ref={container}
      className="karto-map"
      data-testid="mapa"
      data-ready="false"
      data-theme={tema}
      data-modo={vista}
      data-modo3d={conCiudad ? 'ciudad' : 'clasico'}
    />
  );
}
