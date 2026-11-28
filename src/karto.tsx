import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { Controles } from './componentes/controles';
import { Ficha } from './componentes/ficha';
import { Leyenda } from './componentes/leyenda';
import { SelectorEstilo } from './componentes/selector-estilo';
import { CIUDAD_POR_DEFECTO, DATOS_POR_DEFECTO, type Origen } from './config';
import { useAlturas, useCiudad, useComplemento, useCorrecciones } from './datos';
import { Mapa, type EstadoCiudad } from './mapa/mapa';
import { DEFAULT_THEME, type MapTheme } from './mapa/themes';
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

// Mapa urbano completo: temas, vistas 2D / 2.5D / 3D, alturas, ficha y controles.
export function Karto({
  datos = DATOS_POR_DEFECTO,
  ciudad: ciudadId = CIUDAD_POR_DEFECTO,
  temaInicial = DEFAULT_THEME,
  tema: temaControlado,
  onTema,
  vistaInicial = '2d',
  vista: vistaControlada,
  onVista,
  modo3dInicial = 'clasico',
  modo3d: modo3dControlado,
  onModo3d,
  leyenda = true,
  controles = true,
  selectorTema = true,
  ficha: conFicha = true,
  alturasModeladas = true,
  onSeleccion,
  onMapa,
  children,
  className,
}: KartoProps) {
  const [mapa, setMapa] = useState<MapLibreMap | null>(null);
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [temaPropio, setTemaPropio] = useState<MapTheme>(temaInicial);
  const [vistaPropia, setVistaPropia] = useState<Vista>(vistaInicial);
  const [mostrarSimuladas, setMostrarSimuladas] = useState(alturasModeladas);
  const [fallo, setFallo] = useState(false);
  const [modo3dPropio, setModo3dPropio] = useState<Modo3d>(modo3dInicial);
  const [estadoCiudad, setEstadoCiudad] = useState<EstadoCiudad | null>(null);
  const tema = temaControlado ?? temaPropio;
  const vista = vistaControlada ?? vistaPropia;
  const modo3d = modo3dControlado ?? modo3dPropio;
  const mode3d = vista !== '2d';

  const ciudad = useCiudad(datos, ciudadId);
  const alturas = useAlturas(datos, ciudadId, mode3d);
  const complemento = useComplemento(datos, ciudadId);
  const correcciones = useCorrecciones(datos, ciudadId);
  const origen = useMemo<Origen | null>(
    () => (ciudad.datos ? { datos, ciudad: ciudad.datos } : null),
    [datos, ciudad.datos],
  );

  const callbacks = useRef({ onSeleccion, onMapa });
  useEffect(() => {
    callbacks.current = { onSeleccion, onMapa };
  }, [onSeleccion, onMapa]);
  const elegir = useCallback((s: Seleccion | null) => {
    setSeleccion(s);
    callbacks.current.onSeleccion?.(s);
  }, []);
  const listo = useCallback((m: MapLibreMap | null) => {
    setMapa(m);
    callbacks.current.onMapa?.(m);
  }, []);
  const onFallo = useCallback(() => setFallo(true), []);
  const cambiarTema = (t: MapTheme) => {
    setTemaPropio(t);
    onTema?.(t);
  };
  const cambiarVista = (v: Vista) => {
    setVistaPropia(v);
    onVista?.(v);
  };
  const cambiarModo3d = (m: Modo3d) => {
    setModo3dPropio(m);
    onModo3d?.(m);
  };
  const conCiudad = Boolean(ciudad.datos?.ciudad3d) && modo3d === 'ciudad';

  const resumen = useMemo(() => {
    const cuenta = { estimada: 0, simulada: 0 };
    for (const f of alturas.datos?.features ?? []) {
      const tipo = f.properties?.tipo as keyof typeof cuenta;
      if (tipo in cuenta) cuenta[tipo] += 1;
    }
    return cuenta;
  }, [alturas.datos]);

  // En 2D la tesela del edificio no trae altura: se completa con la capa de alturas si ya se leyó.
  const fichaActual = useMemo(() => {
    if (seleccion?.tabla !== 'edificio' || seleccion.propiedades.altura_m !== undefined)
      return seleccion;
    const altura = alturas.datos?.features.find((f) => f.properties?.id === seleccion.id);
    return altura
      ? { ...seleccion, propiedades: { ...seleccion.propiedades, ...altura.properties } }
      : seleccion;
  }, [seleccion, alturas.datos]);

  return (
    <div
      className={`karto${className ? ` ${className}` : ''}`}
      aria-label={`Mapa urbano de ${ciudad.datos?.nombre ?? ''}`}
    >
      {origen && (
        <Mapa
          key={`${datos}|${origen.ciudad.id}`}
          origen={origen}
          seleccion={seleccion}
          vista={vista}
          tema={tema}
          modo3d={modo3d}
          alturas={alturas.datos}
          mostrarSimuladas={mostrarSimuladas}
          complemento={complemento.datos}
          correcciones={correcciones.datos}
          onSeleccion={elegir}
          onMapa={listo}
          onFallo={onFallo}
          onCiudad={setEstadoCiudad}
        />
      )}
      {controles && ciudad.datos && (
        <Controles
          ciudad={ciudad.datos}
          mapa={mapa}
          vista={vista}
          onVista={cambiarVista}
          modo3d={modo3d}
          onModo3d={cambiarModo3d}
        />
      )}
      {selectorTema && <SelectorEstilo tema={tema} onCambio={cambiarTema} />}
      {leyenda && <Leyenda tema={tema} vista={vista} ciudad3d={conCiudad} />}
      {mode3d && (
        <details className="karto-height-notice">
          <summary>{vista === '3d' ? 'Vista 3D libre' : 'Vista 2.5D'} · alturas</summary>
          {vista === '3d' && (
            <span className="karto-height-observed">
              Gira e inclina con clic derecho o Ctrl + arrastrar; en pantalla táctil, con dos dedos.
            </span>
          )}
          {conCiudad && (
            <span className="karto-height-observed" data-testid="karto-estado-ciudad">
              {estadoCiudad?.estado === 'error'
                ? 'No se pudo armar la ciudad 3D. Los volúmenes simples siguen disponibles.'
                : estadoCiudad?.estado === 'lista' && estadoCiudad.stats
                  ? `Ciudad 3D: ${estadoCiudad.stats.edificios.toLocaleString('es-PE')} edificios, ${estadoCiudad.stats.arboles.toLocaleString('es-PE')} árboles por satélite y ${estadoCiudad.stats.vehiculos} vehículos de ejemplo`
                  : 'Armando la ciudad 3D…'}
            </span>
          )}
          {alturas.error ? (
            <>
              No se pudieron cargar las alturas.{' '}
              <button type="button" onClick={alturas.reintentar}>
                Reintentar
              </button>
            </>
          ) : alturas.cargando ? (
            'Cargando alturas…'
          ) : (
            <>
              <span className="karto-height-observed">
                {ciudad.datos?.alturas?.fuente ?? 'Observadas'}:{' '}
                {resumen.estimada.toLocaleString('es-PE')}
              </span>
              <label className="karto-height-simulated">
                <input
                  type="checkbox"
                  checked={mostrarSimuladas}
                  onChange={(event) => setMostrarSimuladas(event.target.checked)}
                />
                Modeladas: {resumen.simulada.toLocaleString('es-PE')}
              </label>
            </>
          )}
        </details>
      )}
      {(fallo || ciudad.error) && (
        <div className="karto-failure" role="alert">
          No se pudo cargar la cartografía de «{ciudadId}». Revisa que los datos estén publicados en{' '}
          {datos}.
        </div>
      )}
      {conFicha && fichaActual && (
        <Ficha
          key={`${fichaActual.tabla}-${fichaActual.id}`}
          seleccion={fichaActual}
          onCerrar={() => elegir(null)}
        />
      )}
      {children}
    </div>
  );
}
