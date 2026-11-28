"""Corrección de la base cartográfica: red vial, corredores, manzanas, veredas y edificios coherentes.

Modelo (en metros, UTM 17S):
  1. Red vial: la de Overture (calles de OSM), actualizada con OpenStreetMap vigente: se agregan
     los tramos urbanos que OSM tiene y la base no, y se quitan los que OSM ya borró.
  2. Alineación: traslación global de la red que centra las calles entre sus fachadas (mínimos
     cuadrados sobre la asimetría izquierda/derecha de cada tramo).
  3. Corredor de cada tramo: del eje a la línea de fachada, a cada lado (percentil 30 de la
     distancia a las fachadas reales, acotado por clase). La calzada va centrada y el resto es
     vereda.
  4. Manzanas: caras de la red vial vehicular menos los corredores.
  5. Edificios y huellas complementarias: se recortan a su manzana (nada queda en la vía); si
     más de la mitad estaba en la vía, se quitan.
  6. Usos del suelo y equipamientos: también sin invadir la vía. Árboles: fuera de la calzada.

Lee siempre de datos-fuente/<ciudad>/origen/ (copia de la base sin corregir, se crea en la primera
ejecución), así se puede repetir. Uso:
  python herramientas/base/corregir.py [ciudad] [--osm overpass.json]
"""
import argparse
import json
import math
import shutil
from datetime import date

import numpy as np
from shapely import STRtree, LineString, MultiPolygon, Point, Polygon
from shapely.affinity import translate
from shapely.ops import nearest_points, polygonize, unary_union

from comun import (ROOT, VEHICULARES, a_geo, a_utm, escribir_lineas, leer_capa, leer_lineas,
                   redondear)
from shapely.geometry import mapping

from edificios import (INSTITUCIONAL, ajustar_fachadas, ajuste_por_manzana, alinear_lotes,
                       completar_lotes, dividir_por_lotes, mover as mover_capa)

# Media calzada por clase (m) y límites del corredor (del eje a la fachada) por lado.
CALZADA = {'trunk': 5.0, 'primary': 4.5, 'secondary': 4.0, 'tertiary': 3.5, 'residential': 3.0,
           'unclassified': 3.0, 'unknown': 3.0, 'living_street': 2.8, 'service': 2.5}
CORREDOR_MAX = {'trunk': 15, 'primary': 12, 'secondary': 9, 'tertiary': 8, 'service': 4}
CORREDOR_DEF = {'trunk': 8, 'primary': 7, 'secondary': 6, 'tertiary': 5.5, 'service': 3}
VEREDA_MIN = 0.4
# Clases que cierran manzanas (los accesos de servicio quedan dentro de la manzana).
DE_MANZANA = VEHICULARES - {'service'}
EQUIPAMIENTOS = {'townhall', 'place_of_worship', 'hospital', 'clinic', 'police', 'marketplace',
                 'school', 'college', 'university', 'bus_station', 'bank', 'stadium', 'cemetery',
                 'swimming_pool', 'fire_station', 'courthouse', 'library', 'sports_centre', 'pitch',
                 'park'}


def utm_line(coords):
    return a_utm(LineString(coords))


# ------------------------------------------------------------------------------- entrada
def preparar_origen(fuente, datos):
    origen = fuente / 'origen'
    origen.mkdir(exist_ok=True)
    for name in ['red_vial', 'calles_rotulo', 'conectores', 'edificios', 'usos_suelo', 'lugares']:
        if not (origen / f'{name}.geojsonl').exists():
            shutil.copy(fuente / f'{name}.geojsonl', origen / f'{name}.geojsonl')
    if not (origen / 'arboles.json').exists():
        shutil.copy(fuente / 'arboles.json', origen / 'arboles.json')
    for name in ['alturas', 'complemento']:
        if not (origen / f'{name}.geojson').exists():
            shutil.copy(datos / f'{name}.geojson', origen / f'{name}.geojson')
    return origen


