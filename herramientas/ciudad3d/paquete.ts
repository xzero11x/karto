import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import type { Pool } from 'pg';

/*
 * Paquete de ciudad para la vista 3D: edificios (huella, pisos), árboles y calles en un solo
 * JSON compacto. Coordenadas enteras en decímetros, locales al centro de Bagua (Mercator web,
 * igual que el visor), así el navegador no proyecta nada y el archivo pesa menos de la mitad.
 * Se calcula una vez, se guarda comprimido en memoria y se sirve con ETag.
 */

const CENTER = [-78.5367, -5.6378] as const;
const EARTH = 2 * Math.PI * 6371008.8;
const mercX = (lng: number) => (180 + lng) / 360;
const mercY = (lat: number) =>
  (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) / 360;
const OX = mercX(CENTER[0]);
const OY = mercY(CENTER[1]);
const MERC_PER_M = 1 / (EARTH * Math.cos((CENTER[1] * Math.PI) / 180));
/** [lng, lat] -> [x, y] en decímetros (x al este, y al norte). */
const local = (lng: number, lat: number) => [
  Math.round(((mercX(lng) - OX) / MERC_PER_M) * 10),
  Math.round(((OY - mercY(lat)) / MERC_PER_M) * 10),
];

type Ring = number[][];
type Geometry =
  { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] };

const flatRing = (ring: Ring) => ring.slice(0, -1).flatMap(([lng, lat]) => local(lng!, lat!));

/*
 * Pisos visuales de Bagua: una y dos plantas. Referencia: expediente del sector Tomaque, 72 % de
 * edificaciones de una planta y 28 % de dos (no hay una distribución urbana fiable para tres o
 * más). Se reparte por rango de la altura estimada (satélite o simulación): las más altas son
 * las de dos plantas. Tres plantas solo donde el satélite (Google 2.5D) mide 9 m o más en una
 * huella de 40 m² o más; nunca cuatro.
 */
const ONE_FLOOR_SHARE = 0.72;
const DRIVABLE = new Set([
  'trunk',
  'primary',
  'secondary',
  'tertiary',
  'residential',
  'unclassified',
  'living_street',
  'service',
  'unknown',
]);
const ROAD_CODE: Record<string, number> = { trunk: 4, primary: 3, secondary: 2, tertiary: 2 };

/*
 * Lugares de referencia para ambientar el suelo (coordenadas aproximadas de registros municipales
 * y cartografía de OpenStreetMap; sirven para ubicar, no marcan entradas ni límites exactos).
 * radio: búsqueda del edificio que lo representa; minimo: área mínima; cuantos: edificios.
 */
const LUGARES = [
  { tipo: 'plaza', lng: -78.53169, lat: -5.63914, radio: 0, minimo: 0, cuantos: 0 },
  { tipo: 'mercado', lng: -78.53108, lat: -5.63631, radio: 30, minimo: 500, cuantos: 2 },
  { tipo: 'coliseo', lng: -78.53544, lat: -5.63694, radio: 25, minimo: 1500, cuantos: 1 },
  { tipo: 'piscina', lng: -78.52867, lat: -5.63784, radio: 8, minimo: 300, cuantos: 1 },
  { tipo: 'terminal', lng: -78.52571, lat: -5.64311, radio: 25, minimo: 300, cuantos: 1 },
  // Edificios importantes (lugares de Overture; la municipalidad, por el edificio alto del lado
  // este de la plaza). Cada uno toma los edificios más grandes dentro del radio.
  { tipo: 'iglesia', lng: -78.53182, lat: -5.63857, radio: 30, minimo: 300, cuantos: 1 },
  { tipo: 'municipalidad', lng: -78.53099, lat: -5.63885, radio: 3, minimo: 200, cuantos: 1 },
  { tipo: 'hospital', lng: -78.53025, lat: -5.63892, radio: 70, minimo: 250, cuantos: 4 },
  { tipo: 'hospital', lng: -78.53572, lat: -5.6351, radio: 50, minimo: 200, cuantos: 3 },
  { tipo: 'clinica', lng: -78.53299, lat: -5.6364, radio: 15, minimo: 120, cuantos: 1 },
  { tipo: 'colegio', lng: -78.53398, lat: -5.6371, radio: 60, minimo: 150, cuantos: 6 },
  { tipo: 'colegio', lng: -78.52837, lat: -5.63826, radio: 50, minimo: 150, cuantos: 5 },
  { tipo: 'colegio', lng: -78.53184, lat: -5.63601, radio: 40, minimo: 150, cuantos: 4 },
  { tipo: 'colegio', lng: -78.53554, lat: -5.64114, radio: 30, minimo: 120, cuantos: 3 },
  { tipo: 'colegio', lng: -78.53528, lat: -5.63191, radio: 90, minimo: 200, cuantos: 8 },
  { tipo: 'templo', lng: -78.52981, lat: -5.64073, radio: 20, minimo: 100, cuantos: 1 },
  { tipo: 'templo', lng: -78.53491, lat: -5.64059, radio: 20, minimo: 100, cuantos: 1 },
] as const;

