"""Árboles de Bagua desde el modelo de altura de dosel de Meta y WRI (1 m, CC BY 4.0).

Lee solo la ventana de Bagua de las teselas 210012000 y 210010222 (EPSG:3857, ~1,19 m),
busca copas como máximos locales de altura >= 3 m, separa copas vecinas según su altura,
descarta puntos dentro de edificaciones y estima el radio de copa por la extensión del dosel.
Salida: data/bagua-master/ciudad/arboles.json. No modifica la base de datos.

Ejecución: docker compose -f compose.yaml -f infrastructure/compose.heights.yaml run --rm \
  heights python scripts/bagua-master/arboles.py
"""
import datetime
import json
import math
import os
import subprocess
from pathlib import Path

import numpy as np
import rasterio
from rasterio.windows import from_bounds
from shapely import STRtree, from_geojson, points

ROOT = Path(__file__).resolve().parents[2]
AMBITO = json.loads((ROOT / 'scripts/bagua-master/ambito.json').read_text())
OUT = ROOT / 'data/bagua-master/ciudad'
CACHE = ROOT / 'data/bagua-master/alturas/fuentes-adicionales'
BASE = 'https://dataforgood-fb-data.s3.amazonaws.com/forests/v1/alsgedi_global_v6_float/chm/'
TILES = ['210010222', '210012000']
SOURCE = 'Meta y World Resources Institute, High Resolution Canopy Height Maps v1 (CC BY 4.0)'
METHOD = 'maximos-locales-7px-min3m-separacion-0.35h-sin-edificios-v1'
R = 6378137.0


def to_3857(lng, lat):
    return R * math.radians(lng), R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def to_lnglat(x, y):
    return math.degrees(x / R), math.degrees(2 * math.atan(math.exp(y / R)) - math.pi / 2)


def sql(query):
    env = {**os.environ}
    if env.get('BAGUA_HEIGHTS_DIRECT_DB') == '1':
        cmd = ['psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1']
    else:
        cmd = ['docker', 'compose', 'exec', '-T', 'database', 'sh', '-c',
               'exec psql -X -qAt -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"']
    return subprocess.run(cmd, cwd=ROOT, input=query, text=True, capture_output=True,
                          check=True).stdout


def read_canopy(bounds):
    """Mosaico de las dos teselas recortado a `bounds` (EPSG:3857), en caché local."""
    CACHE.mkdir(parents=True, exist_ok=True)
    cache = CACHE / 'dosel-meta-bagua.npz'
    if cache.exists():
        data = np.load(cache)
        return data['chm'], tuple(data['transform'])
    west, south, east, north = bounds
    res = None
    parts = []
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR', GDAL_HTTP_MERGE_CONSECUTIVE_RANGES='YES',
                      CPL_VSIL_CURL_CHUNK_SIZE=str(8 * 1024 * 1024), GDAL_HTTP_TIMEOUT='120'):
        for tile in TILES:
            with rasterio.open('/vsicurl/' + BASE + tile + '.tif') as src:
                res = src.res[0]
                b = src.bounds
                top, bottom = min(north, b.top), max(south, b.bottom)
                if top <= bottom:
                    continue
                window = from_bounds(west, bottom, east, top, src.transform).round_offsets().round_lengths()
                print('Leyendo', tile, window, flush=True)
                parts.append(src.read(1, window=window))
    chm = np.vstack(parts)  # norte arriba: 210010222 está al norte de 210012000
    transform = (west, north, res)
    np.savez_compressed(cache, chm=chm, transform=np.array(transform))
    return chm, transform


def shifted_max(a, r):
    """Máximo en ventana cuadrada (2r+1) por filas y columnas, sin SciPy."""
    out = a.copy()
    for axis in (0, 1):
        src = out.copy()
        for d in range(1, r + 1):
            fwd = np.roll(src, d, axis=axis)
            bwd = np.roll(src, -d, axis=axis)
            np.maximum(out, fwd, out=out)
            np.maximum(out, bwd, out=out)
    return out


