"""Fidelidad de los edificios: ajuste por manzana, lotes del CAD, una casa por lote, lotes con
evidencia satelital, fachadas y medianeras. Lo usa corregir.py; todo en metros (UTM 17S)."""
import numpy as np
from shapely import STRtree, LineString, MultiPolygon, Point, Polygon, snap
from shapely.affinity import translate
from shapely.ops import unary_union

# Equipamientos que no se dividen por lotes (un colegio o un mercado es un solo conjunto).
INSTITUCIONAL = {'school', 'college', 'university', 'hospital', 'clinic', 'marketplace', 'stadium',
                 'townhall', 'police', 'place_of_worship', 'bus_station', 'cemetery', 'bank'}


def mayor(geom, minimo=6.0):
    if geom is None or geom.is_empty:
        return None
    geom = geom.buffer(0)
    if isinstance(geom, Polygon):
        return geom if geom.area >= minimo else None
    partes = [p for p in getattr(geom, 'geoms', []) if isinstance(p, Polygon) and p.area >= minimo]
    return max(partes, key=lambda p: p.area) if partes else None


def poligonos(geom, minimo=1.0):
    if geom is None or geom.is_empty:
        return []
    geom = geom.buffer(0)
    if isinstance(geom, Polygon):
        return [geom] if geom.area >= minimo else []
    return [p for p in getattr(geom, 'geoms', []) if isinstance(p, Polygon) and p.area >= minimo]


def ancho_minimo(p):
    """Lado corto del rectángulo mínimo que contiene el polígono (m)."""
    r = p.minimum_rotated_rectangle
    if r.geom_type != 'Polygon':
        return 0.0
    c = list(r.exterior.coords)
    lados = [np.hypot(c[i + 1][0] - c[i][0], c[i + 1][1] - c[i][1]) for i in range(2)]
    return min(lados)


def asignar(geoms, caras):
    """Índice de la cara (manzana bruta) que contiene el punto representativo de cada geometría."""
    arbol = STRtree(caras)
    out = []
    for g in geoms:
        p = g.representative_point()
        idx = [i for i in arbol.query(p, predicate='intersects')]
        out.append(idx[0] if idx else None)
    return out


