import type {
  CustomLayerInterface,
  CustomRenderMethodInput,
  Map as MapLibreMap,
} from 'maplibre-gl';
import { BUILDING_STRIDE, CHUNK_STRIDE, PROP_STRIDE, TREE_STRIDE, type RoadGraph } from './build';
import { Crowd, type Walkways } from './crowd';
import { GROUND_STRIDE } from './ground';
import {
  carModel,
  MODEL_STRIDE,
  mototaxiModel,
  motoModel,
  glowModel,
  palmLowModel,
  palmModel,
  personModel,
  poleModel,
  rebarModel,
  tankModel,
  treeLowModel,
  treeModel,
  worksModel,
} from './models';
import { FACADE_COLORS, ROOF_COLORS, SIGN_COLORS, VEHICLE_COLORS, rgb } from './palette';
import { ATTR, source, type Variant } from './shaders';
import { Traffic } from './traffic';
import CityWorker from './city.worker.ts?worker&inline';

/*
 * Ciudad 3D de BAGUA MASTER como capa personalizada de MapLibre (WebGL2):
 * edificios con materiales y techos inclinados, árboles reales (dosel satelital), tanques y
 * fierros en las losas, y tráfico de mototaxis, motos y autos. Sol con mapa de sombras
 * estabilizado, luz de cielo y suelo, y niebla de distancia que funde con el cielo de MapLibre.
 *
 * Rendimiento: la geometría se arma en un Web Worker (city.worker.ts) y llega en búferes
 * transferidos; todo se dibuja en pocas llamadas (instanciado), el mapa de sombras cubre solo el
 * entorno de la cámara y la animación corre a 30 fps cuando nadie mueve el mapa.
 */

export const CITY_LAYER = 'bm-ciudad-3d';

const EARTH = 2 * Math.PI * 6371008.8;
const mercX = (lng: number) => (180 + lng) / 360;
const mercY = (lat: number) =>
  (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) / 360;
// Origen de las coordenadas locales: el centro de la ciudad (debe ser el `origen` del paquete,
// que se genera con el mismo `centro` de ciudad.json). Lo fija el constructor de CityLayer.
let OX = 0;
let OY = 0;
let MERC_PER_M = 1;
const MODEL = [
  MERC_PER_M, 0, 0, 0,
  0, -MERC_PER_M, 0, 0,
  0, 0, MERC_PER_M, 0,
  OX, OY, 0, 1,
]; // prettier-ignore
function setOrigin([lng, lat]: readonly [number, number]) {
  OX = mercX(lng);
  OY = mercY(lat);
  MERC_PER_M = 1 / (EARTH * Math.cos((lat * Math.PI) / 180));
  MODEL[0] = MERC_PER_M;
  MODEL[5] = -MERC_PER_M;
  MODEL[10] = MERC_PER_M;
  MODEL[12] = OX;
  MODEL[13] = OY;
}
const toLocal = (lng: number, lat: number): [number, number] => [
  (mercX(lng) - OX) / MERC_PER_M,
  (OY - mercY(lat)) / MERC_PER_M,
];