def importar_osm(path, origen):
    """Guarda en origen/osm.geojsonl las vías vehiculares y los equipamientos de un Overpass."""
    feats = []
    for w in json.load(open(path, encoding='utf8'))['elements']:
        t = w.get('tags', {})
        geom = w.get('geometry', [])
        if len(geom) < 2:
            continue
        coords = [[round(n['lon'], 7), round(n['lat'], 7)] for n in geom]
        hw = t.get('highway', '').replace('_link', '')
        kind = t.get('amenity') or t.get('leisure') or t.get('landuse')
        if hw in VEHICULARES:
            feats.append({'type': 'Feature', 'geometry': {'type': 'LineString', 'coordinates': coords},
                          'properties': {'osm': f'way/{w["id"]}', 'clase': hw, 'nombre': t.get('name'),
                                         'superficie': t.get('surface')}})
        elif kind in EQUIPAMIENTOS and len(coords) >= 4 and coords[0] == coords[-1]:
            feats.append({'type': 'Feature', 'geometry': {'type': 'Polygon', 'coordinates': [coords]},
                          'properties': {'osm': f'way/{w["id"]}', 'tipo': kind, 'nombre': t.get('name')}})
    with (origen / 'osm.geojsonl').open('w', encoding='utf8', newline='\n') as out:
        for f in feats:
            out.write(json.dumps(f, ensure_ascii=False, separators=(',', ':')) + '\n')
    (origen / 'osm.json').write_text(json.dumps(
        {'fuente': 'OpenStreetMap (Overpass API), © colaboradores de OpenStreetMap, ODbL',
         'fecha': date.today().isoformat(), 'elementos': len(feats)}, ensure_ascii=False, indent=2),
        encoding='utf8')


# ------------------------------------------------------------------------------- red vial
def actualizar_red(vias, osm_vias, informe):
    """Agrega los tramos urbanos de OSM que faltan y quita los que OSM ya no tiene."""
    arbol = STRtree([g for _, g in vias])
    dx, dy = [], []
    for _, g in osm_vias:
        for d in np.arange(5, g.length - 5, 10):
            p = g.interpolate(d)
            q = vias[arbol.nearest(p)][1]
            q = q.interpolate(q.project(p))
            if p.distance(q) < 8:
                dx.append(p.x - q.x)
                dy.append(p.y - q.y)
    sx, sy = float(np.median(dx)), float(np.median(dy))
    osm_vias = [(t, translate(g, -sx, -sy)) for t, g in osm_vias]
    union_base = unary_union([g for _, g in vias])
    zona_base = union_base.buffer(6)
    union_osm = unary_union([g for _, g in osm_vias]).buffer(6)
    urbano = informe['_urbano']
    # Quitar: tramos urbanos cuyo 60 % ya no está en OSM.
    quedan, quitados = [], []
    for p, g in vias:
        fuera = g.difference(union_osm)
        if g.intersects(urbano) and fuera.length > 0.6 * g.length and fuera.length > 20:
            quitados.append(p['id'])
        else:
            quedan.append((p, g))
    # Agregar: partes urbanas de OSM sin equivalente, unidas a la red en sus extremos. Se descartan
    # los trozos cortos y los que corren pegados a una calle existente (redibujos, no calles nuevas).
    agregados = []
    zona_cerca = union_base.buffer(12)
    redibujos = 0
    for t, g in osm_vias:
        falta = g.difference(zona_base).intersection(urbano.buffer(20))
        partes = [falta] if falta.geom_type == 'LineString' else list(getattr(falta, 'geoms', []))
        partes = [x for x in partes if x.geom_type == 'LineString' and x.length >= 30]
        nuevas = [x for x in partes if x.intersection(zona_cerca).length <= 0.5 * x.length]
        redibujos += len(partes) - len(nuevas)
        for k, parte in enumerate(nuevas):
            coords = list(parte.coords)
            for idx in (0, -1):
                p = Point(coords[idx])
                if p.distance(union_base) < 9:
                    q = nearest_points(p, union_base)[1]
                    if idx == 0:
                        coords.insert(0, (q.x, q.y))
                    else:
                        coords.append((q.x, q.y))
            props = {'id': f"osm-{t['osm'].split('/')[1]}-{k}", 'nombre': t.get('nombre'),
                     'clase': t['clase'], 'subtipo': 'road', 'fuente': 'OpenStreetMap'}
            if t.get('superficie') in ('unpaved', 'dirt', 'gravel', 'ground', 'compacted'):
                props['superficie'] = 'unpaved'
            agregados.append((props, LineString(coords)))
    informe['red_vial'] = {
        'osm_respecto_base_m': [round(sx, 2), round(sy, 2)],
        'tramos_quitados': quitados,
        'tramos_agregados': [p['id'] for p, _ in agregados],
        'metros_agregados': round(sum(g.length for _, g in agregados)),
        'redibujos_descartados': redibujos,
    }
    return quedan + agregados


def estaciones(g, paso=2.0, margen=6.0):
    L = g.length
    for d in np.arange(margen, L - margen, paso):
        p = g.interpolate(d)
        q = g.interpolate(min(L, d + 0.5))
        r = g.interpolate(max(0, d - 0.5))
        dx, dy = q.x - r.x, q.y - r.y
        n = np.hypot(dx, dy) or 1
        yield p, (-dy / n, dx / n)


