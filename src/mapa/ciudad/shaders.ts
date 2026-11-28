/*
 * Shaders de la ciudad 3D (WebGL2, GLSL ES 3.0). Cada malla tiene tres variantes:
 *   main   color con luz de cielo y suelo, sol con sombras (mapa de sombras PCF), brillo y niebla
 *   shadow solo profundidad, vista desde el sol
 *   pick   (edificios) índice codificado en color para seleccionar con el clic
 */
export type Variant = 'main' | 'shadow' | 'pick';

/** Ubicaciones fijas: todas las variantes comparten el mismo VAO. */
export const ATTR = {
  pos: 0,
  normal: 1,
  uv: 2,
  info: 3,
  style: 4,
  id: 5,
  color: 2,
  ia: 6,
  ib: 7,
} as const;

const HEAD = `#version 300 es
precision highp float;
precision highp int;
`;

const LIGHTING = `
uniform highp sampler2DShadow u_shadow;
uniform mat4 u_light;
uniform float u_shadow_on;
uniform vec3 u_sun;
uniform vec3 u_eye;
uniform float u_night;
uniform vec3 u_fog_color;
uniform vec2 u_fog;
uniform float u_saturation;

float hash1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float rect(vec2 p, vec2 lo, vec2 hi, vec2 aa) {
  vec2 a = smoothstep(lo - aa, lo + aa, p) * (1.0 - smoothstep(hi - aa, hi + aa, p));
  return a.x * a.y;
}
float lines(float x, float period, float w, float aa) {
  float d = abs(fract(x / period + 0.5) - 0.5) * period;
  return 1.0 - smoothstep(w - aa, w + aa, d);
}
float shadowAt(vec3 p, vec3 n) {
  if (u_shadow_on < 0.5) return 1.0;
  vec4 lp = u_light * vec4(p + n * 0.08, 1.0);
  vec3 c = lp.xyz / lp.w * 0.5 + 0.5;
  if (c.x <= 0.0 || c.y <= 0.0 || c.x >= 1.0 || c.y >= 1.0 || c.z >= 1.0) return 1.0;
  vec2 texel = 1.0 / vec2(textureSize(u_shadow, 0));
  float s = 0.0;
  for (int i = -1; i <= 1; i++)
    for (int j = -1; j <= 1; j++)
      s += texture(u_shadow, vec3(c.xy + vec2(float(i), float(j)) * texel * 1.2, c.z - 0.0006));
  s /= 9.0;
  vec2 edge = smoothstep(vec2(0.0), vec2(0.08), c.xy) * smoothstep(vec2(0.0), vec2(0.08), 1.0 - c.xy);
  return mix(1.0, s, edge.x * edge.y);
}
vec3 lit(vec3 albedo, vec3 n, vec3 p, float ao, float gloss) {
  float sh = shadowAt(p, n);
  float ndl = max(dot(n, u_sun), 0.0);
  vec3 sunC = mix(vec3(1.0, 0.95, 0.86), vec3(0.32, 0.38, 0.58), u_night);
  vec3 skyC = mix(vec3(0.6, 0.72, 0.88), vec3(0.26, 0.32, 0.5), u_night);
  vec3 grdC = mix(vec3(0.58, 0.48, 0.37), vec3(0.12, 0.11, 0.14), u_night);
  vec3 amb = mix(grdC, skyC, n.z * 0.5 + 0.5) * ao;
  vec3 col = albedo * (amb * 0.56 + sunC * ndl * sh * mix(0.86, 0.35, u_night));
  vec3 v = normalize(u_eye - p);
  vec3 h = normalize(v + u_sun);
  col += sunC * pow(max(dot(n, h), 0.0), 64.0) * gloss * sh * (1.0 - u_night);
  return col;
}
vec3 finish(vec3 col, vec3 p) {
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  // Color vivo de día (sol de Bagua); de noche se apaga.
  col = mix(vec3(l), col, u_saturation * mix(1.15, 1.0, u_night));
  float f = smoothstep(u_fog.x, u_fog.y, distance(u_eye, p));
  return mix(col, u_fog_color, f * 0.72);
}
`;

// ---------------------------------------------------------------- edificios
const BUILDING_VS = `
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;
layout(location = 3) in vec4 a_info;
layout(location = 4) in float a_style;
layout(location = 5) in float a_id;
uniform mat4 u_matrix;
uniform float u_rise;
out vec3 v_pos;
out vec3 v_normal;
out vec2 v_uv;
out vec4 v_info;
flat out float v_style;
flat out float v_id;
void main() {
  // Cada edificio sube desde el suelo con un desfase propio: la ciudad se levanta en ~1 s.
  float t = clamp((u_rise - a_info.w * 0.4) / 0.6, 0.0, 1.0);
  float grow = 1.0 - pow(1.0 - t, 3.0);
  vec3 p = vec3(a_pos.xy, a_pos.z * grow);
  v_pos = p;
  v_normal = a_normal;
  v_uv = abs(a_normal.z) < 0.5 ? vec2(a_uv.x, a_uv.y * grow) : a_uv;
  v_info = a_info;
  v_style = a_style;
  v_id = a_id;
  gl_Position = u_matrix * vec4(p, 1.0);
}`;

