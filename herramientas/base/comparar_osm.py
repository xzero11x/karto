"""Compara la red vial de la base con OpenStreetMap actual (Overpass, JSON con `out geom`).

Mide el desplazamiento entre ambas y, dentro de la zona urbana (a menos de 40 m de una
edificación), los tramos de OSM que faltan en la base y los de la base que OSM ya no tiene.
Uso: python herramientas/base/comparar_osm.py osm.json [ciudad]
"""
import json
import sys

import numpy as np
from shapely import STRtree, LineString
from shapely.affinity import translate
from shapely.ops import unary_union

from comun import ROOT, VEHICULARES, a_geo, a_utm, leer_capa

osm = json.load(open(sys.argv[1], encoding='utf8'))['elements']
CIUDAD = sys.argv[2] if len(sys.argv) > 2 else 'bagua'
FUENTE = ROOT / 'datos-fuente' / CIUDAD
base = [(p, g) for p, g in leer_capa(FUENTE / 'red_vial.geojsonl')
        if p.get('clase') in VEHICULARES]
osm_vias = []
for w in osm:
    t = w.get('tags', {})
    if t.get('highway', '').replace('_link', '') in VEHICULARES and len(w.get('geometry', [])) >= 2:
        osm_vias.append((t, a_utm(LineString([(n['lon'], n['lat']) for n in w['geometry']]))))

# Desplazamiento base → OSM: vector mediano al punto más cercano (muestras cada 10 m).
arbol = STRtree([g for _, g in base])
dx, dy = [], []
for _, g in osm_vias:
    for d in np.arange(5, g.length - 5, 10):
        p = g.interpolate(d)
        i = arbol.nearest(p)
        q = base[i][1].interpolate(base[i][1].project(p))
        if p.distance(q) < 8:
            dx.append(p.x - q.x)
            dy.append(p.y - q.y)
sx, sy = float(np.median(dx)), float(np.median(dy))
print(f'OSM respecto de la base ({len(dx)} muestras): dx {sx:+.2f} m, dy {sy:+.2f} m '
      f'(dispersión {np.std(dx):.2f} / {np.std(dy):.2f} m)')

urbano = unary_union([g.centroid.buffer(40) for _, g in leer_capa(FUENTE / 'edificios.geojsonl')])
union_base = unary_union([g for _, g in base]).buffer(6)
union_osm = unary_union([translate(g, -sx, -sy) for _, g in osm_vias]).buffer(6)

total = 0
print('Tramos urbanos de OSM sin equivalente en la base:')
for t, g in osm_vias:
    falta = translate(g, -sx, -sy).difference(union_base).intersection(urbano)
    if falta.length > 20:
        total += falta.length
        c = a_geo(falta.centroid)
        print(f"  + {t.get('highway'):12s} {str(t.get('name') or '')[:34]:34s} {falta.length:5.0f} m"
              f"  ({c.x:.5f}, {c.y:.5f})  osm way {t.get('_id', '')}")
print(f'  total {total:.0f} m')
total = 0
print('Tramos urbanos de la base que OSM ya no tiene:')
for p, g in base:
    sobra = g.difference(union_osm).intersection(urbano)
    if sobra.length > 20:
        total += sobra.length
        c = a_geo(sobra.centroid)
        print(f"  - {p.get('clase'):12s} {str(p.get('nombre') or '')[:34]:34s} {sobra.length:5.0f} m"
              f"  ({c.x:.5f}, {c.y:.5f})  id {p['id'][:8]}")
print(f'  total {total:.0f} m')
