import earcut from 'earcut';
import {
  ChunkSorter,
  type CityBundleData,
  type P,
  TREE_STRIDE,
  centroid,
  rand,
  orientedBox,
  ringArea,
  roadInfo,
  specialBuildings,
} from './build';
import {
  MODEL_STRIDE,
  baguaMonumentModel,
  benchModel,
  busModel,
  bustModel,
  churchTopModel,
  doubleLampModel,
  flagModel,
  healthSignModel,
  goalModel,
  lanternModel,
  mototaxiModel,
  stallModel,
  stopSignModel,
} from './models';
import { hash, rgb } from './palette';

/*
 * Suelo de la ciudad 3D. Guía visual para Bagua, no un porcentaje medido:
 *   centro       calzada pavimentada, veredas con sardinel, plazas con losetas y jardines
 *   barrios      pavimento y veredas donde corresponde, franjas de césped y solares con tierra
 *   bordes       calles de tierra y afirmado alternadas con pavimento, lotes de tierra expuesta
 *   salida       más tierra y vegetación seca dispersa (bosque seco), nunca alfombra verde
 * Las calles que OpenStreetMap marca sin pavimentar quedan de tierra; Av. Circunvalación y
 * Av. Héroes del Cenepa llevan bermas de césped en tramos; la Av. Malecón, paseo hacia el río.
 * Plazas, parques, estadio y canchas usan los polígonos de OpenStreetMap; bancas, monumento,
 * señales y puestos son representativos.
 */

/** Vértice de suelo: posición 3 · normal 3 · superficie · tres parámetros (u, v, w o color). */
export const GROUND_STRIDE = 10;
export const SURFACE = {
  lot: 0,
  asphalt: 1,
  dirt: 2,
  sidewalk: 3,
  curb: 4,
  grass: 5,
  tiles: 6,
  path: 7,
  pitch: 8,
  court: 9,
  water: 10,
  earth: 11,
  concrete: 12,
  zebra: 14,
  river: 17,
  riverBand: 18,
  paint: 15,
  wall: 16,
  model: 100,
} as const;

// Alturas de cada capa (m): separan superficies superpuestas para que no parpadeen.
const Z = {
  dirt: 0.03,
  asphalt: 0.06,
  mark: 0.09,
  area: 0.08,
  field: 0.11,
  path: 0.14,
  cross: 0.16,
  center: 0.18,
  curb: 0.2,
};

type V3 = [number, number, number];
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

class Writer {
  data: number[] = [];
  vertex(p: V3, n: V3, k: number, q: V3) {
    this.data.push(p[0], p[1], p[2], n[0], n[1], n[2], k, q[0], q[1], q[2]);
  }
  quad(p: V3[], n: V3, k: number, q: V3[]) {
    for (const i of [0, 1, 2, 0, 2, 3]) this.vertex(p[i]!, n, k, q[i]!);
  }
  /** Modelo de models.ts girado, escalado y trasladado, con sus colores horneados. */
  model(
    model: Float32Array,
    x: number,
    y: number,
    z: number,
    heading: number,
    scale = 1,
    paint?: V3,
  ) {
    const c = Math.cos(heading);
    const s = Math.sin(heading);
    for (let i = 0; i < model.length; i += MODEL_STRIDE) {
      const flag = model[i + 9]!;
      const color: V3 =
        paint && (flag === 1 || flag === 4) ? paint : [model[i + 6]!, model[i + 7]!, model[i + 8]!];
      const px = model[i]! * scale;
      const py = model[i + 1]! * scale;
      const nx = model[i + 3]!;
      const ny = model[i + 4]!;
      this.vertex(
        [x + c * px - s * py, y + s * px + c * py, z + model[i + 2]! * scale],
        [c * nx - s * ny, s * nx + c * ny, model[i + 5]!],
        SURFACE.model + (paint && (flag === 1 || flag === 4) ? 0 : flag),
        color,
      );
    }
  }
  /** Caja orientada (centro, rumbo) con color: barandas, muros y graderías. */
  box(
    cx: number,
    cy: number,
    heading: number,
    lx: number,
    ly: number,
    z0: number,
    z1: number,
    hex: string,
    k = 0,
  ) {
    const color = rgb(hex) as V3;
    const c = Math.cos(heading);
    const s = Math.sin(heading);
    const at = (u: number, v: number, z: number): V3 => [cx + c * u - s * v, cy + s * u + c * v, z];
    const hx = lx / 2;
    const hy = ly / 2;
    const col = [color, color, color, color];
    const m = SURFACE.model + k;
    this.quad(
      [at(-hx, -hy, z1), at(hx, -hy, z1), at(hx, hy, z1), at(-hx, hy, z1)],
      [0, 0, 1],
      m,
      col,
    );
    this.quad(
      [at(hx, -hy, z0), at(hx, hy, z0), at(hx, hy, z1), at(hx, -hy, z1)],
      [c, s, 0],
      m,
      col,
    );
    this.quad(
      [at(-hx, hy, z0), at(-hx, -hy, z0), at(-hx, -hy, z1), at(-hx, hy, z1)],
      [-c, -s, 0],
      m,
      col,
    );
    this.quad(
      [at(-hx, -hy, z0), at(hx, -hy, z0), at(hx, -hy, z1), at(-hx, -hy, z1)],
      [s, -c, 0],
      m,
      col,
    );
    this.quad(
      [at(hx, hy, z0), at(-hx, hy, z0), at(-hx, hy, z1), at(hx, hy, z1)],
      [-s, c, 0],
      m,
      col,
    );
  }
  /** Polígono plano triangulado. */
  polygon(ring: P[], z: number, k: number, q: (p: P) => V3) {
    for (const t of earcut(ring.flat(), undefined, 2)) {
      const p = ring[t]!;
      this.vertex([p[0], p[1], z], [0, 0, 1], k, q(p));
    }
  }
}