# ------------------------------------------------------------------------------- 1. por manzana
def ajuste_por_manzana(vias, caras, dist, lam=1.0, mu=0.3, tope=2.5):
    """Traslación rígida de los edificios de cada cara para que cada calle quede centrada entre
    sus dos frentes. Mínimos cuadrados conjuntos:
      n·t_izq + n·t_der = d_der − d_izq   (simetría de cada tramo, n = normal izquierda)
      μ (t_izq − t_der) = 0                (manzanas vecinas se mueven parecido)
      λ t = 0                              (desplazamientos pequeños)
    """
    arbol = STRtree(caras)

    def cara(p):
        idx = arbol.query(p, predicate='intersects')
        return int(idx[0]) if idx.size else None

    ecuaciones = []
    for props, g in vias:
        lados = dist.get(props['id'])
        if not lados or g.length < 12:
            continue
        hi = [d for d in lados[1] if d is not None]
        hd = [d for d in lados[-1] if d is not None]
        n = len(lados[1])
        if len(hi) < max(3, 0.5 * n) or len(hd) < max(3, 0.5 * n):
            continue
        di, dd = np.percentile(hi, 30), np.percentile(hd, 30)
        if abs(dd - di) > 8:
            continue
        m = g.interpolate(0.5, normalized=True)
        a = g.interpolate(max(0, g.project(m) - 1))
        b = g.interpolate(min(g.length, g.project(m) + 1))
        tx, ty = b.x - a.x, b.y - a.y
        L = np.hypot(tx, ty) or 1
        nx, ny = -ty / L, tx / L
        fi = cara(Point(m.x + nx * 4, m.y + ny * 4))
        fd = cara(Point(m.x - nx * 4, m.y - ny * 4))
        if fi is None or fd is None or fi == fd:
            continue
        ecuaciones.append((fi, fd, nx, ny, dd - di, np.sqrt(g.length)))
    usadas = sorted({e[0] for e in ecuaciones} | {e[1] for e in ecuaciones})
    col = {f: i for i, f in enumerate(usadas)}
    k = len(usadas)
    filas, rhs = [], []
    for fi, fd, nx, ny, r, w in ecuaciones:
        fila = np.zeros(2 * k)
        fila[2 * col[fi]], fila[2 * col[fi] + 1] = nx * w, ny * w
        fila[2 * col[fd]] += nx * w
        fila[2 * col[fd] + 1] += ny * w
        filas.append(fila)
        rhs.append(r * w)
        for eje in (0, 1):
            fila = np.zeros(2 * k)
            fila[2 * col[fi] + eje] = mu * w
            fila[2 * col[fd] + eje] = -mu * w
            filas.append(fila)
            rhs.append(0.0)
    for i in range(2 * k):
        fila = np.zeros(2 * k)
        fila[i] = lam
        filas.append(fila)
        rhs.append(0.0)
    A, b = np.array(filas), np.array(rhs)
    t = np.linalg.lstsq(A, b, rcond=None)[0].reshape(-1, 2)
    norma = np.hypot(t[:, 0], t[:, 1])
    escala = np.minimum(1, tope / np.maximum(norma, 1e-9))
    t = t * escala[:, None]
    antes = [abs(e[4]) / 2 for e in ecuaciones]
    despues = [abs(e[4] - (e[2] * (t[col[e[0]], 0] + t[col[e[1]], 0]) +
                           e[3] * (t[col[e[0]], 1] + t[col[e[1]], 1]))) / 2 for e in ecuaciones]
    info = {'tramos': len(ecuaciones), 'manzanas_ajustadas': k,
            'desplazamiento_mediano_m': round(float(np.median(norma)), 2) if k else 0,
            'desplazamiento_max_m': round(float(np.max(np.hypot(t[:, 0], t[:, 1]))), 2) if k else 0,
            'descentrado_antes_m': round(float(np.median(antes)), 2) if antes else 0,
            'descentrado_despues_m': round(float(np.median(despues)), 2) if despues else 0}
    return {f: (float(t[col[f], 0]), float(t[col[f], 1])) for f in usadas}, info


def mover(capa, caras, t_cara):
    destino = asignar([g for _, g in capa], caras)
    out = []
    for (p, g), f in zip(capa, destino):
        dx, dy = t_cara.get(f, (0.0, 0.0)) if f is not None else (0.0, 0.0)
        out.append((p, translate(g, dx, dy) if (dx or dy) else g))
    return out


# ------------------------------------------------------------------------------- 2. lotes
def alinear_lotes(lotes, manzanas, caras, t_cara, rango=1.0, paso=0.25, prior=0.02):
    """Los lotes del CAD están en el marco de los edificios de Google: se mueven con la misma
    traslación de su manzana y luego se afina ±1 m minimizando la diferencia simétrica entre la
    unión de los lotes y la manzana (con un término que prefiere no moverlos). Se recortan a ella."""
    lotes = mover([({}, g) for g in lotes], caras, t_cara)
    lotes = [g for _, g in lotes]
    arbol = STRtree(manzanas)
    grupos = {}
    for lot in lotes:
        p = lot.representative_point()
        idx = arbol.query(p.buffer(3), predicate='intersects')
        if idx.size:
            m = max(idx, key=lambda i: manzanas[i].intersection(p.buffer(3)).area)
            grupos.setdefault(int(m), []).append(lot)
    out, movs, encaje = [], [], []
    for m, grupo in grupos.items():
        mz = manzanas[m]
        U = unary_union(grupo)

        def costo(dx, dy):
            return translate(U, dx, dy).symmetric_difference(mz).area / mz.area + prior * (dx * dx + dy * dy)

        mejor = (costo(0.0, 0.0), 0.0, 0.0)
        for dx in np.arange(-rango, rango + 1e-9, paso):
            for dy in np.arange(-rango, rango + 1e-9, paso):
                c = costo(float(dx), float(dy))
                if c < mejor[0] - 1e-9:
                    mejor = (c, float(dx), float(dy))
        movs.append(np.hypot(mejor[1], mejor[2]))
        Ut = translate(U, mejor[1], mejor[2])
        encaje.append(Ut.intersection(mz).area / max(1e-9, Ut.area))
        for lot in grupo:
            r = mayor(translate(lot, mejor[1], mejor[2]).intersection(mz), 15)
            if r is not None:
                out.append((m, r))
    info = {'lotes': len(lotes), 'lotes_en_manzanas': len(out), 'manzanas_con_lotes': len(grupos),
            'afinado_mediano_m': round(float(np.median(movs)), 2) if movs else 0,
            'encaje_mediano': round(float(np.median(encaje)), 3) if encaje else 0}
    return out, info


