import { PROP_STRIDE, type RoadGraph } from './build';

/*
 * Tráfico ilustrativo: mototaxis, motos lineales y algunos autos recorren las calles reales
 * (grafo de Overture) por su carril derecho, giran al azar en las esquinas y los mototaxis
 * paran de vez en cuando a recoger pasajeros. No representa tráfico real ni conteos.
 */

export const VEHICLE_TYPES = ['mototaxi', 'moto', 'auto'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

const SPEC: Record<
  VehicleType,
  { count: number; speed: [number, number]; lane: number; colors: number[] }
> = {
  // Toldos rojos, azules, amarillos y verdes; casi siempre carrocería roja o azul.
  mototaxi: { count: 70, speed: [5.2, 7], lane: 1.5, colors: [0, 1, 2, 3, 0, 1, 7] },
  moto: { count: 45, speed: [7.5, 10], lane: 1.1, colors: [0, 1, 6, 6, 5, 7, 2] },
  auto: { count: 14, speed: [8, 11], lane: 1.8, colors: [4, 4, 5, 6, 0, 5] },
};

interface Vehicle {
  type: number;
  edge: number;
  dir: 1 | -1;
  s: number;
  speed: number;
  color: number;
  heading: number;
  stop: number;
  x: number;
  y: number;
}

export class Traffic {
  private cum: Float32Array;
  private length: Float32Array;
  private vehicles: Vehicle[] = [];
  private random = Math.random;
  readonly buffers: Float32Array[];

  constructor(private g: RoadGraph) {
    const edges = g.edgeStart.length;
    this.cum = new Float32Array(g.points.length / 2);
    this.length = new Float32Array(edges);
    const mids: number[] = [];
    for (let e = 0; e < edges; e++) {
      const start = g.edgeStart[e]!;
      let d = 0;
      this.cum[start] = 0;
      for (let k = 1; k < g.edgeCount[e]!; k++) {
        const i = start + k;
        d += Math.hypot(
          g.points[i * 2]! - g.points[i * 2 - 2]!,
          g.points[i * 2 + 1]! - g.points[i * 2 - 1]!,
        );
        this.cum[i] = d;
      }
      this.length[e] = d;
      const m = start + Math.floor(g.edgeCount[e]! / 2);
      mids.push(g.points[m * 2]!, g.points[m * 2 + 1]!);
    }
    // Más vehículos en el centro que en las afueras.
    const weights = Array.from({ length: edges }, (_, e) => {
      const d = Math.hypot(mids[e * 2]!, mids[e * 2 + 1]!);
      return this.length[e]! * Math.exp(-d / 1400) * (g.edgeCode[e]! >= 2 ? 2.5 : 1);
    });
    const total = weights.reduce((a, b) => a + b, 0);
    const pick = () => {
      let t = this.random() * total;
      for (let e = 0; e < edges; e++) if ((t -= weights[e]!) <= 0) return e;
      return 0;
    };
    VEHICLE_TYPES.forEach((type, t) => {
      const spec = SPEC[type];
      for (let i = 0; i < spec.count && edges; i++) {
        const edge = pick();
        this.vehicles.push({
          type: t,
          edge,
          dir: this.random() < 0.5 ? 1 : -1,
          s: this.random() * this.length[edge]!,
          speed: spec.speed[0] + this.random() * (spec.speed[1] - spec.speed[0]),
          color: spec.colors[Math.floor(this.random() * spec.colors.length)]!,
          heading: 0,
          stop: 0,
          x: 0,
          y: 0,
        });
      }
    });
    this.buffers = VEHICLE_TYPES.map((type) => new Float32Array(SPEC[type].count * PROP_STRIDE));
    this.update(0);
  }

  private next(v: Vehicle) {
    const g = this.g;
    const node = v.dir > 0 ? g.edgeB[v.edge]! : g.edgeA[v.edge]!;
    const from = g.adjStart[node]!;
    const to = g.adjStart[node + 1]!;
    const options: number[] = [];
    let weight = 0;
    for (let k = from; k < to; k++) {
      const e = g.adj[k]!;
      if (e === v.edge && to - from > 1) continue;
      options.push(e);
      weight += g.edgeCode[e]! >= 2 ? 2 : 1;
    }
    let t = this.random() * weight;
    let chosen = options[0] ?? v.edge;
    for (const e of options)
      if ((t -= g.edgeCode[e]! >= 2 ? 2 : 1) <= 0) {
        chosen = e;
        break;
      }
    v.dir = g.edgeA[chosen] === node ? 1 : -1;
    v.edge = chosen;
  }

  update(dt: number) {
    const g = this.g;
    const counters = [0, 0, 0];
    for (const v of this.vehicles) {
      if (v.type === 0) {
        if (v.stop > 0) v.stop -= dt;
        else if (this.random() < dt * 0.02) v.stop = 2 + this.random() * 4;
      }
      if (v.stop <= 0) v.s += v.speed * dt * (g.edgeCode[v.edge]! >= 2 ? 1.15 : 1);
      let guard = 0;
      while (v.s > this.length[v.edge]! && guard++ < 8) {
        v.s -= this.length[v.edge]!;
        this.next(v);
      }
      const len = this.length[v.edge]!;
      const d = v.dir > 0 ? v.s : len - v.s;
      const start = g.edgeStart[v.edge]!;
      const n = g.edgeCount[v.edge]!;
      let k = 1;
      while (k < n - 1 && this.cum[start + k]! < d) k++;
      const i0 = start + k - 1;
      const i1 = start + k;
      const seg = this.cum[i1]! - this.cum[i0]! || 1;
      const t = Math.min(1, Math.max(0, (d - this.cum[i0]!) / seg));
      const x0 = g.points[i0 * 2]!;
      const y0 = g.points[i0 * 2 + 1]!;
      const x1 = g.points[i1 * 2]!;
      const y1 = g.points[i1 * 2 + 1]!;
      let dx = (x1 - x0) * v.dir;
      let dy = (y1 - y0) * v.dir;
      const l = Math.hypot(dx, dy) || 1;
      dx /= l;
      dy /= l;
      const lane = SPEC[VEHICLE_TYPES[v.type]!].lane;
      v.x = x0 + (x1 - x0) * t + dy * lane;
      v.y = y0 + (y1 - y0) * t - dx * lane;
      // Giro suave en las esquinas.
      const target = Math.atan2(dy, dx);
      let diff = target - v.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      v.heading = dt === 0 ? target : v.heading + diff * Math.min(1, dt * 7);
      const buffer = this.buffers[v.type]!;
      const o = counters[v.type]! * PROP_STRIDE;
      counters[v.type]!++;
      buffer[o] = v.x;
      buffer[o + 1] = v.y;
      buffer[o + 2] = 0.04;
      buffer[o + 3] = 1;
      buffer[o + 4] = v.heading;
      buffer[o + 5] = v.color;
    }
  }
}