const BUILDING_FS = `
in vec3 v_pos;
in vec3 v_normal;
in vec2 v_uv;
in vec4 v_info;
flat in float v_style;
flat in float v_id;
uniform vec3 u_facade[16];
uniform vec3 u_roof[9];
uniform vec3 u_sign[6];
uniform float u_selected;
uniform vec3 u_selection;
uniform float u_hide_simulated;
out vec4 fragColor;

vec3 glass(vec3 n, vec3 p, float seed, float litW, out float gloss) {
  vec3 v = normalize(u_eye - p);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 tint = seed < 0.3 ? vec3(0.1, 0.22, 0.34) : seed < 0.5 ? vec3(0.12, 0.27, 0.22) : seed < 0.68 ? vec3(0.26, 0.19, 0.12) : vec3(0.16, 0.22, 0.28);
  vec3 day = mix(tint, vec3(0.6, 0.76, 0.92), clamp(fres * 0.9 + seed * 0.2, 0.0, 1.0));
  vec3 warm = mix(vec3(1.0, 0.78, 0.45), vec3(0.62, 0.78, 1.0), step(0.8, seed));
  vec3 night = mix(vec3(0.04, 0.05, 0.08), warm, litW);
  gloss = 1.6 * (1.0 - u_night);
  return mix(day, night, u_night);
}

void main() {
  float st = v_style;
  float facade = mod(st, 16.0);
  int material = int(mod(floor(st / 16.0), 8.0));
  int roofI = int(mod(floor(st / 128.0), 16.0));
  float flags = floor(st / 2048.0);
  bool simulated = mod(flags, 2.0) > 0.5;
  bool unfinished = mod(floor(flags / 2.0), 2.0) > 0.5;
  bool shop = mod(floor(flags / 4.0), 2.0) > 0.5;
  bool upper = mod(floor(flags / 8.0), 2.0) > 0.5;
  bool meter = mod(floor(flags / 16.0), 2.0) > 0.5;
  bool earth = mod(floor(flags / 32.0), 2.0) > 0.5;
  bool front = mod(floor(flags / 64.0), 2.0) > 0.5;
  if (u_hide_simulated > 0.5 && simulated) discard;
  vec3 n = normalize(v_normal);
  bool roof = n.z > 0.5;
  vec2 aa = max(fwidth(v_uv), vec2(1e-4));
  float px = max(aa.x, aa.y);
  float detail = 1.0 - smoothstep(0.14, 0.42, px);
  float fine = 1.0 - smoothstep(0.035, 0.09, px);
  float seed = v_info.w;
  vec3 color;
  float gloss = 0.0;
  float emissive = 0.0;
  float ao = 1.0;

  if (roof) {
    color = u_roof[roofI];
    vec2 r = v_uv;
    if (roofI == 7) {
      // Fibrocemento: ondas anchas de 0,18 m, planchas de 1,1 × 2,4 m y líquenes.
      vec2 sheet = floor(r / vec2(1.1, 2.4));
      color *= 0.9 + 0.1 * sin(r.x * 34.9) * fine;
      color *= 0.92 + 0.1 * hash1(sheet + seed * 17.0) * detail;
      color = mix(color, vec3(0.48, 0.5, 0.42), 0.35 * smoothstep(0.6, 1.0, hash1(floor(r / 0.7) + seed)) * detail);
      color *= 1.0 - 0.08 * lines(r.y, 2.4, 0.03, aa.y) * detail;
    } else if (roofI == 8) {
      // Caña o estera: fibras trenzadas.
      float weave = step(0.5, fract(floor(r.x / 0.12) * 0.5 + floor(r.y / 0.12) * 0.5));
      color *= 0.82 + 0.22 * weave * fine + 0.08 * hash1(floor(r / 0.6) + seed) * detail;
    } else if (roofI == 0 || roofI == 1 || roofI == 4 || roofI == 6) {
      // Calamina: ondas cada 0,18 m, planchas de 0,9 × 1,8 m de distinto desgaste.
      vec2 sheet = floor(r / vec2(0.9, 1.8));
      color *= 0.9 + 0.12 * hash1(sheet + seed * 31.0) * detail;
      if (roofI == 1) color = mix(color, color * vec3(0.78, 0.62, 0.5), 0.55 * hash1(sheet * 1.7 + 3.0));
      color *= 0.92 + 0.08 * sin(r.x * 34.9) * fine;
      color *= 1.0 - 0.1 * lines(r.y, 1.8, 0.03, aa.y) * detail;
      gloss = roofI == 0 ? 0.55 : 0.25;
    } else if (roofI == 2) {
      float row = floor(r.y / 0.32);
      color *= 0.86 + 0.14 * smoothstep(0.0, 0.32, mod(r.y, 0.32)) * fine;
      color *= 1.0 - 0.12 * lines(r.x + mod(row, 2.0) * 0.11, 0.22, 0.012, aa.x) * fine;
      color *= 0.92 + 0.12 * hash1(vec2(floor((r.x + mod(row, 2.0) * 0.11) / 0.22), row)) * fine;
    } else {
      // Losa: paños, juntas y manchas de humedad.
      color *= 0.95 + 0.07 * hash1(floor(v_pos.xy / 2.5)) * detail;
      color *= 1.0 - 0.07 * max(lines(r.x, 2.5, 0.02, aa.x), lines(r.y, 2.5, 0.02, aa.y)) * detail;
      float stain = smoothstep(0.62, 0.95, hash1(floor(v_pos.xy / 1.4) + seed * 7.0)) * detail;
      color = mix(color, color * vec3(0.72, 0.76, 0.7), stain * 0.6);
    }
  } else {
    float len = v_info.x;
    float eave = v_info.y;
    float floors = v_info.z;
    float u = v_uv.x;
    float v = v_uv.y;
    float fh = max(2.4, (eave - 0.1) / floors);
    float fl = min(floor(v / fh), floors - 1.0);
    float fv = v - fl * fh;
    int mat = material;
    if (unfinished && fl >= 1.0) mat = 1;
    color = u_facade[int(facade)];
    if (mat == 1) {
      color = u_facade[0];
      float row = floor(v / 0.2);
      float off = mod(row, 2.0) * 0.12;
      float mortar = max(lines(v, 0.2, 0.012, aa.y), lines(u + off, 0.24, 0.012, aa.x));
      color *= 0.9 + 0.16 * hash1(vec2(floor((u + off) / 0.24), row) + seed) * fine;
      color = mix(color, vec3(0.78, 0.72, 0.64), mortar * 0.7 * fine);
      // Columnas cada ~3,5 m, en las esquinas y viga de concreto en cada piso.
      float colW = 0.25;
      float ccount = max(1.0, floor(len / 3.5 + 0.5));
      float cpos = abs(fract(u / (len / ccount) + 0.5) - 0.5) * (len / ccount);
      float column = 1.0 - smoothstep(colW - aa.x, colW + aa.x, min(cpos, min(u, len - u)));
      float beam = 1.0 - smoothstep(0.28 - aa.y, 0.28 + aa.y, fv);
      vec3 concreteC = vec3(0.64, 0.62, 0.58) * (0.92 + 0.1 * hash1(floor(vec2(u, v) / 0.6) + seed));
      color = mix(color, concreteC, max(column, beam * step(0.5, fl + float(unfinished))) * detail);
    } else if (mat == 2) {
      // Madera: tablas verticales de 0,2 m con vetas.
      float plank = floor(u / 0.2);
      color = vec3(0.47, 0.32, 0.2) * (0.82 + 0.25 * hash1(vec2(plank, seed * 9.0)));
      color *= 1.0 - 0.35 * lines(u, 0.2, 0.012, aa.x) * fine;
      color *= 0.95 + 0.05 * sin(v * 23.0 + plank * 3.0) * fine;
    } else if (mat == 3) {
      // Adobe con revoque de barro.
      color = vec3(0.71, 0.55, 0.4) * (0.9 + 0.14 * hash1(floor(vec2(u, v) / 0.35) + seed));
      color *= 1.0 - 0.1 * max(lines(v, 0.42, 0.015, aa.y), lines(u + mod(floor(v / 0.42), 2.0) * 0.3, 0.6, 0.015, aa.x)) * fine;
    } else if (mat == 4) {
      color = vec3(0.68, 0.67, 0.64) * (0.94 + 0.08 * hash1(floor(vec2(u / 1.2, v / 0.6)) + seed));
      color *= 1.0 - 0.08 * lines(v, 0.6, 0.012, aa.y) * fine;
    } else if (mat == 5) {
      // Quincha: caña y barro entre pies derechos de madera.
      color = vec3(0.72, 0.59, 0.45) * (0.9 + 0.12 * hash1(floor(vec2(u, v) / 0.3) + seed));
      color = mix(color, vec3(0.4, 0.28, 0.18), lines(u, 1.2, 0.06, aa.x) * fine);
      color = mix(color, vec3(0.4, 0.28, 0.18), lines(v, 2.6, 0.05, aa.y) * fine);
    } else if (mat == 6) {
      // Calamina como pared: ondas verticales y óxido abajo.
      color = vec3(0.6, 0.63, 0.65) * (0.9 + 0.1 * sin(u * 34.9) * fine);
      color = mix(color, vec3(0.55, 0.33, 0.22), 0.5 * (1.0 - smoothstep(0.0, 1.2, v)));
    } else if (mat == 7) {
      // Estera de caña tejida sobre parantes.
      float weave = step(0.5, fract(floor(u / 0.1) * 0.5 + floor(v / 0.1) * 0.5));
      color = vec3(0.68, 0.56, 0.36) * (0.82 + 0.2 * weave * fine);
      color = mix(color, vec3(0.38, 0.27, 0.17), lines(u, 1.5, 0.05, aa.x) * fine);
    } else {
      // Revoque pintado con zócalo oscuro y desgaste.
      color = mix(color * 0.72, color, smoothstep(0.42 - aa.y, 0.42 + aa.y, v));
      color *= 0.95 + 0.06 * hash1(floor(vec2(u, v) / 0.8) + seed) * detail;
      // Sobre adobe el tarrajeo se cuartea y deja ver el barro en parches.
      if (earth) {
        float crack = smoothstep(0.78, 0.92, hash1(floor(vec2(u / 0.9, v / 0.6)) + seed * 3.0));
        crack *= 1.0 - smoothstep(0.6, 2.2, v) * 0.6;
        color = mix(color, vec3(0.66, 0.54, 0.4), crack * detail);
      }
    }
    // Iglesia: pilastras en las esquinas, zócalo y cornisa blancos.
    if (facade > 12.5 && facade < 13.5) {
      float pil = 1.0 - smoothstep(0.5 - aa.x, 0.5 + aa.x, min(u, len - u));
      float mid = lines(u, max(3.5, len / max(1.0, floor(len / 4.0))), 0.18, aa.x);
      float corn = step(eave - 0.75, v) * step(v, eave);
      float base = 1.0 - smoothstep(0.7 - aa.y, 0.7 + aa.y, v);
      color = mix(color, vec3(0.96, 0.95, 0.91), max(max(pil, mid), max(corn, base)) * detail);
    }
    // Institucional (hospital, clínica): franja azul bajo las ventanas de cada piso.
    if (facade > 13.5 && facade < 14.5)
      color = mix(color, vec3(0.13, 0.36, 0.64), (step(0.5, fv) - step(0.8, fv)) * detail);
    // Chorreado bajo la cornisa y suciedad junto al suelo.
    color *= 1.0 - 0.1 * smoothstep(0.3, 0.0, eave - v) * detail;
    color *= 1.0 - 0.12 * (1.0 - smoothstep(0.0, 0.6, v)) * (0.5 + 0.5 * hash1(vec2(floor(u / 0.5), seed)));
    // Losa entre pisos y cornisa.
    if (fl >= 1.0) color *= 1.0 - 0.2 * (1.0 - smoothstep(0.14 - aa.y, 0.14 + aa.y, fv)) * detail;
    color *= 1.0 - 0.16 * smoothstep(eave - 0.2 - aa.y, eave - 0.2 + aa.y, v) * step(v, eave) * detail;
    float cells = max(1.0, floor(len / 2.8));
    float cw = len / cells;
    float ci = floor(u / cw);
    float cu = u - ci * cw;
    float r = hash1(vec2(ci + seed * 97.0, fl + seed * 13.0));
    float litW = step(0.5, hash1(vec2(ci * 3.1 + seed * 41.0, fl)));
    bool curtain = facade > 14.5 && facade < 15.5;
    if (curtain && !upper) {
      float lw = step(0.5, hash1(vec2(floor(u / 1.5), fl + seed)));
      float gg;
      vec3 g = glass(n, v_pos, 0.12, lw, gg);
      float centro = step(len * 0.32, u) * step(u, len * 0.68);
      vec3 cielo = mix(g, vec3(0.6, 0.73, 0.84), 0.6 * (1.0 - u_night));
      if (centro > 0.5 && fl >= 0.5) {
        // Muro cortina: vidrio claro que refleja el cielo, paños de 1,5 m con perfiles de aluminio.
        float mull = max(lines(u, 1.5, 0.05, aa.x), lines(fv, fh, 0.1, aa.y));
        color = mix(cielo, vec3(0.82, 0.84, 0.86), mull * fine);
        gloss = max(gloss, gg);
        emissive += lw * u_night * 0.8;
      } else {
        // Alas crema con ventana corrida azul por piso y columna azul en la esquina.
        color = vec3(0.93, 0.85, 0.62) * (0.96 + 0.05 * hash1(floor(vec2(u, v) / 0.9) + seed));
        float banda = (step(1.05, fv) - step(1.85, fv)) * step(0.5, fl);
        color = mix(color, mix(vec3(0.22, 0.42, 0.7), g, 0.4), banda);
        gloss = max(gloss, gg * banda);
        emissive += banda * lw * u_night * 0.7;
        float columna = 1.0 - smoothstep(1.6 - aa.x, 1.6 + aa.x, u);
        color = mix(color, vec3(0.12, 0.34, 0.7), columna);
      }
      // Columnas azules que enmarcan el muro cortina, de piso a techo.
      float marco = (1.0 - smoothstep(0.7 - aa.x, 0.7 + aa.x, abs(u - len * 0.32))) +
                    (1.0 - smoothstep(0.7 - aa.x, 0.7 + aa.x, abs(u - len * 0.68)));
      color = mix(color, vec3(0.12, 0.34, 0.7), clamp(marco, 0.0, 1.0));
      // Planta baja: ingreso con pórtico gris y cornisa blanca arriba.
      if (fl < 0.5) color = mix(vec3(0.62, 0.62, 0.6), g, step(0.5, fract(u / 3.0)) * step(fv, 2.3));
      color = mix(color, vec3(0.96, 0.96, 0.94), step(eave - 0.45, v) * step(v, eave));
    }
    // Hospital EsSalud (Héroes del Cenepa, fotografías 2025-2026): azul con franjas blancas.
    if (facade > 11.5 && facade < 12.5 && !upper) {
      float losa = 1.0 - smoothstep(0.3 - aa.y, 0.3 + aa.y, fv);
      color = mix(color, vec3(0.96, 0.96, 0.95), losa * step(0.5, fl) * detail);
      color = mix(color, vec3(0.96, 0.96, 0.95), step(eave - 0.6, v) * step(v, eave));
    }
    // Comisaría PNP: verde menta con franjas verde oscuro en cada losa y letrero blanco.
    if (facade > 10.5 && facade < 11.5 && !upper) {
      float losa = 1.0 - smoothstep(0.32 - aa.y, 0.32 + aa.y, fv);
      color = mix(color, vec3(0.1, 0.42, 0.32), losa * step(0.5, fl) * detail);
      float letrero = (step(2.45, v) - step(3.05, v));
      color = mix(color, vec3(0.97, 0.97, 0.95), letrero * detail);
      color = mix(color, vec3(0.1, 0.42, 0.32), (1.0 - smoothstep(0.55 - aa.y, 0.55 + aa.y, v)) * detail);
    }
    bool templo = facade > 12.5 && facade < 13.5;
    if (templo && !upper && len >= 4.0) {
      float paso = len / max(1.0, floor(len / 4.0));
      float cx = mod(u, paso) - paso * 0.5;
      float arco = length(vec2(cx, (v - 5.4) * 1.0));
      float ventana = step(abs(cx), 0.5) * step(2.4, v) * step(v, 5.4) + step(arco, 0.5) * step(5.4, v);
      vec3 vitral = mix(vec3(0.24, 0.3, 0.42), vec3(0.95, 0.78, 0.45), u_night * 0.8);
      color = mix(color, vitral, clamp(ventana, 0.0, 1.0) * detail);
      emissive += clamp(ventana, 0.0, 1.0) * detail * u_night * 0.6;
    }
    if (!templo && !curtain && !upper && len >= 1.5 && v < eave - 0.15) {
      vec2 q = vec2(cu - cw * 0.5, fv);
      if (fl < 0.5 && shop && cw > 2.3 && r < 0.6) {
        // Tienda: persiana metálica y letrero de color encima.
        float w = min(cw - 0.5, 2.6) * 0.5;
        float m = rect(q, vec2(-w, 0.0), vec2(w, 2.3), aa);
        vec3 shutter = vec3(0.58, 0.6, 0.63) * (0.86 + 0.14 * lines(fv, 0.09, 0.022, aa.y));
        float open = step(0.45, hash1(vec2(ci, seed * 5.0)));
        shutter = mix(shutter, vec3(0.18, 0.16, 0.14) + vec3(0.9, 0.75, 0.45) * 0.5 * u_night, open * step(fv, 2.1));
        color = mix(color, shutter, m * detail);
        float sign = rect(q, vec2(-w, 2.36), vec2(w, 2.68), aa);
        vec3 sc = u_sign[int(mod(floor(seed * 13.0 + ci), 6.0))];
        color = mix(color, sc, sign * detail);
        emissive += sign * detail * 0.6 + m * open * detail * 0.7;
        gloss = max(gloss, 0.3 * m);
      } else if (fl < 0.5 && r < 0.42) {
        float frame = rect(q, vec2(-0.56, 0.0), vec2(0.56, 2.22), aa);
        float door = rect(q, vec2(-0.46, 0.0), vec2(0.46, 2.13), aa);
        color = mix(color, vec3(0.88, 0.86, 0.82), frame * detail);
        vec3 wood = mix(vec3(0.34, 0.21, 0.13), vec3(0.18, 0.32, 0.42), step(0.75, r));
        color = mix(color, wood * (0.9 + 0.1 * lines(q.x, 0.3, 0.012, aa.x)), door * detail);
      } else {
        float w = min(cw * 0.27, fl < 0.5 ? 0.62 : 0.74);
        float frame = rect(q, vec2(-w - 0.07, 0.83), vec2(w + 0.07, 2.27), aa);
        float pane = rect(q, vec2(-w, 0.9), vec2(w, 2.2), aa);
        float sill = rect(q, vec2(-w - 0.12, 0.78), vec2(w + 0.12, 0.88), aa);
        vec3 frameColor = mod(floor(seed * 7.0), 2.0) < 0.5 ? vec3(0.76, 0.77, 0.78) : vec3(0.22, 0.2, 0.18);
        color = mix(color, frameColor, frame * detail);
        float gg;
        vec3 g = glass(n, v_pos, r, litW, gg);
        float mullion = max(lines(q.x, w * 2.0, 0.025, aa.x), lines(fv - 1.55, 10.0, 0.025, aa.y));
        g = mix(g, frameColor, mullion * fine);
        if (fl < 0.5) g = mix(g, vec3(0.1), lines(q.x, 0.13, 0.012, aa.x) * fine);
        // Cortina corrida en algunas ventanas.
        g = mix(g, mix(vec3(0.85, 0.8, 0.7), vec3(0.95, 0.75, 0.45), u_night), step(0.7, r) * 0.7);
        color = mix(color, g, pane * detail);
        gloss = max(gloss, gg * pane * detail);
        emissive += pane * detail * litW * u_night;
        color = mix(color, vec3(0.86, 0.84, 0.8), sill * detail);
      }
    }
    // Medidor de luz con su acometida y caja de agua en la fachada principal.
    if (front && meter && !upper && len > 2.0) {
      float mx = 0.35 + seed * 0.4;
      vec2 mq = vec2(u - mx, v);
      float box = rect(mq, vec2(0.0, 1.35), vec2(0.32, 1.78), aa);
      float dial = rect(mq, vec2(0.06, 1.55), vec2(0.26, 1.7), aa);
      float cable = rect(mq, vec2(0.14, 1.78), vec2(0.18, min(eave, 3.2)), aa);
      color = mix(color, vec3(0.62, 0.64, 0.66), box * fine);
      color = mix(color, vec3(0.12, 0.13, 0.14), (dial + cable) * fine);
      float water = rect(vec2(u - mx - 0.6, v), vec2(0.0, 0.0), vec2(0.3, 0.22), aa) * step(0.3, seed);
      color = mix(color, vec3(0.13, 0.2, 0.32), water * fine);
    }
    // De lejos las ventanas no se distinguen: de noche queda su brillo promedio.
    if (!upper && v < eave - 0.15 && len >= 1.5)
      emissive += (1.0 - detail) * 0.22 * u_night * step(0.9, mod(v, fh));
    // Oclusión ambiental: pie del muro y esquinas.
    ao *= mix(0.62, 1.0, smoothstep(0.0, 2.0, v));
    ao *= mix(0.82, 1.0, smoothstep(0.0, 0.5, min(u, len - u)));
  }

#if defined(PICK)
  float id = v_id + 1.0;
  fragColor = vec4(mod(id, 256.0), mod(floor(id / 256.0), 256.0), floor(id / 65536.0), 255.0) / 255.0;
#else
  vec3 col = lit(color, n, v_pos, ao, gloss);
  col += mix(color, vec3(1.0, 0.82, 0.52), 0.55) * emissive * (0.95 * u_night + 0.08);
  if (abs(v_id - u_selected) < 0.5) col = mix(col, u_selection, 0.5);
  fragColor = vec4(finish(col, v_pos), 1.0);
#endif
}`;

