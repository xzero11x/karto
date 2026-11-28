import { rgb } from './palette';

/*
 * Modelos de baja poligonización para instanciar en GPU: árbol, palmera, moto lineal, mototaxi,
 * auto, tanque de agua y columna con fierros. Metros; x hacia delante, y a la izquierda, z arriba.
 * Cada vértice: posición (3), normal (3), color (3) y marca (1):
 *   0 color fijo · 1 pintura de la instancia · 2 luz delantera · 3 vidrio · 4 ropa · 5 luz trasera
 * En los árboles la marca indica la parte: 0 tronco, 1 copa, 2 hoja de palmera.
 */
export const MODEL_STRIDE = 10;

type Vec3 = [number, number, number];

export class MeshBuilder {
  data: number[] = [];
  private push(p: Vec3, n: Vec3, c: Vec3, flag: number) {
    this.data.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2], flag);
  }
  tri(a: Vec3, b: Vec3, c: Vec3, color: Vec3, flag: number, normal?: Vec3) {
    const n = normal ?? faceNormal(a, b, c);
    this.push(a, n, color, flag);
    this.push(b, n, color, flag);
    this.push(c, n, color, flag);
  }
  quad(a: Vec3, b: Vec3, c: Vec3, d: Vec3, color: Vec3, flag: number) {
    this.tri(a, b, c, color, flag);
    this.tri(a, c, d, color, flag);
  }
  box(
    x0: number,
    y0: number,
    z0: number,
    x1: number,
    y1: number,
    z1: number,
    hex: string,
    flag = 0,
  ) {
    const c = rgb(hex) as Vec3;
    const p = (x: number, y: number, z: number): Vec3 => [x, y, z];
    this.quad(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1), c, flag); // arriba
    this.quad(p(x0, y1, z0), p(x1, y1, z0), p(x1, y0, z0), p(x0, y0, z0), c, flag); // abajo
    this.quad(p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), p(x1, y0, z1), c, flag); // frente
    this.quad(p(x0, y1, z0), p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), c, flag); // atrás
    this.quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1), c, flag); // derecha
    this.quad(p(x1, y1, z0), p(x0, y1, z0), p(x0, y1, z1), p(x1, y1, z1), c, flag); // izquierda
  }
  /** Cilindro vertical con tapa superior. */
  cylinderZ(
    cx: number,
    cy: number,
    r: number,
    z0: number,
    z1: number,
    hex: string,
    flag = 0,
    n = 8,
  ) {
    const c = rgb(hex) as Vec3;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      const p0: Vec3 = [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, z0];
      const p1: Vec3 = [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, z0];
      const n0: Vec3 = [Math.cos(a0), Math.sin(a0), 0];
      const n1: Vec3 = [Math.cos(a1), Math.sin(a1), 0];
      const q0: Vec3 = [p0[0], p0[1], z1];
      const q1: Vec3 = [p1[0], p1[1], z1];
      this.push(p0, n0, c, flag);
      this.push(p1, n1, c, flag);
      this.push(q1, n1, c, flag);
      this.push(p0, n0, c, flag);
      this.push(q1, n1, c, flag);
      this.push(q0, n0, c, flag);
      this.tri([cx, cy, z1], q0, q1, c, flag, [0, 0, 1]);
    }
  }
  /** Rueda: cilindro con eje transversal (y). */
  wheel(cx: number, cy: number, cz: number, r: number, w: number) {
    const c = rgb('#1b1b1b') as Vec3;
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      const at = (a: number, y: number): Vec3 => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
      const y0 = cy - w / 2;
      const y1 = cy + w / 2;
      this.quad(at(a0, y0), at(a1, y0), at(a1, y1), at(a0, y1), c, 0);
      this.tri([cx, y1, cz], at(a0, y1), at(a1, y1), c, 0);
      this.tri([cx, y0, cz], at(a1, y0), at(a0, y0), c, 0);
    }
  }
  /** Montículo cónico (arena, piedra) de radio r y altura h. */
  cone(cx: number, cy: number, r: number, h: number, hex: string, n = 9) {
    const c = rgb(hex) as Vec3;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      this.tri(
        [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, 0],
        [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, 0],
        [cx, cy, h],
        c,
        0,
      );
    }
  }
  /** Placa vertical regular de n lados en el plano x = x0, mirando hacia +x. */
  plate(x0: number, cy: number, cz: number, r: number, n: number, hex: string, back = '#8d9092') {
    const c = rgb(hex) as Vec3;
    const b = rgb(back) as Vec3;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 + Math.PI / n;
      const a1 = ((i + 1) / n) * Math.PI * 2 + Math.PI / n;
      const p0: Vec3 = [x0, cy + Math.cos(a0) * r, cz + Math.sin(a0) * r];
      const p1: Vec3 = [x0, cy + Math.cos(a1) * r, cz + Math.sin(a1) * r];
      this.tri([x0, cy, cz], p1, p0, c, 0, [1, 0, 0]);
      this.tri(
        [x0 - 0.02, cy, cz],
        [p0[0] - 0.02, p0[1], p0[2]],
        [p1[0] - 0.02, p1[1], p1[2]],
        b,
        0,
        [-1, 0, 0],
      );
    }
  }
  build() {
    return new Float32Array(this.data);
  }
}

function faceNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n: Vec3 = [
    u[1]! * v[2]! - u[2]! * v[1]!,
    u[2]! * v[0]! - u[0]! * v[2]!,
    u[0]! * v[1]! - u[1]! * v[0]!,
  ];
  const l = Math.hypot(...n) || 1;
  return [n[0] / l, n[1] / l, n[2] / l];
}

/** Icosfera unitaria (una subdivisión, 80 caras) con normales suaves. */
function icosphere(mesh: MeshBuilder, flag: number, subdivide = true) {
  const t = (1 + Math.sqrt(5)) / 2;
  let verts: Vec3[] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ]; // prettier-ignore
  let faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2],
    [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5],
    [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ]; // prettier-ignore
  const norm = (v: Vec3): Vec3 => {
    const l = Math.hypot(...v);
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  verts = verts.map(norm);
  const cache = new Map<string, number>();
  const mid = (a: number, b: number) => {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const va = verts[a]!;
    const vb = verts[b]!;
    verts.push(norm([(va[0] + vb[0]) / 2, (va[1] + vb[1]) / 2, (va[2] + vb[2]) / 2]));
    cache.set(key, verts.length - 1);
    return verts.length - 1;
  };
  if (subdivide)
    faces = faces.flatMap(([a, b, c]) => {
      const ab = mid(a!, b!);
      const bc = mid(b!, c!);
      const ca = mid(c!, a!);
      return [
        [a!, ab, ca],
        [b!, bc, ab],
        [c!, ca, bc],
        [ab, bc, ca],
      ];
    });
  const white: Vec3 = [1, 1, 1];
  for (const [a, b, c] of faces) {
    const pa = verts[a!]!;
    const pb = verts[b!]!;
    const pc = verts[c!]!;
    mesh.data.push(
      ...pa,
      ...pa,
      ...white,
      flag,
      ...pb,
      ...pb,
      ...white,
      flag,
      ...pc,
      ...pc,
      ...white,
      flag,
    );
  }
}

/** Árbol lejano: la misma forma con un icosaedro (20 caras) y tronco de 4 lados. */
export function treeLowModel() {
  const m = new MeshBuilder();
  m.cylinderZ(0, 0, 1, 0, 1, '#ffffff', 0, 4);
  icosphere(m, 1, false);
  return m.build();
}

/** Palmera lejana: tronco de 4 lados y cinco hojas de un tramo. */
export function palmLowModel() {
  const m = new MeshBuilder();
  m.cylinderZ(0, 0, 1, 0, 1, '#ffffff', 0, 4);
  const white: Vec3 = [1, 1, 1];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const at = (t: number, side: number): Vec3 => {
      const w = (0.14 * Math.sin(Math.PI * Math.min(t, 0.9)) + 0.03) * side;
      return [t * ca - w * sa, t * sa + w * ca, 0.3 * t - 0.75 * t * t];
    };
    m.quad(at(0, -1), at(0.5, -1), at(0.5, 1), at(0, 1), white, 2);
    m.quad(at(0.5, -1), at(1, -1), at(1, 1), at(0.5, 1), white, 2);
  }
  return m.build();
}

