"""Vista previa en PNG de la base, antes y después de corregir, a escala real (0,25 m/px).

Rojo: parte de un edificio que cae en la vía. Corre con rasterio (imagen Docker de alturas):
  docker run --rm -v <karto>:/k -w /k/herramientas/base --entrypoint python \\
    bagua-webgis-heights:latest vista_previa.py salida_dir
"""
import json
import sys
from pathlib import Path

import numpy as np
import rasterio
from rasterio.features import rasterize
from rasterio.transform import from_origin
from shapely import Point
from shapely.ops import unary_union

from comun import ROOT, VEHICULARES, a_utm, leer_capa

F = ROOT / 'datos-fuente' / 'bagua'
D = ROOT / 'datos' / 'bagua'
O = F / 'origen'
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp')
RES = 0.25
ZONAS = {
    'plaza-de-armas': (-78.53169, -5.63914, 320),
    'heroes-del-cenepa': (-78.5286, -5.6418, 320),
    'manzanas-centro-detalle': (-78.5335, -5.6375, 160),
    'sector-sureste-osm': (-78.5228, -5.6447, 360),
}
COLOR = {
    'fondo': (232, 228, 218), 'manzana': (244, 239, 228), 'vereda': (214, 211, 203),
    'calzada': (120, 124, 130), 'tierra': (176, 150, 112), 'edificio': (176, 128, 98),
    'complemento': (196, 160, 128), 'invade': (220, 30, 30), 'arbol': (60, 120, 50),
    'eje': (250, 250, 250), 'contorno': (92, 64, 48),
}
# Ancho que dibujaba la ciudad antes (media calzada + vereda), para mostrar el choque.
ANTES = {'trunk': 7.2, 'primary': 6.7, 'secondary': 6.2, 'tertiary': 6.2}


def lienzo(cx, cy, size):
    c = a_utm(Point(cx, cy))
    n = int(size / RES)
    return from_origin(c.x - size / 2, c.y + size / 2, RES, RES), n, c.buffer(size * 0.75)


def pintar(img, geoms, color, tr, n):
    geoms = [g for g in geoms if g is not None and not g.is_empty]
    if not geoms:
        return
    m = rasterize([(g, 1) for g in geoms], out_shape=(n, n), transform=tr, fill=0, dtype='uint8')
    img[m == 1] = color


def guardar(img, path):
    with rasterio.open(path, 'w', driver='PNG', width=img.shape[1], height=img.shape[0], count=3,
                       dtype='uint8') as dst:
        for b in range(3):
            dst.write(img[:, :, b], b + 1)


def dibujar(nombre, zona, antes):
    tr, n, caja = lienzo(*zona)
    img = np.zeros((n, n, 3), dtype='uint8')
    img[:] = COLOR['fondo']
    src = O if antes else F
    vias = [(p, g) for p, g in leer_capa(src / 'red_vial.geojsonl')
            if p.get('clase') in VEHICULARES and g.intersects(caja)]
    edif = [g for _, g in leer_capa(src / 'edificios.geojsonl') if g.intersects(caja)]
    comp = [g for _, g in leer_capa((O if antes else D) / 'complemento.geojson') if g.intersects(caja)]
    if antes:
        corr = unary_union([g.buffer(ANTES.get(p['clase'], 4.9), cap_style='flat') for p, g in vias])
        calz = [g.buffer(3.2 if p['clase'] not in ANTES else ANTES[p['clase']] - 1.7, cap_style='flat')
                for p, g in vias]
        pintar(img, [corr], COLOR['vereda'], tr, n)
    else:
        manz = [g for _, g in leer_capa(F / 'manzanas.geojsonl') if g.intersects(caja)]
        ver = [g.intersection(caja) for _, g in leer_capa(F / 'veredas.geojsonl') if g.intersects(caja)]
        pintar(img, ver, COLOR['vereda'], tr, n)
        pintar(img, manz, COLOR['manzana'], tr, n)
        calz = [g.buffer(p['ancho'] / 2, cap_style='flat') for p, g in vias]
        corr = None
    tierra = [c for (p, _), c in zip(vias, calz) if p.get('superficie') == 'unpaved']
    asfalto = [c for (p, _), c in zip(vias, calz) if p.get('superficie') != 'unpaved']
    pintar(img, asfalto, COLOR['calzada'], tr, n)
    pintar(img, tierra, COLOR['tierra'], tr, n)
    pintar(img, comp, COLOR['complemento'], tr, n)
    pintar(img, edif, COLOR['edificio'], tr, n)
    # Contornos: se ven las casas una por una (división por lotes y medianeras).
    pintar(img, [g.boundary.buffer(0.12) for g in edif + comp], COLOR['contorno'], tr, n)
    if antes:
        pintar(img, [g.intersection(corr) for g in edif + comp], COLOR['invade'], tr, n)
    arb = json.loads(((O if antes else F) / 'arboles.json').read_text(encoding='utf8'))['arboles']
    pts = [a_utm(Point(x, y)).buffer(max(1.0, r * 0.6)) for x, y, _, r in arb]
    pintar(img, [p for p in pts if p.intersects(caja)], COLOR['arbol'], tr, n)
    pintar(img, [g.buffer(0.12) for _, g in vias], COLOR['eje'], tr, n)
    guardar(img, OUT / f"{nombre}-{'antes' if antes else 'despues'}.png")


for nombre, zona in ZONAS.items():
    for antes in (True, False):
        dibujar(nombre, zona, antes)
print('ok', OUT)