// ---------------------------------------------------------------- objetos y vehículos
const MESH_VS = `
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec4 a_color;
layout(location = 6) in vec4 i_a;
layout(location = 7) in vec2 i_b;
uniform mat4 u_matrix;
uniform float u_rise;
uniform float u_time;
out vec3 v_pos;
out vec3 v_normal;
out vec3 v_color;
flat out float v_flag;
flat out float v_paint;
void main() {
  float c = cos(i_b.x);
  float s = sin(i_b.x);
  vec3 ap = a_pos;
  float part = a_color.a;
  if (part > 6.5 && part < 10.5) {
    // 7 y 8 piernas, 9 y 10 brazos: giran en la cadera o el hombro mientras la persona camina.
    float walking = step(8.0, i_b.y);
    float phase = u_time * 7.2 + fract(sin(dot(i_a.xy, vec2(12.9898, 78.233))) * 43758.5453) * 6.2832;
    float side = (part < 7.5 || part > 9.5) ? 1.0 : -1.0;
    float swing = sin(phase) * (part < 8.5 ? 0.42 : 0.3) * side * walking;
    float pivot = part < 8.5 ? 0.86 : 1.36;
    vec2 r = vec2(ap.x, ap.z - pivot);
    ap.x = cos(swing) * r.x + sin(swing) * r.y;
    ap.z = -sin(swing) * r.x + cos(swing) * r.y + pivot;
  }
  vec3 p = ap * i_a.w;
  p = vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z * clamp(u_rise / 0.8, 0.0, 1.0));
  p += i_a.xyz;
  v_pos = p;
  v_normal = vec3(c * a_normal.x - s * a_normal.y, s * a_normal.x + c * a_normal.y, a_normal.z);
  v_color = a_color.rgb;
  v_flag = a_color.a;
  v_paint = mod(i_b.y, 8.0);
  gl_Position = u_matrix * vec4(p, 1.0);
}`;