/**
 * Peatón de 1,65 m mirando hacia +x. Partes animadas en el shader: 7 y 8 piernas, 9 y 10 brazos;
 * la camisa toma el color de la instancia (marca 4).
 */
export function personModel() {
  const m = new MeshBuilder();
  const pants = '#2f3a4d';
  const skin = '#a87253';
  m.box(-0.08, 0.02, 0, 0.08, 0.15, 0.86, pants, 7);
  m.box(-0.08, -0.15, 0, 0.08, -0.02, 0.86, pants, 8);
  m.box(-0.11, -0.19, 0.84, 0.11, 0.19, 1.4, '#ffffff', 4);
  m.box(-0.06, 0.19, 0.9, 0.06, 0.27, 1.38, skin, 9);
  m.box(-0.06, -0.27, 0.9, 0.06, -0.19, 1.38, skin, 10);
  m.box(-0.09, -0.09, 1.4, 0.1, 0.09, 1.6, skin);
  m.box(-0.11, -0.1, 1.56, 0.09, 0.1, 1.67, '#1d1714');
  return m.build();
}

/** Árbol de copa ancha: tronco unitario (parte 0) y copa esférica unitaria (parte 1). */
export function treeModel() {
  const m = new MeshBuilder();
  m.cylinderZ(0, 0, 1, 0, 1, '#ffffff', 0, 6);
  icosphere(m, 1);
  return m.build();
}

/** Palmera: tronco (parte 0) y nueve hojas arqueadas (parte 2) de longitud unitaria. */
export function palmModel() {
  const m = new MeshBuilder();
  m.cylinderZ(0, 0, 1, 0, 1, '#ffffff', 0, 6);
  const white: Vec3 = [1, 1, 1];
  const leaves = 9;
  for (let k = 0; k < leaves; k++) {
    const a = (k / leaves) * Math.PI * 2 + (k % 2) * 0.2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const at = (t: number, side: number): Vec3 => {
      const w = (0.16 * Math.sin(Math.PI * t) + 0.015) * side;
      const x = t;
      const z = 0.3 * t - 0.75 * t * t;
      return [x * ca - w * sa, x * sa + w * ca, z];
    };
    for (let i = 0; i < 4; i++) {
      const t0 = i / 4;
      const t1 = (i + 1) / 4;
      m.quad(at(t0, -1), at(t1, -1), at(t1, 1), at(t0, 1), white, 2);
    }
  }
  return m.build();
}

/** Moto lineal con conductor. */
export function motoModel() {
  const m = new MeshBuilder();
  m.wheel(0.68, 0, 0.3, 0.3, 0.11);
  m.wheel(-0.68, 0, 0.3, 0.3, 0.13);
  m.box(-0.6, -0.13, 0.32, 0.5, 0.13, 0.62, '#ff00ff', 1);
  m.box(0.15, -0.16, 0.6, 0.58, 0.16, 0.86, '#ff00ff', 1);
  m.box(-0.62, -0.15, 0.7, 0.12, 0.15, 0.82, '#151515');
  m.box(0.55, -0.36, 0.95, 0.6, 0.36, 1.0, '#2b2b2b');
  m.box(0.6, -0.06, 0.78, 0.66, 0.06, 0.9, '#fffbe6', 2);
  m.box(-0.66, -0.07, 0.62, -0.6, 0.07, 0.7, '#ff2a2a', 5);
  m.box(-0.32, -0.2, 0.8, 0.14, 0.2, 0.98, '#2f4f7a');
  m.box(-0.3, -0.2, 0.98, -0.02, 0.2, 1.5, '#ffffff', 4);
  m.box(-0.24, -0.13, 1.5, 0.02, 0.13, 1.78, '#1c1c1c');
  return m.build();
}

