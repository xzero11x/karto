import { describe, expect, it } from 'vitest';
import {
  BUILDING_STRIDE,
  FLAG,
  MATERIAL,
  PROP_STRIDE,
  STYLE_FLAGS,
  TREE_STRIDE,
  buildBuildings,
  buildPower,
  buildRoads,
  buildTrees,
  CHUNK_STRIDE,
  sortInstances,
  roadInfo,
  type CityBundleData,
} from './build';
import { GROUND_STRIDE, SURFACE, buildGround } from './ground';
import { CORRUGATED, ROOF_BY_BUCKET, SLAB } from './palette';

// Rectángulo de 10 × 6 m (decímetros) y un polígono en L de 1 piso.
const rect = [0, 0, 100, 0, 100, 60, 0, 60];
const ell = [200, 0, 300, 0, 300, 40, 240, 40, 240, 100, 200, 100];
const bundle: CityBundleData = {
  edificios: {
    ids: ['0aaa', '3bbb', 'a1cc', 'f2dd'],
    pisos: [1, 2, 3, 1],
    tipos: [0, 1, 1, 1],
    geometrias: [[[rect]], [[ell]], [[rect.map((v) => v + 400)]], [[ell.map((v) => v + 800)]]],
  },
  vias: [
    [1, 0, 0, 500, 0],
    [2, 500, 0, 500, 500, 1000, 500],
    [1, 500, 0, 1000, 0],
  ],
  arboles: [10, 20, 85, 30, 400, 400, 120, 45],
};

describe('ciudad 3D: armado de mallas', () => {
  it('edificios con búferes coherentes e índices válidos', () => {
    const b = buildBuildings(bundle, new Set());
    expect(b.shown).toBe(4);
    expect(b.vertices.length % BUILDING_STRIDE).toBe(0);
    const vertices = b.vertices.length / BUILDING_STRIDE;
    expect(b.indices.length % 3).toBe(0);
    expect(Math.max(...b.indices)).toBeLessThan(vertices);
    expect(b.tanks.length % PROP_STRIDE).toBe(0);
    expect(b.rebars.length % PROP_STRIDE).toBe(0);
    // Ningún vértice por encima de 5 pisos ni por debajo del suelo.
    for (let i = 2; i < b.vertices.length; i += BUILDING_STRIDE) {
      expect(b.vertices[i]).toBeGreaterThanOrEqual(0);
      expect(b.vertices[i]).toBeLessThan(5 * 2.75 + 2);
    }
  });

  it('respeta los edificios ocultos por corrección', () => {
    expect(buildBuildings(bundle, new Set(['0aaa', '3bbb'])).shown).toBe(2);
  });

  it('árboles y palmeras en metros', () => {
    const t = buildTrees(bundle);
    expect((t.trees.length + t.palms.length) / TREE_STRIDE).toBe(2);
  });

  it('grafo vial conectado por extremos coincidentes', () => {
    const g = buildRoads(bundle);
    expect(g.edgeStart.length).toBe(3);
    // El nodo en (50 m, 0) une los tres tramos.
    const counts = Array.from(
      { length: g.adjStart.length - 1 },
      (_, n) => g.adjStart[n + 1]! - g.adjStart[n]!,
    );
    expect(Math.max(...counts)).toBe(3);
  });
});

describe('ciudad 3D: datos del censo 2017 y red eléctrica', () => {
  it('reparto de techos: 67,6 % ondulados, 29,3 % concreto', () => {
    const count = (set: Set<number>) => ROOF_BY_BUCKET.filter((r) => set.has(r)).length;
    expect(ROOF_BY_BUCKET.length).toBe(256);
    expect(count(CORRUGATED) / 256).toBeCloseTo(0.676, 2);
    expect(count(SLAB) / 256).toBeCloseTo(0.293, 2);
  });

  it('paredes cerca del censo y solo una o dos plantas en adobe', () => {
    const ids = Array.from({ length: 4000 }, (_, i) =>
      ((i * 2654435761) >>> 0).toString(16).padStart(8, '0'),
    );
    const square = [0, 0, 80, 0, 80, 80, 0, 80];
    const data: CityBundleData = {
      edificios: {
        ids,
        pisos: ids.map((_, i) => (i % 4 === 0 ? 2 : 1)),
        tipos: ids.map(() => 1),
        geometrias: ids.map(() => [[square]]),
      },
      vias: [],
      arboles: [],
    };
    const b = buildBuildings(data, new Set());
    const materials = new Map<number, number>();
    const seen = new Set<number>();
    for (let i = 0; i < b.vertices.length; i += BUILDING_STRIDE) {
      const id = b.vertices[i + 13]!;
      if (seen.has(id)) continue;
      seen.add(id);
      const style = b.vertices[i + 12]!;
      const flags = Math.floor(style / STYLE_FLAGS);
      const material = Math.floor(style / 16) % 8;
      const key =
        flags & FLAG.earth
          ? material === MATERIAL.quincha
            ? 5
            : material === 0 || material === MATERIAL.adobe
              ? 3
              : 9
          : 1;
      materials.set(key, (materials.get(key) ?? 0) + 1);
      // Ninguna pared de tierra pasa de dos plantas.
      if (flags & FLAG.earth) expect(b.vertices[i + 10]).toBeLessThanOrEqual(2);
    }
    const share = (k: number) => (materials.get(k) ?? 0) / seen.size;
    expect(share(1)).toBeGreaterThan(0.44);
    expect(share(1)).toBeLessThan(0.55);
    expect(share(3)).toBeGreaterThan(0.4);
    expect(share(3)).toBeLessThan(0.5);
    expect(share(5)).toBeLessThan(0.07);
  });

  it('postes a lo largo de la calle, fuera de las casas, con cables', () => {
    const p = buildPower(bundle, new Set());
    expect(p.poles.length + p.lamps.length + p.trafos.length).toBeGreaterThan(0);
    expect(p.lines.length % 10).toBe(0);
    expect(p.lines.length).toBeGreaterThan(0);
  });
});

