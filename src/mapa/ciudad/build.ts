import earcut from 'earcut';
import { FACADE_RANDOM, SLAB, hash, roofIndex } from './palette';

/*
 * Del paquete de ciudad (/api/bagua-master/ciudad) a búferes de GPU. Corre en un Web Worker:
 * el hilo principal solo recibe Float32Array transferidos, sin copiar ni bloquear el mapa.
 */

export interface CityBundleData {
  edificios: { ids: string[]; pisos: number[]; tipos: number[]; geometrias: number[][][][] };
  vias: number[][];
  /** Por vía (mismo orden): media calzada, fachada izquierda y derecha, en decímetros. */
  anchos?: number[][];
  arboles: number[];
  /** Suelo: áreas [tipo, x, y, ...] en decímetros, edificios especiales y puntos de referencia. */
  suelo?: {
    areas: number[][];
    especiales: Record<string, string[]>;
    puntos: Record<string, number[]>;
    /** Polígonos de agua (anillos en decímetros) cerca de la ciudad. */
    agua?: number[][][];
    /** Ejes de ríos (x, y, ... en decímetros), como el Utcubamba junto a la ciudad. */
    rios?: number[][];
    /** Piscinas de OpenStreetMap (anillo en decímetros). */
    piscinas?: number[][];
  };
  fuentes?: Record<string, string | null>;
}

/*
 * Bloques de 250 m: cada malla se guarda ordenada por bloque, con una tabla de cajas, para que el
 * visor dibuje solo los bloques dentro del encuadre y a distancia útil (el resto queda en niebla).
 */
export const CHUNK = 250;
/** Fila de la tabla de bloques: x0, y0, x1, y1, z superior, primero, cantidad. */
export const CHUNK_STRIDE = 7;

export class ChunkSorter {
  private cells = new Map<number, { box: number[]; ranges: number[]; size: number }>();
  constructor(private unit: number) {}
  /** Registra el tramo [from, to) del búfer de origen y su caja. */
  add(from: number, to: number, x0: number, y0: number, x1: number, y1: number, z: number) {
    const gx = Math.floor((x0 + x1) / 2 / CHUNK) + 1000;
    const gy = Math.floor((y0 + y1) / 2 / CHUNK) + 1000;
    const key = gy * 4000 + gx;
    let cell = this.cells.get(key);
    if (!cell) {
      cell = { box: [x0, y0, x1, y1, z], ranges: [], size: 0 };
      this.cells.set(key, cell);
    } else {
      const b = cell.box;
      b[0] = Math.min(b[0]!, x0);
      b[1] = Math.min(b[1]!, y0);
      b[2] = Math.max(b[2]!, x1);
      b[3] = Math.max(b[3]!, y1);
      b[4] = Math.max(b[4]!, z);
    }
    const r = cell.ranges;
    // Tramos contiguos se unen: menos copias al final.
    if (r.length && r[r.length - 1] === from) r[r.length - 1] = to;
    else r.push(from, to);
    cell.size += to - from;
  }
  /** Copia el origen ordenado por bloque; offset: unidades que ya ocupan el búfer. */
  finish<T extends Float32Array | Uint32Array>(
    source: Float32Array | Uint32Array,
    make: (n: number) => T,
    offset = 0,
  ) {
    const keys = [...this.cells.keys()].sort((a, b) => a - b);
    let total = 0;
    for (const k of keys) total += this.cells.get(k)!.size;
    const data = make(total);
    const table = new Float32Array(keys.length * CHUNK_STRIDE);
    let at = 0;
    keys.forEach((k, i) => {
      const c = this.cells.get(k)!;
      table.set([...c.box, offset + at / this.unit, c.size / this.unit], i * CHUNK_STRIDE);
      for (let n = 0; n < c.ranges.length; n += 2) {
        data.set(source.subarray(c.ranges[n]!, c.ranges[n + 1]!), at);
        at += c.ranges[n + 1]! - c.ranges[n]!;
      }
    });
    return { data, table };
  }
}

/** Instancias (x, y, altura, radio, ...) ordenadas por bloque. */
export function sortInstances(data: Float32Array, stride: number) {
  const sorter = new ChunkSorter(stride);
  for (let i = 0; i + stride <= data.length; i += stride) {
    const x = data[i]!;
    const y = data[i + 1]!;
    const r = Math.max(1, data[i + 3]!);
    sorter.add(i, i + stride, x - r, y - r, x + r, y + r, data[i + 2]! + r);
  }
  return sorter.finish(data, (n) => new Float32Array(n));
}

/** Código de calle del paquete: clase 1..4 + 10 sin pavimentar + 20 berma verde + 40 malecón. */
export function roadInfo(raw: number) {
  const f = Math.floor(raw / 10);
  return { code: raw % 10, unpaved: (f & 1) > 0, green: (f & 2) > 0, malecon: (f & 4) > 0 };
}

/**
 * Edificios con forma propia: mercado, coliseo, piscina (se dibuja como piscina), terminal y
 * volúmenes pequeños dentro de una plaza ("plaza": glorietas o copas de árboles detectadas como
 * techo; la plaza ya dibuja su monumento y sus jardines).
 */