/** Mototaxi de tres ruedas con cabina y toldo de color (pintura de la instancia). */
export function mototaxiModel() {
  const m = new MeshBuilder();
  m.wheel(1.08, 0, 0.26, 0.26, 0.12);
  m.wheel(-0.72, 0.56, 0.27, 0.27, 0.14);
  m.wheel(-0.72, -0.56, 0.27, 0.27, 0.14);
  m.box(0.5, -0.17, 0.34, 1.22, 0.17, 0.84, '#ff00ff', 1);
  m.box(0.95, -0.4, 1.0, 1.0, 0.4, 1.05, '#2b2b2b');
  m.box(1.2, -0.07, 0.68, 1.26, 0.07, 0.8, '#fffbe6', 2);
  m.box(0.3, -0.2, 0.85, 0.62, 0.2, 1.38, '#ffffff', 4);
  m.box(0.34, -0.13, 1.38, 0.58, 0.13, 1.64, '#1c1c1c');
  m.box(-1.15, -0.62, 0.3, 0.45, 0.62, 0.55, '#262626');
  m.box(-1.15, -0.62, 0.55, -0.92, 0.62, 1.25, '#ff00ff', 1);
  m.box(-0.92, 0.57, 0.55, 0.3, 0.62, 0.95, '#ff00ff', 1);
  m.box(-0.92, -0.62, 0.55, 0.3, -0.57, 0.95, '#ff00ff', 1);
  m.box(-0.9, -0.55, 0.55, -0.42, 0.55, 0.85, '#6b1d1d');
  m.box(-1.22, -0.68, 1.7, 0.78, 0.68, 1.82, '#ff00ff', 1);
  for (const x of [-1.15, 0.7])
    for (const y of [-0.62, 0.58]) m.box(x, y, 0.9, x + 0.05, y + 0.04, 1.71, '#222222');
  m.box(0.72, -0.52, 1.02, 0.76, 0.52, 1.66, '#9ec5d8', 3);
  m.box(-1.2, 0.3, 0.6, -1.16, 0.5, 0.7, '#ff2a2a', 5);
  m.box(-1.2, -0.5, 0.6, -1.16, -0.3, 0.7, '#ff2a2a', 5);
  return m.build();
}

/** Auto sedán. */
export function carModel() {
  const m = new MeshBuilder();
  for (const x of [1.35, -1.35]) for (const y of [0.78, -0.78]) m.wheel(x, y, 0.32, 0.32, 0.22);
  m.box(-2.1, -0.86, 0.32, 2.1, 0.86, 0.86, '#ff00ff', 1);
  m.box(-1.05, -0.8, 0.86, 0.85, 0.8, 1.36, '#33424f', 3);
  m.box(-0.95, -0.78, 1.36, 0.75, 0.78, 1.44, '#ff00ff', 1);
  m.box(2.08, 0.5, 0.6, 2.12, 0.78, 0.72, '#fffbe6', 2);
  m.box(2.08, -0.78, 0.6, 2.12, -0.5, 0.72, '#fffbe6', 2);
  m.box(-2.12, 0.5, 0.62, -2.08, 0.8, 0.72, '#ff2a2a', 5);
  m.box(-2.12, -0.8, 0.62, -2.08, -0.5, 0.72, '#ff2a2a', 5);
  return m.build();
}

/** Tanque de agua elevado (tipo Rotoplas de 1100 L) con tapa. */
export function tankModel() {
  const m = new MeshBuilder();
  m.cylinderZ(0, 0, 0.55, 0, 1.25, '#ff00ff', 1, 10);
  m.cylinderZ(0, 0, 0.24, 1.25, 1.33, '#ff00ff', 1, 8);
  return m.build();
}