def fachadas(vias, huellas, largo=16.0):
    """Distancias del eje a la primera fachada por lado: {id: {1: [...], -1: [...]}}."""
    arbol = STRtree(huellas)
    out = {}
    for props, g in vias:
        lados = {1: [], -1: []}
        for p, (nx, ny) in estaciones(g):
            for s in (1, -1):
                ray = LineString([(p.x, p.y), (p.x + s * nx * largo, p.y + s * ny * largo)])
                best = None
                for i in arbol.query(ray):
                    inter = huellas[i].intersection(ray)
                    if not inter.is_empty:
                        d = p.distance(inter)
                        best = d if best is None else min(best, d)
                lados[s].append(best)
        out[props['id']] = lados
    return out


def alinear(vias, dist, informe):
    """Traslación global t que centra los ejes entre sus fachadas: n·t ≈ (dI - dD) / 2."""
    A, b, w = [], [], []
    for props, g in vias:
        lados = dist.get(props['id'])
        if not lados or g.length < 20:
            continue
        hi = [d for d in lados[1] if d is not None]
        hd = [d for d in lados[-1] if d is not None]
        n = len(lados[1])
        if len(hi) < max(3, 0.5 * n) or len(hd) < max(3, 0.5 * n):
            continue
        a = (np.percentile(hi, 30) - np.percentile(hd, 30)) / 2
        if abs(a) > 4:
            continue
        x0, y0 = g.coords[0]
        x1, y1 = g.coords[-1]
        L = np.hypot(x1 - x0, y1 - y0) or 1
        A.append([-(y1 - y0) / L, (x1 - x0) / L])
        b.append(a)
        w.append(g.length)
    A, b, w = np.array(A), np.array(b), np.sqrt(np.array(w))
    t, *_ = np.linalg.lstsq(A * w[:, None], b * w, rcond=None)
    resid = b - A @ t
    informe['alineacion'] = {'tramos': len(b), 'traslacion_m': [round(float(t[0]), 2), round(float(t[1]), 2)],
                             'asimetria_antes_m': round(float(np.median(np.abs(b))), 2),
                             'asimetria_despues_m': round(float(np.median(np.abs(resid))), 2)}
    return float(t[0]), float(t[1])


def lado_berma(vias):
    """Avenidas de doble calzada: lado (1 izquierda, −1 derecha) donde está la otra calzada, es
    decir la berma central, y separación entre ejes. {id: (lado, separación)}."""
    duales = [(p, g) for p, g in vias if p.get('doble_calzada') == 1]
    if not duales:
        return {}
    arbol = STRtree([g for _, g in duales])
    out = {}
    for p, g in duales:
        sep = float(p.get('separacion_m') or 12)
        m = g.interpolate(0.5, normalized=True)
        a = g.interpolate(max(0, g.project(m) - 1))
        b = g.interpolate(min(g.length, g.project(m) + 1))
        tx, ty = b.x - a.x, b.y - a.y
        L = np.hypot(tx, ty) or 1
        nx, ny = -ty / L, tx / L
        mejor = None
        for s in (1, -1):
            q = Point(m.x + s * nx * sep, m.y + s * ny * sep)
            d = min((duales[i][1].distance(q) for i in arbol.query(q.buffer(sep * 0.45))
                     if duales[i][0]['id'] != p['id']), default=np.inf)
            if mejor is None or d < mejor[0]:
                mejor = (d, s)
        if mejor and mejor[0] < sep * 0.45:
            out[p['id']] = (mejor[1], sep)
    return out


def anchos(vias, dist, berma=None):
    """Corredor por lado y media calzada de cada tramo. En las avenidas de doble calzada, cada
    calzada tiene dos carriles (unos 7 m) y del lado de la berma no hay vereda."""
    berma = berma or {}
    out = {}
    for props, g in vias:
        clase = props.get('clase')
        hw = CALZADA.get(clase, 3.0)
        if props['id'] in berma:
            hw = min(hw, 3.6, max(2.75, berma[props["id"]][1] / 2 - 1.6))
        tierra = props.get('superficie') == 'unpaved'
        cmax = CORREDOR_MAX.get(clase, 6.0)
        cdef = CORREDOR_DEF.get(clase, 4.5)
        lados = dist.get(props['id'], {1: [], -1: []})
        w = {}
        for s in (1, -1):
            hits = [d for d in lados[s] if d is not None]
            if len(hits) >= max(3, 0.3 * max(1, len(lados[s]))):
                w[s] = float(np.percentile(hits, 30))
            else:
                w[s] = hw if tierra else cdef
            w[s] = min(cmax, max(2.5, w[s]))
        # Calzada centrada que deja vereda en el lado más angosto (si hay sitio).
        h = min(hw, min(w.values()) - (0 if tierra else 0.9))
        h = max(min(2.5, min(w.values())), h)
        if tierra:
            w = {s: max(h, min(w[s], h + 0.5)) for s in w}
        if props['id'] in berma:
            w[berma[props['id']][0]] = h
        out[props['id']] = {'izq': round(w[1], 2), 'der': round(w[-1], 2), 'calzada': round(h, 2)}
    return out