describe('ciudad 3D: suelo, plazas y lugares', () => {
  // Cruce en T con una avenida (código 3) y una calle de tierra (11: clase 1 sin pavimentar),
  // una plaza de 60 × 40 m, una cancha de losa y la piscina en el edificio 'a1cc'.
  const plaza = [2000, 2000, 2600, 2000, 2600, 2400, 2000, 2400];
  const court = [3000, 0, 3400, 0, 3400, 200, 3000, 200];
  const ground: CityBundleData = {
    ...bundle,
    vias: [
      [3, -2000, -300, 0, -300, 2000, -300],
      [1, 0, -300, 0, -1500],
      [11, 3000, 3000, 3600, 3000],
    ],
    suelo: {
      areas: [
        [1, ...plaza],
        [5, ...court],
      ],
      especiales: { piscina: ['a1cc'] },
      puntos: { plaza: [2300, 2200] },
    },
  };

  it('búfer de suelo con rangos coherentes y superficies conocidas', () => {
    const g = buildGround(ground);
    expect(g.vertices.length % GROUND_STRIDE).toBe(0);
    // Cuatro capas, cada una con su tabla de bloques que cubre todos los triángulos.
    expect(g.tables.length).toBe(4);
    let covered = 0;
    for (const table of g.tables)
      for (let k = 0; k < table.length; k += CHUNK_STRIDE) {
        expect(table[k + 6]! % 3).toBe(0);
        covered += table[k + 6]!;
      }
    expect(covered).toBe(g.vertices.length / GROUND_STRIDE);
    expect(g.walks.index.length % 6).toBe(0);
    expect(g.walks.index.length).toBeGreaterThan(0);
    const kinds = new Set<number>();
    for (let i = 6; i < g.vertices.length; i += GROUND_STRIDE) kinds.add(g.vertices[i]!);
    for (const k of [
      SURFACE.lot,
      SURFACE.asphalt,
      SURFACE.dirt,
      SURFACE.tiles,
      SURFACE.grass,
      SURFACE.court,
      SURFACE.water,
    ])
      expect(kinds.has(k)).toBe(true);
    expect(g.vertices.every((x) => Number.isFinite(x))).toBe(true);
    // La calle sin pavimentar queda de tierra; la avenida, pavimentada y con vereda.
    expect(g.stats.pavimentadas).toBe(2);
    expect(g.stats.conVereda).toBeGreaterThanOrEqual(1);
    expect(g.stats.bancas).toBeGreaterThan(4);
  });

  it('la piscina no se dibuja como edificio', () => {
    const b = buildBuildings(ground, new Set());
    expect(b.shown).toBe(3);
  });

  it('código de calle: clase y marcas', () => {
    expect(roadInfo(73)).toEqual({ code: 3, unpaved: true, green: true, malecon: true });
    expect(roadInfo(2)).toEqual({ code: 2, unpaved: false, green: false, malecon: false });
  });
});

describe('ciudad 3D: bloques para dibujar solo lo visible', () => {
  it('edificios: los bloques cubren todos los índices', () => {
    const b = buildBuildings(bundle, new Set());
    let n = 0;
    for (let k = 0; k < b.chunks.length; k += CHUNK_STRIDE) n += b.chunks[k + 6]!;
    expect(n).toBe(b.indices.length);
    expect(b.skirtIndices.length % 3).toBe(0);
    expect(Math.max(...b.skirtIndices)).toBeLessThan(b.skirtVertices.length / 3);
  });

  it('instancias ordenadas por bloque sin perder ninguna', () => {
    const data = new Float32Array([
      0, 0, 5, 2, 0.1, 0, 900, 900, 8, 3, 0.2, 0, 10, 5, 6, 2, 0.3, 1,
    ]);
    const sorted = sortInstances(data, TREE_STRIDE);
    expect(sorted.data.length).toBe(data.length);
    expect(sorted.table.length / CHUNK_STRIDE).toBe(2);
    expect(sorted.table[6]! + sorted.table[CHUNK_STRIDE + 6]!).toBe(3);
  });
});