/** Columna de espera: dado de concreto con cuatro fierros oxidados hacia arriba. */
export function rebarModel() {
  const m = new MeshBuilder();
  m.box(-0.13, -0.13, 0, 0.13, 0.13, 0.32, '#a19d95');
  for (const x of [-0.07, 0.05])
    for (const y of [-0.07, 0.05]) m.box(x, y, 0.32, x + 0.025, y + 0.025, 1.05, '#6b4430');
  return m.build();
}

/**
 * Poste de concreto de 9 m con cruceta y bastidor de baja tensión. Variantes: con pastoral de
 * alumbrado (luz hacia la calzada, +y) o con transformador.
 */
export function poleModel(kind: 'pole' | 'lamp' | 'trafo') {
  const m = new MeshBuilder();
  const concrete = '#aaa59b';
  // Fuste troncocónico aproximado con tres tramos.
  m.box(-0.15, -0.15, 0, 0.15, 0.15, 3, concrete);
  m.box(-0.12, -0.12, 3, 0.12, 0.12, 6, concrete);
  m.box(-0.09, -0.09, 6, 0.09, 0.09, 9, concrete);
  m.box(-0.06, -0.8, 7.95, 0.06, 0.8, 8.08, '#6a5a48');
  for (const y of [-0.65, 0, 0.65]) m.box(-0.04, y - 0.04, 8.08, 0.04, y + 0.04, 8.22, '#d9d6cf');
  m.box(-0.13, -0.05, 6.65, 0.13, 0.25, 6.9, '#4a4a4a');
  if (kind === 'lamp') {
    m.box(-0.04, 0, 7.25, 0.04, 1.7, 7.33, '#7a7a7a');
    m.box(-0.14, 1.45, 7.06, 0.14, 1.9, 7.25, '#ffe2a8', 2);
  }
  if (kind === 'trafo') {
    m.cylinderZ(0, -0.42, 0.3, 5.3, 6.3, '#8c9196', 0, 8);
    m.box(-0.05, -0.2, 5.6, 0.05, -0.1, 5.9, '#4a4a4a');
  }
  return m.build();
}

/** Mancha de luz del alumbrado en el suelo (cuadrado unitario; el shader la difumina). */
export function glowModel() {
  const m = new MeshBuilder();
  const w: [number, number, number] = [1, 1, 1];
  m.quad([-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0], w, 0);
  return m.build();
}

/** Banca de plaza: patas de concreto y asiento y respaldar de listones (largo sobre x). */
export function benchModel() {
  const m = new MeshBuilder();
  for (const x of [-0.75, 0.65]) m.box(x, -0.22, 0, x + 0.1, 0.22, 0.42, '#b9b4aa');
  m.box(-0.85, -0.24, 0.42, 0.85, 0.24, 0.48, '#7a5233');
  m.box(-0.85, 0.2, 0.5, 0.85, 0.25, 0.85, '#7a5233');
  return m.build();
}

/**
 * Monumento de la plaza principal: basamento escalonado, pedestal de piedra y figura de bronce de
 * un militar (referencia documentada por el IIAP; la forma es representativa).
 */
export function monumentModel() {
  const m = new MeshBuilder();
  m.box(-2.4, -2.4, 0, 2.4, 2.4, 0.35, '#c9c4b8');
  m.box(-1.8, -1.8, 0.35, 1.8, 1.8, 0.7, '#bdb7aa');
  m.box(-0.95, -0.95, 0.7, 0.95, 0.95, 3.4, '#d6d0c2');
  m.box(-1.1, -1.1, 3.4, 1.1, 1.1, 3.6, '#c4bdae');
  m.box(0.96, -0.5, 1.6, 0.98, 0.5, 2.4, '#6f5a32', 6);
  const bronze = '#5d4a2c';
  m.box(-0.28, -0.32, 3.6, 0.28, -0.05, 4.65, bronze, 6);
  m.box(-0.28, 0.05, 3.6, 0.28, 0.32, 4.65, bronze, 6);
  m.box(-0.32, -0.42, 4.65, 0.32, 0.42, 5.55, bronze, 6);
  m.box(-0.24, -0.56, 4.7, 0.22, -0.42, 5.5, bronze, 6);
  m.box(-0.1, 0.42, 5.2, 0.3, 0.56, 5.55, bronze, 6);
  m.box(0.05, 0.42, 5.55, 0.15, 0.52, 6.4, bronze, 6);
  m.box(-0.12, -0.13, 5.55, 0.12, 0.13, 5.7, bronze, 6);
  m.cylinderZ(0, 0, 0.19, 5.7, 6.06, bronze, 6, 8);
  m.cylinderZ(0, 0, 0.24, 6.02, 6.12, bronze, 6, 8);
  return m.build();
}

