"""Genera las teselas de una ciudad (datos/<ciudad>/teselas.pmtiles) desde datos-fuente/<ciudad>/.

Usa la imagen Docker de herramientas/tiles.Dockerfile: tippecanoe 2.79.0 crea un MBTiles dentro
del contenedor y go-pmtiles 1.31.2 lo convierte a PMTiles. Solo necesita Python 3 y Docker.
Las capas vacías (p. ej. partes de edificio) no se teselan: su ausencia consta en el manifiesto.

Uso:
  docker build -f herramientas/tiles.Dockerfile -t bagua-master-tiles:2.79.0 herramientas
  python herramientas/generar_teselas.py bagua
"""
import datetime
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CIUDAD = sys.argv[1] if len(sys.argv) > 1 else 'bagua'
IN_DIR = ROOT / 'datos-fuente' / CIUDAD
CONFIG = IN_DIR / 'ambito.json'
OUT_DIR = ROOT / 'datos' / CIUDAD
IMAGE = 'bagua-master-tiles:2.79.0'
LAYERS = ['red_vial', 'calles_rotulo', 'conectores', 'edificios', 'usos_suelo', 'agua', 'terreno', 'lugares', 'partes_edificio']


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1 << 20), b''):
            digest.update(block)
    return digest.hexdigest()


def main():
    cfg = json.loads(CONFIG.read_text(encoding='utf8'))
    zmin, zmax = cfg['teselas']['zoom_minimo'], cfg['teselas']['zoom_maximo']
    name = 'teselas.pmtiles'
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    present = [l for l in LAYERS if (IN_DIR / f'{l}.geojsonl').exists() and (IN_DIR / f'{l}.geojsonl').stat().st_size > 0]
    absent = [l for l in LAYERS if l not in present]
    if 'calles_rotulo' not in present:
        raise SystemExit('Falta calles_rotulo.geojsonl en datos-fuente/<ciudad>: sin esa capa el mapa no dibujaría '
                         'los nombres de las calles.')
    layer_args = ' '.join(f'-L {l}:/work/in/{l}.geojsonl' for l in present)
    attribution = f"Overture Maps Foundation {cfg['overture']['version']}"
    script = (
        f'tippecanoe --force --quiet -o /tmp/bagua-master.mbtiles -n "BAGUA MASTER" -A "{attribution}" '
        f'-Z{zmin} -z{zmax} --no-feature-limit --no-tile-size-limit {layer_args} '
        f'&& pmtiles convert /tmp/bagua-master.mbtiles /work/out/{name}.tmp '
        f'&& mv /work/out/{name}.tmp /work/out/{name} '
        f'&& tippecanoe --version 2>&1 | head -1 && pmtiles version 2>&1 | head -1'
    )
    result = subprocess.run(
        ['docker', 'run', '--rm', '--entrypoint', 'sh',
         '-v', f'{IN_DIR.as_posix()}:/work/in:ro', '-v', f'{OUT_DIR.as_posix()}:/work/out',
         IMAGE, '-c', script],
        capture_output=True, text=True, check=False,
    )
    if result.returncode != 0:
        raise SystemExit(f'Fallo al generar teselas:\n{result.stdout}\n{result.stderr}')
    lines = (result.stdout + result.stderr).splitlines()
    # tippecanoe avisa de que no codifica los id de texto como id de entidad: el id Overture va en la propiedad 'id'.
    versions = [l.strip() for l in lines if l.startswith('tippecanoe v') or l.startswith('pmtiles ')]
    output = OUT_DIR / name
    inputs = {l: sha256(IN_DIR / f'{l}.geojsonl') for l in present}
    manifest = {
        'archivo': name,
        'bytes': output.stat().st_size,
        'sha256': sha256(output),
        'zoom': [zmin, zmax],
        'capas': present,
        'capas_vacias_no_teseladas': absent,
        'entradas_sha256': inputs,
        'herramientas': versions,
        'nota_id': 'El id Overture de cada elemento se conserva como propiedad id (tippecanoe no admite id de texto como id de entidad).',
        'imagen': IMAGE,
        'atribucion': attribution,
        'generado_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
    }
    (IN_DIR / 'teselas-manifiesto.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf8')
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
