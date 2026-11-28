// Genera datos/<ciudad>/ciudad3d.json desde la base PostGIS de webgis-residuos (rama main, con los
// datos de data/bagua-master importados). Se corre dentro del contenedor backend, que ya tiene
// `pg` y la conexión (variables PG*). Ver herramientas/ciudad3d/LEEME.md.
import pg from 'pg';
import { writeFileSync } from 'node:fs';
import { buildCityBundle } from './paquete.ts';

const dataDir = process.argv[2] ?? '/tmp/kcity';
const pool = new pg.Pool();
const bundle = await buildCityBundle(pool, dataDir);
writeFileSync(`${dataDir}/ciudad3d.json`, bundle.raw);
console.log(`ciudad3d.json: ${bundle.raw.length} bytes (${bundle.gzip.length} comprimido)`);
await pool.end();