/** Busto sobre columna (plazas secundarias). */
export function bustModel() {
  const m = new MeshBuilder();
  m.box(-1.3, -1.3, 0, 1.3, 1.3, 0.3, '#c9c4b8');
  m.box(-0.55, -0.55, 0.3, 0.55, 0.55, 2.3, '#d6d0c2');
  m.box(-0.45, -0.32, 2.3, 0.45, 0.32, 2.75, '#5d4a2c', 6);
  m.cylinderZ(0, 0, 0.17, 2.75, 3.12, '#5d4a2c', 6, 8);
  return m.build();
}

/** Señal de PARE: poste y octógono rojo mirando hacia +x. */
export function stopSignModel() {
  const m = new MeshBuilder();
  m.box(-0.03, -0.03, 0, 0.03, 0.03, 2.35, '#8d9092');
  m.plate(0.05, 0, 2.3, 0.38, 8, '#f2f2f2');
  m.plate(0.06, 0, 2.3, 0.33, 8, '#c8202a');
  return m.build();
}

/** Puesto de mercado: mesa con mercadería y toldo de lona del color dado. */
export function stallModel(tarp: string, goods: string) {
  const m = new MeshBuilder();
  m.box(-0.9, -0.45, 0, 0.9, 0.45, 0.8, '#6e5238');
  m.box(-0.85, -0.4, 0.8, 0.85, 0.4, 0.95, goods);
  for (const x of [-1.1, 1.05])
    for (const y of [-0.85, 0.8]) m.box(x, y, 0, x + 0.05, y + 0.05, 2.3, '#4a4a4a');
  m.box(-1.2, -1.0, 2.3, 1.2, 1.0, 2.36, tarp);
  return m.build();
}

/** Bus interprovincial (12 m) con ventanas y franja del color de la empresa. */
export function busModel(body: string, stripe: string) {
  const m = new MeshBuilder();
  for (const x of [3.9, -3.2, -4.4]) for (const y of [1.1, -1.1]) m.wheel(x, y, 0.5, 0.5, 0.3);
  m.box(-6, -1.25, 0.45, 6, 1.25, 3.4, body);
  m.box(-5.9, -1.27, 1.9, 5.3, 1.27, 2.9, '#27323b', 3);
  m.box(5.98, -1.15, 1.4, 6.02, 1.15, 3.1, '#27323b', 3);
  m.box(-6.01, -1.26, 0.9, 6.01, 1.26, 1.3, stripe);
  m.box(5.98, 0.6, 0.7, 6.03, 1.0, 0.9, '#fffbe6', 2);
  m.box(5.98, -1.0, 0.7, 6.03, -0.6, 0.9, '#fffbe6', 2);
  return m.build();
}

/** Arco de fútbol (ancho w, alto h) con su red, de frente hacia +x. */
export function goalModel(w: number, h: number) {
  const m = new MeshBuilder();
  const white = '#f4f4f2';
  for (const y of [-w / 2, w / 2]) m.box(-0.06, y - 0.06, 0, 0.06, y + 0.06, h, white);
  m.box(-0.06, -w / 2, h - 0.06, 0.06, w / 2, h + 0.06, white);
  m.box(-1.2, -w / 2, 0, -1.18, w / 2, h * 0.8, '#d8d8d4');
  return m.build();
}

