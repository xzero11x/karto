/*
 * Colores de la ciudad 3D y su equivalente 2D. El techo de cada edificio sale de los dos
 * primeros caracteres hexadecimales de su id (256 casillas), así la huella 2D (teselas) y el
 * volumen 3D coinciden. Reparto según el Censo 2017 (INEI) para las 6 230 viviendas urbanas
 * ocupadas de Bagua: planchas de calamina, fibrocemento o similares 67,3 %, concreto armado
 * 29,3 %, y pocos techos de teja, madera, caña o estera. La categoría censal junta calamina y
 * fibrocemento, así que se reparten entre ambos.
 */

/**
 * Techos: 0 calamina, 1 calamina oxidada, 2 teja, 3 losa, 4 calamina azul, 5 losa clara,
 * 6 calamina roja, 7 fibrocemento, 8 caña o estera.
 */
export const ROOF_COLORS = [
  '#8b9396', // calamina galvanizada, opaca por el sol y el polvo
  '#9a5a3d', // calamina oxidada
  '#b65a3a', // teja de arcilla
  '#9f9685', // losa de concreto con manchas
  '#4f7f9c', // calamina pintada de azul
  '#a9583f', // losa con impermeabilizante rojo óxido
  '#a2402f', // calamina pintada de rojo
  '#a6a296', // fibrocemento
  '#a88d5e', // caña o estera
];
export const ROOF_LABELS = [
  'Calamina',
  'Calamina oxidada',
  'Teja',
  'Concreto armado',
  'Calamina pintada',
  'Concreto impermeabilizado',
  'Calamina roja',
  'Fibrocemento',
  'Caña o estera',
];
/** Techos ondulados (calamina y fibrocemento): se pueden inclinar a una o dos aguas. */
export const CORRUGATED = new Set([0, 1, 4, 6, 7]);
/** Techos de concreto armado (losas): llevan tanque, fierros y muros de material noble. */
export const SLAB = new Set([3, 5]);
/** Casillas por tipo de techo (suman 256): 173 ondulados (67,6 %), 75 losas (29,3 %), 8 otros. */
const ROOF_SHARES: [number, number][] = [
  [0, 58],
  [1, 30],
  [4, 30],
  [6, 25],
  [7, 30],
  [3, 51],
  [5, 24],
  [2, 4],
  [8, 4],
];
export const ROOF_BY_BUCKET: number[] = (() => {
  const table: number[] = [];
  // Intercalado: casillas vecinas no comparten tipo, así ningún techo se agrupa por id.
  const left = ROOF_SHARES.map(([roof, n]) => ({ roof, n }));
  while (table.length < 256) {
    for (const item of left)
      if (item.n > 0) {
        table.push(item.roof);
        item.n--;
      }
  }
  return table.slice(0, 256);
})();

/** Fachadas pintadas (índice 0 = ladrillo, se usa solo para el material ladrillo). */
export const FACADE_COLORS = [
  '#c06a42', // ladrillo artesanal de Bagua, naranja
  '#ecdcb8', // crema
  '#e8bd57', // amarillo
  '#cf7653', // terracota
  '#ec9a7c', // salmón
  '#86c0dc', // celeste
  '#93d1a8', // verde agua
  '#c9d76a', // verde limón
  '#f2eee5', // blanco
  '#44aeb0', // turquesa
  '#e996b0', // rosado
  '#5fc4aa', // 11 comisaría PNP: verde menta con franjas verde oscuro
  '#1f63b4', // 12 EsSalud: azul con franjas blancas
  '#f0b323', // 13 iglesia: amarillo con pilastras blancas
  '#f2f0ea', // 14 institucional: blanco con franja azul
  '#2f6f9f', // 15 municipalidad: muro cortina al centro, alas crema con bandas azules
];
/** Colores de fachada que se reparten al azar entre las viviendas (1 a 10). */
export const FACADE_RANDOM = 10;

/** Letreros de tienda y toldos: colores vivos de comercio de barrio. */
export const SIGN_COLORS = ['#d7263d', '#f4c430', '#1b75bc', '#2a9d4b', '#f26b1d', '#ffffff'];

/** Pintura de vehículos: mototaxis con toldo de color, motos y autos. */
export const VEHICLE_COLORS = [
  '#c62828',
  '#1565c0',
  '#f9a825',
  '#2e7d32',
  '#f5f5f5',
  '#9e9e9e',
  '#212121',
  '#ef6c00',
];

export function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const bucket = (id: string) => {
  const v = parseInt(id.slice(0, 2), 16);
  return Number.isNaN(v) || id.length < 2 ? hash(id) % 256 : v;
};
export const roofIndex = (id: string) => ROOF_BY_BUCKET[bucket(id)]!;

/** Expresión MapLibre equivalente a `roofIndex`, para colorear huellas 2D con el mismo techo. */
export const roofColorExpression = (colors: readonly string[] = ROOF_COLORS) => {
  const groups: string[][] = colors.map(() => []);
  ROOF_BY_BUCKET.forEach((roof, b) => groups[roof]!.push(b.toString(16).padStart(2, '0')));
  return [
    'match',
    ['downcase', ['slice', ['to-string', ['get', 'id']], 0, 2]],
    ...groups.flatMap((chars, i) => (chars.length ? [chars, colors[i]!] : [])),
    colors[3]!,
  ];
};

export const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