def corredores(vias, ancho):
    """Polígonos del corredor (eje ± fachadas) y de la calzada de cada tramo."""
    corr, calz = [], []
    ends = {}
    for props, g in vias:
        a = ancho[props['id']]
        izq = g.buffer(a['izq'], single_sided=True, cap_style='flat', join_style='mitre', mitre_limit=3)
        der = g.buffer(-a['der'], single_sided=True, cap_style='flat', join_style='mitre', mitre_limit=3)
        corr.append(unary_union([izq, der]))
        calz.append(g.buffer(a['calzada'], cap_style='flat', join_style='mitre', mitre_limit=3))
        for c in (g.coords[0], g.coords[-1]):
            k = (round(c[0], 1), round(c[1], 1))
            ends.setdefault(k, []).append(min(a['izq'], a['der']))
    # Nudos: un disco del menor corredor cierra las cuñas de los quiebres sin redondear esquinas.
    discos = [Point(k).buffer(min(v), 16) for k, v in ends.items()]
    calz_nudos = [Point(k).buffer(min(v) * 0.7, 16) for k, v in ends.items() if len(v) >= 2]
    return corr + discos, calz + calz_nudos


def recortar(geom, tiras, arbol):
    idx = arbol.query(geom, predicate='intersects')
    if not idx.size:
        return geom
    return geom.difference(unary_union([tiras[i] for i in idx]))


def mayor(geom, minimo=6.0):
    if geom.is_empty:
        return None
    if isinstance(geom, Polygon):
        return geom if geom.area >= minimo else None
    partes = [p for p in getattr(geom, 'geoms', []) if isinstance(p, Polygon) and p.area >= minimo]
    return max(partes, key=lambda p: p.area) if partes else None


def limpio(geom, minimo=6.0):
    """Polígono o multipolígono sin astillas (lo que no es polígono se descarta)."""
    if geom.is_empty:
        return None
    geom = geom.buffer(0)
    partes = [geom] if isinstance(geom, Polygon) else [
        p for p in getattr(geom, 'geoms', []) if isinstance(p, Polygon)]
    partes = [p for p in partes if p.area >= minimo]
    if not partes:
        return None
    return partes[0] if len(partes) == 1 else MultiPolygon(partes)


# ------------------------------------------------------------------------------- lugares
GENERICAS = {'bagua', 'de', 'del', 'la', 'el', 'los', 'las', 'y', 'hospital', 'iglesia', 'cementerio',
             'municipalidad', 'provincial', 'mercado', 'terminal', 'colegio', 'institucion', 'educativa',
             'oficial', 'i', 'ii', 'no', 'n'}
# Palabra clave del lugar, tipo del polígono de OSM y si basta con que haya uno de ese tipo.
CLAVES = [('cementerio', 'cemetery', False), ('hospital', 'hospital', False),
          ('municipalidad', 'townhall', True), ('mercado', 'marketplace', True),
          ('terminal terrestre', 'bus_station', True), ('comisar', 'police', True),
          ('estadio', 'stadium', True)]


def normal(texto):
    import unicodedata
    t = unicodedata.normalize('NFKD', (texto or '').lower())
    return ''.join(c for c in t if not unicodedata.combining(c))


def palabras(texto):
    import re
    return {w for w in re.findall(r'[a-z0-9]+', normal(texto)) if w not in GENERICAS and len(w) > 2}