/** Farol de malecón o plaza: poste verde oscuro y farola. */
export function lanternModel() {
  const m = new MeshBuilder();
  m.box(-0.12, -0.12, 0, 0.12, 0.12, 0.4, '#2e3b33');
  m.box(-0.05, -0.05, 0.4, 0.05, 0.05, 3.6, '#2e3b33');
  m.box(-0.16, -0.16, 3.6, 0.16, 0.16, 4.05, '#ffe2a8', 2);
  m.box(-0.2, -0.2, 4.05, 0.2, 0.2, 4.15, '#2e3b33');
  return m.build();
}

/** Material de obra en la vereda: arena, piedra chancada y ladrillos apilados. */
export function worksModel() {
  const m = new MeshBuilder();
  m.cone(-0.9, 0, 0.95, 0.75, '#c9a46a');
  m.cone(0.6, 0.2, 0.75, 0.55, '#8d8b86');
  m.box(-0.2, -0.95, 0, 0.7, -0.35, 0.55, '#b0553a');
  m.box(-0.15, -0.9, 0.55, 0.6, -0.4, 0.7, '#a24c33');
  return m.build();
}

/** Remate de campanario: cornisa, cúpula amarilla, linterna blanca y cruz (base 3,4 m, z = 0). */
export function churchTopModel() {
  const m = new MeshBuilder();
  const yellow = '#f0b323';
  const white = '#f3f1ea';
  m.box(-1.85, -1.85, 0, 1.85, 1.85, 0.35, white);
  const R = 1.55;
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const a0 = (i / steps) * (Math.PI / 2);
    const a1 = ((i + 1) / steps) * (Math.PI / 2);
    const r = R * Math.cos((a0 + a1) / 2);
    m.cylinderZ(0, 0, r, 0.35 + R * Math.sin(a0), 0.35 + R * Math.sin(a1), yellow, 0, 12);
  }
  m.cylinderZ(0, 0, 0.32, 0.35 + R - 0.05, 0.35 + R + 0.65, white, 0, 8);
  m.cylinderZ(0, 0, 0.4, 0.35 + R + 0.65, 0.35 + R + 0.78, white, 0, 8);
  const z = 0.35 + R + 0.78;
  m.box(-0.06, -0.06, z, 0.06, 0.06, z + 1.3, '#d9d6cf');
  m.box(-0.06, -0.38, z + 0.8, 0.06, 0.38, z + 0.92, '#d9d6cf');
  return m.build();
}

/** Asta con la bandera del Perú (roja, blanca y roja), 9 m. */
export function flagModel() {
  const m = new MeshBuilder();
  m.box(-0.6, -0.6, 0, 0.6, 0.6, 0.5, '#bdb8ad');
  m.cylinderZ(0, 0, 0.06, 0.5, 9.2, '#d4d6d8', 0, 6);
  m.box(-0.02, 0.08, 8.0, 0.02, 0.78, 9.1, '#d91023');
  m.box(-0.02, 0.78, 8.0, 0.02, 1.48, 9.1, '#ffffff');
  m.box(-0.02, 1.48, 8.0, 0.02, 2.18, 9.1, '#d91023');
  return m.build();
}

/** Letrero de salud en la azotea: panel blanco con cruz roja. */
export function healthSignModel() {
  const m = new MeshBuilder();
  for (const x of [-1.0, 1.0]) m.box(x - 0.05, -0.05, 0, x + 0.05, 0.05, 1.2, '#8c9196');
  m.box(-1.3, -0.08, 1.2, 1.3, 0.08, 3.6, '#f4f4f2');
  m.box(-0.28, -0.1, 1.55, 0.28, 0.1, 3.25, '#d32f2f', 2);
  m.box(-0.85, -0.1, 2.12, 0.85, 0.1, 2.68, '#d32f2f', 2);
  return m.build();
}

/**
 * Monumento de la Plaza de Armas de Bagua (fotografías 2022-2026): losas verticales de concreto
 * claro de distinta altura sobre una base elevada con escalones y baranda turquesa, tres astas
 * altas detrás (la central con la bandera del Perú) y una figura de bronce al frente.
 */