const MESH_FS = `
in vec3 v_pos;
in vec3 v_normal;
in vec3 v_color;
flat in float v_flag;
flat in float v_paint;
uniform vec3 u_palette[8];
out vec4 fragColor;
void main() {
  vec3 n = normalize(v_normal);
  vec3 color = v_color;
  float gloss = 0.15;
  float emissive = 0.0;
  int flag = int(v_flag + 0.5);
  if (flag == 1) { color = u_palette[int(v_paint)]; gloss = 0.7; }
  else if (flag == 4) color = u_palette[int(mod(v_paint + 3.0, 8.0))] * 0.9;
  else if (flag == 3) { color = vec3(0.2, 0.27, 0.33); gloss = 1.4; }
  else if (flag == 2) { emissive = 0.3 + 2.2 * u_night; }
  else if (flag == 5) { emissive = 0.2 + 1.4 * u_night; }
  vec3 col = lit(color, n, v_pos, 1.0, gloss * (1.0 - u_night));
  col += color * emissive;
  fragColor = vec4(finish(col, v_pos), 1.0);
}`;

// ---------------------------------------------------------------- árboles
const TREE_VS = `
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec4 a_color;
layout(location = 6) in vec4 i_a;
layout(location = 7) in vec2 i_b;
uniform mat4 u_matrix;
uniform float u_palm;
uniform float u_time;
uniform float u_rise;
out vec3 v_pos;
out vec3 v_normal;
out vec3 v_local;
flat out float v_part;
flat out float v_seed;
flat out float v_kind;
void main() {
  float h = i_a.z;
  float r = clamp(i_a.w, 1.2, 7.5);
  float seed = i_b.x;
  float part = a_color.a;
  vec3 p;
  vec3 n = a_normal;
  if (u_palm < 0.5) {
    float trunkH = h * 0.42;
    if (part < 0.5) {
      float tr = clamp(h * 0.03, 0.14, 0.5);
      p = vec3(a_pos.xy * tr * (1.15 - 0.3 * a_pos.z), a_pos.z * (trunkH + r * 0.35));
    } else {
      float cz = max((h - trunkH) * 0.55, r * 0.6);
      vec3 q = a_pos;
      float bump = 0.14 * sin(dot(q, vec3(4.1, 3.3, 5.2)) + seed * 40.0)
                 + 0.09 * sin(dot(q, vec3(-7.3, 6.1, 2.9)) + seed * 17.0);
      q *= 1.0 + bump;
      p = vec3(q.xy * r, q.z * cz + h - cz);
      n = normalize(vec3(a_normal.xy / r, a_normal.z / cz) + 0.0001);
    }
  } else {
    float trunkH = h * 0.88;
    float lean = (seed - 0.5) * 0.12;
    if (part < 0.5) {
      p = vec3(a_pos.xy * 0.18 * (1.2 - 0.4 * a_pos.z), a_pos.z * trunkH);
      p.x += lean * p.z;
    } else {
      p = vec3(a_pos.xy * r * 1.2, a_pos.z * r + trunkH);
      p.x += lean * trunkH;
    }
  }
  // Viento: la copa se mece un poco, más arriba que abajo.
  float sway = sin(u_time * 1.4 + seed * 20.0) * 0.012 * p.z * step(0.5, part);
  p.x += sway;
  p.y += sway * 0.6;
  float g = clamp((u_rise - seed * 0.4) / 0.6, 0.0, 1.0);
  g = 1.0 - pow(1.0 - g, 3.0);
  p *= vec3(mix(0.4, 1.0, g), mix(0.4, 1.0, g), g);
  float ang = seed * 6.2831;
  float c = cos(ang);
  float s = sin(ang);
  v_local = a_pos;
  p = vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z) + vec3(i_a.xy, 0.0);
  v_normal = vec3(c * n.x - s * n.y, s * n.x + c * n.y, n.z);
  v_pos = p;
  v_part = part;
  v_seed = seed;
  v_kind = i_b.y;
  gl_Position = u_matrix * vec4(p, 1.0);
}`;