// ------------------------------------------------------------------ polilíneas
interface Line {
  pts: P[];
  s: number[];
}
function line(pts: P[]): Line {
  const clean: P[] = [];
  for (const p of pts) {
    const q = clean[clean.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.05) clean.push(p);
  }
  const s = [0];
  for (let i = 1; i < clean.length; i++)
    s.push(
      s[i - 1]! + Math.hypot(clean[i]![0] - clean[i - 1]![0], clean[i]![1] - clean[i - 1]![1]),
    );
  return { pts: clean, s };
}
const length = (l: Line) => l.s[l.s.length - 1] ?? 0;
/** Punto y dirección a la distancia d. */
function pointAt(l: Line, d: number) {
  let i = 0;
  while (i < l.pts.length - 2 && l.s[i + 1]! < d) i++;
  const a = l.pts[i]!;
  const b = l.pts[i + 1]!;
  const seg = l.s[i + 1]! - l.s[i]! || 1;
  const t = Math.min(1, Math.max(0, (d - l.s[i]!) / seg));
  const dx = (b[0] - a[0]) / seg;
  const dy = (b[1] - a[1]) / seg;
  return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as P, dx, dy };
}
/** Tramo entre las distancias d0 y d1. */
function slice(l: Line, d0: number, d1: number): Line {
  const pts: P[] = [pointAt(l, d0).p];
  const s = [d0];
  l.s.forEach((d, i) => {
    if (d > d0 + 0.05 && d < d1 - 0.05) {
      pts.push(l.pts[i]!);
      s.push(d);
    }
  });
  pts.push(pointAt(l, d1).p);
  s.push(d1);
  return { pts, s };
}
/** Normales a la izquierda con inglete en cada vértice. */
function miters(l: Line) {
  const n = l.pts.length;
  const seg = (i: number): P => {
    const a = l.pts[i]!;
    const b = l.pts[i + 1]!;
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [-(b[1] - a[1]) / d, (b[0] - a[0]) / d];
  };
  return l.pts.map((_, j) => {
    if (j === 0) return seg(0);
    if (j === n - 1) return seg(n - 2);
    const a = seg(j - 1);
    const b = seg(j);
    let x = a[0] + b[0];
    let y = a[1] + b[1];
    const d = Math.hypot(x, y);
    if (d < 1e-6) return a;
    x /= d;
    y /= d;
    const k = 1 / Math.max(0.5, x * b[0] + y * b[1]);
    return [x * k, y * k] as P;
  });
}
/** Banda plana entre dos desplazamientos laterales (izquierda positiva). */
function band(
  w: Writer,
  l: Line,
  o0: number,
  o1: number,
  z: number,
  k: number,
  q: (s: number, o: number) => V3,
) {
  const m = miters(l);
  for (let i = 0; i + 1 < l.pts.length; i++) {
    const at = (j: number, o: number): V3 => [
      l.pts[j]![0] + m[j]![0] * o,
      l.pts[j]![1] + m[j]![1] * o,
      z,
    ];
    w.quad([at(i, o0), at(i + 1, o0), at(i + 1, o1), at(i, o1)], [0, 0, 1], k, [
      q(l.s[i]!, o0),
      q(l.s[i + 1]!, o0),
      q(l.s[i + 1]!, o1),
      q(l.s[i]!, o1),
    ]);
  }
}
/** Cara vertical a un desplazamiento lateral (sardinel), mirando hacia el eje de la calle. */
function face(w: Writer, l: Line, o: number, z0: number, z1: number, k: number, paint: number) {
  const m = miters(l);
  const side = o > 0 ? -1 : 1;
  for (let i = 0; i + 1 < l.pts.length; i++) {
    const a = l.pts[i]!;
    const b = l.pts[i + 1]!;
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const n: V3 = [(-(b[1] - a[1]) / d) * side, ((b[0] - a[0]) / d) * side, 0];
    const at = (j: number, z: number): V3 => [
      l.pts[j]![0] + m[j]![0] * o,
      l.pts[j]![1] + m[j]![1] * o,
      z,
    ];
    w.quad([at(i, z0), at(i + 1, z0), at(i + 1, z1), at(i, z1)], n, k, [
      [l.s[i]!, z0, paint],
      [l.s[i + 1]!, z0, paint],
      [l.s[i + 1]!, z1, paint],
      [l.s[i]!, z1, paint],
    ]);
  }
}
/** Partes de [0, L] fuera de los cortes. */
function pieces(L: number, cuts: [number, number][]) {
  const out: [number, number][] = [];
  let from = 0;
  for (const [a, b] of [...cuts].sort((x, y) => x[0] - y[0])) {
    if (a > from) out.push([from, Math.min(a, L)]);
    from = Math.max(from, b);
  }
  if (from < L) out.push([from, L]);
  return out.filter(([a, b]) => b - a > 1.2);
}

// ------------------------------------------------------------------ polígonos
function inside(p: P, ring: P[]) {
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
}
/** Rectángulo orientado por la arista más larga: centro, eje, medio largo y medio ancho. */
function obb(ring: P[]) {
  let best = 0;
  let ax = 1;
  let ay = 0;
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length]!;
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d > best) [best, ax, ay] = [d, (b[0] - a[0]) / d, (b[1] - a[1]) / d];
  });
  let [u0, u1, v0, v1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const p of ring) {
    const u = p[0] * ax + p[1] * ay;
    const v = -p[0] * ay + p[1] * ax;
    [u0, u1, v0, v1] = [Math.min(u0, u), Math.max(u1, u), Math.min(v0, v), Math.max(v1, v)];
  }
  let hl = (u1 - u0) / 2;
  let hw = (v1 - v0) / 2;
  const uc = (u0 + u1) / 2;
  const vc = (v0 + v1) / 2;
  const center: P = [uc * ax - vc * ay, uc * ay + vc * ax];
  if (hw > hl) {
    [hl, hw] = [hw, hl];
    [ax, ay] = [-ay, ax];
  }
  return { center, ax, ay, hl, hw };
}
/** Distancia desde c en la dirección d hasta el borde del anillo. */
function reach(ring: P[], c: P, d: P) {
  let best = Infinity;
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length]!;
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const den = d[0] * ey - d[1] * ex;
    if (Math.abs(den) < 1e-9) return;
    const t = ((a[0] - c[0]) * ey - (a[1] - c[1]) * ex) / den;
    const u = ((a[0] - c[0]) * d[1] - (a[1] - c[1]) * d[0]) / den;
    if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t);
  });
  return Number.isFinite(best) ? best : 0;
}
/** Anillo desplazado hacia adentro (anillo antihorario). */
function inset(ring: P[], d: number): P[] {
  const n = ring.length;
  return ring.map((p, i) => {
    const a = ring[(i - 1 + n) % n]!;
    const b = ring[(i + 1) % n]!;
    const n1 = norm([-(p[1] - a[1]), p[0] - a[0]]);
    const n2 = norm([-(b[1] - p[1]), b[0] - p[0]]);
    let x = n1[0] + n2[0];
    let y = n1[1] + n2[1];
    const l = Math.hypot(x, y) || 1;
    x /= l;
    y /= l;
    const k = Math.min(2, 1 / Math.max(0.5, x * n2[0] + y * n2[1]));
    return [p[0] + x * d * k, p[1] + y * d * k];
  });
}
const norm = (v: P): P => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};
const toRing = (flat: number[], from = 0): P[] => {
  const out: P[] = [];
  for (let i = from; i + 1 < flat.length; i += 2) out.push([flat[i]! / 10, flat[i + 1]! / 10]);
  if (ringArea(out) < 0) out.reverse();
  return out;
};