export function baguaMonumentModel() {
  const m = new MeshBuilder();
  m.box(-5.2, -5.2, 0, 5.2, 5.2, 0.3, '#c9c9c4');
  m.box(-4.6, -4.6, 0.3, 4.6, 4.6, 0.6, '#d3d3ce');
  m.box(-4.0, -4.0, 0.6, 4.0, 4.0, 0.95, '#dcdcd7');
  // Baranda turquesa en el borde de la base.
  const turquesa = '#2fb2ad';
  for (let k = -4; k <= 4; k++)
    for (const [x, y] of [
      [k * 0.95, -3.85],
      [k * 0.95, 3.85],
      [-3.85, k * 0.95],
      [3.85, k * 0.95],
    ] as [number, number][])
      m.box(x - 0.04, y - 0.04, 0.95, x + 0.04, y + 0.04, 1.75, turquesa);
  for (const sgn of [-1, 1]) {
    m.box(-3.9, sgn * 3.85 - 0.05, 1.68, 3.9, sgn * 3.85 + 0.05, 1.78, turquesa);
    m.box(sgn * 3.85 - 0.05, -3.9, 1.68, sgn * 3.85 + 0.05, 3.9, 1.78, turquesa);
  }
  const losas: [number, number, number, number][] = [
    [-2.1, -0.4, 0.55, 5.6],
    [-1.15, -0.9, 0.65, 7.4],
    [0.0, -0.5, 0.7, 9.0],
    [1.15, -1.0, 0.6, 7.8],
    [2.1, -0.3, 0.55, 5.2],
    [-0.6, 1.0, 0.75, 4.6],
    [0.8, 1.1, 0.7, 5.0],
  ];
  for (const [x, y, w, h] of losas)
    m.box(x - w / 2, y - 0.85, 0.95, x + w / 2, y + 0.85, 0.95 + h, '#e1e1db');
  // Tres astas detrás; la central con la bandera del Perú.
  for (const x of [-2.6, 0, 2.6]) m.cylinderZ(x, -3.2, 0.07, 0.95, 13.5, '#eceeef', 0, 6);
  m.box(0.0, -3.17, 12.2, 0.0 + 0.02, -3.17 + 0.7, 13.3, '#d91023');
  m.box(0.0, -2.47, 12.2, 0.0 + 0.02, -2.47 + 0.7, 13.3, '#ffffff');
  m.box(0.0, -1.77, 12.2, 0.0 + 0.02, -1.77 + 0.7, 13.3, '#d91023');
  const bronze = '#5d4a2c';
  m.box(-0.5, 2.2, 0.95, 0.5, 3.1, 2.1, '#a3a19a');
  m.box(-0.22, 2.45, 2.1, 0.22, 2.85, 3.2, bronze, 6);
  m.box(-0.26, 2.43, 3.2, 0.26, 2.87, 4.0, bronze, 6);
  m.cylinderZ(0, 2.65, 0.16, 4.0, 4.32, bronze, 6, 8);
  return m.build();
}

/** Poste de plaza con dos faroles esféricos blancos (Plaza de Armas de Bagua, 2026). */
export function doubleLampModel() {
  const m = new MeshBuilder();
  m.box(-0.13, -0.13, 0, 0.13, 0.13, 0.5, '#4a5056');
  m.cylinderZ(0, 0, 0.06, 0.5, 3.7, '#5b6166', 0, 8);
  m.box(-0.5, -0.03, 3.62, 0.5, 0.03, 3.7, '#5b6166');
  for (const x of [-0.5, 0.5]) {
    for (let i = 0; i < 4; i++) {
      const a0 = -Math.PI / 2 + (i / 4) * Math.PI;
      const a1 = -Math.PI / 2 + ((i + 1) / 4) * Math.PI;
      const r = 0.22 * Math.cos((a0 + a1) / 2);
      m.cylinderZ(
        x,
        0,
        r,
        3.92 + 0.22 * Math.sin(a0),
        3.92 + 0.22 * Math.sin(a1),
        '#fffaf0',
        2,
        10,
      );
    }
  }
  return m.build();
}