const TREE_FS = `
in vec3 v_pos;
in vec3 v_normal;
in vec3 v_local;
flat in float v_part;
flat in float v_seed;
flat in float v_kind;
uniform float u_palm;
out vec4 fragColor;
void main() {
  vec3 n = normalize(v_normal);
  vec3 color;
  float ao = 1.0;
  if (v_part < 0.5) {
    color = u_palm > 0.5 ? vec3(0.52, 0.46, 0.38) : vec3(0.36, 0.27, 0.2);
    color *= 0.9 + 0.1 * sin(v_pos.z * 9.0);
  } else if (v_part > 1.5) {
    color = mix(vec3(0.3, 0.5, 0.2), vec3(0.45, 0.6, 0.25), v_seed);
    if (!gl_FrontFacing) n = -n;
    n = normalize(vec3(n.xy, abs(n.z) + 0.3));
  } else {
    // Copa: verdes variados y algunos árboles en flor (flamboyán, tahuarí, tulipán).
    // Bagua (bosque seco del Marañón): mango y ficus de verde oscuro y denso, algarrobo y
    // faique de verde oliva, y copas más secas y amarillentas.
    vec3 g1 = vec3(0.18, 0.33, 0.14);
    vec3 g2 = vec3(0.3, 0.44, 0.18);
    vec3 g3 = vec3(0.4, 0.45, 0.23);
    vec3 g4 = vec3(0.5, 0.51, 0.27);
    float k = fract(v_seed * 7.13);
    color = k < 0.25 ? g1 : k < 0.5 ? g2 : k < 0.75 ? g3 : g4;
    if (v_kind > 0.5) {
      float f = fract(v_seed * 13.7);
      vec3 bloom = f < 0.45 ? vec3(0.86, 0.26, 0.16) : f < 0.75 ? vec3(0.95, 0.74, 0.18) : vec3(0.82, 0.42, 0.72);
      color = mix(color, bloom, 0.75);
    }
    float clump = hash1(floor(v_local.xy * 3.0 + v_local.z * 2.0) + v_seed * 11.0);
    color *= 0.82 + 0.3 * clump;
    ao = mix(0.5, 1.05, smoothstep(-0.7, 0.8, v_local.z));
  }
  vec3 col = lit(color, n, v_pos, ao, 0.0);
  fragColor = vec4(finish(col, v_pos), 1.0);
}`;