/** Áreas de uso del suelo: 1 plaza, 2 parque, 3 estadio, 4 cancha de césped, 5 losa deportiva,
 * 6 colegio, 7 cementerio, 8 hospital. */
function areaCode(
  clase: string,
  nombre: string | null,
  superficie: string | null,
  deporte: string | null,
) {
  if (clase === 'park') return /^plaza/i.test(nombre ?? '') ? 1 : 2;
  if (clase === 'stadium') return 3;
  if (clase === 'pitch') return /grass/.test(superficie ?? '') || deporte === 'soccer' ? 4 : 5;
  if (clase === 'school' || clase === 'college') return 6;
  if (clase === 'cemetery') return 7;
  if (clase === 'hospital') return 8;
  return 0;
}

export async function buildCityBundle(pool: Pool, dataDir: string) {
  const buildings = await pool.query(
    `SELECT e.id, coalesce(e.altura_m,a.altura_m,s.altura_m) AS altura_m,
            CASE WHEN e.altura_m IS NOT NULL THEN 2 WHEN a.edificio_id IS NOT NULL THEN 0 ELSE 1 END AS tipo,
            ST_Area(e.geom_utm) AS area,
            ST_AsGeoJSON(coalesce(m.geom,e.geom),7)::json AS geometry
     FROM bagua_master.edificio e
     LEFT JOIN bagua_master.edificio_geom_mapa m ON m.edificio_id=e.id
     LEFT JOIN bagua_master.altura_estimada a ON e.id=a.edificio_id
     LEFT JOIN bagua_master.altura_simulada s ON e.id=s.edificio_id
     WHERE e.geom_valida AND coalesce(e.altura_m,a.altura_m,s.altura_m)>0 ORDER BY e.id`,
  );
  const rows = buildings.rows as {
    id: string;
    altura_m: number;
    tipo: number;
    area: number;
    geometry: Geometry;
  }[];
  const ranked = rows
    .map((r, i) => ({ i, h: Number(r.altura_m), id: r.id }))
    .sort((a, b) => a.h - b.h || (a.id < b.id ? -1 : 1));
  const floors = new Array<number>(rows.length).fill(1);
  ranked.forEach((r, k) => {
    const q = (k + 0.5) / ranked.length;
    const row = rows[r.i]!;
    let f = q <= ONE_FLOOR_SHARE ? 1 : 2;
    if (row.tipo === 0 && r.h >= 9 && row.area >= 40) f = 3;
    floors[r.i] = f;
  });

  const ids: string[] = [];
  const pisos: number[] = [];
  const tipos: number[] = [];
  const geometrias: number[][][][] = [];
  rows.forEach((row, i) => {
    const polygons =
      row.geometry.type === 'Polygon' ? [row.geometry.coordinates] : row.geometry.coordinates;
    ids.push(row.id);
    pisos.push(floors[i]!);
    tipos.push(row.tipo);
    geometrias.push(polygons.map((rings) => rings.map(flatRing)));
  });

  /*
   * Calles: clase (1 a 4) + 10 si OpenStreetMap la marca sin pavimentar + 20 si es tramo con
   * berma verde (Av. Circunvalación y Av. Héroes del Cenepa, donde la municipalidad sembró
   * césped) + 40 si es la Av. Malecón (orientada con el río Utcubamba a la derecha).
   */
  const roads = await pool.query(
    `WITH rio AS (SELECT ST_Union(geom_utm) AS g FROM bagua_master.agua)
     SELECT r.clase, r.nombre,
       EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(r.atributos->'road_surface')='array'
                 THEN r.atributos->'road_surface' ELSE '[]'::jsonb END) x
               WHERE x->>'value'='unpaved' AND (jsonb_typeof(x->'between') IS DISTINCT FROM 'array'
                 OR (x->'between'->>1)::float - (x->'between'->>0)::float > 0.5)) AS sin_pavimento,
       CASE WHEN r.nombre ILIKE 'Avenida Malec%' AND rio.g IS NOT NULL THEN
         ST_Distance(ST_OffsetCurve(r.geom_utm, 15), rio.g) < ST_Distance(ST_OffsetCurve(r.geom_utm, -15), rio.g)
       ELSE false END AS rio_izquierda,
       ST_AsGeoJSON(r.geom,7)::json AS geometry
     FROM bagua_master.red_vial r, rio
     WHERE r.geom_valida AND ST_GeometryType(r.geom)='ST_LineString'`,
  );
  const vias = (
    roads.rows as {
      clase: string;
      nombre: string | null;
      sin_pavimento: boolean;
      rio_izquierda: boolean;
      geometry: { coordinates: number[][] };
    }[]
  )
    .filter((r) => DRIVABLE.has(r.clase))
    .map((r) => {
      const nombre = r.nombre ?? '';
      const malecon = /^avenida malec/i.test(nombre);
      const verde = /circunvalaci|h[ée]roes del cenepa/i.test(nombre);
      const coords = r.rio_izquierda
        ? [...r.geometry.coordinates].reverse()
        : r.geometry.coordinates;
      return [
        (ROAD_CODE[r.clase] ?? 1) +
          (r.sin_pavimento ? 10 : 0) +
          (verde ? 20 : 0) +
          (malecon ? 40 : 0),
        ...coords.flatMap(([lng, lat]) => local(lng!, lat!)),
      ];
    });

  const usos = await pool.query(
    `SELECT u.clase, u.nombre, u.atributos->>'surface' AS superficie,
            u.atributos->'source_tags'->>'sport' AS deporte,
            ST_AsGeoJSON(ST_ExteriorRing(d.geom),7)::json AS anillo
     FROM bagua_master.uso_suelo u, LATERAL ST_Dump(u.geom) d
     WHERE u.geom_valida AND ST_GeometryType(d.geom)='ST_Polygon'`,
  );
  const areas = (
    usos.rows as {
      clase: string;
      nombre: string | null;
      superficie: string | null;
      deporte: string | null;
      anillo: { coordinates: number[][] };
    }[]
  )
    .map((r) => [
      areaCode(r.clase, r.nombre, r.superficie, r.deporte),
      ...flatRing(r.anillo.coordinates),
    ])
    .filter((a) => a[0]! > 0 && a.length >= 7);

  // Aguas a menos de ~3,5 km de la plaza: el Utcubamba llega como eje (línea), los ríos anchos
  // como polígono y la piscina municipal como polígono de OpenStreetMap.
  const plaza = LUGARES[0];
  const aguas = await pool.query(
    `WITH caja AS (SELECT ST_Expand(ST_SetSRID(ST_MakePoint($1, $2), 4326), 0.032) AS g)
     SELECT a.clase, ST_AsGeoJSON(d.geom, 7)::json AS geometry
     FROM bagua_master.agua a, caja,
       LATERAL ST_Dump(ST_SimplifyPreserveTopology(ST_Intersection(a.geom, caja.g), 0.00002)) d
     WHERE a.geom_valida AND ST_Intersects(a.geom, caja.g) AND NOT ST_IsEmpty(d.geom)`,
    [plaza.lng, plaza.lat],
  );
  const agua: number[][][] = [];
  const piscinas: number[][] = [];
  const rios: number[][] = [];
  for (const row of aguas.rows as {
    clase: string;
    geometry: { type: string; coordinates: number[][] | Ring[] };
  }[]) {
    if (row.geometry.type === 'LineString')
      rios.push(
        (row.geometry.coordinates as number[][]).flatMap(([lng, lat]) => local(lng!, lat!)),
      );
    else if (row.geometry.type === 'Polygon') {
      const rings = (row.geometry.coordinates as Ring[]).map(flatRing);
      if (row.clase === 'swimming_pool') piscinas.push(rings[0]!);
      else agua.push(rings);
    }
  }

  const especiales: Record<string, string[]> = {};
  const puntos: Record<string, number[]> = {};
  for (const lugar of LUGARES) {
    puntos[lugar.tipo] ??= local(lugar.lng, lugar.lat);
    if (!lugar.cuantos) continue;
    const found = await pool.query(
      `SELECT e.id FROM bagua_master.edificio e
       WHERE e.geom_valida AND ST_Area(e.geom_utm) >= $4
         AND ST_DWithin(e.geom_utm, ST_Transform(ST_SetSRID(ST_MakePoint($1,$2),4326),32718), $3)
       ORDER BY ST_Area(e.geom_utm) DESC LIMIT $5`,
      [lugar.lng, lugar.lat, lugar.radio, lugar.minimo, lugar.cuantos],
    );
    // Un edificio pertenece a un solo lugar: el primero de la lista que lo toma.
    const taken = new Set(Object.values(especiales).flat());
    especiales[lugar.tipo] = [
      ...(especiales[lugar.tipo] ?? []),
      ...(found.rows as { id: string }[]).map((r) => r.id).filter((id) => !taken.has(id)),
    ];
  }

  let arboles: number[] = [];
  let fuenteArboles: string | null = null;
  try {
    const trees = JSON.parse(
      await readFile(path.join(dataDir, 'ciudad', 'arboles.json'), 'utf8'),
    ) as { fuente: string; arboles: [number, number, number, number][] };
    fuenteArboles = trees.fuente;
    arboles = trees.arboles.flatMap(([lng, lat, h, r]) => [
      ...local(lng, lat),
      Math.round(h * 10),
      Math.round(r * 10),
    ]);
  } catch {
    // Sin archivo de árboles: la ciudad se dibuja igual.
  }

  const body = JSON.stringify({
    origen: CENTER,
    unidad: 'decimetros',
    edificios: { ids, pisos, tipos, geometrias },
    vias,
    arboles,
    suelo: { areas, especiales, puntos, agua, rios, piscinas },
    fuentes: {
      suelo:
        'Suelo: calles sin pavimentar según OpenStreetMap; el resto por sector (centro pavimentado, bordes con tierra). Plazas, parques, estadio y canchas: polígonos de OpenStreetMap (Overture).',
      arboles: fuenteArboles,
      pisos:
        'Pisos visuales: 72 % una planta y 28 % dos (expediente sector Tomaque); tres solo con altura satelital >= 9 m.',
      materiales:
        'Paredes y techos según Censo 2017 (INEI), viviendas urbanas de Bagua: ladrillo 49 %, adobe 45 %, quincha 4 %; calamina o fibrocemento 67 %, concreto 29 %.',
    },
  });
  const raw = Buffer.from(body);
  return {
    etag: `"${createHash('sha1').update(raw).digest('hex').slice(0, 16)}"`,
    raw,
    gzip: gzipSync(raw, { level: 9 }),
    at: Date.now(),
  };
}

export type CityBundle = Awaited<ReturnType<typeof buildCityBundle>>;