// ------------------------------------------------------------------ matrices (por columnas)
type M4 = Float64Array;
function mul(a: ArrayLike<number>, b: ArrayLike<number>): M4 {
  const o = new Float64Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r]! * b[c * 4 + k]!;
      o[c * 4 + r] = s;
    }
  return o;
}
function invert(m: ArrayLike<number>): M4 | null {
  const a = Array.from(m);
  const inv = new Float64Array(16);
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = a as number[] as [
    number, number, number, number, number, number, number, number,
    number, number, number, number, number, number, number, number,
  ]; // prettier-ignore
  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;
  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) return null;
  det = 1 / det;
  inv[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  inv[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  inv[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  inv[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  inv[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  inv[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  inv[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  inv[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  inv[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  inv[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  inv[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  inv[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  inv[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  inv[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  inv[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  inv[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return inv;
}
function transform(m: ArrayLike<number>, x: number, y: number, z: number, w = 1) {
  return [0, 1, 2, 3].map((r) => m[r]! * x + m[4 + r]! * y + m[8 + r]! * z + m[12 + r]! * w) as [
    number,
    number,
    number,
    number,
  ];
}
function lookAt(eye: number[], target: number[], up: number[]): M4 {
  let zx = eye[0]! - target[0]!;
  let zy = eye[1]! - target[1]!;
  let zz = eye[2]! - target[2]!;
  let l = Math.hypot(zx, zy, zz);
  zx /= l;
  zy /= l;
  zz /= l;
  let xx = up[1]! * zz - up[2]! * zy;
  let xy = up[2]! * zx - up[0]! * zz;
  let xz = up[0]! * zy - up[1]! * zx;
  l = Math.hypot(xx, xy, xz);
  xx /= l;
  xy /= l;
  xz /= l;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  return new Float64Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0]! + xy * eye[1]! + xz * eye[2]!),
    -(yx * eye[0]! + yy * eye[1]! + yz * eye[2]!),
    -(zx * eye[0]! + zy * eye[1]! + zz * eye[2]!),
    1,
  ]); // prettier-ignore
}
function ortho(r: number, near: number, far: number): M4 {
  return new Float64Array([
    1 / r, 0, 0, 0,
    0, 1 / r, 0, 0,
    0, 0, -2 / (far - near), 0,
    0, 0, -(far + near) / (far - near), 1,
  ]); // prettier-ignore
}

/**
 * Bloques a dibujar: dentro del encuadre (prueba de las 8 esquinas de cada caja contra los planos
 * de recorte) y más cerca que maxDist del ojo. Devuelve rangos [primero, cantidad] unidos cuando
 * son contiguos, separados en cercanos y lejanos (para el nivel de detalle).
 */
function cull(
  table: Float32Array | undefined,
  m: ArrayLike<number>,
  eye: number[] | null,
  maxDist: number,
  lod = Infinity,
) {
  const near: number[] = [];
  const far: number[] = [];
  if (!table) return { near, far };
  for (let i = 0; i + CHUNK_STRIDE <= table.length; i += CHUNK_STRIDE) {
    const count = table[i + 6]!;
    if (!count) continue;
    const [x0, y0, x1, y1, z1] = [
      table[i]!,
      table[i + 1]!,
      table[i + 2]!,
      table[i + 3]!,
      table[i + 4]!,
    ];
    let d = 0;
    if (eye) {
      d = Math.hypot(
        Math.max(x0 - eye[0]!, 0, eye[0]! - x1),
        Math.max(y0 - eye[1]!, 0, eye[1]! - y1),
      );
      if (d > maxDist) continue;
    }
    let [l, r, b, t, behind] = [0, 0, 0, 0, 0];
    for (let c = 0; c < 8; c++) {
      const x = c & 1 ? x1 : x0;
      const y = c & 2 ? y1 : y0;
      const z = c & 4 ? z1 : 0;
      const cx = m[0]! * x + m[4]! * y + m[8]! * z + m[12]!;
      const cy = m[1]! * x + m[5]! * y + m[9]! * z + m[13]!;
      const cw = m[3]! * x + m[7]! * y + m[11]! * z + m[15]!;
      if (cw <= 0) behind++;
      if (cx < -cw) l++;
      if (cx > cw) r++;
      if (cy < -cw) b++;
      if (cy > cw) t++;
    }
    if (behind === 8 || (!behind && (l === 8 || r === 8 || b === 8 || t === 8))) continue;
    const list = d > lod ? far : near;
    const first = table[i + 5]!;
    const n = list.length;
    if (n && list[n - 2]! + list[n - 1]! === first) list[n - 1] = list[n - 1]! + count;
    else list.push(first, count);
  }
  return { near, far };
}

// ------------------------------------------------------------------ GL
interface Program {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
}
interface Instanced {
  vao: WebGLVertexArrayObject;
  vbo: WebGLBuffer;
  instances: WebGLBuffer;
  vertexCount: number;
  count: number;
}

export interface CityTheme {
  night: number;
  saturation: number;
  selection: string;
  fog: string;
}
export interface CityStats {
  edificios: number;
  arboles: number;
  vehiculos: number;
  ms: { descarga: number; armado: number };
}

const SUN_AZIMUTH = (295 * Math.PI) / 180;
const SUN: [number, number, number] = (() => {
  const v = [Math.sin(SUN_AZIMUTH) * 0.74, Math.cos(SUN_AZIMUTH) * 0.74, 0.67];
  const l = Math.hypot(...v);
  return [v[0]! / l, v[1]! / l, v[2]! / l];
})();

export class CityLayer implements CustomLayerInterface {
  readonly id = CITY_LAYER;
  readonly type = 'custom' as const;
  readonly renderingMode = '3d' as const;
  private map?: MapLibreMap;
  private gl?: WebGL2RenderingContext;
  private worker: Worker;
  private programs = new Map<string, Program>();
  private building?: {
    vao: WebGLVertexArrayObject;
    vbo: WebGLBuffer;
    ibo: WebGLBuffer;
    count: number;
    chunks?: Float32Array;
  };
  /** Oclusión de contacto alrededor de las casas. */
  private skirt?: {
    vao: WebGLVertexArrayObject;
    vbo: WebGLBuffer;
    ibo: WebGLBuffer;
    chunks?: Float32Array;
  };
  /** Tablas de bloques de árboles y palmeras. */
  private chunks: Record<string, Float32Array> = {};
  private crowd?: Crowd;
  /** El mapa de sombras se vuelve a dibujar solo si cambia la cámara o los datos. */
  private shadowKey = '';
  private dirty = true;
  private meshes: Record<string, Instanced> = {};
  private ground?: WebGLVertexArrayObject;
  /** Suelo: lotes (con mezcla), superficies planas y objetos que dan sombra, en un búfer. */
  private surface?: { vao: WebGLVertexArrayObject; vbo: WebGLBuffer; tables: Float32Array[] };
  private shadow?: { fbo: WebGLFramebuffer; tex: WebGLTexture; size: number };
  private pickTarget?: {
    fbo: WebGLFramebuffer;
    color: WebGLRenderbuffer;
    depth: WebGLRenderbuffer;
    w: number;
    h: number;
  };
  private lightMatrix: Float32Array = new Float32Array(16);
  private shadowReady = false;
  private ids: string[] = [];
  private index = new Map<string, number>();
  private selected = -1;
  private hideSimulated = false;
  private theme: CityTheme = { night: 0, saturation: 1, selection: '#0b66f5', fog: '#e8f2f5' };
  private riseStart = performance.now() - 5000;
  private last = performance.now();
  private traffic?: Traffic;
  private pending: { x: number; y: number; resolve: (id: string | null) => void }[] = [];
  private hidden: string[] = [];
  private loaded = false;
  private stats: Partial<CityStats> & { palmas?: number } = {};
  private animTimer = 0;
  onStats?: (stats: CityStats) => void;
  onError?: (message: string) => void;

  constructor(origin: readonly [number, number]) {
    setOrigin(origin);
    // Worker embebido: funciona igual al instalar karto como dependencia.
    this.worker = new CityWorker();
    this.worker.onmessage = (event: MessageEvent) => {
      try {
        this.receive(event.data as Record<string, unknown>);
      } catch (error) {
        console.error('Ciudad 3D:', error);
        this.onError?.(String(error));
      }
    };
    this.worker.onerror = (event) => {
      console.error('Ciudad 3D (worker):', event.message);
      this.onError?.(event.message);
    };
  }

  /** Descarga y arma la ciudad en segundo plano (se puede llamar antes de entrar en 3D). */
  load(url: string) {
    if (this.loaded) return;
    this.loaded = true;
    this.worker.postMessage({
      type: 'load',
      url: new URL(url, location.href).href,
      hidden: this.hidden,
    });
  }

  setHidden(ids: string[]) {
    const same = ids.length === this.hidden.length && ids.every((id, i) => id === this.hidden[i]);
    this.hidden = ids;
    if (!same && this.ids.length) this.worker.postMessage({ type: 'hide', hidden: ids });
  }

  /*
   * Los datos del worker llegan fuera del ciclo de dibujo de MapLibre. Tocar el estado de GL en
   * ese momento desordenaría la caché de estado de MapLibre (búferes y VAO enlazados), así que
   * se encolan y se suben al inicio del próximo cuadro, donde MapLibre restablece su estado.
   */
  private uploads: (() => void)[] = [];
  private flush(gl: WebGL2RenderingContext) {
    if (this.uploads.length) this.dirty = true;
    for (const upload of this.uploads.splice(0)) upload();
    gl.bindVertexArray(null);
  }

  private receive(data: Record<string, unknown>) {
    if (data.type === 'error') {
      this.loaded = false;
      this.onError?.(String(data.message));
      return;
    }
    if (data.type === 'buildings') {
      const ids = data.ids as string[];
      this.uploads.push(() => {
        const gl = this.gl!;
        this.ids = ids;
        this.index = new Map(ids.map((id, i) => [id, i]));
        const b = this.building!;
        gl.bindVertexArray(b.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, b.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, data.vertices as Float32Array, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices as Uint32Array, gl.STATIC_DRAW);
        b.count = (data.indices as Uint32Array).length;
        b.chunks = data.chunks as Float32Array;
        const k = this.skirt!;
        gl.bindVertexArray(k.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, k.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, data.skirtVertices as Float32Array, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, k.ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.skirtIndices as Uint32Array, gl.STATIC_DRAW);
        k.chunks = data.skirtChunks as Float32Array;
        gl.bindVertexArray(null);
        this.setInstances('tank', data.tanks as Float32Array);
        this.setInstances('rebar', data.rebars as Float32Array);
        this.setInstances('works', data.works as Float32Array);
        // Red eléctrica: postes, alumbrado, transformadores y cables (una sola instancia fija).
        const power = data.power as Record<string, Float32Array>;
        this.setInstances('pole', power.poles!);
        this.setInstances('lamp', power.lamps!);
        this.setInstances('glow', power.lamps!);
        this.setInstances('trafo', power.trafos!);
        const wires = this.meshes.wires!;
        gl.bindBuffer(gl.ARRAY_BUFFER, wires.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, power.lines!, gl.STATIC_DRAW);
        wires.vertexCount = power.lines!.length / MODEL_STRIDE;
        this.setInstances('wires', new Float32Array([0, 0, 0, 1, 0, 0]));
      });
      this.ids = ids;
      this.index = new Map(ids.map((id, i) => [id, i]));
      this.stats.edificios = data.shown as number;
    } else if (data.type === 'scene') {
      this.uploads.push(() => {
        this.setInstances('tree', data.trees as Float32Array, TREE_STRIDE);
        this.setInstances('palm', data.palms as Float32Array, TREE_STRIDE);
        this.chunks.tree = data.treeChunks as Float32Array;
        this.chunks.palm = data.palmChunks as Float32Array;
      });
      this.traffic = new Traffic(data.roads as RoadGraph);
      this.stats.arboles =
        ((data.trees as Float32Array).length + (data.palms as Float32Array).length) / TREE_STRIDE;
      this.stats.palmas = (data.palms as Float32Array).length;
      this.stats.vehiculos = this.traffic.buffers.reduce((n, b) => n + b.length / PROP_STRIDE, 0);
      this.stats.ms = data.ms as CityStats['ms'];
      this.onStats?.(this.stats as CityStats);
    } else if (data.type === 'ground') {
      this.uploads.push(() => {
        const gl = this.gl!;
        const g = this.surface!;
        gl.bindBuffer(gl.ARRAY_BUFFER, g.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, data.vertices as Float32Array, gl.STATIC_DRAW);
        g.tables = data.tables as Float32Array[];
        this.setInstances('tree', data.trees as Float32Array, TREE_STRIDE);
        this.chunks.tree = data.treeChunks as Float32Array;
        if (data.palms) {
          this.setInstances('palm', data.palms as Float32Array, TREE_STRIDE);
          this.chunks.palm = data.palmChunks as Float32Array;
        }
      });
      if (data.palms) this.stats.palmas = (data.palms as Float32Array).length;
      this.crowd = new Crowd(data.walks as Walkways);
      this.stats.arboles =
        ((data.trees as Float32Array).length + (this.stats.palmas ?? 0)) / TREE_STRIDE;
      this.onStats?.(this.stats as CityStats);
    }
    this.map?.triggerRepaint();
  }

  private setInstances(name: string, data: Float32Array, stride = PROP_STRIDE) {
    const gl = this.gl!;
    const mesh = this.meshes[name]!;
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.instances);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    mesh.count = data.length / stride;
    const blob = this.meshes[`blob_${name}`];
    if (blob) blob.count = mesh.count;
  }

  /** Dibuja rangos de instancias apuntando los atributos de instancia a cada rango. */
  private drawRanges(mesh: Instanced, ranges: number[], stride: number) {
    if (!ranges.length) return;
    const gl = this.gl!;
    gl.bindVertexArray(mesh.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.instances);
    const bytes = stride * 4;
    for (let i = 0; i < ranges.length; i += 2) {
      const offset = ranges[i]! * bytes;
      gl.vertexAttribPointer(ATTR.ia, 4, gl.FLOAT, false, bytes, offset);
      gl.vertexAttribPointer(ATTR.ib, 2, gl.FLOAT, false, bytes, offset + 16);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, mesh.vertexCount, ranges[i + 1]!);
    }
    gl.vertexAttribPointer(ATTR.ia, 4, gl.FLOAT, false, bytes, 0);
    gl.vertexAttribPointer(ATTR.ib, 2, gl.FLOAT, false, bytes, 16);
  }

  private compile(kind: Parameters<typeof source>[0], variant: Variant) {
    const gl = this.gl!;
    const { vertex, fragment } = source(kind, variant);
    const program = gl.createProgram()!;
    for (const [type, text] of [
      [gl.VERTEX_SHADER, vertex],
      [gl.FRAGMENT_SHADER, fragment],
    ] as const) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, text);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw Error(`Shader ${kind}/${variant}: ${gl.getShaderInfoLog(shader)}`);
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw Error(`Programa ${kind}/${variant}: ${gl.getProgramInfoLog(program)}`);
    this.programs.set(`${kind}/${variant}`, { program, uniforms: new Map() });
  }

  private use(key: string) {
    const p = this.programs.get(key)!;
    this.gl!.useProgram(p.program);
    const gl = this.gl!;
    const loc = (name: string) => {
      if (!p.uniforms.has(name)) p.uniforms.set(name, gl.getUniformLocation(p.program, name));
      return p.uniforms.get(name)!;
    };
    return {
      f: (name: string, ...v: number[]) => {
        const l = loc(name);
        if (!l) return;
        if (v.length === 1) gl.uniform1f(l, v[0]!);
        else if (v.length === 2) gl.uniform2f(l, v[0]!, v[1]!);
        else if (v.length === 3) gl.uniform3f(l, v[0]!, v[1]!, v[2]!);
        else gl.uniform4f(l, v[0]!, v[1]!, v[2]!, v[3]!);
      },
      v3: (name: string, values: number[]) => {
        const l = loc(name);
        if (l) gl.uniform3fv(l, values);
      },
      m: (name: string, value: Float32Array) => {
        const l = loc(name);
        if (l) gl.uniformMatrix4fv(l, false, value);
      },
      i: (name: string, value: number) => {
        const l = loc(name);
        if (l) gl.uniform1i(l, value);
      },
    };
  }

  private instanced(model: Float32Array, stride: number, shared?: WebGLBuffer): Instanced {
    const gl = this.gl!;
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, model, gl.STATIC_DRAW);
    const bytes = MODEL_STRIDE * 4;
    gl.enableVertexAttribArray(ATTR.pos);
    gl.vertexAttribPointer(ATTR.pos, 3, gl.FLOAT, false, bytes, 0);
    gl.enableVertexAttribArray(ATTR.normal);
    gl.vertexAttribPointer(ATTR.normal, 3, gl.FLOAT, false, bytes, 12);
    gl.enableVertexAttribArray(ATTR.color);
    gl.vertexAttribPointer(ATTR.color, 4, gl.FLOAT, false, bytes, 24);
    const instances = shared ?? gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, instances);
    if (!shared) gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(0), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(ATTR.ia);
    gl.vertexAttribPointer(ATTR.ia, 4, gl.FLOAT, false, stride * 4, 0);
    gl.vertexAttribDivisor(ATTR.ia, 1);
    gl.enableVertexAttribArray(ATTR.ib);
    gl.vertexAttribPointer(ATTR.ib, 2, gl.FLOAT, false, stride * 4, 16);
    gl.vertexAttribDivisor(ATTR.ib, 1);
    gl.bindVertexArray(null);
    return { vao, vbo, instances, vertexCount: model.length / MODEL_STRIDE, count: 0 };
  }

  onAdd(map: MapLibreMap, gl: WebGL2RenderingContext) {
    this.map = map;
    this.gl = gl;
  }

  private initialized = false;
  /** Crea programas, búferes y el mapa de sombras en el primer cuadro visible. */
  private init(gl: WebGL2RenderingContext) {
    if (this.initialized) return;
    this.initialized = true;
    for (const kind of ['building', 'mesh', 'tree', 'ground', 'glow', 'surface', 'skirt'] as const)
      this.compile(kind, 'main');
    for (const kind of ['building', 'mesh', 'tree', 'surface'] as const)
      this.compile(kind, 'shadow');
    this.compile('building', 'pick');

    // Edificios.
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer()!;
    const ibo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    const bytes = BUILDING_STRIDE * 4;
    const attr = (loc: number, size: number, offset: number) => {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, bytes, offset * 4);
    };
    attr(ATTR.pos, 3, 0);
    attr(ATTR.normal, 3, 3);
    attr(ATTR.uv, 2, 6);
    attr(ATTR.info, 4, 8);
    attr(ATTR.style, 1, 12);
    attr(ATTR.id, 1, 13);
    gl.bindVertexArray(null);
    this.building = { vao, vbo, ibo, count: 0 };

    this.meshes = {
      tree: this.instanced(treeModel(), TREE_STRIDE),
      palm: this.instanced(palmModel(), TREE_STRIDE),
      tank: this.instanced(tankModel(), PROP_STRIDE),
      rebar: this.instanced(rebarModel(), PROP_STRIDE),
      works: this.instanced(worksModel(), PROP_STRIDE),
      mototaxi: this.instanced(mototaxiModel(), PROP_STRIDE),
      moto: this.instanced(motoModel(), PROP_STRIDE),
      auto: this.instanced(carModel(), PROP_STRIDE),
      pole: this.instanced(poleModel('pole'), PROP_STRIDE),
      lamp: this.instanced(poleModel('lamp'), PROP_STRIDE),
      trafo: this.instanced(poleModel('trafo'), PROP_STRIDE),
      glow: this.instanced(glowModel(), PROP_STRIDE),
      wires: this.instanced(new Float32Array(0), PROP_STRIDE),
      person: this.instanced(personModel(), PROP_STRIDE),
    };
    // Árboles lejanos (y sus sombras) con menos polígonos, del mismo búfer de instancias.
    this.meshes.treeLow = this.instanced(treeLowModel(), TREE_STRIDE, this.meshes.tree!.instances);
    this.meshes.palmLow = this.instanced(palmLowModel(), TREE_STRIDE, this.meshes.palm!.instances);
    // Sombra suave bajo vehículos y peatones (no entran al mapa de sombras, que queda fijo).
    for (const name of ['mototaxi', 'moto', 'auto', 'person'])
      this.meshes[`blob_${name}`] = this.instanced(
        glowModel(),
        PROP_STRIDE,
        this.meshes[name]!.instances,
      );

    // Suelo: calles, veredas, plazas, lotes y sus objetos.
    {
      const vao = gl.createVertexArray()!;
      gl.bindVertexArray(vao);
      const vbo = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      const bytes = GROUND_STRIDE * 4;
      gl.enableVertexAttribArray(ATTR.pos);
      gl.vertexAttribPointer(ATTR.pos, 3, gl.FLOAT, false, bytes, 0);
      gl.enableVertexAttribArray(ATTR.normal);
      gl.vertexAttribPointer(ATTR.normal, 3, gl.FLOAT, false, bytes, 12);
      gl.enableVertexAttribArray(ATTR.color);
      gl.vertexAttribPointer(ATTR.color, 4, gl.FLOAT, false, bytes, 24);
      gl.bindVertexArray(null);
      this.surface = { vao, vbo, tables: [] };
    }
    {
      const vao = gl.createVertexArray()!;
      gl.bindVertexArray(vao);
      const vbo = gl.createBuffer()!;
      const ibo = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.enableVertexAttribArray(ATTR.pos);
      gl.vertexAttribPointer(ATTR.pos, 3, gl.FLOAT, false, 12, 0);
      gl.bindVertexArray(null);
      this.skirt = { vao, vbo, ibo };
    }

    // Cuadrado del suelo que recibe las sombras.
    this.ground = gl.createVertexArray()!;
    gl.bindVertexArray(this.ground);
    const quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(ATTR.pos);
    gl.vertexAttribPointer(ATTR.pos, 3, gl.FLOAT, false, 12, 0);
    gl.bindVertexArray(null);

    // Mapa de sombras: textura de profundidad con comparación (PCF por hardware).
    const touch = navigator.maxTouchPoints > 0;
    const size = Math.min(touch ? 2048 : 4096, gl.getParameter(gl.MAX_TEXTURE_SIZE) as number);
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.DEPTH_COMPONENT24,
      size,
      size,
      0,
      gl.DEPTH_COMPONENT,
      gl.UNSIGNED_INT,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    const fbo = gl.createFramebuffer()!;
    const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.shadow = { fbo, tex, size };
  }

  onRemove(_map: MapLibreMap, gl: WebGL2RenderingContext) {
    this.worker.terminate();
    window.clearTimeout(this.animTimer);
    for (const p of this.programs.values()) gl.deleteProgram(p.program);
    if (this.shadow) {
      gl.deleteFramebuffer(this.shadow.fbo);
      gl.deleteTexture(this.shadow.tex);
    }
  }

  rise() {
    this.riseStart = performance.now();
    this.map?.triggerRepaint();
  }
  setSelected(id: string) {
    this.selected = this.index.get(id) ?? -1;
    this.map?.triggerRepaint();
  }
  setHideSimulated(hide: boolean) {
    this.hideSimulated = hide;
    this.map?.triggerRepaint();
  }
  setTheme(theme: CityTheme) {
    this.theme = theme;
    this.map?.triggerRepaint();
  }

  /** Edificio bajo un punto de pantalla (píxeles CSS), leído de la GPU en el próximo cuadro. */
  pick(x: number, y: number) {
    return new Promise<string | null>((resolve) => {
      if (!this.ids.length) return resolve(null);
      this.pending.push({ x, y, resolve });
      this.map?.triggerRepaint();
    });
  }

  /** Matriz local (metros) -> clip y datos de cámara para este cuadro. */
  private frame(options: CustomRenderMethodInput) {
    const m = mul(options.defaultProjectionData.mainMatrix, MODEL);
    const inv = invert(m);
    let eye: [number, number, number] = [0, 0, 1000];
    if (inv) {
      const e = transform(inv, 0, 0, 1, 0);
      if (Math.abs(e[3]) > 1e-9) eye = [e[0] / e[3], e[1] / e[3], e[2] / e[3]];
    }
    const center = this.map!.getCenter();
    const c = toLocal(center.lng, center.lat);
    const dc = Math.hypot(eye[0] - c[0], eye[1] - c[1], eye[2]);
    return { matrix: new Float32Array(m), eye, center: c, dc };
  }

  prerender(gl: WebGL2RenderingContext) {
    if (!this.map) return;
    this.init(gl);
    this.flush(gl);
    if (!this.shadow || !this.building?.count) return;
    const zoom = this.map.getZoom();
    if (zoom < 14.8) {
      this.shadowReady = false;
      return;
    }
    const center = this.map.getCenter();
    const [cx, cy] = toLocal(center.lng, center.lat);
    const radius = Math.min(2400, Math.max(110, 260 * 2 ** (17 - zoom)));
    const view = lookAt(
      [cx + SUN[0] * 900, cy + SUN[1] * 900, SUN[2] * 900],
      [cx, cy, 0],
      [0, 0, 1],
    );
    let light = mul(ortho(radius, 1, 1900), view);
    // Estabiliza la sombra: la cuadrícula del mapa de sombras queda fija al mover la cámara.
    const o = transform(light, 0, 0, 0);
    const half = this.shadow.size / 2;
    const dx = Math.round(o[0] * half) / half - o[0];
    const dy = Math.round(o[1] * half) / half - o[1];
    light = mul(new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, dx, dy, 0, 1]), light);
    this.lightMatrix = new Float32Array(light);
    // Misma cámara (a nivel de texel), mismos datos y sin animación de subida: se reutiliza.
    const key = Array.from(this.lightMatrix).join(',');
    const rising = performance.now() - this.riseStart < 1400;
    if (this.shadowReady && !this.dirty && !rising && key === this.shadowKey) return;
    this.shadowKey = key;
    this.dirty = false;

    const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadow.fbo);
    gl.viewport(0, 0, this.shadow.size, this.shadow.size);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthRange(0, 1);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.colorMask(false, false, false, false);
    gl.clearDepth(1);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(2.5, 6);
    gl.disable(gl.CULL_FACE);
    this.draw(gl, 'shadow', this.lightMatrix);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.colorMask(true, true, true, true);
    gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
    this.shadowReady = true;
  }

  private draw(
    gl: WebGL2RenderingContext,
    variant: Variant,
    matrix: Float32Array,
    eye?: number[],
    fog?: number[],
    zoom = 16,
  ) {
    const rise = (performance.now() - this.riseStart) / 1000;
    const time = performance.now() / 1000;
    const main = variant === 'main';
    const common = (u: ReturnType<CityLayer['use']>) => {
      u.m('u_matrix', matrix);
      u.f('u_rise', rise);
      if (!main) return;
      u.m('u_light', this.lightMatrix);
      u.f('u_shadow_on', this.shadowReady ? 1 : 0);
      u.i('u_shadow', 0);
      u.f('u_sun', ...SUN);
      u.f('u_eye', ...(eye as [number, number, number]));
      u.f('u_night', this.theme.night);
      u.v3('u_fog_color', rgb(this.theme.fog));
      u.f('u_fog', fog![0]!, fog![1]!);
      u.f('u_saturation', this.theme.saturation);
    };
    if (main && this.shadow) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.shadow.tex);
    }
    // Solo los bloques en pantalla y antes de la niebla total (en sombra: los del sol).
    const reach = main && eye && fog ? fog[1]! * 1.05 : Infinity;
    const view = (table?: Float32Array, lod = Infinity) =>
      cull(table, matrix, main && eye ? eye : null, reach, lod);
    const elements = (ranges: number[]) => {
      for (let i = 0; i < ranges.length; i += 2)
        gl.drawElements(gl.TRIANGLES, ranges[i + 1]!, gl.UNSIGNED_INT, ranges[i]! * 4);
    };
    const arrays = (ranges: number[]) => {
      for (let i = 0; i < ranges.length; i += 2)
        gl.drawArrays(gl.TRIANGLES, ranges[i]!, ranges[i + 1]!);
    };

    // Suelo: lotes y tierra se funden con el mapa base (sin escribir profundidad); calles,
    // veredas, plazas y río son opacos; bancas, monumento, señales y puestos dan sombra.
    const ground = this.surface;
    if (ground && ground.tables.length === 4) {
      const [lots, soft, flat, cast] = ground.tables as [
        Float32Array,
        Float32Array,
        Float32Array,
        Float32Array,
      ];
      const u = this.use(`surface/${variant}`);
      common(u);
      u.f('u_time', time);
      if (main) {
        gl.bindVertexArray(ground.vao);
        gl.depthMask(false);
        arrays(view(lots).near);
        arrays(view(soft).near);
        gl.depthMask(true);
        arrays(view(flat).near);
        // Oclusión de contacto: franja oscura junto a las paredes, antes de casas y objetos.
        if (this.skirt?.chunks && zoom >= 15) {
          const k = this.use('skirt/main');
          common(k);
          gl.disable(gl.DEPTH_TEST);
          gl.depthMask(false);
          gl.bindVertexArray(this.skirt.vao);
          elements(view(this.skirt.chunks).near);
          gl.enable(gl.DEPTH_TEST);
          gl.depthMask(true);
          this.use(`surface/${variant}`);
        }
      }
      if (zoom >= 15) {
        gl.bindVertexArray(ground.vao);
        arrays(view(cast).near);
      }
    }
    // Edificios.
    if (this.building?.count) {
      const u = this.use(`building/${variant}`);
      common(u);
      if (main) {
        u.v3('u_facade', FACADE_COLORS.flatMap(rgb));
        u.v3('u_roof', ROOF_COLORS.flatMap(rgb));
        u.v3('u_sign', SIGN_COLORS.flatMap(rgb));
        u.f('u_selected', this.selected);
        u.v3('u_selection', rgb(this.theme.selection));
        u.f('u_hide_simulated', this.hideSimulated ? 1 : 0);
      }
      gl.bindVertexArray(this.building.vao);
      if (this.building.chunks) elements(view(this.building.chunks).near);
      else gl.drawElements(gl.TRIANGLES, this.building.count, gl.UNSIGNED_INT, 0);
    }
    // Objetos en losas, postes, vehículos y peatones (estos dos solo en la vista).
    const meshProgram = this.use(`mesh/${variant}`);
    common(meshProgram);
    meshProgram.f('u_time', time);
    if (main) meshProgram.v3('u_palette', VEHICLE_COLORS.flatMap(rgb));
    const vehicles = main && zoom >= 15 ? ['mototaxi', 'moto', 'auto'] : [];
    const people = main && zoom >= 16.3 ? ['person'] : [];
    const poles = zoom >= 15.5 ? ['pole', 'lamp', 'trafo'] : [];
    for (const name of ['tank', 'rebar', 'works', ...poles, ...vehicles, ...people]) {
      const mesh = this.meshes[name]!;
      if (!mesh.count) continue;
      gl.bindVertexArray(mesh.vao);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, mesh.vertexCount, mesh.count);
    }
    // Cables: líneas de un píxel (como se ven los cables de verdad a esta distancia).
    const wires = this.meshes.wires!;
    if (main && zoom >= 16 && wires.count && wires.vertexCount) {
      gl.bindVertexArray(wires.vao);
      gl.drawArraysInstanced(gl.LINES, 0, wires.vertexCount, 1);
    }
    // Árboles: detalle completo cerca, icosaedro lejos y en el mapa de sombras.
    const tree = this.use(`tree/${variant}`);
    common(tree);
    tree.f('u_time', time);
    const lod = main && fog ? fog[0]! * 0.95 : 0;
    for (const name of ['tree', 'palm']) {
      const mesh = this.meshes[name]!;
      if (!mesh.count) continue;
      tree.f('u_palm', name === 'palm' ? 1 : 0);
      const table = this.chunks[name];
      if (!table) continue;
      const { near, far } = view(table, lod);
      if (main) this.drawRanges(mesh, near, TREE_STRIDE);
      this.drawRanges(this.meshes[`${name}Low`]!, main ? far : near, TREE_STRIDE);
    }
    if (main) {
      const g = this.use('glow/main');
      common(g);
      gl.depthMask(false);
      // Luz del alumbrado público en el suelo, solo de noche (suma luz, no tapa).
      const glow = this.meshes.glow!;
      if (this.theme.night > 0 && glow.count && zoom >= 15.5) {
        g.f('u_dark', 0);
        g.f('u_blob', 7, 7, 0, 2.6);
        gl.bindVertexArray(glow.vao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, glow.vertexCount, glow.count);
      }
      g.f('u_dark', 1);
      const blobs: [string, number, number][] = [
        ['mototaxi', 1.6, 0.95],
        ['moto', 1.05, 0.42],
        ['auto', 2.5, 1.15],
        ['person', 0.42, 0.42],
      ];
      for (const [name, sx, sy] of blobs) {
        const mesh = this.meshes[`blob_${name}`]!;
        if (!mesh.count || !(vehicles.includes(name) || people.includes(name))) continue;
        g.f('u_blob', sx, sy, 0, 0);
        gl.bindVertexArray(mesh.vao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, mesh.vertexCount, mesh.count);
      }
      gl.depthMask(true);
    }
    gl.bindVertexArray(null);
  }

  render(gl: WebGL2RenderingContext, options: CustomRenderMethodInput) {
    if (!this.map) return;
    this.init(gl);
    this.flush(gl);
    if (!this.building) return;
    const zoom = this.map.getZoom();
    if (zoom < 14.6) return;
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const { matrix, eye, dc } = this.frame(options);
    const fog = [dc * 1.4, dc * 4.6];

    // Tráfico y peatones: posiciones nuevas en cada cuadro.
    if (this.traffic && zoom >= 15) {
      this.traffic.update(dt);
      (['mototaxi', 'moto', 'auto'] as const).forEach((name, i) => {
        this.setInstances(name, this.traffic!.buffers[i]!);
      });
    }
    if (this.crowd && zoom >= 16.3) {
      const center = this.map.getCenter();
      this.crowd.follow(...toLocal(center.lng, center.lat));
      this.crowd.update(dt);
      this.setInstances('person', this.crowd.buffer);
    }

    gl.disable(gl.CULL_FACE);
    // Sombra proyectada sobre el suelo (calles, patios, parques).
    if (this.shadowReady && this.ground) {
      const center = this.map.getCenter();
      const [cx, cy] = toLocal(center.lng, center.lat);
      const radius = Math.min(2400, Math.max(110, 260 * 2 ** (17 - zoom)));
      const u = this.use('ground/main');
      u.m('u_matrix', matrix);
      u.m('u_light', this.lightMatrix);
      u.f('u_shadow_on', 1);
      u.i('u_shadow', 0);
      u.f('u_eye', ...eye);
      u.f('u_fog', fog[0]!, fog[1]!);
      u.f('u_ground', cx, cy, radius * 1.5);
      u.f('u_strength', 0.62 * (1 - 0.6 * this.theme.night));
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.shadow!.tex);
      gl.depthMask(false);
      gl.bindVertexArray(this.ground);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.depthMask(true);
    }
    this.draw(gl, 'main', matrix, eye, fog, zoom);

    if (this.pending.length) this.runPicks(gl, matrix);

    // Animación (tráfico y viento) a ~30 fps mientras la ciudad esté a la vista.
    const animating = (this.traffic && zoom >= 15) || now - this.riseStart < 1300;
    if (animating && !document.hidden) {
      window.clearTimeout(this.animTimer);
      this.animTimer = window.setTimeout(() => this.map?.triggerRepaint(), 33);
    }
  }

  private runPicks(gl: WebGL2RenderingContext, matrix: Float32Array) {
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    if (!this.pickTarget || this.pickTarget.w !== w || this.pickTarget.h !== h) {
      if (this.pickTarget) {
        gl.deleteFramebuffer(this.pickTarget.fbo);
        gl.deleteRenderbuffer(this.pickTarget.color);
        gl.deleteRenderbuffer(this.pickTarget.depth);
      }
      const fbo = gl.createFramebuffer()!;
      const color = gl.createRenderbuffer()!;
      const depth = gl.createRenderbuffer()!;
      gl.bindRenderbuffer(gl.RENDERBUFFER, color);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, w, h);
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
      const prev = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
      gl.bindFramebuffer(gl.FRAMEBUFFER, prev);
      this.pickTarget = { fbo, color, depth, w, h };
    }
    const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    const viewport = gl.getParameter(gl.VIEWPORT) as Int32Array;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickTarget.fbo);
    gl.viewport(0, 0, w, h);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.depthRange(0, 1);
    const ratio = w / this.map!.getCanvas().clientWidth;
    const pixel = new Uint8Array(4);
    for (const request of this.pending.splice(0)) {
      const px = Math.floor(request.x * ratio);
      const py = Math.floor(h - request.y * ratio - 1);
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(px, py, 1, 1);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const u = this.use('building/pick');
      u.m('u_matrix', matrix);
      u.f('u_rise', 10);
      gl.bindVertexArray(this.building!.vao);
      gl.drawElements(gl.TRIANGLES, this.building!.count, gl.UNSIGNED_INT, 0);
      gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      gl.disable(gl.SCISSOR_TEST);
      const id = pixel[0]! + pixel[1]! * 256 + pixel[2]! * 65536 - 1;
      request.resolve(pixel[3] && id >= 0 ? (this.ids[id] ?? null) : null);
    }
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
    gl.viewport(viewport[0]!, viewport[1]!, viewport[2]!, viewport[3]!);
  }
}