// ---------------------------------------------------------------- sombra sobre el suelo
const GROUND_VS = `
layout(location = 0) in vec3 a_pos;
uniform mat4 u_matrix;
uniform vec3 u_ground;
out vec3 v_pos;
void main() {
  v_pos = vec3(u_ground.xy + a_pos.xy * u_ground.z, 0.06);
  gl_Position = u_matrix * vec4(v_pos, 1.0);
}`;

const GROUND_FS = `
in vec3 v_pos;
uniform float u_strength;
out vec4 fragColor;
void main() {
  float s = shadowAt(v_pos, vec3(0.0, 0.0, 1.0));
  float fog = smoothstep(u_fog.x, u_fog.y, distance(u_eye, v_pos));
  float a = (1.0 - s) * u_strength * (1.0 - fog);
  fragColor = vec4(vec3(0.02, 0.04, 0.12) * a, a);
}`;

const GLOW_VS = `
layout(location = 0) in vec3 a_pos;
layout(location = 6) in vec4 i_a;
layout(location = 7) in vec2 i_b;
uniform mat4 u_matrix;
uniform vec4 u_blob;
out vec2 v_local;
out vec3 v_pos;
void main() {
  float c = cos(i_b.x);
  float s = sin(i_b.x);
  vec2 q = a_pos.xy * u_blob.xy + u_blob.zw;
  v_local = a_pos.xy;
  v_pos = vec3(i_a.xy + vec2(c * q.x - s * q.y, s * q.x + c * q.y), i_a.z + 0.12);
  gl_Position = u_matrix * vec4(v_pos, 1.0);
}`;

const GLOW_FS = `
in vec2 v_local;
in vec3 v_pos;
uniform float u_dark;
out vec4 fragColor;
void main() {
  float d = length(v_local);
  float fog = smoothstep(u_fog.x, u_fog.y, distance(u_eye, v_pos));
  if (u_dark > 0.5) {
    float a = pow(max(0.0, 1.0 - d), 1.5) * 0.5 * (1.0 - 0.5 * u_night) * (1.0 - fog);
    fragColor = vec4(0.0, 0.0, 0.0, a);
    return;
  }
  float f = pow(max(0.0, 1.0 - d), 2.0) * u_night;
  fragColor = vec4(vec3(1.0, 0.78, 0.45) * f * 0.55 * (1.0 - fog), 0.0);
}`;

// ---------------------------------------------------------------- suelo (ground.ts)
const SURFACE_VS = `
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec4 a_surf;
uniform mat4 u_matrix;
out vec3 v_pos;
out vec3 v_normal;
out vec3 v_q;
flat out float v_kind;
void main() {
  v_pos = a_pos;
  v_normal = a_normal;
  v_q = a_surf.yzw;
  v_kind = a_surf.x;
  gl_Position = u_matrix * vec4(a_pos, 1.0);
}`;

