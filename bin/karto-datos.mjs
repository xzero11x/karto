#!/usr/bin/env node
// Copia los datos de karto a una carpeta pública, para proyectos que no usan Vite.
//   npx karto-datos public/karto            todas las ciudades
//   npx karto-datos public/karto bagua      solo las indicadas
import path from 'node:path';
import { ciudadesDisponibles, copiarDatos } from '../vite.mjs';

const [destino, ...ciudades] = process.argv.slice(2);
if (!destino) {
  console.log('Uso: karto-datos <carpeta> [ciudad…]');
  console.log(`Ciudades: ${ciudadesDisponibles().join(', ')}`);
  process.exit(1);
}
const copiadas = copiarDatos(path.resolve(destino), {
  ciudades: ciudades.length ? ciudades : undefined,
});
console.log(`karto: datos copiados en ${destino} (${copiadas.join(', ')})`);