// ------------------------------------------------------------------ armado
export function buildGround(data: CityBundleData) {
  const lots = new Writer();
  // Tierra con bordes suaves (calles sin pavimentar): se mezcla sobre los lotes.
  const soft = new Writer();
  const flat = new Writer();
  const cast = new Writer();
  // Recorridos de peatones: veredas, caminos de plaza, malecón y alrededor del mercado.
  const walks: { pts: P[]; z: number; weight: number; half: number; kind: number }[] = [];
  const walkway = (l: Line, offset: number, z: number, weight: number, half: number, kind = 0) => {
    if (length(l) < 4 || half <= 0) return;
    const m = miters(l);
    walks.push({
      pts: l.pts.map((p, j) => [p[0] + m[j]![0] * offset, p[1] + m[j]![1] * offset] as P),
      z,
      weight,
      half,
      kind,
    });
  };
  const extraTrees: number[] = [];
  const extraPalms: number[] = [];
  const suelo = data.suelo;
  const puntos = suelo?.puntos ?? {};
  const plaza: P = puntos.plaza ? [puntos.plaza[0]! / 10, puntos.plaza[1]! / 10] : [0, 0];

  // Huellas de edificios en rejilla (claves numéricas): densidad por sector y lugares libres.
  const cell = 40;
  const cellAt = (x: number, y: number) =>
    (Math.floor(y / cell) + 2000) * 5000 + Math.floor(x / cell) + 2000;
  const put = <T>(grid: Map<number, T[]>, x: number, y: number, item: T) => {
    const k = cellAt(x, y);
    const list = grid.get(k);
    if (list) list.push(item);
    else grid.set(k, [item]);
  };
  /** Recorre lo guardado en las 9 celdas vecinas; se detiene si fn devuelve true. */
  const near = <T>(grid: Map<number, T[]>, p: P, fn: (item: T) => boolean | void) => {
    const k = cellAt(p[0], p[1]);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const list = grid.get(k + dy * 5000 + dx);
        if (list) for (const item of list) if (fn(item)) return true;
      }
    return false;
  };
  const density = new Map<number, number>();
  const rings = new Map<number, P[][]>();
  const centerGrid = new Map<number, P[]>();
  const centers: P[] = [];
  const geometryOf = new Map<string, number[][][]>();
  data.edificios.ids.forEach((id, b) => {
    const geometry = data.edificios.geometrias[b] ?? [];
    geometryOf.set(id, geometry);
    for (const polygon of geometry) {
      if (!polygon[0]) continue;
      const ring = toRing(polygon[0]);
      if (ring.length < 3) continue;
      const c = centroid(ring);
      centers.push(c);
      const k = cellAt(c[0], c[1]);
      density.set(k, (density.get(k) ?? 0) + 1);
      put(rings, c[0], c[1], ring);
      put(centerGrid, c[0], c[1], c);
    }
  });
  const built = (p: P) => near(rings, p, (r) => inside(p, r));
  /** Sector: 0 centro consolidado, 1 borde en desarrollo (distancia a la plaza y densidad). */
  const zoneAt = (p: P) => {
    const k = cellAt(p[0], p[1]);
    let n = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) n += density.get(k + dy * 5000 + dx) ?? 0;
    const far = smooth(300, 1400, Math.hypot(p[0] - plaza[0], p[1] - plaza[1]));
    return Math.min(1, Math.max(0, 0.55 * far + 0.7 * (1 - Math.min(1, n / 24)) - 0.12));
  };

  // Árboles satelitales en rejilla: no plantar dos en el mismo lugar.
  const treeGrid = new Map<number, P[]>();
  for (let i = 0; i + 3 < data.arboles.length; i += 4)
    put(treeGrid, data.arboles[i]! / 10, data.arboles[i + 1]! / 10, [
      data.arboles[i]! / 10,
      data.arboles[i + 1]! / 10,
    ] as P);
  const plant = (p: P, h: number, r: number, seed: number) => {
    if (near(treeGrid, p, (q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 4.5)) return;
    extraTrees.push(p[0], p[1], h, r, seed, 0);
    put(treeGrid, p[0], p[1], p);
  };

  // ---------------------------------------------------------------- calles
  interface Road {
    l: Line;
    code: number;
    hw: number;
    paved: boolean;
    walk: boolean;
    sw: number;
    /** Vereda a la izquierda y a la derecha del eje (m), medida sobre las fachadas. */
    swL: number;
    swR: number;
    green: boolean;
    malecon: boolean;
    /** Avenida con berma verde (Héroes del Cenepa, Circunvalación). */
    berma: boolean;
    zone: number;
    r: () => number;
  }
  const roads: Road[] = [];
  data.vias.forEach((raw, i) => {
    const pts: P[] = [];
    for (let k = 1; k + 1 < raw.length; k += 2) pts.push([raw[k]! / 10, raw[k + 1]! / 10]);
    const l = line(pts);
    if (l.pts.length < 2 || length(l) < 1) return;
    const info = roadInfo(raw[0]!);
    const r = rand(hash(`via${i}`));
    const zone = zoneAt(pointAt(l, length(l) / 2).p);
    const paved = !info.unpaved && (info.code >= 3 || r() < 1 - 0.78 * smooth(0.25, 0.85, zone));
    const width = info.code === 4 ? 5 : info.code === 3 ? 4.5 : info.code === 2 ? 4 : 3.2;
    // Con la base corregida, calzada y veredas vienen medidas sobre las fachadas reales: la
    // vereda llega justo a la línea de fachada y ninguna casa queda sobre ella.
    const medida = data.anchos?.[i];
    const hw = medida ? medida[0]! / 10 : paved ? width : Math.min(width, 3);
    const swDef = zone < 0.25 ? 2.2 : 1.7;
    const swL = medida ? Math.max(0, medida[1]! / 10 - hw) : swDef;
    const swR = medida ? Math.max(0, medida[2]! / 10 - hw) : swDef;
    const walk = medida
      ? paved && Math.max(swL, swR) >= 0.4
      : paved && (info.malecon || zone < 0.45 || r() < 0.4) && !(info.code === 4 && zone > 0.6);
    roads.push({
      l,
      code: info.code,
      hw: paved ? hw : Math.min(hw, 3),
      paved,
      walk,
      sw: Math.max(swL, swR),
      swL,
      swR,
      green: info.green && walk && Math.min(swL, swR) >= 2.6 && r() < 0.75,
      malecon: info.malecon,
      berma: info.green,
      zone,
      r,
    });
  });
  // Intersecciones: vértices compartidos con grado 3 o más (extremos suman 1, interiores 2).
  const nodes = new Map<string, { degree: number; hw: number }>();
  const key = (p: P) => `${Math.round(p[0])}_${Math.round(p[1])}`;
  for (const road of roads)
    road.l.pts.forEach((p, j) => {
      const n = nodes.get(key(p)) ?? { degree: 0, hw: 0 };
      n.degree += j === 0 || j === road.l.pts.length - 1 ? 1 : 2;
      n.hw = Math.max(n.hw, road.hw);
      nodes.set(key(p), n);
    });

  let stops = 0;
  const sign = stopSignModel();
  const lantern = lanternModel();
  const farolPlaza = doubleLampModel();
  const bench = benchModel();
  for (const road of roads) {
    const { l, hw, r } = road;
    const L = length(l);
    const top = road.paved ? Z.asphalt : Z.dirt;
    if (road.paved)
      band(flat, l, -hw, hw, top, SURFACE.asphalt, (s, o) => [s, o, road.code === 4 ? 0 : 1]);
    else band(soft, l, -hw - 0.6, hw + 0.6, top, SURFACE.dirt, (s, o) => [s, o, hw]);
    const crossings = l.pts
      .map((p, j) => ({ s: l.s[j]!, n: nodes.get(key(p))! }))
      .filter((c) => c.n.degree >= 3);

    if (road.walk) {
      const cuts = crossings.map(
        (c) => [c.s - c.n.hw - road.sw - 0.4, c.s + c.n.hw + road.sw + 0.4] as [number, number],
      );
      const paint = road.zone < 0.2 && r() < 0.35 ? 1 : 0;
      for (const [a, b] of pieces(L, cuts)) {
        const part = slice(l, a, b);
        for (const side of [1, -1]) {
          const sw = side === 1 ? road.swL : road.swR;
          if (sw < 0.4 && !(road.malecon && side === -1)) continue;
          face(flat, part, side * hw, top, Z.curb, SURFACE.curb, paint);
          if (road.malecon && side === -1) {
            // Paseo del malecón hacia el río: losetas, baranda, faroles, bancas y árboles.
            const wpro = 5.5;
            band(flat, part, -hw, -hw - wpro, Z.curb, SURFACE.tiles, (s, o) => [
              s,
              -o - hw - wpro / 2,
              wpro / 2,
            ]);
            const pl = length(part);
            walkway(part, -hw - wpro / 2, Z.curb, 2.5, 2.2, 2);
            for (let d = 0; d + 2.5 <= pl; d += 2.5) {
              const { p, dx, dy } = pointAt(part, d);
              const o = -hw - wpro + 0.15;
              cast.box(
                p[0] - dy * o,
                p[1] + dx * o,
                Math.atan2(dy, dx),
                0.08,
                0.08,
                Z.curb,
                Z.curb + 1.0,
                '#e9e7e0',
              );
              const q = pointAt(part, Math.min(pl, d + 1.25));
              cast.box(
                q.p[0] - q.dy * o,
                q.p[1] + q.dx * o,
                Math.atan2(q.dy, q.dx),
                2.5,
                0.07,
                Z.curb + 0.92,
                Z.curb + 1.02,
                '#e9e7e0',
              );
              cast.box(
                q.p[0] - q.dy * o,
                q.p[1] + q.dx * o,
                Math.atan2(q.dy, q.dx),
                2.5,
                0.04,
                Z.curb + 0.45,
                Z.curb + 0.5,
                '#e9e7e0',
              );
            }
            for (let d = 6; d < pl - 2; d += 14) {
              const { p, dx, dy } = pointAt(part, d);
              const heading = Math.atan2(dy, dx);
              const at = (o: number): P => [p[0] - dy * o, p[1] + dx * o];
              const b = at(-hw - wpro + 1.1);
              cast.model(bench, b[0], b[1], Z.curb, heading);
              const t = at(-hw - 1.1);
              if ((d / 14) % 2 < 1) plant(t, 6 + r() * 2, 2.4 + r() * 0.6, r());
              else {
                const f = at(-hw - 0.5);
                cast.model(lantern, f[0], f[1], Z.curb, heading);
              }
            }
            continue;
          }
          let inner = hw;
          let vereda = sw;
          if (road.green && sw >= 2.6) {
            band(flat, part, side * hw, side * (hw + 1.3), Z.curb - 0.04, SURFACE.grass, (s, o) => [
              s,
              Math.abs(o),
              0,
            ]);
            inner = hw + 1.3;
            vereda = sw - 1.3;
          }
          const edge = inner;
          band(
            flat,
            part,
            side * inner,
            side * (inner + vereda),
            Z.curb,
            SURFACE.sidewalk,
            (s, o) => [s, Math.abs(o), edge],
          );
          if (road.zone < 0.65 && vereda > 1.2)
            walkway(
              part,
              side * (inner + vereda / 2),
              Z.curb,
              0.3 + 1.6 * (1 - road.zone),
              vereda / 2 - 0.4,
            );
        }
      }
    }

    if (!road.paved) continue;
    // Pasos de cebra junto a las esquinas del centro y línea central discontinua en avenidas.
    if (road.zone < 0.35)
      for (const c of crossings)
        for (const dir of [-1, 1]) {
          const a = c.s + dir * (c.n.hw + 0.8);
          const b = c.s + dir * (c.n.hw + 3.8);
          const [d0, d1] = a < b ? [a, b] : [b, a];
          if (d0 < 0 || d1 > L) continue;
          band(flat, slice(l, d0, d1), -hw + 0.3, hw - 0.3, Z.mark, SURFACE.zebra, (s, o) => [
            s,
            o,
            0,
          ]);
        }
    if (road.code >= 3) {
      const cuts = crossings.map((c) => [c.s - c.n.hw - 7, c.s + c.n.hw + 7] as [number, number]);
      for (const [a, b] of pieces(L, cuts))
        band(flat, slice(l, a, b), -0.08, 0.08, Z.mark, SURFACE.paint, (s, o) => [s, o, 0]);
    }
    // Señal de PARE en algunas esquinas de calles menores (a la derecha de quien llega).
    if (road.code <= 2 && road.zone < 0.8)
      for (const c of crossings)
        for (const dir of [1, -1]) {
          if (r() > 0.28) continue;
          const d = c.s - dir * (c.n.hw + 1.4);
          if (d < 0 || d > L) continue;
          const { p, dx, dy } = pointAt(l, d);
          const o = -dir * (hw + (road.walk ? 0.6 : 0.4));
          cast.model(
            sign,
            p[0] - dy * o,
            p[1] + dx * o,
            road.walk ? Z.curb : 0,
            Math.atan2(-dy * dir, -dx * dir),
          );
          stops++;
        }
  }

  // ---------------------------------------------------------------- áreas
  const areas = (suelo?.areas ?? [])
    .map((a) => ({ tipo: a[0]!, ring: toRing(a, 1) }))
    .filter((a) => a.ring.length >= 3);
  const plazas = areas
    .filter((a) => a.tipo === 1)
    .sort((a, b) => ringArea(b.ring) - ringArea(a.ring));
  const stadiums = areas.filter((a) => a.tipo === 3);
  const tile =
    (o: P) =>
    (p: P): V3 => [p[0] - o[0], p[1] - o[1], 999];
  let benches = 0;
  for (const area of areas) {
    const { tipo, ring } = area;
    const r = rand(hash(`area${ring[0]![0].toFixed(1)}${ring[0]![1].toFixed(1)}`));
    const c = centroid(ring);
    if (tipo === 1 || tipo === 2) {
      const main = plazas[0] === area;
      const isPlaza = tipo === 1;
      flat.polygon(ring, Z.area, SURFACE.grass, (p) => [p[0], p[1], 1]);
      // Vereda perimetral.
      const bw = isPlaza ? 3 : 2.2;
      const inner = inset(ring, bw);
      const middle = inset(ring, bw / 2);
      walkway(line([...middle, middle[0]!]), 0, Z.path, isPlaza ? 3 : 1.5, bw / 2 - 0.4, 1);
      let u = 0;
      ring.forEach((a, i) => {
        const b = ring[(i + 1) % ring.length]!;
        const ia = inner[i]!;
        const ib = inner[(i + 1) % ring.length]!;
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        flat.quad(
          [
            [a[0], a[1], Z.path],
            [b[0], b[1], Z.path],
            [ib[0], ib[1], Z.path],
            [ia[0], ia[1], Z.path],
          ],
          [0, 0, 1],
          isPlaza ? SURFACE.tiles : SURFACE.path,
          [
            [u, -bw / 2, bw / 2],
            [u + len, -bw / 2, bw / 2],
            [u + len, bw / 2, bw / 2],
            [u, bw / 2, bw / 2],
          ],
        );
        // Faroles en la vereda perimetral de las plazas.
        if (isPlaza)
          for (let d = 6; d < len - 3; d += 16) {
            const t = d / len;
            const p: P = [ia[0] + (ib[0] - ia[0]) * t, ia[1] + (ib[1] - ia[1]) * t];
            cast.model(farolPlaza, p[0], p[1], Z.path, 0);
          }
        u += len;
      });
      // Caminos desde el centro: ejes y diagonales del rectángulo envolvente.
      const box = obb(ring);
      const rc = isPlaza ? Math.min(9, 0.12 * Math.sqrt(ringArea(ring))) : 2.5;
      const pw = isPlaza ? 1.6 : 1.2;
      const dirs: P[] = [
        [box.ax, box.ay],
        [-box.ax, -box.ay],
        [-box.ay, box.ax],
        [box.ay, -box.ax],
      ];
      if (isPlaza)
        for (const [su, sv] of [
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ] as const)
          dirs.push(
            norm([
              box.ax * box.hl * su - box.ay * box.hw * sv,
              box.ay * box.hl * su + box.ax * box.hw * sv,
            ]),
          );
      const angles = dirs.map((d) => Math.atan2(d[1], d[0])).sort((a, b) => a - b);
      for (const d of dirs) {
        const far = reach(ring, c, d) - 0.5;
        if (far < rc + 2) continue;
        const path = line([
          [c[0] + d[0] * rc * 0.8, c[1] + d[1] * rc * 0.8],
          [c[0] + d[0] * far, c[1] + d[1] * far],
        ]);
        band(flat, path, -pw, pw, Z.cross, isPlaza ? SURFACE.tiles : SURFACE.path, (s, o) => [
          s,
          o,
          pw,
        ]);
        walkway(path, 0, Z.cross, isPlaza ? 3 : 1.5, pw - 0.45, 1);
        const heading = Math.atan2(d[1], d[0]);
        for (let s = rc + 3; s < far - 3; s += 7)
          for (const side of [1, -1]) {
            const o = side * (pw + 0.45);
            const p: P = [c[0] + d[0] * s - d[1] * o, c[1] + d[1] * s + d[0] * o];
            cast.model(bench, p[0], p[1], Z.area, side > 0 ? heading : heading + Math.PI);
            benches++;
          }
      }
      // Árboles en los jardines (entre caminos), sin repetir los detectados por satélite.
      angles.forEach((a, i) => {
        const b = i + 1 < angles.length ? angles[i + 1]! : angles[0]! + Math.PI * 2;
        const m = (a + b) / 2;
        const d: P = [Math.cos(m), Math.sin(m)];
        const far = reach(ring, c, d);
        for (const f of isPlaza ? [0.45, 0.78] : [0.6]) {
          const p: P = [c[0] + d[0] * far * f, c[1] + d[1] * far * f];
          if (far * f > rc + 3 && inside(p, ring)) plant(p, 6.5 + r() * 1.8, 3 + r() * 0.8, r());
        }
      });
      if (isPlaza) {
        const disk: P[] = Array.from({ length: 20 }, (_, k) => [
          c[0] + Math.cos((k / 20) * Math.PI * 2) * rc,
          c[1] + Math.sin((k / 20) * Math.PI * 2) * rc,
        ]);
        flat.polygon(disk, Z.center, SURFACE.tiles, tile(c));
        const heading = Math.atan2(box.ay, box.ax);
        cast.model(main ? baguaMonumentModel() : bustModel(), c[0], c[1], Z.center, heading);
      }
    } else if (tipo === 3) {
      flat.polygon(ring, Z.area - 0.02, SURFACE.earth, (p) => [p[0], p[1], 0]);
      // Cerco perimetral del estadio.
      ring.forEach((a, i) => {
        const b = ring[(i + 1) % ring.length]!;
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        cast.box(
          (a[0] + b[0]) / 2,
          (a[1] + b[1]) / 2,
          Math.atan2(b[1] - a[1], b[0] - a[0]),
          len + 0.2,
          0.25,
          0,
          3,
          '#d8cfb8',
        );
      });
    } else if (tipo === 4 || tipo === 5) {
      const box = obb(ring);
      const heading = Math.atan2(box.ay, box.ax);
      const corner = (su: number, sv: number): V3 => [
        box.center[0] + box.ax * box.hl * su - box.ay * box.hw * sv,
        box.center[1] + box.ay * box.hl * su + box.ax * box.hw * sv,
        Z.field,
      ];
      const code = Math.round(box.hw) * 1000 + box.hl;
      flat.quad(
        [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)],
        [0, 0, 1],
        tipo === 4 ? SURFACE.pitch : SURFACE.court,
        [
          [-box.hl, -box.hw, code],
          [box.hl, -box.hw, code],
          [box.hl, box.hw, code],
          [-box.hl, box.hw, code],
        ],
      );
      const big = box.hw > 18;
      for (const su of [1, -1]) {
        const g = goalModel(big ? 7.32 : 3, big ? 2.44 : 2);
        const at = box.hl - (big ? 1.5 : 0.6);
        cast.model(
          g,
          box.center[0] + box.ax * at * su,
          box.center[1] + box.ay * at * su,
          Z.field,
          su > 0 ? heading + Math.PI : heading,
        );
      }
      // Graderías a ambos lados de la cancha del estadio; la principal, techada.
      const inStadium = stadiums.some((s) => inside(box.center, s.ring));
      if (inStadium)
        for (const sv of [1, -1]) {
          const steps = 7;
          for (let k = 0; k < steps; k++) {
            const o = box.hw + 3 + k * 0.9 + 0.45;
            cast.box(
              box.center[0] - box.ay * o * sv,
              box.center[1] + box.ax * o * sv,
              heading,
              box.hl * 1.4,
              0.9,
              0,
              0.5 + k * 0.45,
              k % 2 ? '#c9c4b8' : '#bdb7aa',
            );
          }
          if (sv > 0) {
            const o = box.hw + 3 + steps * 0.9;
            for (let x = -0.6; x <= 0.61; x += 0.3)
              cast.box(
                box.center[0] + box.ax * box.hl * x - box.ay * (o + 0.2),
                box.center[1] + box.ay * box.hl * x + box.ax * (o + 0.2),
                heading,
                0.3,
                0.3,
                0,
                7,
                '#9a9a96',
              );
            const om = box.hw + 3 + (steps * 0.9) / 2;
            cast.box(
              box.center[0] - box.ay * om,
              box.center[1] + box.ax * om,
              heading,
              box.hl * 1.45,
              steps * 0.9 + 1.6,
              6.9,
              7.1,
              '#8fa4b1',
            );
          }
        }
    } else if (tipo === 6 || tipo === 8) {
      flat.polygon(ring, Z.area - 0.02, SURFACE.concrete, (p) => [p[0], p[1], 0]);
    } else if (tipo === 7) {
      flat.polygon(ring, Z.area - 0.02, SURFACE.earth, (p) => [p[0], p[1], 0]);
    }
  }

  // ---------------------------------------------------------------- lugares
  const special = specialBuildings(data);
  const tarps = ['#2f6fb0', '#c23b2e', '#e0892b', '#2f8f57', '#e2c23a', '#6b4fa0'];
  const mototaxi = mototaxiModel();
  const goods = ['#d9473b', '#e7b32f', '#6aa84f', '#c97a3a', '#f0e0c0'];
  let stalls = 0;
  for (const [id, kind] of special) {
    const geometry = geometryOf.get(id);
    const ring = geometry?.[0]?.[0] ? toRing(geometry[0][0]) : null;
    if (!ring || ring.length < 3) continue;
    const r = rand(hash(`lugar${id}`));
    if (kind === 'mercado') {
      // Puestos con toldo alrededor del mercado, sobre la vereda.
      ring.forEach((a, i) => {
        const b = ring[(i + 1) % ring.length]!;
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len < 6) return;
        const dx = (b[0] - a[0]) / len;
        const dy = (b[1] - a[1]) / len;
        for (let d = 2.2; d < len - 2; d += 3.2) {
          if (r() > 0.6) continue;
          const p: P = [a[0] + dx * d + dy * 1.8, a[1] + dy * d - dx * 1.8];
          if (built(p)) continue;
          const stall = stallModel(
            tarps[Math.floor(r() * tarps.length)]!,
            goods[Math.floor(r() * goods.length)]!,
          );
          cast.model(stall, p[0], p[1], Z.curb, Math.atan2(dy, dx));
          stalls++;
        }
        // Paradero de mototaxis frente al mercado, sobre la calzada.
        for (let d = 3; d < len - 3 && len > 14; d += 2.1) {
          if (r() > 0.45) continue;
          const p: P = [a[0] + dx * d + dy * 6.2, a[1] + dy * d - dx * 6.2];
          if (built(p)) continue;
          const tone = tarps[Math.floor(r() * tarps.length)]!;
          cast.model(
            mototaxi,
            p[0],
            p[1],
            Z.asphalt,
            Math.atan2(-dx, dy) + (r() - 0.5) * 0.3,
            1,
            rgb(tone) as V3,
          );
        }
      });
      // Gente comprando: recorrido entre los puestos y la pista.
      const aisle = inset(ring, -3.4);
      walkway(line([...aisle, aisle[0]!]), 0, Z.curb, 9, 0.9, 3);
    } else if (kind === 'piscina') {
      // Piscina municipal: losa, agua con carriles y cerco.
      flat.polygon(ring, 0.3, SURFACE.concrete, (p) => [p[0], p[1], 1]);
      // El agua toma la forma de la piscina de OpenStreetMap si cae dentro del local.
      const mapped = (suelo?.piscinas ?? [])
        .map((flatRing) => toRing(flatRing))
        .find((pool) => pool.length >= 3 && inside(centroid(pool), ring));
      const box = obb(mapped ?? ring);
      const hl = mapped ? box.hl : Math.max(3, Math.min(12.5, box.hl - 3));
      const hw = mapped ? box.hw : Math.max(2, Math.min(6.25, box.hw - 3));
      const corner = (su: number, sv: number): V3 => [
        box.center[0] + box.ax * hl * su - box.ay * hw * sv,
        box.center[1] + box.ay * hl * su + box.ax * hw * sv,
        0.33,
      ];
      flat.quad(
        [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)],
        [0, 0, 1],
        SURFACE.water,
        [
          [-hl, -hw, 0],
          [hl, -hw, 0],
          [hl, hw, 0],
          [-hl, hw, 0],
        ],
      );
      ring.forEach((a, i) => {
        const b = ring[(i + 1) % ring.length]!;
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        cast.box(
          (a[0] + b[0]) / 2,
          (a[1] + b[1]) / 2,
          Math.atan2(b[1] - a[1], b[0] - a[0]),
          len + 0.2,
          0.2,
          0,
          2.2,
          '#5d8fb5',
        );
      });
    }
  }
  // Terminal terrestre: buses estacionados en losas de concreto junto al punto de referencia.
  let buses = 0;
  if (puntos.terminal) {
    const t: P = [puntos.terminal[0]! / 10, puntos.terminal[1]! / 10];
    let best = { d: Infinity, dx: 1, dy: 0 };
    for (const road of roads)
      for (let i = 0; i + 1 < road.l.pts.length; i++) {
        const a = road.l.pts[i]!;
        const b = road.l.pts[i + 1]!;
        const d = Math.hypot((a[0] + b[0]) / 2 - t[0], (a[1] + b[1]) / 2 - t[1]);
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        if (d < best.d) best = { d, dx: (b[0] - a[0]) / len, dy: (b[1] - a[1]) / len };
      }
    const nearRoad = (p: P) =>
      roads.some((road) =>
        road.l.pts.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < road.hw + 3),
      );
    const colors = [
      ['#f2f0ea', '#c23b2e'],
      ['#f2f0ea', '#2f6fb0'],
      ['#e7c64a', '#2b2b2b'],
      ['#2f8f57', '#f2f0ea'],
    ];
    const heading = Math.atan2(best.dy, best.dx);
    for (let row = -3; row <= 3 && buses < 4; row++)
      for (const side of [1, -1]) {
        if (buses >= 4) break;
        const o = side * (8 + Math.abs(row) * 4.2);
        const p: P = [t[0] - best.dy * o, t[1] + best.dx * o];
        if (built(p) || nearRoad(p)) continue;
        const pad: V3[] = [
          [-7, -2, 0],
          [7, -2, 0],
          [7, 2, 0],
          [-7, 2, 0],
        ].map(
          ([u, v]) =>
            [p[0] + best.dx * u! - best.dy * v!, p[1] + best.dy * u! + best.dx * v!, Z.area] as V3,
        );
        flat.quad(
          pad,
          [0, 0, 1],
          SURFACE.concrete,
          pad.map((q) => [q[0], q[1], 0] as V3),
        );
        const [body, stripe] = colors[buses % colors.length]!;
        cast.model(busModel(body!, stripe!), p[0], p[1], Z.area, heading);
        buses++;
      }
  }

  // ---------------------------------------------------------------- suelo de los lotes
  // Rejilla de 25 m sobre la ciudad: peso urbano por cercanía a casas y calles (bordes suaves)
  // y sector en cada vértice; el shader mezcla tierra, césped, patios y vegetación seca.
  const roadGrid = new Map<number, P[]>();
  for (const road of roads) {
    const L = length(road.l);
    for (let d = 0; d <= L; d += 6) {
      const p = pointAt(road.l, d).p;
      put(roadGrid, p[0], p[1], p);
    }
  }
  if (centers.length) {
    const step = 25;
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const c of centers)
      [x0, y0, x1, y1] = [
        Math.min(x0, c[0]),
        Math.min(y0, c[1]),
        Math.max(x1, c[0]),
        Math.max(y1, c[1]),
      ];
    x0 = Math.floor((x0 - 60) / step) * step;
    y0 = Math.floor((y0 - 60) / step) * step;
    const nx = Math.ceil((x1 + 60 - x0) / step) + 1;
    const ny = Math.ceil((y1 + 60 - y0) / step) + 1;
    const weight = new Float32Array(nx * ny);
    const zone = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const p: P = [x0 + i * step, y0 + j * step];
        let db = Infinity;
        near(centerGrid, p, (q) => {
          db = Math.min(db, Math.hypot(q[0] - p[0], q[1] - p[1]));
        });
        let dr = Infinity;
        near(roadGrid, p, (q) => {
          dr = Math.min(dr, Math.hypot(q[0] - p[0], q[1] - p[1]));
        });
        if (db > 60 && dr > 30) continue;
        weight[j * nx + i] = Math.max(1 - smooth(22, 42, db), 1 - smooth(9, 19, dr));
        zone[j * nx + i] = zoneAt(p);
      }
    for (let j = 0; j + 1 < ny; j++)
      for (let i = 0; i + 1 < nx; i++) {
        const ids = [j * nx + i, j * nx + i + 1, (j + 1) * nx + i + 1, (j + 1) * nx + i];
        if (Math.max(...ids.map((k) => weight[k]!)) < 0.12) continue;
        const pos = [
          [i, j],
          [i + 1, j],
          [i + 1, j + 1],
          [i, j + 1],
        ].map(([a, b]) => [x0 + a! * step, y0 + b! * step, 0] as V3);
        lots.quad(
          pos,
          [0, 0, 1],
          SURFACE.lot,
          ids.map((k) => [zone[k]!, weight[k]!, 0] as V3),
        );
      }
  }

  // Río Utcubamba: OpenStreetMap trae solo su eje junto a la ciudad. Se dibuja un cauce de unos
  // 32 m de agua con orillas de grava que se funden con el suelo (ancho ilustrativo).
  for (const raw of suelo?.rios ?? []) {
    const pts: P[] = [];
    for (let k = 0; k + 1 < raw.length; k += 2) pts.push([raw[k]! / 10, raw[k + 1]! / 10]);
    const l = line(pts);
    if (l.pts.length < 2) continue;
    band(soft, l, -22, 22, 0.035, SURFACE.riverBand, (s, o) => [s, o, 22]);
  }
  // Ríos anchos con polígono: agua que fluye a lo largo del eje principal de cada polígono.
  for (const polygon of suelo?.agua ?? []) {
    const rings2 = polygon.map((flatRing) => toRing(flatRing)).filter((r) => r.length >= 3);
    if (!rings2.length) continue;
    const all = rings2.flat();
    let [mx, my] = [0, 0];
    for (const p of all) [mx, my] = [mx + p[0] / all.length, my + p[1] / all.length];
    let [sxx, sxy, syy] = [0, 0, 0];
    for (const p of all) {
      sxx += (p[0] - mx) ** 2;
      sxy += (p[0] - mx) * (p[1] - my);
      syy += (p[1] - my) ** 2;
    }
    const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    const holes: number[] = [];
    let count = 0;
    rings2.forEach((r, i) => {
      if (i > 0) holes.push(count);
      count += r.length;
    });
    for (const t of earcut(all.flat(), holes, 2)) {
      const p = all[t]!;
      flat.vertex([p[0], p[1], 0.04], [0, 0, 1], SURFACE.river, [
        Math.cos(angle),
        Math.sin(angle),
        0,
      ]);
    }
  }

  // ---------------------------------------------------------------- berma central
  // Avenidas de doble calzada con berma (Héroes del Cenepa): entre las dos calzadas, césped con
  // palmeras y arbustos podados, como en el centro de Bagua.
  {
    const berm = roads.filter((road) => road.berma && road.paved);
    const covered = new Map<number, P[]>();
    for (const A of berm) {
      const L = length(A.l);
      let run: { p: P; w: number }[] = [];
      const flush = () => {
        if (run.length >= 2) {
          const mid = line(run.map((x) => x.p));
          const w = run.reduce((t, x) => t + x.w, 0) / run.length;
          band(flat, mid, -w / 2, w / 2, Z.curb - 0.02, SURFACE.grass, (s, o) => [
            s,
            Math.abs(o),
            0,
          ]);
          for (const side of [1, -1])
            face(flat, mid, (side * w) / 2, Z.asphalt, Z.curb, SURFACE.curb, 0);
          const ml = length(mid);
          // Sin árboles junto a los cruces: 8 m libres en cada extremo de la berma.
          for (let d = 8; d < ml - 8; d += 9) {
            const { p } = pointAt(mid, d);
            // Frente a la plaza principal (y la municipalidad) la berma va sin árboles.
            if (Math.hypot(p[0] - plaza[0], p[1] - plaza[1]) < 130 || w < 2) continue;
            const rr = rand(hash(`berma${Math.round(p[0])}_${Math.round(p[1])}`));
            if (Math.round(d / 9) % 2 === 0) {
              extraPalms.push(p[0], p[1], 7 + rr() * 3, Math.min(2.4, w / 2 + 0.6), rr(), 0);
              put(treeGrid, p[0], p[1], p);
            } else plant(p, 3 + rr(), Math.min(1.5 + rr() * 0.4, w / 2 + 0.2), rr());
          }
        }
        run = [];
      };
      for (let d = 2; d < L - 2; d += 5) {
        const a = pointAt(A.l, d);
        let best: { q: P; dist: number; hw: number } | null = null;
        for (const B of berm) {
          if (B === A) continue;
          for (let i = 0; i + 1 < B.l.pts.length; i++) {
            const s0 = B.l.pts[i]!;
            const s1 = B.l.pts[i + 1]!;
            const ex = s1[0] - s0[0];
            const ey = s1[1] - s0[1];
            const el = Math.hypot(ex, ey) || 1;
            if (Math.abs((ex / el) * a.dx + (ey / el) * a.dy) < 0.9) continue;
            const t = Math.max(
              0,
              Math.min(1, ((a.p[0] - s0[0]) * ex + (a.p[1] - s0[1]) * ey) / (el * el)),
            );
            const q: P = [s0[0] + ex * t, s0[1] + ey * t];
            const dist = Math.hypot(q[0] - a.p[0], q[1] - a.p[1]);
            if (dist < 28 && (!best || dist < best.dist)) best = { q, dist, hw: B.hw };
          }
        }
        const gap = best ? best.dist - A.hw - best.hw - 0.4 : 0;
        const m: P | null = best ? [(a.p[0] + best.q[0]) / 2, (a.p[1] + best.q[1]) / 2] : null;
        if (
          !best ||
          !m ||
          gap < 1.5 ||
          near(covered, m, (c) => Math.hypot(c[0] - m[0], c[1] - m[1]) < 3)
        ) {
          flush();
          continue;
        }
        put(covered, m[0], m[1], m);
        run.push({ p: m, w: Math.min(gap, 8) });
      }
      flush();
    }
  }

  // ---------------------------------------------------------------- edificios importantes
  {
    const esp = suelo?.especiales ?? {};
    const ringOf = (id: string) => {
      const b = data.edificios.ids.indexOf(id);
      const f = data.edificios.geometrias[b]?.[0]?.[0];
      if (!f) return null;
      const ring: P[] = [];
      for (let i = 0; i + 1 < f.length; i += 2) ring.push([f[i]! / 10, f[i + 1]! / 10]);
      return ring.length >= 3 ? { ring, floors: data.edificios.pisos[b] ?? 1 } : null;
    };
    /** Punto medio del lado del rectángulo más cercano a la plaza y su normal hacia afuera. */
    const frontOf = (box: ReturnType<typeof orientedBox>) => {
      const sides = [
        { m: box.at(box.u0, (box.v0 + box.v1) / 2), n: [-box.ax, -box.ay], short: true },
        { m: box.at(box.u1, (box.v0 + box.v1) / 2), n: [box.ax, box.ay], short: true },
        { m: box.at((box.u0 + box.u1) / 2, box.v0), n: [box.ay, -box.ax], short: false },
        { m: box.at((box.u0 + box.u1) / 2, box.v1), n: [-box.ay, box.ax], short: false },
      ];
      return sides;
    };
    const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const top = churchTopModel();
    for (const id of esp.iglesia ?? []) {
      const it = ringOf(id);
      if (!it) continue;
      const box = orientedBox(it.ring);
      const heading = Math.atan2(box.ay, box.ax);
      // Fachada: el lado del rectángulo que mira a la plaza (sobre el eje más alineado con ella);
      // las torres van en sus esquinas y la nave se aleja de la plaza.
      const centro = box.at((box.u0 + box.u1) / 2, (box.v0 + box.v1) / 2);
      const vx = plaza[0] - centro[0];
      const vy = plaza[1] - centro[1];
      const du = vx * box.ax + vy * box.ay;
      const dv = -vx * box.ay + vy * box.ax;
      const porU = Math.abs(du) >= Math.abs(dv);
      const ancho = porU ? box.v1 - box.v0 : box.u1 - box.u0;
      const t = Math.min(4.2, Math.max(2.8, Math.min(ancho, 22) * 0.24));
      const fachada = porU ? (du > 0 ? box.u1 : box.u0) : dv > 0 ? box.v1 : box.v0;
      const hacia = porU ? (du > 0 ? -1 : 1) : dv > 0 ? -1 : 1;
      // Fachada ancha (huella con anexos): las torres enmarcan 18 m centrados.
      const lo = porU ? box.v0 : box.u0;
      const hi = porU ? box.v1 : box.u1;
      const mitad = (lo + hi) / 2;
      const media = Math.min((hi - lo) / 2, 9);
      const at = (a: number, b: number) => (porU ? box.at(a, b) : box.at(b, a));
      for (const s of [mitad - media + t / 2, mitad + media - t / 2]) {
        const c = at(fachada + (hacia * t) / 2, s);
        const yellow = '#f0b323';
        const white = '#f3f1ea';
        cast.box(c[0], c[1], heading, t, t, 0, 13.6, yellow);
        cast.box(c[0], c[1], heading, t + 0.3, t + 0.3, 0, 0.7, white);
        cast.box(c[0], c[1], heading, t + 0.3, t + 0.3, 8.6, 9.0, white);
        cast.box(c[0], c[1], heading, t + 0.3, t + 0.3, 13.6, 14.0, white);
        cast.box(c[0], c[1], heading, t - 0.2, t - 0.2, 14.0, 17.0, yellow);
        // Vanos del campanario.
        cast.box(c[0], c[1], heading, t - 0.16, t * 0.42, 14.5, 16.6, '#3a2f26');
        cast.box(c[0], c[1], heading, t * 0.42, t - 0.16, 14.5, 16.6, '#3a2f26');
        cast.model(top, c[0], c[1], 17.0, heading, t / 3.4);
      }
      // Puerta principal en arco, al centro de la fachada.
      const door = at(fachada - hacia * 0.05, mitad);
      const dh = porU ? heading : heading + Math.PI / 2;
      cast.box(door[0], door[1], dh, 0.2, 2.6, 0, 3.6, '#6b3a22');
      cast.box(door[0], door[1], dh, 0.24, 3.2, 3.6, 4.1, '#f3f1ea');
    }
    const flag = flagModel();
    for (const id of esp.comisaria ?? []) {
      const it = ringOf(id);
      if (!it) continue;
      const box = orientedBox(it.ring);
      const front = frontOf(box).sort((a, b) => dist(a.m, plaza) - dist(b.m, plaza))[0]!;
      const p: P = [front.m[0] + front.n[0]! * 1.4, front.m[1] + front.n[1]! * 1.4];
      cast.model(flag, p[0], p[1], Z.curb, Math.atan2(front.n[1]!, front.n[0]!) + Math.PI / 2);
    }
    for (const id of esp.municipalidad ?? []) {
      const it = ringOf(id);
      if (!it) continue;
      const box = orientedBox(it.ring);
      const front = frontOf(box).sort((a, b) => dist(a.m, plaza) - dist(b.m, plaza))[0]!;
      const p: P = [front.m[0] + front.n[0]! * 2.6, front.m[1] + front.n[1]! * 2.6];
      cast.model(flag, p[0], p[1], Z.curb, Math.atan2(front.n[1]!, front.n[0]!) + Math.PI / 2);
      // Letrero BAGUA con el escudo, sobre la fachada que da a la plaza.
      const top = Math.max(it.floors, 5) * 2.75 + 0.3;
      const s: P = [front.m[0] - front.n[0]! * 0.4, front.m[1] - front.n[1]! * 0.4];
      const heading = Math.atan2(front.n[1]!, front.n[0]!) + Math.PI / 2;
      cast.box(s[0], s[1], heading, 10, 0.35, top - 0.2, top + 2.4, '#f6f6f2');
      cast.box(s[0], s[1], heading, 9, 0.4, top + 0.4, top + 1.2, '#1f5fa8');
      cast.box(s[0], s[1], heading, 1.6, 0.45, top + 1.3, top + 2.3, '#2e8b3e');
    }
    // Un letrero de salud por establecimiento: sobre la azotea de su edificio más grande (los
    // edificios a menos de 80 m son el mismo hospital).
    const sign = healthSignModel();
    const salud = [...(esp.essalud ?? []), ...(esp.hospital ?? []), ...(esp.clinica ?? [])]
      .map((id) => ringOf(id))
      .filter(
        (it): it is NonNullable<typeof it> => it !== null && Math.abs(ringArea(it.ring)) >= 150,
      )
      .sort((a, b) => Math.abs(ringArea(b.ring)) - Math.abs(ringArea(a.ring)));
    const puestos: P[] = [];
    for (const it of salud) {
      const c = centroid(it.ring);
      if (puestos.some((q) => dist(q, c) < 80)) continue;
      puestos.push(c);
      const box = orientedBox(it.ring);
      const medio = box.at((box.u0 + box.u1) / 2, (box.v0 + box.v1) / 2);
      cast.model(
        sign,
        medio[0],
        medio[1],
        Math.max(it.floors, 2) * 2.75 + 0.3,
        Math.atan2(box.ay, box.ax),
      );
    }
  }

  // Cada capa ordenada por bloques de 250 m (el visor dibuja solo los visibles).
  const layers = [lots, soft, flat, cast].map((w) => w.data);
  const total = layers.reduce((n, d) => n + d.length, 0);
  const vertices = new Float32Array(total);
  const tables: Float32Array[] = [];
  let offset = 0;
  for (const list of layers) {
    const d = Float32Array.from(list);
    const sorter = new ChunkSorter(GROUND_STRIDE);
    const T = 3 * GROUND_STRIDE;
    for (let i = 0; i + T <= d.length; i += T) {
      let [x0, y0, x1, y1, z1] = [Infinity, Infinity, -Infinity, -Infinity, 0];
      for (let k = i; k < i + T; k += GROUND_STRIDE) {
        x0 = Math.min(x0, d[k]!);
        y0 = Math.min(y0, d[k + 1]!);
        x1 = Math.max(x1, d[k]!);
        y1 = Math.max(y1, d[k + 1]!);
        z1 = Math.max(z1, d[k + 2]!);
      }
      sorter.add(i, i + T, x0, y0, x1, y1, z1);
    }
    const { data: sorted, table } = sorter.finish(
      d,
      (n) => new Float32Array(n),
      offset / GROUND_STRIDE,
    );
    vertices.set(sorted, offset);
    tables.push(table);
    offset += sorted.length;
  }
  // Recorridos peatonales: puntos seguidos y un índice por recorrido.
  const walkPoints: number[] = [];
  const walkIndex: number[] = [];
  for (const w of walks) {
    walkIndex.push(walkPoints.length / 2, w.pts.length, w.weight, w.z, w.half, w.kind);
    for (const p of w.pts) walkPoints.push(p[0], p[1]);
  }
  return {
    vertices,
    tables,
    walks: { points: new Float32Array(walkPoints), index: new Float32Array(walkIndex) },
    trees: new Float32Array(extraTrees),
    palms: new Float32Array(extraPalms),
    stats: {
      calles: roads.length,
      pavimentadas: roads.filter((r) => r.paved).length,
      conVereda: roads.filter((r) => r.walk).length,
      bancas: benches,
      pare: stops,
      puestos: stalls,
      buses,
      arbolesNuevos: extraTrees.length / TREE_STRIDE,
      recorridos: walks.length,
    },
  };
}