const SURFACE_FS = `
in vec3 v_pos;
in vec3 v_normal;
in vec3 v_q;
flat in float v_kind;
uniform float u_time;
out vec4 fragColor;

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash1(i), hash1(i + vec2(1.0, 0.0)), f.x),
             mix(hash1(i + vec2(0.0, 1.0)), hash1(i + vec2(1.0, 1.0)), f.x), f.y);
}
float mark(float d, float lw, float px) { return 1.0 - smoothstep(lw, lw + px, abs(d)); }

void main() {
  vec3 n = normalize(v_normal);
  vec2 w = v_pos.xy;
  float px = max(length(fwidth(w)), 1e-4);
  float fine = 1.0 - smoothstep(0.04, 0.2, px);
  float detail = 1.0 - smoothstep(0.25, 2.0, px);
  int k = int(v_kind + 0.5);
  float u = v_q.x;
  float v = v_q.y;
  float q = v_q.z;
  vec3 color = vec3(0.6);
  float gloss = 0.0;
  float emissive = 0.0;
  float alpha = 1.0;

  if (k >= 100) {
    // Objetos (bancas, monumento, señales, puestos, buses, barandas) con su color.
    color = v_q;
    int flag = k - 100;
    if (flag == 2) emissive = 0.3 + 2.2 * u_night;
    else if (flag == 5) emissive = 0.2 + 1.4 * u_night;
    else if (flag == 3) gloss = 1.4;
    else if (flag == 6) gloss = 0.9;
  } else if (k == 0) {
    // Lotes y patios: tierra, césped, patios de cemento y vegetación seca según el sector.
    float zone = u;
    float n1 = vnoise(w / 16.0);
    float n2 = vnoise(w / 3.5 + 7.3);
    float n3 = vnoise(w / 55.0 + 3.1);
    vec3 soil = mix(vec3(0.72, 0.57, 0.4), vec3(0.63, 0.43, 0.29), n3);
    soil *= 0.9 + 0.16 * n2 * detail;
    float patio = (1.0 - smoothstep(0.1, 0.45, zone)) * smoothstep(0.42, 0.58, n1);
    float green = smoothstep(0.52, 0.7, n1 * 0.75 + n2 * 0.25 + 0.08 - zone * 0.18) * (1.0 - 0.45 * zone);
    float dry = smoothstep(0.45, 0.7, n3 * 0.6 + n2 * 0.4) * smoothstep(0.35, 0.9, zone);
    color = soil;
    color = mix(color, vec3(0.7, 0.69, 0.66) * (0.94 + 0.08 * n2), patio * 0.8);
    color = mix(color, mix(vec3(0.36, 0.5, 0.22), vec3(0.5, 0.6, 0.3), n2), green * 0.88);
    color = mix(color, mix(vec3(0.62, 0.56, 0.36), vec3(0.5, 0.48, 0.3), n2), dry * 0.75);
    color *= 1.0 - 0.12 * step(0.94, hash1(floor(w * 4.0))) * fine;
    alpha = smoothstep(0.25, 0.65, v + (vnoise(w / 7.0) - 0.5) * 0.5);
  } else if (k == 1 && q > 0.5) {
    // Pavimento de concreto (calles y avenidas de Bagua): paños de 4,5 m con juntas, junta
    // longitudinal al centro y huellas de rodadura un poco más oscuras.
    color = vec3(0.67, 0.66, 0.63) * (0.93 + 0.07 * vnoise(w * 1.3) * detail + 0.05 * vnoise(w / 7.0));
    float panio = floor(u / 4.5);
    color *= 0.97 + 0.05 * hash1(vec2(panio, sign(v)));
    color = mix(color, vec3(0.42, 0.42, 0.41), max(lines(u, 4.5, 0.012, px), 1.0 - smoothstep(0.01, 0.03, abs(v))) * fine * 0.8);
    color *= 1.0 - 0.07 * (1.0 - smoothstep(0.3, 0.9, abs(abs(v) - 1.6)));
    color = mix(color, color * 0.85, smoothstep(0.78, 0.84, vnoise(w / 4.0 + 7.0)) * detail);
    gloss = 0.05;
  } else if (k == 1) {
    // Asfalto (carretera): agregado, parches, huellas de rodadura más claras.
    color = vec3(0.3, 0.31, 0.32) * (0.9 + 0.12 * vnoise(w * 1.7) * detail + 0.08 * vnoise(w / 9.0));
    color *= 1.0 + 0.14 * (hash1(floor(w * 14.0)) - 0.5) * fine;
    color = mix(color, color * 0.8, smoothstep(0.74, 0.8, vnoise(w / 5.0 + 13.0)) * detail);
    color *= 1.0 + 0.06 * (1.0 - smoothstep(0.3, 1.0, abs(abs(v) - 1.7)));
    gloss = 0.12;
  } else if (k == 2) {
    // Calle de tierra o afirmado: huellas, piedras, charcos y hierba en los bordes.
    color = mix(vec3(0.7, 0.55, 0.39), vec3(0.6, 0.43, 0.3), vnoise(w / 3.0));
    color *= 0.88 + 0.18 * vnoise(w * 2.3) * detail;
    float rut = 1.0 - smoothstep(0.15, 0.45, abs(abs(v) - 0.9));
    color *= 1.0 - 0.13 * rut;
    color = mix(color, vec3(0.72, 0.7, 0.64), step(0.94, hash1(floor(w * 5.0))) * fine * 0.6);
    color = mix(color, vec3(0.46, 0.5, 0.29), smoothstep(2.0, 2.9, abs(v)) * vnoise(w / 1.3) * 0.7);
    float puddle = smoothstep(0.8, 0.84, vnoise(w / 4.0 + 41.0)) * rut;
    color = mix(color, vec3(0.32, 0.3, 0.26), puddle * 0.75);
    gloss = puddle * 1.5;
    float edge = abs(v) + (vnoise(w / 2.2) - 0.5) * 1.1;
    alpha = 1.0 - smoothstep(q - 0.7, q + 0.45, edge);
  } else if (k == 3) {
    // Vereda de concreto con juntas cada 1,5 m y sardinel más claro junto a la pista.
    color = vec3(0.73, 0.72, 0.68) * (0.93 + 0.08 * vnoise(w * 1.5) * detail);
    color *= 1.0 - 0.2 * lines(u, 1.5, 0.012, px) * fine;
    color = mix(color, vec3(0.82, 0.81, 0.77), 1.0 - smoothstep(0.14, 0.16, v - q));
    color *= 1.0 - 0.1 * smoothstep(0.7, 0.9, vnoise(w / 2.0 + 5.0)) * detail;
  } else if (k == 4) {
    // Cara del sardinel: concreto, o pintado de amarillo en el centro.
    color = q > 0.5 ? vec3(0.9, 0.74, 0.18) : vec3(0.75, 0.74, 0.7);
    color *= 0.92 + 0.08 * vnoise(vec2(u * 2.0, v * 9.0));
  } else if (k == 5) {
    // Césped de jardines y bermas: matas, desgaste y flores en plazas y parques.
    color = mix(vec3(0.33, 0.5, 0.2), vec3(0.46, 0.6, 0.27), vnoise(w / 2.5));
    color *= 0.84 + 0.26 * vnoise(w * 4.0) * detail;
    color = mix(color, vec3(0.56, 0.48, 0.36), smoothstep(0.76, 0.86, vnoise(w / 5.0 + 9.0)) * 0.5);
    if (q > 0.5) {
      float f = step(0.965, hash1(floor(w * 3.0))) * fine;
      color = mix(color, mix(vec3(0.9, 0.3, 0.35), vec3(0.95, 0.8, 0.3), hash1(floor(w * 3.0) + 2.0)), f);
    }
  } else if (k == 6 || k == 7) {
    // Losetas de plaza (6) o camino de cemento (7), con sardinel de jardín en los bordes.
    vec2 t = (q > 900.0 ? w : vec2(u, v)) / 0.5;
    if (k == 6) {
      vec2 g8 = floor(w / 4.0);
      float marco = max(lines(w.x, 4.0, 0.22, px * 2.0), lines(w.y, 4.0, 0.22, px * 2.0));
      float grecas = step(0.5, fract((g8.x + g8.y) * 0.5)) * max(lines(w.x + w.y, 2.0, 0.12, px * 2.0),
                                                                 lines(w.x - w.y, 2.0, 0.12, px * 2.0));
      color = vec3(0.88, 0.88, 0.86) * (0.96 + 0.04 * vnoise(w * 2.0));
      color = mix(color, vec3(0.38, 0.4, 0.43), max(marco, grecas * 0.85) * (0.4 + 0.6 * detail));
      color *= 1.0 - 0.18 * (lines(t.x, 1.0, 0.03, px * 2.0) + lines(t.y, 1.0, 0.03, px * 2.0)) * fine;
    } else {
      color = vec3(0.74, 0.73, 0.69) * (0.94 + 0.08 * vnoise(w * 1.3) * detail);
      color *= 1.0 - 0.18 * lines(u, 2.0, 0.012, px) * fine;
    }
    color *= 0.95 + 0.06 * vnoise(w * 0.7);
    if (q < 900.0) color = mix(color, vec3(0.84, 0.83, 0.79), smoothstep(q - 0.2 - px, q - 0.2 + px, abs(v)));
  } else if (k == 8 || k == 9) {
    // Cancha de césped con franjas de corte (8) o losa deportiva pintada (9), con sus líneas.
    float hw = floor(q / 1000.0);
    float hl = q - hw * 1000.0;
    float lx = hl - 1.0;
    float ly = hw - 1.0;
    float sc = clamp(ly / 34.0, 0.25, 1.0);
    float lw = max(0.06, px * 0.45);
    vec2 a = vec2(abs(u), abs(v));
    float bx = 16.5 * sc;
    float by = min(20.16 * sc, ly);
    float L = mark(a.x - lx, lw, px) * step(a.y, ly + lw)
            + mark(a.y - ly, lw, px) * step(a.x, lx + lw)
            + mark(u, lw, px) * step(a.y, ly)
            + mark(length(vec2(u, v)) - 9.15 * sc, lw, px)
            + mark(a.x - (lx - bx), lw, px) * step(a.y, by)
            + mark(a.y - by, lw, px) * step(lx - bx, a.x) * step(a.x, lx);
    if (k == 8) {
      color = vec3(0.29, 0.53, 0.21) * (0.92 + 0.1 * step(0.5, fract(u / (5.0 * sc))));
      color *= 0.92 + 0.12 * vnoise(w * 1.5) * detail;
      color = mix(color, vec3(0.55, 0.47, 0.34), smoothstep(0.72, 0.86, vnoise(w / 4.0 + 3.0)) * 0.35);
    } else {
      float inField = step(a.x, lx) * step(a.y, ly);
      float hue = hash1(vec2(floor(hl * 10.0), floor(hw * 10.0)));
      vec3 paint = hue < 0.35 ? vec3(0.27, 0.48, 0.4) : hue < 0.65 ? vec3(0.3, 0.42, 0.58) : vec3(0.62, 0.36, 0.3);
      color = mix(vec3(0.66, 0.65, 0.62), paint, inField * 0.85);
      color *= 0.93 + 0.08 * vnoise(w * 1.2) * detail;
    }
    color = mix(color, vec3(0.94), clamp(L, 0.0, 1.0) * (0.35 + 0.55 * detail));
  } else if (k == 10) {
    // Agua de piscina con carriles y reflejos que se mueven.
    color = vec3(0.1, 0.5, 0.63) * (0.9 + 0.15 * vnoise(w * 1.6 + vec2(u_time * 0.4, u_time * 0.3)) * detail);
    color = mix(color, vec3(0.06, 0.25, 0.45), lines(v, 2.5, 0.12, px) * 0.6 * detail);
    gloss = 2.0;
  } else if (k == 11) {
    // Tierra compactada (estadio, cementerio) con matas.
    color = mix(vec3(0.7, 0.55, 0.39), vec3(0.62, 0.45, 0.32), vnoise(w / 6.0));
    color *= 0.88 + 0.16 * vnoise(w * 2.0) * detail;
    color = mix(color, vec3(0.5, 0.53, 0.32), smoothstep(0.7, 0.85, vnoise(w / 3.0 + 4.0)) * 0.5);
  } else if (k == 12) {
    // Losa de concreto (patios, andenes) con juntas y manchas; borde claro de piscina.
    color = vec3(0.7, 0.69, 0.66) * (0.93 + 0.08 * vnoise(w * 1.1) * detail);
    color *= 1.0 - 0.16 * (lines(w.x, 3.0, 0.015, px) + lines(w.y, 3.0, 0.015, px)) * fine;
    color = mix(color, color * 0.75, smoothstep(0.78, 0.84, vnoise(w / 3.0 + 21.0)) * 0.6 * (1.0 - q));
    if (q > 0.5) color = vec3(0.86, 0.86, 0.83) * (0.95 + 0.05 * vnoise(w * 2.0));
  } else if (k == 14) {
    // Paso de cebra: franjas de 0,5 m.
    if (lines(v, 1.0, 0.25, px) * (0.4 + 0.6 * detail) < 0.5) discard;
    color = vec3(0.9, 0.9, 0.86) * (0.88 + 0.12 * vnoise(w * 3.0));
  } else if (k == 17 || k == 18) {
    // Río: agua turbia que corre a lo largo del cauce, con brillo de cielo y sol. En el cauce
    // dibujado desde el eje (18), orillas de grava irregulares que se funden con el suelo.
    vec2 dir = normalize(vec2(u, v) + 1e-5);
    vec2 f = vec2(dot(w, dir), dot(w, vec2(-dir.y, dir.x)));
    float shore = 0.0;
    if (k == 18) {
      dir = vec2(1.0, 0.0);
      f = vec2(u, v);
      float edge = abs(v) + (vnoise(vec2(u * 0.035, v > 0.0 ? 1.0 : 7.0)) - 0.5) * 9.0;
      shore = smoothstep(q - 8.5, q - 6.0, edge);
      alpha = 1.0 - smoothstep(q - 3.0, q, edge);
    }
    float t = u_time;
    float n1 = vnoise(vec2(f.x * 0.05 - t * 0.22, f.y * 0.16));
    float n2 = vnoise(vec2(f.x * 0.4 - t * 1.1, f.y * 0.9) + 17.0);
    float n3 = vnoise(vec2(f.x * 1.3 - t * 1.6, f.y * 2.1) + 5.0);
    // Más hondo y verdoso al centro del cauce, más claro y terroso hacia la orilla.
    float deep = k == 18 ? 1.0 - smoothstep(2.0, q - 7.0, abs(v)) : 0.7;
    color = mix(vec3(0.58, 0.48, 0.35), vec3(0.4, 0.35, 0.25), deep);
    color *= 0.9 + 0.2 * n1;
    vec2 g = vec2(n2 - 0.5, n3 - 0.5) * (0.25 + 0.2 * detail);
    n = normalize(vec3(g.x * dir + g.y * vec2(-dir.y, dir.x), 1.0));
    vec3 view = normalize(u_eye - v_pos);
    float fres = pow(1.0 - max(dot(n, view), 0.0), 3.0);
    color = mix(color, mix(vec3(0.6, 0.72, 0.84), vec3(0.1, 0.13, 0.22), u_night), 0.12 + fres * 0.45);
    color += vec3(0.05) * smoothstep(0.62, 0.9, n2 * n3 * 1.8) * detail * (1.0 - u_night);
    gloss = 2.6 * (1.0 - shore);
    if (shore > 0.0) {
      vec3 gravel = mix(vec3(0.66, 0.6, 0.5), vec3(0.55, 0.47, 0.38), vnoise(w * 0.7));
      gravel *= 0.85 + 0.25 * hash1(floor(w * 6.0)) * fine + 0.1 * vnoise(w * 3.0) * detail;
      gravel = mix(gravel, vec3(0.45, 0.5, 0.3), smoothstep(0.6, 0.85, vnoise(w / 3.0 + 9.0)) * 0.6);
      color = mix(color, gravel, shore);
      n = normalize(mix(n, vec3(0.0, 0.0, 1.0), shore));
    }
  } else if (k == 15) {
    // Línea central amarilla discontinua (3 m pintado, 3 m libre).
    if (fract(u / 6.0) < 0.5) discard;
    color = vec3(0.88, 0.72, 0.2);
  }
  vec3 col = lit(color, n, v_pos, 1.0, gloss * (1.0 - u_night));
  col += color * emissive;
  col = finish(col, v_pos);
  fragColor = vec4(col * alpha, alpha);
}`;

