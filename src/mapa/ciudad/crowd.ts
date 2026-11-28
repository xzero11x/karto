import { PROP_STRIDE } from './build';

/*
 * Peatones ilustrativos: caminan por las veredas del centro y los barrios, los caminos de las
 * plazas y parques, el paseo del malecón y alrededor del mercado, donde hay más gente, van más
 * despacio y se detienen a comprar. No representa conteos reales.
 */

/** Recorridos del worker: puntos seguidos y por recorrido inicio, puntos, peso, z, medio ancho, tipo. */
export interface Walkways {
  points: Float32Array;
  index: Float32Array;
}
const WALK_STRIDE = 6;

interface Path {
  start: number;
  count: number;
  z: number;
  half: number;
  kind: number;
  cum: Float32Array;
  length: number;
  weight: number;
  x: number;
  y: number;
}
interface Walker {
  path: Path;
  s: number;
  dir: 1 | -1;
  speed: number;
  pause: number;
  side: number;
  paint: number;
  scale: number;
}

/** Radio alrededor del centro de la vista donde camina la gente (más lejos no se distingue). */
const REACH = 650;

export class Crowd {
  readonly buffer: Float32Array;
  private walkers: Walker[] = [];
  private random = Math.random;
  private paths: Path[] = [];
  private nearby: Path[] = [];
  private nearbyWeights: number[] = [];
  private center = [Infinity, Infinity];

  constructor(
    private w: Walkways,
    count = 650,
  ) {
    const paths = this.paths;
    for (let i = 0; i + WALK_STRIDE <= w.index.length; i += WALK_STRIDE) {
      const [start, n, weight, z, half, kind] = Array.from(
        w.index.subarray(i, i + WALK_STRIDE),
      ) as [number, number, number, number, number, number];
      const cum = new Float32Array(n);
      for (let k = 1; k < n; k++) {
        const a = (start + k - 1) * 2;
        const b = (start + k) * 2;
        cum[k] =
          cum[k - 1]! +
          Math.hypot(w.points[b]! - w.points[a]!, w.points[b + 1]! - w.points[a + 1]!);
      }
      const length = cum[n - 1] ?? 0;
      if (length < 4) continue;
      const mid = (start + Math.floor(n / 2)) * 2;
      paths.push({
        start,
        count: n,
        z,
        half,
        kind,
        cum,
        length,
        // Más gente en plazas, malecón y sobre todo alrededor del mercado.
        weight: weight * (kind === 3 ? 10 : kind === 1 ? 6 : kind === 2 ? 3 : 1),
        x: w.points[mid]!,
        y: w.points[mid + 1]!,
      });
    }
    this.nearby = paths;
    this.nearbyWeights = paths.map((p) => p.weight * p.length);
    if (paths.length) for (let k = 0; k < count; k++) this.walkers.push(this.spawn());
    this.buffer = new Float32Array(this.walkers.length * PROP_STRIDE);
    this.update(0);
  }

  /** Persona nueva en un recorrido cercano, elegido según su peso y largo. */
  private spawn(walker?: Walker): Walker {
    const total = this.nearbyWeights.reduce((a, b) => a + b, 0);
    let t = this.random() * total;
    let i = 0;
    while (i < this.nearby.length - 1 && (t -= this.nearbyWeights[i]!) > 0) i++;
    const path = this.nearby[i] ?? this.paths[0]!;
    const market = path.kind === 3;
    const w = walker ?? ({} as Walker);
    w.path = path;
    w.s = this.random() * path.length;
    w.dir = this.random() < 0.5 ? 1 : -1;
    w.speed = market ? 0.55 + this.random() * 0.4 : 1.05 + this.random() * 0.45;
    w.pause = this.random() < (market ? 0.5 : 0.12) ? this.random() * 4 : 0;
    w.side = (this.random() * 2 - 1) * path.half;
    w.paint = Math.floor(this.random() * 8);
    w.scale = 0.92 + this.random() * 0.14;
    return w;
  }

  /** Cuando la vista se mueve, quien quedó lejos reaparece en un recorrido cercano. */
  follow(x: number, y: number) {
    if (Math.hypot(x - this.center[0]!, y - this.center[1]!) < 120 || !this.paths.length) return;
    this.center = [x, y];
    const near = this.paths.filter((p) => Math.hypot(p.x - x, p.y - y) < REACH);
    if (!near.length) return;
    this.nearby = near;
    this.nearbyWeights = near.map((p) => p.weight * p.length);
    for (const walker of this.walkers)
      if (Math.hypot(walker.path.x - x, walker.path.y - y) > REACH * 1.2) this.spawn(walker);
  }

  get count() {
    return this.walkers.length;
  }

  update(dt: number) {
    const pts = this.w.points;
    this.walkers.forEach((p, i) => {
      const path = p.path;
      let moving = 1;
      if (p.pause > 0) {
        p.pause -= dt;
        moving = 0;
      } else {
        p.s += p.dir * p.speed * dt;
        if (p.s <= 0 || p.s >= path.length) {
          p.s = Math.min(path.length, Math.max(0, p.s));
          p.dir = p.dir === 1 ? -1 : 1;
          p.pause = 0.5 + this.random() * 2;
        } else if (this.random() < dt * (path.kind === 3 ? 0.35 : 0.03)) {
          // Se detiene a mirar un puesto o a conversar.
          p.pause = 1 + this.random() * (path.kind === 3 ? 5 : 3);
        }
      }
      let k = 1;
      while (k < path.count - 1 && path.cum[k]! < p.s) k++;
      const a = (path.start + k - 1) * 2;
      const b = (path.start + k) * 2;
      const seg = path.cum[k]! - path.cum[k - 1]! || 1;
      const t = (p.s - path.cum[k - 1]!) / seg;
      const dx = (pts[b]! - pts[a]!) / seg;
      const dy = (pts[b + 1]! - pts[a + 1]!) / seg;
      // Cada quien conserva su carril lateral en el camino.
      const off = p.side;
      const o = i * PROP_STRIDE;
      this.buffer[o] = pts[a]! + (pts[b]! - pts[a]!) * t - dy * off;
      this.buffer[o + 1] = pts[a + 1]! + (pts[b + 1]! - pts[a + 1]!) * t + dx * off;
      this.buffer[o + 2] = path.z;
      this.buffer[o + 3] = p.scale;
      this.buffer[o + 4] = Math.atan2(dy * p.dir, dx * p.dir);
      this.buffer[o + 5] = p.paint + 8 * moving;
    });
  }
}
