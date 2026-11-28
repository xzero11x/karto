"""Utilidades de la base cartográfica: lectura de capas y proyección métrica (UTM 17S)."""
import json
from pathlib import Path

import numpy as np
from pyproj import Transformer
from shapely import transform
from shapely.geometry import mapping, shape

ROOT = Path(__file__).resolve().parents[2]
EPSG_METRICO = 'EPSG:32717'  # WGS 84 / UTM 17S (Bagua, -78,5°)
_A_UTM = Transformer.from_crs('EPSG:4326', EPSG_METRICO, always_xy=True)
_A_GEO = Transformer.from_crs(EPSG_METRICO, 'EPSG:4326', always_xy=True)

# Clases de vía con calzada para vehículos (definen manzanas).
VEHICULARES = {'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'unclassified',
               'living_street', 'service', 'unknown'}
PEATONALES = {'footway', 'pedestrian', 'path', 'steps', 'cycleway'}


def _xy(fn):
    def f(coords):
        x, y = fn(coords[:, 0], coords[:, 1])
        return np.column_stack([x, y])
    return f


def a_utm(g):
    return transform(g, _xy(_A_UTM.transform))


def a_geo(g):
    return transform(g, _xy(_A_GEO.transform))


def leer_lineas(path):
    return [json.loads(l) for l in Path(path).read_text(encoding='utf8').splitlines() if l.strip()]


def leer_capa(path):
    """GeoJSON por líneas o FeatureCollection → lista de (propiedades, geometría UTM)."""
    path = Path(path)
    feats = (json.loads(path.read_text(encoding='utf8'))['features'] if path.suffix == '.geojson'
             else leer_lineas(path))
    out = []
    for f in feats:
        g = a_utm(shape(f['geometry']))
        if g.geom_type in ('Polygon', 'MultiPolygon') and not g.is_valid:
            g = g.buffer(0)
        out.append((f['properties'], g))
    return out


def escribir_lineas(path, items):
    """items: (propiedades, geometría UTM)."""
    with Path(path).open('w', encoding='utf8', newline='\n') as out:
        for props, g in items:
            out.write(json.dumps({'type': 'Feature', 'properties': props,
                                  'geometry': redondear(mapping(a_geo(g)))},
                                 ensure_ascii=False, separators=(',', ':')) + '\n')


def redondear(geom, nd=7):
    def r(c):
        if isinstance(c, (list, tuple)) and c and isinstance(c[0], (int, float)):
            return [round(c[0], nd), round(c[1], nd)]
        return [r(x) for x in c]
    return {'type': geom['type'], 'coordinates': r(geom['coordinates'])}