def limpiar_lugares(lugares, equip, edif, manzanas, arbol_corr, informe):
    """Quita geocodificaciones erróneas, reubica con OSM y saca los puntos de la vía."""
    arbol_e = STRtree([g for _, g in edif])
    arbol_m = STRtree(manzanas)
    salida, quitados, reubicados, reclasificados = [], [], [], []
    sacados = 0
    for props, g in lugares:
        nombre = props.get('nombre') or ''
        cat = props.get('categoria') or ''
        lon, lat = a_geo(g).coords[0]
        # 1. Sitios turísticos o administrativos de otras localidades geocodificados en la ciudad.
        if cat == 'historic_site':
            quitados.append(f'{nombre} (sitio de otra localidad)')
            continue
        # 2. Coordenadas exactas en minutos de arco: geocodificación aproximada, no un lugar.
        if all(abs(v * 60 - round(v * 60)) < 2e-3 for v in (lon, lat)):
            quitados.append(f'{nombre} (coordenada aproximada)')
            continue
        # 3. Categoría incompatible con el nombre.
        if cat == 'hospital' and 'veterinari' in normal(nombre):
            props = {**props, 'categoria': 'veterinarian'}
            reclasificados.append(nombre)
        # 4. Reubicar con el polígono de OSM del mismo equipamiento.
        n = normal(nombre)
        for clave, tipo, unico in CLAVES:
            if clave not in n:
                continue
            cands = [(ep, eg) for ep, eg in equip if ep['clase'] == tipo]
            elegido = None
            if unico and len(cands) == 1:
                elegido = cands[0]
            else:
                comunes = [(len(palabras(nombre) & palabras(ep.get('nombre'))), ep, eg) for ep, eg in cands]
                comunes = [c for c in comunes if c[0] > 0]
                if comunes:
                    _, ep, eg = max(comunes, key=lambda c: c[0])
                    elegido = (ep, eg)
            if elegido and elegido[1].distance(g) > 30:
                reubicados.append(f"{nombre} -> {elegido[0].get('nombre')} ({g.distance(elegido[1]):.0f} m)")
                g = elegido[1].representative_point()
                if elegido[0].get("nombre"):
                    props = {**props, "nombre": elegido[0]["nombre"]}
            break
        # 5. Puntos en la vía (geocodificados al eje): al edificio más cercano o dentro de la manzana.
        if arbol_corr.query(g, predicate='intersects').size:
            i = arbol_e.nearest(g)
            if edif[i][1].distance(g) < 25:
                g = edif[i][1].representative_point()
            else:
                m = manzanas[arbol_m.nearest(g)]
                dentro = m.buffer(-1.5)
                g = nearest_points(dentro if not dentro.is_empty else m, g)[0]
            sacados += 1
        salida.append((props, g))
    informe['lugares'] = {'entrada': len(lugares), 'quitados': quitados, 'reubicados_con_osm': reubicados,
                          'sacados_de_la_via': sacados, 'reclasificados': reclasificados}
    return salida