export function specialBuildings(data: CityBundleData) {
  const out = new Map<string, string>();
  for (const [tipo, ids] of Object.entries(data.suelo?.especiales ?? {}))
    for (const id of ids) out.set(id, tipo);
  const plazas = (data.suelo?.areas ?? [])
    .filter((a) => a[0] === 1)
    .map((a) => {
      const ring: P[] = [];
      for (let i = 1; i + 1 < a.length; i += 2) ring.push([a[i]! / 10, a[i + 1]! / 10]);
      return ring;
    });
  if (!plazas.length) return out;
  const within = (p: P, ring: P[]) => {
    let hit = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i]!;
      const c = ring[j]!;
      if (
        a[1] > p[1] !== c[1] > p[1] &&
        p[0] < ((c[0] - a[0]) * (p[1] - a[1])) / (c[1] - a[1]) + a[0]
      )
        hit = !hit;
    }
    return hit;
  };
  data.edificios.ids.forEach((id, b) => {
    const flat = data.edificios.geometrias[b]?.[0]?.[0];
    if (!flat || out.has(id)) return;
    const ring: P[] = [];
    for (let i = 0; i + 1 < flat.length; i += 2) ring.push([flat[i]! / 10, flat[i + 1]! / 10]);
    if (ring.length < 3 || Math.abs(ringArea(ring)) > 400) return;
    const c = centroid(ring);
    if (plazas.some((plaza) => within(c, plaza))) out.set(id, 'plaza');
  });
  return out;
}

/** Vértice de edificio: pos 3 · normal 3 · uv 2 · info 4 (largo, alero, pisos, semilla) · estilo · índice. */
export const BUILDING_STRIDE = 14;
/** Instancia de objeto: x, y, z, escala, giro, color. */
export const PROP_STRIDE = 6;
/** Instancia de árbol: x, y, altura, radio de copa, semilla, tipo (0 copa, 1 florido). */
export const TREE_STRIDE = 6;

/** Marcas por edificio (se guardan en el estilo, multiplicadas por STYLE_FLAGS). */
export const FLAG = {
  simulated: 1,
  unfinished: 2,
  shop: 4,
  upper: 8,
  meter: 16,
  earth: 32,
  front: 64,
};
/** Estilo = color + 16·material + 128·techo + 2048·marcas. */
export const STYLE_FLAGS = 2048;
/**
 * Materiales de pared. Censo 2017, viviendas urbanas de Bagua: ladrillo o bloque de cemento
 * 49,0 %, adobe 45,1 %, quincha 3,9 %; pocas de madera, triplay, calamina o estera.
 * "painted" es revoque pintado sobre ladrillo o sobre adobe (marca earth).
 */
export const MATERIAL = {
  painted: 0,
  brick: 1,
  wood: 2,
  adobe: 3,
  concrete: 4,
  quincha: 5,
  sheet: 6,
  mat: 7,
};

const FLOOR_H = 2.75;

export type P = [number, number];

export const rand = (seed: number) => {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
};

export function ringArea(r: P[]) {
  let a = 0;
  r.forEach((p, i) => {
    const q = r[(i + 1) % r.length]!;
    a += p[0] * q[1] - q[0] * p[1];
  });
  return a / 2;
}

/** Rectángulo orientado por la arista más larga: ejes (ax, ay) y extensión en u (largo) y v. */
export function orientedBox(ring: P[]) {
  let li = 0;
  let longest = 0;
  ring.forEach((a, i) => {
    const c = ring[(i + 1) % ring.length]!;
    const d = Math.hypot(c[0] - a[0], c[1] - a[1]);
    if (d > longest) [longest, li] = [d, i];
  });
  const A = ring[li]!;
  const B = ring[(li + 1) % ring.length]!;
  const ax = longest ? (B[0] - A[0]) / longest : 1;
  const ay = longest ? (B[1] - A[1]) / longest : 0;
  let [u0, u1, v0, v1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const p of ring) {
    const u = p[0] * ax + p[1] * ay;
    const v = -p[0] * ay + p[1] * ax;
    [u0, u1, v0, v1] = [Math.min(u0, u), Math.max(u1, u), Math.min(v0, v), Math.max(v1, v)];
  }
  const at = (u: number, v: number): P => [u * ax - v * ay, u * ay + v * ax];
  return { ax, ay, u0, u1, v0, v1, at };
}

/**
 * Huellas irregulares (dentadas, de muchos vértices) que casi llenan su rectángulo orientado: se
 * dibujan como ese rectángulo, como las casas reales de Bagua.
 */
function regularize(local: P[][]): P[][] {
  const outer = local[0];
  if (!outer || local.length !== 1 || outer.length <= 5) return local;
  const b = orientedBox(outer);
  const box = (b.u1 - b.u0) * (b.v1 - b.v0);
  const area = ringArea(outer);
  if (box <= 0 || Math.abs(area) / box < 0.8) return local;
  const rect = [b.at(b.u0, b.v0), b.at(b.u1, b.v0), b.at(b.u1, b.v1), b.at(b.u0, b.v1)];
  return [area > 0 ? rect : rect.reverse()];
}

export function centroid(r: P[]): P {
  let x = 0;
  let y = 0;
  let a = 0;
  r.forEach((p, i) => {
    const q = r[(i + 1) % r.length]!;
    const c = p[0] * q[1] - q[0] * p[1];
    a += c;
    x += (p[0] + q[0]) * c;
    y += (p[1] + q[1]) * c;
  });
  if (Math.abs(a) < 1e-6) return r[0]!;
  return [x / (3 * a), y / (3 * a)];
}