# ------------------------------------------------------------------------------- 3. una casa por lote
def dividir_por_lotes(capa, lotes, excluir, ocultos):
    """Divide las huellas que abarcan varios lotes (casas vecinas fusionadas por el modelo)."""
    geoms_l = [g for _, g in lotes]
    arbol_l = STRtree(geoms_l)
    arbol_x = STRtree(excluir) if excluir else None
    out, divididos, piezas_total = [], 0, 0
    for props, g in capa:
        pid = props.get('id')
        if g.area > 1500 or pid in ocultos or (arbol_x is not None and any(
                excluir[i].intersection(g).area > 0.5 * g.area for i in arbol_x.query(g, predicate='intersects'))):
            out.append((props, g))
            continue
        cand = []
        for i in arbol_l.query(g, predicate='intersects'):
            a = g.intersection(geoms_l[i]).area
            if a >= 12 and a >= 0.1 * g.area:
                cand.append(i)
        if len(cand) < 2 or sum(g.intersection(geoms_l[i]).area for i in cand) < 0.7 * g.area:
            out.append((props, g))
            continue
        piezas = [mayor(g.intersection(geoms_l[i]), 12) for i in cand]
        piezas = [p for p in piezas if p is not None]
        if len(piezas) < 2:
            out.append((props, g))
            continue
        resto = g.difference(unary_union(piezas))
        for parte in poligonos(resto, 0.5):
            area, j = max((parte.buffer(0.05).intersection(p).area, j) for j, p in enumerate(piezas))
            if area > 0:
                piezas[j] = mayor(unary_union([piezas[j], parte]).buffer(0.01).buffer(-0.01), 1) or piezas[j]
            elif parte.area >= 12:
                piezas.append(parte)
        # Una casa no mide menos de 2,8 m de ancho: las tiras (lote que no coincide con la pared
        # real) se unen a la vecina con la que comparten más pared.
        while len(piezas) >= 2:
            angostas = [j for j, p in enumerate(piezas) if ancho_minimo(p) < 2.8]
            if not angostas:
                break
            j = min(angostas, key=lambda j: piezas[j].area)
            comun, k = max((piezas[j].buffer(0.05).intersection(p).area, k)
                           for k, p in enumerate(piezas) if k != j)
            if comun <= 0:
                piezas.pop(j)
                continue
            unida = mayor(unary_union([piezas[k], piezas[j]]).buffer(0.01).buffer(-0.01), 1)
            piezas[k] = unida or piezas[k]
            piezas.pop(j)
        if len(piezas) < 2:
            out.append((props, g))
            continue
        divididos += 1
        piezas_total += len(piezas)
        for k, pieza in enumerate(sorted(piezas, key=lambda p: (-p.centroid.y, p.centroid.x)), start=1):
            out.append(({**props, 'id': f'{pid}#{k}', 'origen_id': pid}, pieza))
    return out, {'divididos': divididos, 'piezas': piezas_total}


