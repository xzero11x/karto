/// <reference lib="webworker" />
import {
  TREE_STRIDE,
  buildBuildings,
  buildPower,
  buildRoads,
  buildTrees,
  sortInstances,
  type CityBundleData,
} from './build';
import { buildGround } from './ground';

// Trabajador de la ciudad 3D: descarga el paquete, arma las mallas (ordenadas por bloques de
// 250 m) y las transfiere sin copia.
type Message = { type: 'load'; url: string; hidden: string[] } | { type: 'hide'; hidden: string[] };

let bundle: CityBundleData | null = null;
const scope = self as unknown as DedicatedWorkerGlobalScope;

function sendBuildings(hidden: string[]) {
  if (!bundle) return;
  const set = new Set(hidden);
  const b = buildBuildings(bundle, set);
  const power = buildPower(bundle, set);
  scope.postMessage({ type: 'buildings', ids: bundle.edificios.ids, ...b, power }, [
    b.vertices.buffer,
    b.indices.buffer,
    b.chunks.buffer,
    b.skirtVertices.buffer,
    b.skirtIndices.buffer,
    b.skirtChunks.buffer,
    b.tanks.buffer,
    b.rebars.buffer,
    b.works.buffer,
    power.poles.buffer,
    power.lamps.buffer,
    power.trafos.buffer,
    power.lines.buffer,
  ]);
}

scope.onmessage = async (event: MessageEvent<Message>) => {
  const message = event.data;
  try {
    if (message.type === 'load') {
      const started = performance.now();
      const response = await fetch(message.url, { credentials: 'same-origin' });
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      bundle = (await response.json()) as CityBundleData;
      const downloaded = performance.now();
      sendBuildings(message.hidden);
      const t = buildTrees(bundle);
      const satellite = t.trees.slice();
      const satellitePalms = t.palms.slice();
      const trees = sortInstances(t.trees, TREE_STRIDE);
      const palms = sortInstances(t.palms, TREE_STRIDE);
      const roads = buildRoads(bundle);
      scope.postMessage(
        {
          type: 'scene',
          trees: trees.data,
          treeChunks: trees.table,
          palms: palms.data,
          palmChunks: palms.table,
          roads,
          fuentes: bundle.fuentes ?? {},
          ms: { descarga: downloaded - started, armado: performance.now() - downloaded },
        },
        [
          trees.data.buffer,
          trees.table.buffer,
          palms.data.buffer,
          palms.table.buffer,
          roads.points.buffer,
          roads.edgeStart.buffer,
          roads.edgeCount.buffer,
          roads.edgeA.buffer,
          roads.edgeB.buffer,
          roads.edgeCode.buffer,
          roads.adjStart.buffer,
          roads.adj.buffer,
        ],
      );
      // Suelo después: la ciudad ya se ve mientras se arman calles, veredas, plazas y río.
      const ground = buildGround(bundle);
      const merged = new Float32Array(satellite.length + ground.trees.length);
      merged.set(satellite, 0);
      merged.set(ground.trees, satellite.length);
      const all = sortInstances(merged, TREE_STRIDE);
      const mergedPalms = new Float32Array(satellitePalms.length + ground.palms.length);
      mergedPalms.set(satellitePalms, 0);
      mergedPalms.set(ground.palms, satellitePalms.length);
      const allPalms = sortInstances(mergedPalms, TREE_STRIDE);
      scope.postMessage(
        {
          type: 'ground',
          vertices: ground.vertices,
          tables: ground.tables,
          walks: ground.walks,
          trees: all.data,
          treeChunks: all.table,
          palms: allPalms.data,
          palmChunks: allPalms.table,
          stats: ground.stats,
        },
        [
          ground.vertices.buffer,
          ...ground.tables.map((table) => table.buffer),
          ground.walks.points.buffer,
          ground.walks.index.buffer,
          all.data.buffer,
          all.table.buffer,
          allPalms.data.buffer,
          allPalms.table.buffer,
        ],
      );
    } else if (message.type === 'hide') sendBuildings(message.hidden);
  } catch (error) {
    scope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
