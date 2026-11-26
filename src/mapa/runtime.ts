// MapLibre y el protocolo PMTiles se cargan bajo demanda y se registran una sola vez.
let pmtilesRegistered = false;
let workerSet = false;

/** Carga MapLibre, fija su worker (la primera vez) y registra el protocolo pmtiles://. */
export async function loadMapRuntime(workerUrl: string) {
  const [maplibre, pmtiles] = await Promise.all([import('maplibre-gl'), import('pmtiles')]);
  if (!workerSet) {
    maplibre.setWorkerUrl(workerUrl);
    workerSet = true;
  }
  if (!pmtilesRegistered) {
    maplibre.addProtocol('pmtiles', new pmtiles.Protocol().tile);
    pmtilesRegistered = true;
  }
  return maplibre;
}