# ------------------------------------------------------------------------------- 4. lotes vacíos
def completar_lotes(lotes, huellas, presencia, manzanas, minimo_frac=0.35):
    """Agrega una edificación en lotes sin huella solo donde la presencia satelital lo confirma:
    al frente del lote (las casas de Bagua arrancan en la fachada), con el área construida medida."""
    arbol_h = STRtree(huellas)
    geoms_p = [g for _, g in presencia]
    arbol_p = STRtree(geoms_p)
    nuevos = []
    for k, (m, lot) in enumerate(lotes):
        if lot.area < 40:
            continue
        cerca = [huellas[i] for i in arbol_h.query(lot, predicate='intersects')]
        ocupado = unary_union(cerca).intersection(lot).area if cerca else 0
        if ocupado >= 0.15 * lot.area:
            continue
        idx = arbol_p.query(lot, predicate='intersects')
        if not idx.size:
            continue
        evid = unary_union([geoms_p[i] for i in idx]).intersection(lot)
        if evid.area < minimo_frac * lot.area:
            continue
        frente = lot.boundary.intersection(manzanas[m].boundary.buffer(0.8))
        largo = frente.length if not frente.is_empty else 0
        if largo >= 3:
            fondo = min(25.0, max(4.0, evid.area / largo))
            huella = lot.intersection(frente.buffer(fondo, cap_style='square'))
        else:
            huella = evid.buffer(0.5).minimum_rotated_rectangle.intersection(lot)
        if cerca:
            huella = huella.difference(unary_union(cerca))
        huella = mayor(huella, 20)
        if huella is None:
            continue
        alturas = [(presencia[i][0].get('altura_m') or 0, geoms_p[i].intersection(lot).area) for i in idx]
        peso = sum(a for _, a in alturas)
        altura = sum(h * a for h, a in alturas) / peso if peso else 3.0
        nuevos.append(({'id': f'lote-{k:05d}', 'fuente': 'google_presencia_lote', 'confianza': 'media',
                        'altura_m': round(min(12.0, max(2.5, altura)), 1), 'origen_altura': 'google_2_5d',
                        'area_m2': round(huella.area)}, huella))
    return nuevos


# ------------------------------------------------------------------------------- 5. fachadas
def ajustar_fachadas(capas, manzanas, tol_fachada=0.7, tol_medianera=0.5):
    """Fachadas sobre la línea de fachada y medianeras sin huecos falsos ni solapes.
    capas: lista de listas (props, geom); devuelve las mismas listas ajustadas."""
    todas = [(c, i, g) for c, capa in enumerate(capas) for i, (_, g) in enumerate(capa)]
    manz_de = asignar([g for _, _, g in todas], manzanas)
    por_manzana = {}
    for item, m in zip(todas, manz_de):
        por_manzana.setdefault(m, []).append(item)
    nuevas = [list(capa) for capa in capas]
    pegadas = 0
    for m, items in por_manzana.items():
        mz = manzanas[m] if m is not None else None
        hechas = []
        for c, i, g in sorted(items, key=lambda x: -x[2].area):
            g2 = g
            if mz is not None:
                s = snap(g, mz.boundary, tol_fachada).buffer(0).intersection(mz)
                s = mayor(s, 6)
                if s is not None and abs(s.area - g.area) < 0.2 * g.area:
                    g2 = s
            if hechas:
                vecinas = unary_union([h for h in hechas if h.distance(g2) < tol_medianera + 0.01])
                if not vecinas.is_empty:
                    s = snap(g2, vecinas, tol_medianera).buffer(0).difference(vecinas)
                    s = mayor(s, 6)
                    if s is not None and abs(s.area - g2.area) < 0.2 * g2.area:
                        pegadas += s.area > g2.area + 0.05
                        g2 = s
            hechas.append(g2)
            nuevas[c][i] = (nuevas[c][i][0], g2)
    return nuevas, {'medianeras_cerradas': int(pegadas)}