# ------------------------------------------------------------------------------- principal
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('ciudad', nargs='?', default='bagua')
    ap.add_argument('--osm', help='JSON de Overpass (out geom) para actualizar la red vial')
    args = ap.parse_args()
    fuente = ROOT / 'datos-fuente' / args.ciudad
    datos = ROOT / 'datos' / args.ciudad
    origen = preparar_origen(fuente, datos)
    if args.osm:
        importar_osm(args.osm, origen)
    informe = {'generado': date.today().isoformat(), 'metodo': __doc__.split('Lee siempre')[0].strip()}

    vias_todas = leer_capa(origen / 'red_vial.geojsonl')
    edif = leer_capa(origen / 'edificios.geojsonl')
    comp = leer_capa(origen / 'complemento.geojson')
    huellas = [g for _, g in edif] + [g for _, g in comp]
    informe['_urbano'] = unary_union([g.centroid.buffer(40) for g in huellas])

    # 1. Red vial actualizada con OSM.
    osm = leer_capa(origen / 'osm.geojsonl') if (origen / 'osm.geojsonl').exists() else []
    osm_vias = [(p, g) for p, g in osm if g.geom_type == 'LineString']
    vehic = [(p, g) for p, g in vias_todas if p.get('clase') in VEHICULARES and g.geom_type == 'LineString']
    otras = [(p, g) for p, g in vias_todas if not (p.get('clase') in VEHICULARES and g.geom_type == 'LineString')]
    if osm_vias:
        vehic = actualizar_red(vehic, osm_vias, informe)

    # 2. Alineación global por simetría de fachadas.
    dist = fachadas(vehic, huellas)
    tx, ty = alinear(vehic, dist, informe)
    mover = abs(tx) > 0.3 or abs(ty) > 0.3
    if mover:
        vehic = [(p, translate(g, tx, ty)) for p, g in vehic]
        otras = [(p, translate(g, tx, ty)) for p, g in otras]
        dist = fachadas(vehic, huellas)
    informe['alineacion']['aplicada'] = mover

    # 2b. Ajuste por manzana: los edificios de cada manzana se trasladan como bloque para que cada
    # calle quede centrada entre sus dos frentes (así no se recorta el lado angosto).
    caras = [c for c in polygonize(unary_union([g for p, g in vehic if p.get('clase') in DE_MANZANA]))
             if c.area < 150_000]
    t_cara, info_mz = ajuste_por_manzana(vehic, caras, dist)
    informe['ajuste_por_manzana'] = info_mz
    edif = mover_capa(edif, caras, t_cara)
    comp = mover_capa(comp, caras, t_cara)
    huellas = [g for _, g in edif] + [g for _, g in comp]
    dist = fachadas(vehic, huellas)

    # 3. Corredores, calzadas y veredas.
    ancho = anchos(vehic, dist, lado_berma(vehic))
    corr, calz = corredores(vehic, ancho)
    arbol_corr = STRtree(corr)
    union_corr = unary_union(corr)
    union_calz = unary_union(calz)

    # 4. Manzanas.
    # Las franjas angostas entre las dos calzadas de una avenida son bermas, no manzanas.
    manzanas, bermas = [], []
    arbol_h = STRtree(huellas)
    for c in caras:
        m = limpio(c.difference(union_corr).buffer(-0.25).buffer(0.25), 20)
        if m is None:
            continue
        ancho_medio = 2 * m.area / max(1e-9, m.length)
        if ancho_medio < 7 and not any(huellas[i].intersects(m) for i in arbol_h.query(m)):
            bermas.append(m)
        else:
            manzanas.append(m)
    informe['bermas'] = len(bermas)
    manzanas.sort(key=lambda m: (-round(m.centroid.y, -1), m.centroid.x))
    urbano_mz = unary_union(caras)
    veredas = limpio(union_corr.difference(union_calz).intersection(urbano_mz.buffer(1)), 2)

    # 5. Edificios y huellas complementarias.
    def corregir_huellas(capa, nombre):
        salida, quitados, recortados, m2 = [], [], 0, 0.0
        for props, g in capa:
            g = g.buffer(0)
            r = recortar(g, corr, arbol_corr)
            perdida = g.area - r.area
            if perdida > 0.5 * g.area or r.area < 6:
                quitados.append(props.get('id'))
                continue
            if perdida > 0.05:
                recortados += 1
                m2 += perdida
                r = mayor(r) or r
            salida.append((props, r if perdida > 0.05 else g))
        informe[nombre] = {'entrada': len(capa), 'quitados_en_la_via': len(quitados),
                           'recortados': recortados, 'm2_retirados_de_la_via': round(m2),
                           'ids_quitados': quitados}
        return salida

    edif_ok = corregir_huellas(edif, 'edificios')
    # Huellas complementarias duplicadas sobre edificios de Overture (>30 %).
    arbol_e = STRtree([g for _, g in edif_ok])
    comp_sin_dup = []
    dup = 0
    for p, g in comp:
        cand = arbol_e.query(g, predicate='intersects')
        if cand.size and sum(g.intersection(edif_ok[i][1]).area for i in cand) > 0.3 * g.area:
            dup += 1
            continue
        comp_sin_dup.append((p, g))
    comp_ok = corregir_huellas(comp_sin_dup, 'complementarios')
    informe['complementarios']['duplicados_quitados'] = dup

    # 6. Usos del suelo, equipamientos y árboles.
    usos = []
    for p, g in leer_capa(origen / 'usos_suelo.geojsonl'):
        r = limpio(recortar(g.buffer(0), corr, arbol_corr), 10)
        if r is not None:
            usos.append((p, r))
    equip = []
    if osm:
        sx, sy = informe['red_vial']['osm_respecto_base_m']
        for p, g in osm:
            if g.geom_type == 'Polygon':
                r = limpio(recortar(translate(g, -sx + tx * mover, -sy + ty * mover).buffer(0),
                                    corr, arbol_corr), 10)
                if r is not None:
                    equip.append(({'id': p['osm'], 'clase': p['tipo'], 'nombre': p.get('nombre'),
                                   'fuente': 'OpenStreetMap'}, r))
    # Falsas edificaciones en plazas, parques y canchas (copas de árbol o glorietas detectadas como
    # techo por los modelos satelitales): huellas pequeñas casi enteras dentro del área verde.
    verdes = [g for p, g in usos if p.get('clase') in ('park', 'pitch', 'garden', 'grass')] + \
             [g for p, g in equip if p['clase'] in ('park', 'pitch')]
    arbol_v = STRtree(verdes) if verdes else None

    def en_verde(g):
        if arbol_v is None or g.area >= 400:
            return False
        idx = arbol_v.query(g, predicate='intersects')
        return idx.size > 0 and unary_union([verdes[i] for i in idx]).intersection(g).area > 0.8 * g.area

    antes = len(edif_ok), len(comp_ok)
    edif_ok = [x for x in edif_ok if not en_verde(x[1])]
    comp_ok = [x for x in comp_ok if not en_verde(x[1])]
    informe['edificios']['quitados_en_areas_verdes'] = antes[0] - len(edif_ok)
    informe['complementarios']['quitados_en_areas_verdes'] = antes[1] - len(comp_ok)
    # 7. Una casa por lote (lotes del CAD municipal, carpeta privada), lotes con evidencia satelital,
    # fachadas sobre la línea de fachada y medianeras sin huecos falsos.
    ocultos = set()
    if (datos / 'correcciones.json').exists():
        oc = json.loads((datos / 'correcciones.json').read_text(encoding='utf8')).get('ocultos', {})
        ocultos = set(oc.get('edificio', [])) | set(oc.get('edificio_complemento', []))
    lotes_path = fuente / 'privado' / 'lotes_cad.geojson'
    if lotes_path.exists():
        lotes, informe['lotes'] = alinear_lotes([g.buffer(0) for _, g in leer_capa(lotes_path)], manzanas,
                                                caras, t_cara)
        excluir = [g for p, g in equip if p['clase'] in INSTITUCIONAL]
        edif_ok, informe['edificios']['divididos_por_lote'] = dividir_por_lotes(edif_ok, lotes, excluir, ocultos)
        comp_ok, informe['complementarios']['divididos_por_lote'] = dividir_por_lotes(comp_ok, lotes, excluir, ocultos)
        if (origen / 'presencia_google.geojsonl').exists():
            presencia = mover_capa(leer_capa(origen / 'presencia_google.geojsonl'), caras, t_cara)
            nuevos = completar_lotes(lotes, [g for _, g in edif_ok + comp_ok], presencia, manzanas)
            comp_ok = comp_ok + nuevos
            informe['complementarios']['agregados_en_lotes_con_evidencia'] = len(nuevos)
    (edif_ok, comp_ok), informe['fachadas'] = ajustar_fachadas([edif_ok, comp_ok], manzanas)
    lugares = limpiar_lugares(leer_capa(origen / 'lugares.geojsonl'), equip, edif_ok, manzanas,
                              arbol_corr, informe)
    arboles = json.loads((origen / 'arboles.json').read_text(encoding='utf8'))
    arbol_calz = STRtree(calz)
    # Frente a la plaza principal (avenida entre la plaza y la municipalidad) no hay árboles.
    perfil = json.loads((datos / 'ciudad.json').read_text(encoding='utf8'))
    sin_arboles = None
    if perfil.get('plaza'):
        plaza_p = a_utm(Point(*perfil['plaza']))
        # Toda la avenida de fachada a fachada: berma, calzadas y veredas.
        frente = [g.buffer(max(float(p.get('separacion_m') or 12) / 2 + 0.8,
                               ancho[p['id']]['izq'], ancho[p['id']]['der']), cap_style='flat')
                  for p, g in vehic if p.get('doble_calzada') == 1 and g.distance(plaza_p) < 140]
        # También los terrenos de la municipalidad, la comisaría y la iglesia frente a la plaza.
        frente += [g for p, g in equip if p['clase'] in ('townhall', 'police', 'place_of_worship')
                   and g.distance(plaza_p) < 150]
        if frente:
            sin_arboles = unary_union(frente).intersection(plaza_p.buffer(160))
    quedan, pegados, frente_plaza, recortadas = [], 0, 0, 0
    for a in arboles['arboles']:
        pt = a_utm(Point(a[0], a[1]))
        if any(calz[i].contains(pt) for i in arbol_calz.query(pt)):
            continue
        if sin_arboles is not None and sin_arboles.contains(pt):
            frente_plaza += 1
            continue
        # La copa no cubre los carriles: radio hasta el borde de la calzada (+0,8 m). Si el
        # tronco está pegado a la calzada, el árbol no es plausible.
        cerca = [calz[i] for i in arbol_calz.query(pt.buffer(8))]
        dist_c = min((c.distance(pt) for c in cerca), default=99.0)
        if dist_c < 0.6:
            pegados += 1
            continue
        if a[3] > dist_c + 0.8:
            a = [a[0], a[1], a[2], round(dist_c + 0.8, 1)]
            recortadas += 1
        quedan.append(a)
    informe['arboles'] = {'entrada': len(arboles['arboles']),
                          'quitados_en_calzada_o_pegados': len(arboles['arboles']) - len(quedan) - frente_plaza,
                          'quitados_frente_a_la_plaza': frente_plaza, 'copas_recortadas': recortadas}
    arboles['arboles'] = quedan
    arboles['total'] = len(quedan)

    # ------------------------------------------------------------------- salida
    for p, g in vehic:
        a = ancho[p['id']]
        # Truncado (no redondeado): la calzada publicada nunca supera el corredor.
        p['ancho'] = math.floor(20 * min(a['calzada'], a['izq'], a['der'])) / 10
        p['paramento_izq'] = a['izq']
        p['paramento_der'] = a['der']
    escribir_lineas(fuente / 'red_vial.geojsonl', vehic + otras)
    for name in ['calles_rotulo', 'conectores']:
        capa = leer_capa(origen / f'{name}.geojsonl')
        if mover:
            capa = [(p, translate(g, tx, ty)) for p, g in capa]
        escribir_lineas(fuente / f'{name}.geojsonl', capa)
    escribir_lineas(fuente / 'manzanas.geojsonl',
                    [({'id': f'mz-{i + 1:04d}', 'area_m2': round(m.area)}, m) for i, m in enumerate(manzanas)])
    escribir_lineas(fuente / 'veredas.geojsonl', [({'clase': 'vereda'}, veredas)] if veredas else [])
    escribir_lineas(fuente / 'bermas.geojsonl', [({'clase': 'berma'}, b) for b in bermas])
    escribir_lineas(fuente / 'edificios.geojsonl',
                    [({**p, 'area_m2': round(g.area)}, g) for p, g in edif_ok])
    escribir_lineas(fuente / 'usos_suelo.geojsonl', usos)
    escribir_lineas(fuente / 'equipamientos.geojsonl', equip)
    escribir_lineas(fuente / 'lugares.geojsonl', lugares)
    (fuente / 'arboles.json').write_text(json.dumps(arboles, ensure_ascii=False, separators=(',', ':')),
                                         encoding='utf8')
    with (fuente / 'arboles.geojsonl').open('w', encoding='utf8', newline='\n') as out:
        for lng, lat, h, r in quedan:
            out.write(json.dumps({'type': 'Feature', 'properties': {'h': h, 'r': r},
                                  'geometry': {'type': 'Point', 'coordinates': [lng, lat]}}) + '\n')
    # Capas de datos/: alturas (3D clásico) con la huella corregida, complemento corregido.
    alt = json.loads((origen / 'alturas.geojson').read_text(encoding='utf8'))
    props_alt = {f['properties']['id']: f['properties'] for f in alt['features']}
    alt['features'] = [{'type': 'Feature',
                        'properties': {**props_alt[p.get('origen_id', p['id'])], 'id': p['id']},
                        'geometry': redondear(mapping(a_geo(g)))}
                       for p, g in edif_ok if p.get('origen_id', p['id']) in props_alt]
    (datos / 'alturas.geojson').write_text(json.dumps(alt, ensure_ascii=False, separators=(',', ':')),
                                           encoding='utf8')
    cmp_json = json.loads((origen / 'complemento.geojson').read_text(encoding='utf8'))
    cmp_json['features'] = [{'type': 'Feature', 'properties': {**p, 'area_m2': round(g.area)},
                             'geometry': redondear(mapping(a_geo(g)))} for p, g in comp_ok]
    (datos / 'complemento.geojson').write_text(json.dumps(cmp_json, ensure_ascii=False, separators=(',', ':')),
                                               encoding='utf8')

    del informe['_urbano']
    anchos_res = [ancho[p['id']] for p, _ in vehic]
    informe['corredores'] = {
        'tramos': len(vehic),
        'calzada_mediana_m': round(float(np.median([2 * a['calzada'] for a in anchos_res])), 1),
        'entre_fachadas_mediana_m': round(float(np.median([a['izq'] + a['der'] for a in anchos_res])), 1),
    }
    informe['manzanas'] = len(manzanas)
    informe['veredas_m2'] = round(veredas.area) if veredas else 0
    informe['equipamientos'] = len(equip)
    informe['usos_suelo'] = len(usos)
    (fuente / 'base-informe.json').write_text(json.dumps(informe, ensure_ascii=False, indent=2), encoding='utf8')
    resumen = {k: v for k, v in informe.items() if k not in ('metodo',)}
    for k in ('edificios', 'complementarios'):
        resumen[k] = {kk: vv for kk, vv in resumen[k].items() if kk != 'ids_quitados'}
    resumen['red_vial'] = {kk: (vv if not isinstance(vv, list) or len(vv) <= 3 else len(vv))
                           for kk, vv in resumen.get('red_vial', {}).items()}
    print(json.dumps(resumen, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
