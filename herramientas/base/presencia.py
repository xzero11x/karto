"""Evidencia de edificaciones: presencia del modelo Google Open Buildings 2.5D Temporal (2023, 2 m).

Vectoriza las celdas con presencia >= 0,5 de los recortes (bandas building_height y
building_presence, EPSG:32717) y guarda polígonos con su presencia y altura medias. Se usa para
completar lotes sin huella solo donde el satélite confirma una construcción.
Corre con rasterio (imagen Docker de alturas):
  docker run --rm -v <recortes>:/r -v <karto>:/k -w /k/herramientas/base --entrypoint python \\
    bagua-webgis-heights:latest presencia.py /r bagua
"""
import glob
import json
import sys

import numpy as np
import rasterio
from rasterio.features import shapes
from shapely.geometry import mapping, shape
from shapely.ops import transform as stransform
from pyproj import Transformer

from comun import ROOT, redondear

UMBRAL = 0.5
recortes = sorted(glob.glob(f'{sys.argv[1]}/recorte-*.tif'))
ciudad = sys.argv[2] if len(sys.argv) > 2 else 'bagua'
salida = ROOT / 'datos-fuente' / ciudad / 'origen' / 'presencia_google.geojsonl'
a_geo = Transformer.from_crs('EPSG:32717', 'EPSG:4326', always_xy=True).transform
n = 0
with salida.open('w', encoding='utf8', newline='\n') as out:
    for path in recortes:
        with rasterio.open(path) as src:
            altura = src.read(1)
            pres = src.read(2)
            mask = (pres >= UMBRAL).astype('uint8')
            etiquetas = np.zeros(mask.shape, dtype='int32')
            polys = []
            for k, (geom, val) in enumerate(shapes(mask, mask=mask == 1, transform=src.transform,
                                                    connectivity=4), start=1):
                polys.append((k, geom))
            from rasterio.features import rasterize
            etiquetas = rasterize([(g, k) for k, g in polys], out_shape=mask.shape,
                                  transform=src.transform, fill=0, dtype='int32')
            cuenta = np.bincount(etiquetas.ravel())
            suma_p = np.bincount(etiquetas.ravel(), weights=pres.ravel())
            suma_h = np.bincount(etiquetas.ravel(), weights=np.nan_to_num(altura).ravel())
            for k, g in polys:
                c = max(1, cuenta[k] if k < len(cuenta) else 1)
                geom = stransform(a_geo, shape(g))
                out.write(json.dumps({'type': 'Feature', 'properties': {
                    'presencia': round(float(suma_p[k] / c), 3), 'altura_m': round(float(suma_h[k] / c), 1),
                    'celdas': int(c), 'recorte': path.split('/')[-1]},
                    'geometry': redondear(mapping(geom))}, separators=(',', ':')) + '\n')
                n += 1
print(n, 'polígonos de presencia en', salida)