const SKIRT_VS = `
layout(location = 0) in vec3 a_pos;
uniform mat4 u_matrix;
out float v_a;
out vec3 v_pos;
void main() {
  v_a = a_pos.z;
  v_pos = vec3(a_pos.xy, 0.1);
  gl_Position = u_matrix * vec4(v_pos, 1.0);
}`;

const SKIRT_FS = `
in float v_a;
in vec3 v_pos;
out vec4 fragColor;
void main() {
  float fog = smoothstep(u_fog.x, u_fog.y, distance(u_eye, v_pos));
  float a = v_a * v_a * 0.4 * (1.0 - fog) * (1.0 - 0.45 * u_night);
  fragColor = vec4(0.0, 0.0, 0.0, a);
}`;

const EMPTY_FS = `
out vec4 fragColor;
void main() { fragColor = vec4(1.0); }`;

export function source(
  kind: 'building' | 'mesh' | 'tree' | 'ground' | 'glow' | 'surface' | 'skirt',
  variant: Variant,
) {
  const vs = {
    building: BUILDING_VS,
    mesh: MESH_VS,
    tree: TREE_VS,
    ground: GROUND_VS,
    glow: GLOW_VS,
    surface: SURFACE_VS,
    skirt: SKIRT_VS,
  }[kind];
  const fs = {
    building: BUILDING_FS,
    mesh: MESH_FS,
    tree: TREE_FS,
    ground: GROUND_FS,
    glow: GLOW_FS,
    surface: SURFACE_FS,
    skirt: SKIRT_FS,
  }[kind];
  const define = variant === 'pick' ? '#define PICK\n' : '';
  return {
    vertex: HEAD + define + vs,
    fragment: HEAD + define + (variant === 'shadow' ? EMPTY_FS : LIGHTING + fs),
  };
}
