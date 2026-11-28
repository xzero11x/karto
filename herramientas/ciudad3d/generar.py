"""Paquete de la ciudad 3D (datos/<ciudad>/ciudad3d.json) desde la base corregida de karto.

Lee solo archivos de karto (datos-fuente/<ciudad>/ y datos/<ciudad>/): edificios divididos por lote,
huellas complementarias, red vial con calzada y fachadas, usos del suelo, equipamientos de OSM,
agua, lugares y árboles. No necesita base de datos. Coordenadas enteras en decímetros, locales al
`centro` de ciudad.json (Mercator web, igual que el visor).
Uso: python herramientas/ciudad3d/generar.py [ciudad]
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from shapely import STRtree, Point
from shapely.geometry import shape
from shapely.ops import unary_union

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'base'))
from comun import ROOT, VEHICULARES, a_utm, leer_lineas  # noqa: E402

CIUDAD = sys.argv[1] if len(sys.argv) > 1 else 'bagua'
F = ROOT / 'datos-fuente' / CIUDAD
D = ROOT / 'datos' / CIUDAD
perfil = json.loads((D / 'ciudad.json').read_text(encoding='utf8'))
CENTRO = perfil['centro']

EARTH = 2 * math.pi * 6371008.8
merc_x = lambda lng: (180 + lng) / 360  # noqa: E731
merc_y = lambda lat: (180 - (180 / math.pi) * math.log(math.tan(math.pi / 4 + lat * math.pi / 360))) / 360  # noqa: E731
OX, OY = merc_x(CENTRO[0]), merc_y(CENTRO[1])
MERC_PER_M = 1 / (EARTH * math.cos(CENTRO[1] * math.pi / 180))


def local(lng, lat):
    return [round((merc_x(lng) - OX) / MERC_PER_M * 10), round((OY - merc_y(lat)) / MERC_PER_M * 10)]


def anillo(coords):
    """Anillo GeoJSON (cerrado) → [x, y, ...] en decímetros sin repetir el primer punto."""
    out = []
    for lng, lat in coords[:-1]:
        out.extend(local(lng, lat))
    return out


def poligonos(geom):
    if geom['type'] == 'Polygon':
        return [geom['coordinates']]
    if geom['type'] == 'MultiPolygon':
        return geom['coordinates']
    return []


def leer(path):
    path = Path(path)
    if path.suffix == '.geojson':
        return json.loads(path.read_text(encoding='utf8'))['features']
    return leer_lineas(path)


# ------------------------------------------------------------------------------- edificios
DRIVABLE = {'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'unclassified', 'living_street',
            'service', 'unknown'}
ROAD_CODE = {'trunk': 4, 'primary': 3, 'secondary': 2, 'tertiary': 2}
ONE_FLOOR_SHARE = 0.72

edificios = []  # (id, altura, tipo, area_m2, geometry geojson)
for f in leer(D / 'alturas.geojson'):
    p = f['properties']
    tipo = 0 if p.get('tipo') == 'estimada' else 1
    edificios.append((p['id'], float(p.get('altura_m') or 3), tipo, f['geometry']))
for f in leer(D / 'complemento.geojson'):
    p = f['properties']
    satelite = str(p.get('origen_altura', '')).startswith('google')
    edificios.append((p['id'], float(p.get('altura_m') or 3), 0 if satelite else 1, f['geometry']))

areas_m2 = [a_utm(shape(g)).area for _, _, _, g in edificios]
# Pisos: medidos por satélite → altura / 2,8 m; simulados → reparto 72 % de una planta y 28 % de
# dos (expediente del sector Tomaque), las más altas son las de dos.
sim = sorted([i for i, e in enumerate(edificios) if e[2] == 1], key=lambda i: (edificios[i][1], edificios[i][0]))
pisos = [1] * len(edificios)
for k, i in enumerate(sim):
    pisos[i] = 1 if (k + 0.5) / len(sim) <= ONE_FLOOR_SHARE else 2
for i, (_, h, tipo, _) in enumerate(edificios):
    if tipo == 0:
        pisos[i] = int(min(5, max(1, round((h - 0.3) / 2.8))))

# ------------------------------------------------------------------------------- equipamientos
equip = [(f['properties'], f['geometry']) for f in leer(F / 'equipamientos.geojsonl')]
lugares = [(f['properties'], f['geometry']) for f in leer(F / 'lugares.geojsonl')]
geoms_utm = [a_utm(shape(g)) for _, _, _, g in edificios]
arbol_e = STRtree(geoms_utm)


def dentro(poly, minimo=0.0, cuantos=1):
    """Edificios con al menos la mitad dentro del polígono, de mayor a menor área."""
    P = a_utm(shape(poly))
    idx = [i for i in arbol_e.query(P, predicate='intersects')
           if geoms_utm[i].area >= minimo and geoms_utm[i].intersection(P).area >= 0.5 * geoms_utm[i].area]
    return [edificios[i][0] for i in sorted(idx, key=lambda i: -geoms_utm[i].area)[:cuantos]]


def cerca(lnglat, radio, minimo=0.0, cuantos=1):
    p = a_utm(Point(*lnglat))
    idx = [i for i in arbol_e.query(p.buffer(radio), predicate='intersects') if geoms_utm[i].area >= minimo]
    return [edificios[i][0] for i in sorted(idx, key=lambda i: (geoms_utm[i].distance(p), -geoms_utm[i].area))[:cuantos]]


especiales = {}


def agregar(tipo, ids):
    usados = {i for v in especiales.values() for i in v}
    especiales.setdefault(tipo, []).extend(i for i in ids if i not in usados)


REGLAS = {  # clase de OSM → (tipo en la ciudad, área mínima, cuántos edificios)
    'townhall': ('municipalidad', 150, 1), 'place_of_worship': ('iglesia', 200, 1),
    'police': ('comisaria', 120, 1), 'hospital': ('hospital', 150, 6), 'clinic': ('clinica', 80, 2),
    'marketplace': ('mercado', 300, 2), 'bus_station': ('terminal', 200, 1),
    'school': ('colegio', 100, 10), 'college': ('colegio', 100, 10), 'university': ('colegio', 100, 12),
}
for p, g in sorted(equip, key=lambda x: list(REGLAS).index(x[0]['clase']) if x[0]['clase'] in REGLAS else 99):
    if p['clase'] in REGLAS:
        tipo, minimo, n = REGLAS[p['clase']]
        if p['clase'] == 'hospital' and 'cenepa' in (p.get('nombre') or '').lower():
            tipo = 'essalud'
        agregar(tipo, dentro(g, minimo, n))
agregar('coliseo', cerca((-78.53544, -5.63694), 25, 1500))
for p, g in lugares:
    n = (p.get('nombre') or '').lower()
    if 'clinica amazonas' in n.replace('í', 'i'):
        agregar('clinica', cerca(g['coordinates'], 15, 80))
    elif p.get('categoria') in ('christian_place_of_worship', 'religious_organization') and 'matriz' not in n:
        agregar('templo', cerca(g['coordinates'], 20, 80))

# ------------------------------------------------------------------------------- suelo
plaza_ll = tuple(perfil.get('plaza') or (-78.53169, -5.63914))
plaza_p = a_utm(Point(*plaza_ll))
areas = []
vistos = []


def area_code(clase, nombre, poly_utm):
    if clase in ('park', 'garden'):
        return 1 if poly_utm.contains(plaza_p) or (nombre or '').lower().startswith('plaza') else 2
    if clase == 'stadium':
        return 3
    if clase == 'pitch':
        return 4 if poly_utm.area > 3000 else 5
    if clase in ('school', 'college', 'university', 'kindergarten'):
        return 6
    if clase == 'cemetery':
        return 7
    if clase in ('hospital', 'clinic'):
        return 8
    return 0


for f in leer(F / 'usos_suelo.geojsonl') + [{'properties': p, 'geometry': g} for p, g in equip]:
    p, g = f['properties'], f['geometry']
    U = a_utm(shape(g))
    code = area_code(p.get('clase'), p.get('nombre'), U)
    if not code:
        continue
    if any(c == code and U.intersection(V).area > 0.6 * min(U.area, V.area) for c, V in vistos):
        continue
    vistos.append((code, U))
    for rings in poligonos(g):
        flat = anillo(rings[0])
        if len(flat) >= 6:
            areas.append([code, *flat])

# Agua cerca de la plaza: ríos como eje, polígonos anchos y piscinas de OSM.
caja = plaza_p.buffer(3500)
agua, rios, piscinas = [], [], []
for f in leer(F / 'agua.geojsonl'):
    g = f['geometry']
    if not a_utm(shape(g)).intersects(caja):
        continue
    if g['type'] == 'LineString':
        rios.append([v for lng, lat in g['coordinates'] for v in local(lng, lat)])
    elif g['type'] == 'MultiLineString':
        for line in g['coordinates']:
            rios.append([v for lng, lat in line for v in local(lng, lat)])
    else:
        for rings in poligonos(g):
            agua.append([anillo(r) for r in rings])
for p, g in equip:
    if p['clase'] == 'swimming_pool':
        for rings in poligonos(g):
            piscinas.append(anillo(rings[0]))
puntos = {'plaza': local(*plaza_ll)}
for clave, ll in (('mercado', (-78.53108, -5.63631)), ('coliseo', (-78.53544, -5.63694)),
                  ('piscina', (-78.52867, -5.63784)), ('terminal', (-78.52571, -5.64311))):
    puntos[clave] = local(*ll)

# ------------------------------------------------------------------------------- vías
rio_union = unary_union([a_utm(shape(f['geometry'])) for f in leer(F / 'agua.geojsonl')]) or None
vias, anchos = [], []
for f in leer(F / 'red_vial.geojsonl'):
    p, g = f['properties'], f['geometry']
    if p.get('clase') not in DRIVABLE or g['type'] != 'LineString':
        continue
    nombre = p.get('nombre') or ''
    malecon = nombre.lower().startswith('avenida malec')
    verde = any(k in nombre.lower() for k in ('circunvalaci', 'héroes del cenepa', 'heroes del cenepa'))
    coords = g['coordinates']
    izq, der = p.get('paramento_izq'), p.get('paramento_der')
    if malecon and rio_union is not None:
        L = a_utm(shape(g))
        a = L.offset_curve(15).distance(rio_union)
        b = L.offset_curve(-15).distance(rio_union)
        if a < b:  # río a la izquierda: se invierte para dejarlo a la derecha
            coords = coords[::-1]
            izq, der = der, izq
    code = ROAD_CODE.get(p['clase'], 1) + (10 if p.get('superficie') == 'unpaved' else 0) + \
        (20 if verde else 0) + (40 if malecon else 0)
    vias.append([code, *[v for lng, lat in coords for v in local(lng, lat)]])
    calzada = (p.get('ancho') or 6.0) / 2
    anchos.append([round(calzada * 10), round((izq or calzada) * 10), round((der or calzada) * 10)])

# ------------------------------------------------------------------------------- árboles
arb = json.loads((F / 'arboles.json').read_text(encoding='utf8'))
arboles = [v for lng, lat, h, r in arb['arboles'] for v in (*local(lng, lat), round(h * 10), round(r * 10))]

# ------------------------------------------------------------------------------- salida
paquete = {
    'origen': CENTRO,
    'unidad': 'decimetros',
    'edificios': {
        'ids': [e[0] for e in edificios],
        'pisos': pisos,
        'tipos': [e[2] for e in edificios],
        'geometrias': [[[anillo(r) for r in rings] for rings in poligonos(e[3])] for e in edificios],
    },
    'vias': vias,
    'anchos': anchos,
    'arboles': arboles,
    'suelo': {'areas': areas, 'especiales': especiales, 'puntos': puntos, 'agua': agua, 'rios': rios,
              'piscinas': piscinas},
    'fuentes': {
        'base': 'Base corregida de karto (herramientas/base): calles de OpenStreetMap con calzada y '
                'veredas medidas sobre las fachadas, manzanas, edificios de Google Open Buildings, '
                'Microsoft y OSM divididos por lote.',
        'arboles': arb.get('fuente'),
        'pisos': 'Pisos: altura satelital / 2,8 m donde hay medición; en el resto, 72 % una planta y '
                 '28 % dos (expediente sector Tomaque).',
        'materiales': 'Paredes y techos según Censo 2017 (INEI), viviendas urbanas de Bagua: ladrillo 49 %, '
                      'adobe 45 %, quincha 4 %; calamina o fibrocemento 67 %, concreto 29 %.',
        'equipamientos': 'Municipalidad, iglesia, comisaría, hospitales, colegios, mercado y terminal: '
                         'polígonos de OpenStreetMap.',
    },
}
salida = D / 'ciudad3d.json'
salida.write_text(json.dumps(paquete, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
print(json.dumps({'edificios': len(edificios), 'vias': len(vias), 'arboles': len(arboles) // 4,
                  'areas': len(areas), 'rios': len(rios), 'agua': len(agua), 'piscinas': len(piscinas),
                  'especiales': {k: len(v) for k, v in especiales.items()},
                  'bytes': salida.stat().st_size}, ensure_ascii=False))
