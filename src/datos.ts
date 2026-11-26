import { useEffect, useState } from 'react';
import type { FeatureCollection } from 'geojson';
import { dataUrl } from './config';
import type { Ciudad, Correcciones } from './tipos';

const cache = new Map<string, Promise<unknown>>();
function json<T>(url: string): Promise<T> {
  if (!cache.has(url))
    cache.set(
      url,
      fetch(url).then((res) => {
        if (!res.ok) throw new Error(`No se pudo leer ${url}`);
        return res.json();
      }),
    );
  return cache.get(url) as Promise<T>;
}

/** Lee un JSON (una sola vez por URL); `activo = false` lo deja para después. */
function useJson<T>(url: string, activo = true) {
  const [estado, setEstado] = useState<{ datos?: T; error: boolean; cargando: boolean }>({
    error: false,
    cargando: activo,
  });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    if (!activo) return;
    let vivo = true;
    setEstado((e) => ({ ...e, cargando: true, error: false }));
    json<T>(url)
      .then((datos) => vivo && setEstado({ datos, error: false, cargando: false }))
      .catch(() => {
        cache.delete(url);
        if (vivo) setEstado({ error: true, cargando: false });
      });
    return () => {
      vivo = false;
    };
  }, [url, activo, intento]);
  return { ...estado, reintentar: () => setIntento((n) => n + 1) };
}

const archivo = (datos: string, ciudad: string, file: string) =>
  dataUrl(`${ciudad}/${file}`, datos);

/** Perfil de la ciudad: centro, límites, zoom y atribución. */
export const useCiudad = (datos: string, ciudad: string) =>
  useJson<Ciudad>(archivo(datos, ciudad, 'ciudad.json'));
/** Alturas de los edificios para 2.5D y 3D: se piden al activar una de esas vistas. */
export const useAlturas = (datos: string, ciudad: string, activo: boolean) =>
  useJson<FeatureCollection>(archivo(datos, ciudad, 'alturas.geojson'), activo);
/** Huellas complementarias de otras fuentes abiertas. */
export const useComplemento = (datos: string, ciudad: string) =>
  useJson<FeatureCollection>(archivo(datos, ciudad, 'complemento.geojson'));
/** Correcciones locales sobre Overture. */
export const useCorrecciones = (datos: string, ciudad: string) =>
  useJson<Correcciones>(archivo(datos, ciudad, 'correcciones.json'));