function isRectangle(r: P[]) {
  if (r.length !== 4) return false;
  for (let i = 0; i < 4; i++) {
    const a = r[i]!;
    const b = r[(i + 1) % 4]!;
    const c = r[(i + 2) % 4]!;
    const u = [b[0] - a[0], b[1] - a[1]];
    const v = [c[0] - b[0], c[1] - b[1]];
    const cos =
      (u[0]! * v[0]! + u[1]! * v[1]!) / (Math.hypot(u[0]!, u[1]!) * Math.hypot(v[0]!, v[1]!));
    if (Math.abs(cos) > 0.25) return false;
  }
  return true;
}

export function buildBuildings(data: CityBundleData, hidden: ReadonlySet<string>) {
  const v: number[] = [];
  const idx: number[] = [];
  const tanks: number[] = [];
  const rebars: number[] = [];
  const works: number[] = [];
  // Oclusión de contacto: franja que se oscurece hacia la pared (x, y, intensidad).
  const skirt: number[] = [];
  const skirtIdx: number[] = [];
  const sorter = new ChunkSorter(1);
  const skirtSorter = new ChunkSorter(1);
  const { ids, pisos, tipos, geometrias } = data.edificios;
  const special = specialBuildings(data);
  // Centro consolidado: alrededor de la Plaza de Armas dominan los edificios de 2 a 4 pisos con
  // azotea de concreto, columnas a la vista y comercio abajo; hacia los bordes, casas bajas.
  const plazaDm = data.suelo?.puntos?.plaza;
  const plaza: P | null = plazaDm ? [plazaDm[0]! / 10, plazaDm[1]! / 10] : null;
  const CENTRO_M = 480;
  let shown = 0;

  ids.forEach((id, b) => {
    if (hidden.has(id)) return;
    const kind = special.get(id);
    // La piscina municipal se dibuja con el suelo (agua, borde y cerco), no como edificio.
    if (kind === 'piscina' || kind === 'plaza') return;
    shown++;
    const r = rand(hash(id));
    let floors = Math.max(1, pisos[b] ?? 1);
    let roof = roofIndex(id);
    // Cercanía al centro (1 en la plaza, 0 desde CENTRO_M).
    let centro = 0;
    const first = geometrias[b]?.[0]?.[0];
    if (plaza && first && first.length >= 6) {
      let sx = 0;
      let sy = 0;
      const n = Math.floor(first.length / 2);
      for (let i = 0; i < n * 2; i += 2) {
        sx += first[i]!;
        sy += first[i + 1]!;
      }
      const d = Math.hypot(sx / n / 10 - plaza[0], sy / n / 10 - plaza[1]);
      centro = Math.max(0, 1 - d / CENTRO_M);
    }
    if (!kind && centro > 0 && tipos[b] === 1) {
      const rc = rand(hash(id + ':centro'));
      if (rc() < 0.25 + 0.65 * centro) roof = rc() < 0.62 ? 3 : 5;
      if (rc() < 0.85 * centro) floors = Math.max(floors, 2);
      if (rc() < 0.6 * centro) floors = Math.max(floors, 3);
      if (rc() < 0.3 * centro) floors = 4;
    }
    if (floors >= 3 && !SLAB.has(roof)) roof = 3;
    // Coliseo: nave alta con bóveda de calamina; mercado: nave alta de calamina.
    const vault = kind === 'coliseo';
    if (vault) {
      floors = 3;
      roof = 0;
    }
    if (kind === 'mercado') {
      floors = 2;
      roof = 0;
    }
    // Iglesia: nave alta a dos aguas (las torres y cúpulas las pone el suelo); templos menores a
    // dos aguas de calamina; municipalidad de 4 pisos con muro cortina; hospital, clínica y
    // colegios con azotea de concreto.
    if (kind === 'iglesia') {
      floors = 3;
      roof = 2;
    } else if (kind === 'templo') {
      floors = 2;
      roof = 6;
    } else if (kind === 'municipalidad') {
      floors = Math.max(floors, 5);
      roof = 3;
    } else if (kind === 'comisaria') {
      floors = Math.max(floors, 2);
      roof = 3;
    } else if (kind === 'hospital' || kind === 'clinica' || kind === 'essalud') {
      floors = Math.max(floors, kind === 'clinica' ? 3 : 2);
      roof = 3;
    } else if (kind === 'colegio') {
      floors = Math.max(floors, 2);
      roof = r() < 0.5 ? 3 : 0;
    }
    const huella = geometrias[b]?.[0]?.[0];
    if (!kind && huella && huella.length >= 6 && SLAB.has(roof)) {
      const ring: P[] = [];
      for (let i = 0; i + 1 < huella.length; i += 2)
        ring.push([huella[i]! / 10, huella[i + 1]! / 10]);
      if (Math.abs(ringArea(ring)) > 450) roof = r() < 0.6 ? 0 : 7;
    }
    const slab = SLAB.has(roof);
    // Pared condicionada al techo para que el conjunto respete el censo: bajo losa siempre hay
    // ladrillo o bloque (visto, tarrajeado o concreto); bajo calamina o fibrocemento, 30 %
    // ladrillo, 62 % adobe, 5,5 % quincha y el resto madera, calamina o estera.
    const m = r();
    let material: number;
    let earth = false;
    if (kind) material = vault ? MATERIAL.concrete : MATERIAL.painted;
    else if (slab)
      material = m < 0.38 ? MATERIAL.brick : m < 0.95 ? MATERIAL.painted : MATERIAL.concrete;
    else if (m < 0.3) material = r() < 0.5 ? MATERIAL.brick : MATERIAL.painted;
    else if (m < 0.92) {
      earth = true;
      material = r() < 0.5 ? MATERIAL.adobe : MATERIAL.painted;
    } else if (m < 0.975) {
      earth = true;
      material = MATERIAL.quincha;
    } else {
      earth = true;
      const k = r();
      material = k < 0.45 ? MATERIAL.wood : k < 0.75 ? MATERIAL.sheet : MATERIAL.mat;
    }
    // Adobe hasta dos plantas; quincha, madera, calamina y estera, una.
    if (earth)
      floors = Math.min(
        floors,
        material === MATERIAL.adobe || material === MATERIAL.painted ? 2 : 1,
      );
    const KIND_COLOR: Record<string, number> = {
      iglesia: 13,
      templo: 8,
      municipalidad: 15,
      comisaria: 11,
      essalud: 12,
      hospital: 14,
      clinica: 14,
      colegio: 1,
    };
    const color =
      material === MATERIAL.brick
        ? 0
        : kind
          ? (KIND_COLOR[kind] ?? 4)
          : 1 + Math.floor(r() * FACADE_RANDOM);
    let flags = tipos[b] === 1 ? FLAG.simulated : 0;
    if (earth) flags |= FLAG.earth;
    // Pisos altos sin terminar (ladrillo y columnas a la vista): muy común en Bagua.
    if (!kind && !earth && floors >= 2 && material !== MATERIAL.concrete && r() < 0.5)
      flags |= FLAG.unfinished;
    if (kind === 'mercado' || (!kind && r() < (floors >= 2 ? 0.45 + 0.4 * centro : 0.2)))
      flags |= FLAG.shop;
    // Medidor de luz en la fachada: 95 % de viviendas urbanas con alumbrado de red pública.
    if (r() < 0.95) flags |= FLAG.meter;
    const eave = floors * FLOOR_H + (slab ? 0.3 : 0.1);
    const seed = r();
    const style = color + 16 * material + 128 * roof + STYLE_FLAGS * flags;
    const idxStart = idx.length;
    const skirtStart = skirtIdx.length;
    let [bx0, by0, bx1, by1] = [Infinity, Infinity, -Infinity, -Infinity];

    for (const rings of geometrias[b] ?? []) {
      const nave = kind === 'iglesia' || kind === 'templo';
      const local: P[][] = (data.anchos && !nave ? (x: P[][]) => x : regularize)(
        rings.map((flat) => {
          const out: P[] = [];
          for (let i = 0; i + 1 < flat.length; i += 2) out.push([flat[i]! / 10, flat[i + 1]! / 10]);
          return out;
        }),
      );
      const outer = local[0];
      if (!outer || outer.length < 3) continue;
      const area = Math.abs(ringArea(outer));
      for (const p of outer) {
        bx0 = Math.min(bx0, p[0]);
        by0 = Math.min(by0, p[1]);
        bx1 = Math.max(bx1, p[0]);
        by1 = Math.max(by1, p[1]);
      }
      {
        const ring = ringArea(outer) > 0 ? outer : [...outer].reverse();
        const n = ring.length;
        const first = skirt.length / 3;
        ring.forEach((p, i) => {
          const a = ring[(i - 1 + n) % n]!;
          const c = ring[(i + 1) % n]!;
          const la = Math.hypot(p[0] - a[0], p[1] - a[1]) || 1;
          const lc = Math.hypot(c[0] - p[0], c[1] - p[1]) || 1;
          const n1 = [(p[1] - a[1]) / la, -(p[0] - a[0]) / la];
          const n2 = [(c[1] - p[1]) / lc, -(c[0] - p[0]) / lc];
          let x = n1[0]! + n2[0]!;
          let y = n1[1]! + n2[1]!;
          const l = Math.hypot(x, y) || 1;
          x /= l;
          y /= l;
          const k = 1.8 * Math.min(2, 1 / Math.max(0.5, x * n2[0]! + y * n2[1]!));
          skirt.push(p[0], p[1], 1, p[0] + x * k, p[1] + y * k, 0);
        });
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          const a0 = first + 2 * i;
          const b0 = first + 2 * j;
          skirtIdx.push(a0, b0, b0 + 1, a0, b0 + 1, a0 + 1);
        }
      }
      // Eje del edificio: la arista más larga.
      let li = 0;
      let longest = 0;
      outer.forEach((a, i) => {
        const c = outer[(i + 1) % outer.length]!;
        const d = Math.hypot(c[0] - a[0], c[1] - a[1]);
        if (d > longest) [longest, li] = [d, i];
      });
      // Iglesia: la nave (cumbrera) apunta a la plaza, con la fachada de las torres hacia ella.
      if (kind === 'iglesia' && plaza) {
        const c0 = centroid(outer);
        const dx = plaza[0] - c0[0];
        const dy = plaza[1] - c0[1];
        const dl = Math.hypot(dx, dy) || 1;
        let mejor = -1;
        outer.forEach((a, i) => {
          const c = outer[(i + 1) % outer.length]!;
          const d = Math.hypot(c[0] - a[0], c[1] - a[1]);
          if (d < 3) return;
          const k = Math.abs(((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / (d * dl));
          if (k > mejor) [mejor, li, longest] = [k, i, d];
        });
      }
      const A = outer[li]!;
      const B = outer[(li + 1) % outer.length]!;
      const ax = (B[0] - A[0]) / longest;
      const ay = (B[1] - A[1]) / longest;
      const bx = -ay;
      const by = ax;
      const along = (p: P) => p[0] * ax + p[1] * ay;
      const across = (p: P) => p[0] * bx + p[1] * by;
      let vmin = Infinity;
      let vmax = -Infinity;
      for (const p of outer) {
        vmin = Math.min(vmin, across(p));
        vmax = Math.max(vmax, across(p));
      }
      const depth = Math.max(0.5, vmax - vmin);
      const gable =
        !vault &&
        !slab &&
        local.length === 1 &&
        isRectangle(outer) &&
        depth > 3 &&
        (kind === 'iglesia' || kind === 'templo' || (earth && r() < 0.08));
      const shed = !vault && !slab && !gable;
      const rise = gable
        ? Math.min(1.0, Math.max(0.45, depth * 0.1))
        : shed
          ? Math.min(0.55, Math.max(0.18, depth * 0.045))
          : 0;
      // Altura del techo en un punto (alero + pendiente).
      const roofZ = (p: P) => (shed ? eave + (rise * (across(p) - vmin)) / depth : eave);
      const vertex = (
        p: P,
        z: number,
        n: [number, number, number],
        u: number,
        w: number,
        len: number,
        st = style,
      ) => {
        v.push(p[0], p[1], z, n[0], n[1], n[2], u, w, len, eave, floors, seed, st, b);
        return v.length / BUILDING_STRIDE - 1;
      };

      // Obra en construcción: arena, piedra y ladrillos frente a la fachada, sobre la vereda.
      if (flags & FLAG.unfinished && r() < 0.45) {
        const out = ringArea(outer) > 0 ? -1 : 1;
        works.push(
          (A[0] + B[0]) / 2 + bx * out * 2.2,
          (A[1] + B[1]) / 2 + by * out * 2.2,
          0,
          0.8 + r() * 0.4,
          Math.atan2(ay, ax),
          0,
        );
      }

      // Muros: bajo un techo inclinado, cada muro sube hasta la cubierta.
      local.forEach((ring, ringIndex) => {
        const outward = (ringArea(ring) > 0 ? 1 : -1) * (ringIndex === 0 ? 1 : -1);
        ring.forEach((a, i) => {
          const c = ring[(i + 1) % ring.length]!;
          const dx = c[0] - a[0];
          const dy = c[1] - a[1];
          const len = Math.hypot(dx, dy);
          if (len < 0.05) return;
          const n: [number, number, number] = [(outward * dy) / len, (outward * -dx) / len, 0];
          const za = gable ? eave : roofZ(a);
          const zc = gable ? eave : roofZ(c);
          const st = ringIndex === 0 && i === li ? style + STYLE_FLAGS * FLAG.front : style;
          const i0 = vertex(a, 0, n, 0, 0, len, st);
          const i1 = vertex(c, 0, n, len, 0, len, st);
          const i2 = vertex(c, zc, n, len, zc, len, st);
          const i3 = vertex(a, za, n, 0, za, len, st);
          idx.push(i0, i1, i2, i0, i2, i3);
        });
      });

      if (gable) {
        // Dos aguas sobre rectángulo: cumbrera paralela a la arista larga, con alero de 0,35 m.
        const [P0, P1, P2, P3] = [0, 1, 2, 3].map((k) => outer[(li + k) % 4]!) as [P, P, P, P];
        const c = centroid(outer);
        const grow = (p: P, ridge = false): P => {
          const ex = 0.35 * Math.sign(along(p) - along(c));
          const ey = ridge ? 0 : 0.35 * Math.sign(across(p) - across(c));
          return [p[0] + ax * ex + bx * ey, p[1] + ay * ex + by * ey];
        };
        const mid = (p: P, q: P): P => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        const M1 = mid(P3, P0);
        const M2 = mid(P1, P2);
        const top = eave + rise;
        const [E0, E1, E2, E3] = [grow(P0), grow(P1), grow(P2), grow(P3)];
        const ridge1 = grow(M1, true);
        const ridge2 = grow(M2, true);
        const face = (q: P[], zs: number[]) => {
          const p0 = [q[0]![0], q[0]![1], zs[0]!];
          const p1 = [q[1]![0], q[1]![1], zs[1]!];
          const p2 = [q[2]![0], q[2]![1], zs[2]!];
          const ux = p1[0]! - p0[0]!;
          const uy = p1[1]! - p0[1]!;
          const uz = p1[2]! - p0[2]!;
          const wx = p2[0]! - p0[0]!;
          const wy = p2[1]! - p0[1]!;
          const wz = p2[2]! - p0[2]!;
          let n: [number, number, number] = [
            uy * wz - uz * wy,
            uz * wx - ux * wz,
            ux * wy - uy * wx,
          ];
          const l = Math.hypot(...n) || 1;
          n = [n[0] / l, n[1] / l, n[2] / l];
          if (n[2] < 0) n = [-n[0], -n[1], -n[2]];
          const base = q.map((p, k) => vertex(p, zs[k]!, n, along(p), across(p), 0));
          idx.push(base[0]!, base[1]!, base[2]!, base[0]!, base[2]!, base[3]!);
        };
        face([E0, E1, ridge2, ridge1], [eave - 0.08, eave - 0.08, top, top]);
        face([ridge1, ridge2, E2, E3], [top, top, eave - 0.08, eave - 0.08]);
        // Hastiales: triángulos de muro sobre los lados cortos.
        const gableWall = (p: P, q: P, m: P) => {
          const dx = q[0] - p[0];
          const dy = q[1] - p[1];
          const len = Math.hypot(dx, dy);
          const out = ringArea(outer) > 0 ? 1 : -1;
          const n: [number, number, number] = [(out * dy) / len, (out * -dx) / len, 0];
          const st = style | 0;
          const a = vertex(p, eave, n, 0, eave, len, st + STYLE_FLAGS * FLAG.upper);
          const c2 = vertex(q, eave, n, len, eave, len, st + STYLE_FLAGS * FLAG.upper);
          const t = vertex(m, top, n, len / 2, top, len, st + STYLE_FLAGS * FLAG.upper);
          idx.push(a, c2, t);
        };
        gableWall(P1, P2, M2);
        gableWall(P3, P0, M1);
      } else if (vault) {
        // Bóveda rebajada sobre el rectángulo envolvente (flecha 18 % de la luz: toda la cubierta
        // se lee como techo) y tímpanos en los extremos.
        let umin = Infinity;
        let umax = -Infinity;
        for (const p of outer) {
          umin = Math.min(umin, along(p));
          umax = Math.max(umax, along(p));
        }
        const at = (u: number, w: number): P => [ax * u + bx * w, ay * u + by * w];
        const sag = depth * 0.18;
        const R = (depth * depth) / 4 / (2 * sag) + sag / 2;
        const half = Math.asin(depth / 2 / R);
        const steps = 10;
        const arc = Array.from({ length: steps + 1 }, (_, k) => {
          const t = -half + (2 * half * k) / steps;
          return {
            w: (vmin + vmax) / 2 + R * Math.sin(t),
            z: eave + R * Math.cos(t) - (R - sag),
            t,
          };
        });
        for (let k = 0; k < steps; k++) {
          const a = arc[k]!;
          const c = arc[k + 1]!;
          const tm = (a.t + c.t) / 2;
          const n: [number, number, number] = [
            -Math.sin(tm) * bx,
            -Math.sin(tm) * by,
            Math.cos(tm),
          ];
          const q = [
            at(umin - 0.4, a.w),
            at(umax + 0.4, a.w),
            at(umax + 0.4, c.w),
            at(umin - 0.4, c.w),
          ];
          const base = q.map((p, j) => vertex(p, j < 2 ? a.z : c.z, n, along(p), across(p), 0));
          idx.push(base[0]!, base[1]!, base[2]!, base[0]!, base[2]!, base[3]!);
        }
        for (const [u, sgn] of [
          [umin, -1],
          [umax, 1],
        ] as const) {
          const n: [number, number, number] = [ax * sgn, ay * sgn, 0];
          const st = style + STYLE_FLAGS * FLAG.upper;
          const mid = vertex(at(u, (vmin + vmax) / 2), eave, n, depth / 2, eave, depth, st);
          for (let k = 0; k < steps; k++) {
            const a = arc[k]!;
            const c = arc[k + 1]!;
            const i0 = vertex(at(u, a.w), a.z, n, a.w - vmin, a.z, depth, st);
            const i1 = vertex(at(u, c.w), c.z, n, c.w - vmin, c.z, depth, st);
            idx.push(mid, i0, i1);
          }
        }
      } else {
        // Techo plano (losa) o a una agua (calamina): triangulado con earcut.
        const flat = local.flat();
        const holes: number[] = [];
        let count = 0;
        local.forEach((ring, i) => {
          if (i > 0) holes.push(count);
          count += ring.length;
        });
        const g = shed ? rise / depth : 0;
        let n: [number, number, number] = [-g * bx, -g * by, 1];
        const l = Math.hypot(...n);
        n = [n[0] / l, n[1] / l, n[2] / l];
        const base = flat.map((p) => vertex(p, roofZ(p), n, along(p), across(p), 0));
        for (const t of earcut(flat.flat(), holes, 2)) idx.push(base[t]!);
      }

      // Objetos en las losas: tanque de agua y columnas de espera con fierros.
      if (slab && area > 25) {
        const c = centroid(outer);
        if (r() < 0.72) {
          const corner = outer[Math.floor(r() * outer.length)]!;
          const k = 0.25 + r() * 0.3;
          tanks.push(
            c[0] + (corner[0] - c[0]) * k,
            c[1] + (corner[1] - c[1]) * k,
            eave,
            0.85 + r() * 0.3,
            r() * 6.28,
            r() < 0.75 ? 6 : 1,
          );
        }
        if (floors <= 2 && r() < 0.42) {
          const step = Math.max(1, Math.floor(outer.length / 6));
          for (let i = 0; i < outer.length; i += step) {
            const p = outer[i]!;
            const dx = c[0] - p[0];
            const dy = c[1] - p[1];
            const d = Math.hypot(dx, dy) || 1;
            rebars.push(p[0] + (dx / d) * 0.25, p[1] + (dy / d) * 0.25, eave, 1, r() * 0.3, 0);
          }
        }
      }
    }
    if (idx.length > idxStart) {
      sorter.add(idxStart, idx.length, bx0, by0, bx1, by1, eave + 3);
      skirtSorter.add(skirtStart, skirtIdx.length, bx0 - 2, by0 - 2, bx1 + 2, by1 + 2, 0.2);
    }
  });

  const sorted = sorter.finish(Uint32Array.from(idx), (n) => new Uint32Array(n));
  const skirts = skirtSorter.finish(Uint32Array.from(skirtIdx), (n) => new Uint32Array(n));
  return {
    vertices: new Float32Array(v),
    indices: sorted.data,
    chunks: sorted.table,
    skirtVertices: new Float32Array(skirt),
    skirtIndices: skirts.data,
    skirtChunks: skirts.table,
    tanks: new Float32Array(tanks),
    rebars: new Float32Array(rebars),
    works: new Float32Array(works),
    shown,
  };
}

export function buildTrees(data: CityBundleData) {
  const trees: number[] = [];
  const palms: number[] = [];
  const a = data.arboles;
  for (let i = 0; i + 3 < a.length; i += 4) {
    const x = a[i]! / 10;
    const y = a[i + 1]! / 10;
    const h = Math.min(32, a[i + 2]! / 10);
    const radius = a[i + 3]! / 10;
    const r = rand(hash(`${a[i]}_${a[i + 1]}`));
    const seed = r();
    const kind = r();
    if (h < 16 && kind < 0.14)
      palms.push(x, y, Math.max(6, h), Math.max(2.2, radius * 0.9), seed, 0);
    else trees.push(x, y, h, radius, seed, kind > 0.93 ? 1 : 0);
  }
  return { trees: new Float32Array(trees), palms: new Float32Array(palms) };
}

/** Grafo vial para el tráfico: tramos con sus puntos y nodos por extremos coincidentes (±1 m). */
export function buildRoads(data: CityBundleData) {
  const points: number[] = [];
  const edgeStart: number[] = [];
  const edgeCount: number[] = [];
  const edgeA: number[] = [];
  const edgeB: number[] = [];
  const edgeCode: number[] = [];
  const nodes = new Map<string, number>();
  const nodeXY: number[] = [];
  const node = (x: number, y: number) => {
    const key = `${Math.round(x)}_${Math.round(y)}`;
    let n = nodes.get(key);
    if (n === undefined) {
      n = nodes.size;
      nodes.set(key, n);
      nodeXY.push(x, y);
    }
    return n;
  };
  for (const road of data.vias) {
    const code = road[0]! % 10;
    const n = (road.length - 1) / 2;
    if (n < 2) continue;
    const start = points.length / 2;
    for (let i = 1; i < road.length; i += 2) points.push(road[i]! / 10, road[i + 1]! / 10);
    edgeStart.push(start);
    edgeCount.push(n);
    edgeA.push(node(road[1]! / 10, road[2]! / 10));
    edgeB.push(node(road[road.length - 2]! / 10, road[road.length - 1]! / 10));
    edgeCode.push(code);
  }
  const adjacency: number[][] = Array.from({ length: nodes.size }, () => []);
  edgeA.forEach((a, e) => {
    adjacency[a]!.push(e);
    adjacency[edgeB[e]!]!.push(e);
  });
  const adjStart: number[] = [];
  const adj: number[] = [];
  for (const list of adjacency) {
    adjStart.push(adj.length);
    adj.push(...list);
  }
  adjStart.push(adj.length);
  return {
    points: new Float32Array(points),
    edgeStart: new Int32Array(edgeStart),
    edgeCount: new Int32Array(edgeCount),
    edgeA: new Int32Array(edgeA),
    edgeB: new Int32Array(edgeB),
    edgeCode: new Uint8Array(edgeCode),
    adjStart: new Int32Array(adjStart),
    adj: new Int32Array(adj),
  };
}

export type RoadGraph = ReturnType<typeof buildRoads>;

/*
 * Red eléctrica de baja tensión: postes de concreto cada ~34 m en un lado de la calle, cables
 * entre postes, alumbrado público y acometidas a las casas cercanas. En 2017, 5 916 de las
 * 6 230 viviendas urbanas ocupadas tenían alumbrado eléctrico de red pública. La posición de
 * cada poste es ilustrativa: no proviene de un catastro de la red.
 */
export function buildPower(data: CityBundleData, hidden: ReadonlySet<string>) {
  // Rejilla de huellas (anillo exterior) para no plantar postes dentro de las casas.
  const cell = 25;
  const grid = new Map<string, P[][]>();
  data.edificios.ids.forEach((id, b) => {
    if (hidden.has(id)) return;
    for (const rings of data.edificios.geometrias[b] ?? []) {
      const flat = rings[0];
      if (!flat) continue;
      const ring: P[] = [];
      for (let i = 0; i + 1 < flat.length; i += 2) ring.push([flat[i]! / 10, flat[i + 1]! / 10]);
      const c = centroid(ring);
      const key = `${Math.floor(c[0] / cell)}_${Math.floor(c[1] / cell)}`;
      const list = grid.get(key) ?? [];
      list.push(ring);
      grid.set(key, list);
    }
  });
  const near = (p: P, reach = 1) => {
    const gx = Math.floor(p[0] / cell);
    const gy = Math.floor(p[1] / cell);
    const out: P[][] = [];
    for (let x = gx - reach; x <= gx + reach; x++)
      for (let y = gy - reach; y <= gy + reach; y++) out.push(...(grid.get(`${x}_${y}`) ?? []));
    return out;
  };
  const inside = (p: P, ring: P[]) => {
    let hit = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i]!;
      const c = ring[j]!;
      if (
        a[1] > p[1] !== c[1] > p[1] &&
        p[0] < ((c[0] - a[0]) * (p[1] - a[1])) / (c[1] - a[1]) + a[0]
      )
        hit = !hit;
    }
    return hit;
  };
  const poles: number[] = [];
  const lamps: number[] = [];
  const trafos: number[] = [];
  const lines: number[] = [];
  const placed = new Map<string, P[]>();
  const tooClose = (p: P) => {
    const key = (x: number, y: number) => `${Math.floor(x / 10)}_${Math.floor(y / 10)}`;
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (const q of placed.get(key(p[0] + x * 10, p[1] + y * 10)) ?? [])
          if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 14) return true;
    return false;
  };
  const remember = (p: P) => {
    const key = `${Math.floor(p[0] / 10)}_${Math.floor(p[1] / 10)}`;
    const list = placed.get(key) ?? [];
    list.push(p);
    placed.set(key, list);
  };
  const dark = [0.16, 0.16, 0.17];
  // Cable con catenaria (flecha ~1 % del vano) como segmentos de línea.
  const wire = (a: number[], c: number[], sag: number) => {
    const n = 5;
    for (let i = 0; i < n; i++) {
      for (const t of [i / n, (i + 1) / n]) {
        const z = a[2]! + (c[2]! - a[2]!) * t - sag * 4 * t * (1 - t);
        lines.push(
          a[0]! + (c[0]! - a[0]!) * t,
          a[1]! + (c[1]! - a[1]!) * t,
          z,
          0,
          0,
          1,
          ...dark,
          0,
        );
      }
    }
  };
  let count = 0;
  for (const road of data.vias) {
    const code = road[0]! % 10;
    const pts: P[] = [];
    for (let i = 1; i + 1 < road.length; i += 2) pts.push([road[i]! / 10, road[i + 1]! / 10]);
    if (pts.length < 2) continue;
    const offset = code >= 3 ? 7.5 : code === 2 ? 5.6 : 4.3;
    const spacing = 34;
    let walked = 0;
    let next = 8;
    let previous: { top: number[][]; low: number[] } | null = null;
    for (let k = 0; k + 1 < pts.length; k++) {
      const a = pts[k]!;
      const c = pts[k + 1]!;
      const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
      if (len < 0.01) continue;
      const dx = (c[0] - a[0]) / len;
      const dy = (c[1] - a[1]) / len;
      while (next <= walked + len) {
        const t = next - walked;
        next += spacing + ((count * 7) % 5) - 2;
        const p: P = [a[0] + dx * t + dy * offset, a[1] + dy * t - dx * offset];
        if (tooClose(p) || near(p).some((ring) => inside(p, ring))) {
          previous = null;
          continue;
        }
        remember(p);
        count++;
        const heading = Math.atan2(dy, dx);
        const lamp = code >= 2 || count % 2 === 0;
        const trafo = count % 7 === 0;
        (lamp ? lamps : trafo ? trafos : poles).push(p[0], p[1], 0, 1, heading, 0);
        // Puntos de amarre: extremos de la cruceta (media tensión) y bastidor bajo.
        const lx = -dy;
        const ly = dx;
        const top = [0.65, -0.65].map((s) => [p[0] + lx * s, p[1] + ly * s, 8.1]);
        const low = [p[0] + lx * 0.15, p[1] + ly * 0.15, 6.8];
        if (previous) {
          const span = Math.hypot(
            top[0]![0]! - previous.top[0]![0]!,
            top[0]![1]! - previous.top[0]![1]!,
          );
          if (span < 55) {
            top.forEach((q, i) => wire(previous!.top[i]!, q, span * 0.012));
            wire(previous.low, low, span * 0.018);
          }
        }
        previous = { top, low };
        // Acometidas: cable del bastidor bajo a la casa más cercana a cada lado del poste.
        let best: { d: number; q: P } | null = null;
        for (const ring of near(p)) {
          for (const q of ring) {
            const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
            if (d > 3 && d < 16 && (!best || d < best.d)) best = { d, q };
          }
        }
        if (best) wire(low, [best.q[0], best.q[1], 2.9], 0.25);
      }
      walked += len;
    }
  }
  return {
    poles: new Float32Array(poles),
    lamps: new Float32Array(lamps),
    trafos: new Float32Array(trafos),
    lines: new Float32Array(lines),
  };
}