def main():
    west, south, east, north = AMBITO['ambito']['descarga_bbox']
    x0, y0 = to_3857(west, south)
    x1, y1 = to_3857(east, north)
    chm, (left, top, res) = read_canopy((x0, y0, x1, y1))
    h = chm.astype(np.float32)
    h[h > 80] = 0  # sin dato
    # Suavizado 3×3: reduce el ruido de píxel antes de buscar copas.
    s = sum(np.roll(np.roll(h, i, 0), j, 1) for i in (-1, 0, 1) for j in (-1, 0, 1)) / 9
    # Desempate reproducible: las alturas vienen en metros enteros y forman mesetas.
    s += np.random.default_rng(7).random(s.shape, dtype=np.float32) * 0.05
    peaks = (s >= shifted_max(s, 3)) & (s >= 4.0)
    peaks[:4, :] = peaks[-4:, :] = False
    peaks[:, :4] = peaks[:, -4:] = False
    rows, cols = np.nonzero(peaks)
    heights = s[rows, cols]
    print('Máximos locales', len(rows), flush=True)
    # Solo la ciudad y su borde: copas a menos de 150 m de una edificación (los cerros boscosos
    # se dibujan con la cobertura del suelo, no árbol por árbol).
    raw = sql("""SELECT ST_AsGeoJSON(geom,7) FROM bagua_master.edificio WHERE geom_valida
                 UNION ALL SELECT ST_AsGeoJSON(geom,7) FROM bagua_master.edificio_complemento;""")
    footprints = [from_geojson(line) for line in raw.splitlines() if line.strip()]
    tree = STRtree(footprints)
    xs = left + (cols + 0.5) * res
    ys = top - (rows + 0.5) * res
    lng = np.degrees(xs / R)
    lat = np.degrees(2 * np.arctan(np.exp(ys / R)) - np.pi / 2)
    pts = points(np.column_stack([lng, lat]))
    near = np.unique(tree.query(pts, predicate='dwithin', distance=0.00135)[0])
    inside = np.unique(tree.query(pts, predicate='within')[0])
    keep = np.setdiff1d(near, inside)
    rows, cols, heights, lng, lat = rows[keep], cols[keep], heights[keep], lng[keep], lat[keep]
    order = np.argsort(-heights)
    print('Candidatos en la ciudad', len(order), flush=True)
    # Separación entre copas proporcional a la altura (copas grandes no se solapan).
    cell = 3.0
    grid = {}
    kept = []
    for i in order:
        hx = float(heights[i])
        x = left + (cols[i] + 0.5) * res
        y = top - (rows[i] + 0.5) * res
        dmin = max(3.0, 0.35 * hx)
        cx, cy = int(x // cell), int(y // cell)
        reach = int(math.ceil(dmin / cell))
        ok = True
        for gx in range(cx - reach, cx + reach + 1):
            for gy in range(cy - reach, cy + reach + 1):
                for (ox, oy) in grid.get((gx, gy), ()):
                    if (ox - x) ** 2 + (oy - y) ** 2 < dmin * dmin:
                        ok = False
                        break
                if not ok:
                    break
            if not ok:
                break
        if ok:
            grid.setdefault((cx, cy), []).append((x, y))
            kept.append((i, x, y, hx))
    print('Copas', len(kept), flush=True)
    out = []
    for i, x, y, hx in kept:
        r_, c_ = rows[i], cols[i]
        win = s[max(0, r_ - 5): r_ + 6, max(0, c_ - 5): c_ + 6]
        area = float((win >= 0.6 * hx).sum()) * res * res
        radius = min(7.0, max(1.2, math.sqrt(area / math.pi)))
        out.append([round(float(lng[i]), 6), round(float(lat[i]), 6), round(hx, 1), round(radius, 1)])
    OUT.mkdir(parents=True, exist_ok=True)
    report = {
        'fuente': SOURCE,
        'teselas': TILES,
        'metodo': METHOD,
        'generado': datetime.datetime.now(datetime.UTC).isoformat(timespec='seconds'),
        'campos': ['lng', 'lat', 'altura_m', 'radio_copa_m'],
        'aviso': 'Copas detectadas por satélite (modelo de dosel). Posición y altura aproximadas; '
                 'no es un inventario de arbolado.',
        'total': len(out),
        'arboles': out,
    }
    (OUT / 'arboles.json').write_text(json.dumps(report, ensure_ascii=False, separators=(',', ':')))
    print(json.dumps({k: v for k, v in report.items() if k != 'arboles'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
