"""Diagnóstico de coherencia de la base: vías, edificios, huellas complementarias y árboles.

Mide en metros (UTM 17S) cuánto invaden los edificios las calzadas, a qué distancia del eje están
las fachadas y qué huellas se duplican entre fuentes. No modifica nada.
Uso: python herramientas/base/diagnostico.py [ciudad]
"""
import json
import sys

import numpy as np
from shapely import STRtree, LineString, Point
from shapely.ops import unary_union

from comun import ROOT, VEHICULARES, leer_capa

CIUDAD = sys.argv[1] if len(sys.argv) > 1 else 'bagua'
FUENTE = ROOT / 'datos-fuente' / CIUDAD
DATOS = ROOT / 'datos' / CIUDAD
# Media calzada mínima creíble por clase (m): un edificio que la pisa está en la pista.
CALZADA_MIN = {'trunk': 4.5, 'primary': 4.0, 'secondary': 3.5, 'tertiary': 3.2}


def rayos(vias, arbol, geoms, paso=2.0, largo=16.0, margen=6.0):
    """Distancia del eje a la primera fachada, a cada lado, cada `paso` m."""
    out = []
    for props, g in vias:
        L = g.length
        if L < 2 * margen + paso:
            continue
        lados = {1: [], -1: []}
        for d in np.arange(margen, L - margen, paso):
            p = g.interpolate(d)
            q = g.interpolate(min(L, d + 0.5))
            dx, dy = q.x - p.x, q.y - p.y
            n = np.hypot(dx, dy) or 1
            nx, ny = -dy / n, dx / n
            for s in (1, -1):
                ray = LineString([(p.x, p.y), (p.x + s * nx * largo, p.y + s * ny * largo)])
                best = None
                for i in arbol.query(ray):
                    inter = geoms[i].intersection(ray)
                    if inter.is_empty:
                        continue
                    dist = Point(p.x, p.y).distance(inter)
                    best = dist if best is None else min(best, dist)
                lados[s].append(best)
        out.append((props, lados))
    return out


def main():
    vias = [(p, g) for p, g in leer_capa(FUENTE / 'red_vial.geojsonl')
            if p.get('clase') in VEHICULARES and g.geom_type == 'LineString']
    edif = leer_capa(FUENTE / 'edificios.geojsonl')
    comp = leer_capa(DATOS / 'complemento.geojson')
    altu = {p['id']: g for p, g in leer_capa(DATOS / 'alturas.geojson')}
    print(f'vías vehiculares {len(vias)} · edificios Overture {len(edif)} · complementarios {len(comp)}')

    # 1. Edificios dentro de la calzada mínima.
    calzada = unary_union([g.buffer(CALZADA_MIN.get(p['clase'], 2.5), cap_style='flat')
                           for p, g in vias])
    for nombre, capa in (('Overture', edif), ('complementarios', comp)):
        pisan = [(p, g, g.intersection(calzada).area) for p, g in capa if g.intersects(calzada)]
        pisan = [x for x in pisan if x[2] > 0.5]
        prof = sorted(x[2] / max(1, x[1].area) for x in pisan)
        print(f'{nombre}: {len(pisan)} pisan la calzada mínima '
              f'({sum(x[2] for x in pisan):.0f} m²); fracción invadida mediana '
              f'{np.median(prof) if prof else 0:.2f}, >50 %: {sum(1 for f in prof if f > 0.5)}')

    # 2. Distancia de las fachadas al eje (todas las huellas).
    todas = [g for _, g in edif] + [g for _, g in comp]
    arbol = STRtree(todas)
    res = rayos(vias, arbol, todas)
    por_clase = {}
    for props, lados in res:
        for s, ds in lados.items():
            hits = [d for d in ds if d is not None]
            if len(hits) >= max(3, 0.3 * len(ds)):
                por_clase.setdefault(props['clase'], []).append(np.percentile(hits, 25))
    for clase, vals in sorted(por_clase.items(), key=lambda kv: -len(kv[1])):
        v = np.array(vals)
        print(f'  fachada (p25 por lado) {clase:12s} n={len(v):4d}  p10 {np.percentile(v, 10):4.1f}  '
              f'mediana {np.median(v):4.1f}  p90 {np.percentile(v, 90):4.1f} m')

    # 3. Huellas complementarias duplicadas sobre edificios de Overture.
    arbol_o = STRtree([g for _, g in edif])
    dup = 0
    for _, g in comp:
        cand = arbol_o.query(g, predicate='intersects')
        if cand.size and sum(g.intersection(edif[i][1]).area for i in cand) > 0.3 * g.area:
            dup += 1
    print(f'complementarios superpuestos a Overture (>30 %): {dup}')

    # 4. Geometría 3D (alturas) frente a la de las teselas.
    distintas = sum(1 for p, g in edif if p['id'] in altu and
                    altu[p['id']].symmetric_difference(g).area > 0.05 * g.area)
    print(f'edificios cuya huella 3D difiere de la 2D (>5 %): {distintas} de {len(edif)}')

    # 5. Árboles sobre la calzada mínima.
    arboles = json.loads((FUENTE / 'arboles.json').read_text(encoding='utf8'))['arboles']
    from comun import a_utm
    pts = [a_utm(Point(x, y)) for x, y, _, _ in arboles]
    en_pista = sum(1 for p in pts if calzada.contains(p))
    print(f'árboles sobre la calzada mínima: {en_pista} de {len(pts)}')


if __name__ == '__main__':
    main()
