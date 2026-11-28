"""Verificación de la base corregida: reglas de coherencia que deben cumplirse siempre.

  - ningún edificio ni huella complementaria invade la calzada ni el corredor de una vía;
  - cada edificio cae en una sola manzana (o fuera del área de manzanas);
  - ninguna manzana pisa una calzada;
  - ningún árbol está sobre la calzada.
Termina con código 1 si alguna regla falla. Uso: python herramientas/base/verificar.py [ciudad]
"""
import json
import sys

from shapely import STRtree, Point
from shapely.ops import unary_union

from comun import ROOT, VEHICULARES, a_utm, leer_capa

CIUDAD = sys.argv[1] if len(sys.argv) > 1 else 'bagua'
F = ROOT / 'datos-fuente' / CIUDAD
D = ROOT / 'datos' / CIUDAD
TOL = 0.05  # m² (redondeo de coordenadas a 7 decimales ≈ 1 cm)

vias = [(p, g) for p, g in leer_capa(F / 'red_vial.geojsonl') if p.get('clase') in VEHICULARES]
calz = [g.buffer(p['ancho'] / 2 - 0.02, cap_style='flat') for p, g in vias]
corr = [unary_union([g.buffer(p['paramento_izq'] - 0.02, single_sided=True, cap_style='flat'),
                     g.buffer(-(p['paramento_der'] - 0.02), single_sided=True, cap_style='flat')])
        for p, g in vias]
arbol_calz, arbol_corr = STRtree(calz), STRtree(corr)
manz = [g for _, g in leer_capa(F / 'manzanas.geojsonl')]
arbol_m = STRtree(manz)
fallas = {}


def invade(g, tiras, arbol):
    return sum(g.intersection(tiras[i]).area for i in arbol.query(g, predicate='intersects'))


for nombre, path in (('edificios', F / 'edificios.geojsonl'), ('complementarios', D / 'complemento.geojson'),
                     ('alturas 3D', D / 'alturas.geojson')):
    capa = leer_capa(path)
    en_calzada = sum(1 for _, g in capa if invade(g, calz, arbol_calz) > TOL)
    en_corredor = sum(1 for _, g in capa if invade(g, corr, arbol_corr) > 0.5)
    dos_manzanas = 0
    for _, g in capa:
        toca = [i for i in arbol_m.query(g, predicate='intersects') if g.intersection(manz[i]).area > 0.5]
        dos_manzanas += len(toca) > 1
    print(f'{nombre:16s} {len(capa):6d}  en calzada {en_calzada:4d}  en corredor {en_corredor:4d}  '
          f'en dos manzanas {dos_manzanas:3d}')
    fallas[nombre] = en_calzada + en_corredor + dos_manzanas

mz_calz = sum(1 for m in manz if invade(m, calz, arbol_calz) > TOL)
print(f'manzanas         {len(manz):6d}  sobre calzada {mz_calz}')
fallas['manzanas'] = mz_calz
arb = json.loads((F / 'arboles.json').read_text(encoding='utf8'))['arboles']
en_pista = sum(1 for x, y, _, _ in arb
               if any(calz[i].contains(p) for p in [a_utm(Point(x, y))] for i in arbol_calz.query(p)))
print(f'árboles          {len(arb):6d}  sobre calzada {en_pista}')
fallas['arboles'] = en_pista
total = sum(fallas.values())
print('OK: la base es coherente' if total == 0 else f'FALLAN {total} casos: {fallas}')
sys.exit(1 if total else 0)
