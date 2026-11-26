// Plugin de Vite para karto: publica los datos del mapa y el worker de MapLibre bajo una URL base
// (por defecto /karto/). En desarrollo los sirve desde el paquete (con soporte de rangos HTTP, que
// PMTiles necesita); al compilar los copia a la carpeta de salida.
import {
  copyFileSync,
  cpSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DATOS = fileURLToPath(new URL('./datos', import.meta.url));
const WORKER = 'maplibre-gl-worker.mjs';
const TIPOS = {
  '.pmtiles': 'application/octet-stream',
  '.pbf': 'application/x-protobuf',
  '.json': 'application/json',
  '.geojson': 'application/geo+json',
  '.mjs': 'text/javascript',
  '.txt': 'text/plain; charset=utf-8',
};

/** Worker de la versión de MapLibre instalada en el proyecto (o, si no, la de karto). */
export function rutaWorker(root = process.cwd()) {
  for (const desde of [path.join(root, 'package.json'), fileURLToPath(import.meta.url)]) {
    try {
      return createRequire(desde).resolve(`maplibre-gl/dist/${WORKER}`);
    } catch {
      // se intenta con el siguiente
    }
  }
  throw new Error('karto: no se encontró maplibre-gl. Instálalo: npm install maplibre-gl');
}

/** Ciudades disponibles en el paquete (carpetas de datos con ciudad.json). */
export function ciudadesDisponibles() {
  return readdirSync(DATOS).filter((d) => existsSync(path.join(DATOS, d, 'ciudad.json')));
}

/** Copia a `destino` las fuentes, el worker y las ciudades pedidas (todas por defecto). */
export function copiarDatos(destino, { ciudades, root } = {}) {
  const elegidas = ciudades ?? ciudadesDisponibles();
  mkdirSync(destino, { recursive: true });
  cpSync(path.join(DATOS, 'fuentes'), path.join(destino, 'fuentes'), { recursive: true });
  for (const c of elegidas) {
    if (!existsSync(path.join(DATOS, c, 'ciudad.json')))
      throw new Error(`karto: la ciudad «${c}» no existe en ${DATOS}`);
    cpSync(path.join(DATOS, c), path.join(destino, c), { recursive: true });
  }
  copyFileSync(rutaWorker(root), path.join(destino, WORKER));
  return elegidas;
}

function servir(req, res, archivo) {
  const { size } = statSync(archivo);
  const tipo = TIPOS[path.extname(archivo)] ?? 'application/octet-stream';
  res.setHeader('Content-Type', tipo);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-cache');
  const rango = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  if (rango) {
    const inicio = rango[1] ? Number(rango[1]) : Math.max(0, size - Number(rango[2]));
    const fin = rango[1] && rango[2] ? Math.min(Number(rango[2]), size - 1) : size - 1;
    if (inicio >= size || inicio > fin) {
      res.statusCode = 416;
      res.setHeader('Content-Range', `bytes */${size}`);
      return res.end();
    }
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${inicio}-${fin}/${size}`);
    res.setHeader('Content-Length', fin - inicio + 1);
    return createReadStream(archivo, { start: inicio, end: fin }).pipe(res);
  }
  res.setHeader('Content-Length', size);
  createReadStream(archivo).pipe(res);
}

/**
 * @param {{ base?: string; ciudades?: string[] }} [opciones]
 *   base: URL donde se publican los datos (por defecto /karto/; debe coincidir con la prop `datos`).
 *   ciudades: ciudades a incluir en la compilación (por defecto todas).
 */
export function karto({ base = '/karto/', ciudades } = {}) {
  const prefijo = `/${base.replace(/^\/+|\/+$/g, '')}/`;
  let config;
  return {
    name: 'karto',
    configResolved(c) {
      config = c;
    },
    configureServer(server) {
      const worker = rutaWorker(server.config.root);
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0]);
        if (!url.startsWith(prefijo)) return next();
        const relativo = url.slice(prefijo.length);
        const archivo = relativo === WORKER ? worker : path.join(DATOS, relativo);
        if (!archivo.startsWith(DATOS) && archivo !== worker) return next();
        if (!existsSync(archivo) || !statSync(archivo).isFile()) return next();
        servir(req, res, archivo);
      });
    },
    closeBundle() {
      if (config?.command !== 'build' || config.build.ssr) return;
      const destino = path.resolve(config.root, config.build.outDir, prefijo.slice(1));
      copiarDatos(destino, { ciudades, root: config.root });
    },
  };
}

export default karto;
