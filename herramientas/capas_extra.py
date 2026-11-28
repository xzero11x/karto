"""Capas adicionales de una ciudad en datos-fuente/<ciudad>/, desde fuentes abiertas reales.

- cobertura.geojsonl: cobertura del suelo de Overture (base/land_cover, derivada de ESA WorldCover):
  bosque, cultivos (arrozales), pastos, matorral, suelo desnudo, humedal. Se lee de la versión
  publicada COBERTURA_VERSION (la cobertura no depende de la versión de calles y edificios).
- arboles.geojsonl: copas de datos-fuente/<ciudad>/arboles.json (modelo de dosel de Meta y WRI, 1 m).
- red_vial.geojsonl: añade `superficie` (paved/unpaved) desde road_surface del Parquet de Overture
  con el que se hicieron las calles (opcional: --parquet ruta/transportation_segment.parquet).

Después: python herramientas/generar_teselas.py <ciudad>.
Uso: python herramientas/capas_extra.py bagua [--parquet RUTA] [--sin-cobertura]
"""
import argparse
import json
import re
from pathlib import Path

import duckdb

ROOT = Path(__file__).resolve().parents[1]
COBERTURA_VERSION = '2026-11-18.0'


def connect(region):
    con = duckdb.connect()
    con.execute(f"INSTALL spatial; LOAD spatial; INSTALL httpfs; LOAD httpfs; SET s3_region='{region}';")
    return con


def land_cover(con, in_dir, bbox):
    xmin, ymin, xmax, ymax = bbox
    glob = f's3://overturemaps-us-west-2/release/{COBERTURA_VERSION}/theme=base/type=land_cover/*'
    rows = con.execute(f"""
        SELECT id, subtype, ST_AsGeoJSON(ST_Intersection(geometry,
               ST_MakeEnvelope({xmin}, {ymin}, {xmax}, {ymax})))
        FROM read_parquet('{glob}', hive_partitioning=1)
        WHERE bbox.xmax >= {xmin} AND bbox.xmin <= {xmax} AND bbox.ymax >= {ymin} AND bbox.ymin <= {ymax}
        ORDER BY id
    """).fetchall()
    count = {}
    with (in_dir / 'cobertura.geojsonl').open('w', encoding='utf8', newline='\n') as out:
        for fid, subtype, geometry in rows:
            g = json.loads(geometry)
            if g['type'] not in ('Polygon', 'MultiPolygon'):
                continue
            count[subtype] = count.get(subtype, 0) + 1
            out.write(json.dumps({'type': 'Feature', 'properties': {'id': fid, 'clase': subtype},
                                  'geometry': g}) + '\n')
    return count


def trees(in_dir):
    source = in_dir / 'arboles.json'
    if not source.exists():
        return 0
    data = json.loads(source.read_text(encoding='utf8'))
    with (in_dir / 'arboles.geojsonl').open('w', encoding='utf8', newline='\n') as out:
        for lng, lat, h, r in data['arboles']:
            out.write(json.dumps({'type': 'Feature', 'properties': {'h': h, 'r': r},
                                  'geometry': {'type': 'Point', 'coordinates': [lng, lat]}}) + '\n')
    return len(data['arboles'])


def surfaces(con, in_dir, parquet):
    rows = con.execute(f"""
        SELECT id, CAST(road_surface AS VARCHAR) FROM read_parquet('{Path(parquet).as_posix()}')
        WHERE road_surface IS NOT NULL
    """).fetchall()
    surface = {}
    for fid, raw in rows:
        # DuckDB 2 escribe los valores sin comillas: [{'value': unpaved, 'between': NULL}].
        found = set(re.findall(r'\b(unpaved|paved|gravel|dirt)\b', raw))
        if found:
            surface[fid] = 'unpaved' if found & {'unpaved', 'gravel', 'dirt'} else 'paved'
    path = in_dir / 'red_vial.geojsonl'
    lines = path.read_text(encoding='utf8').splitlines()
    tagged = 0
    with path.open('w', encoding='utf8', newline='\n') as out:
        for line in lines:
            feature = json.loads(line)
            value = surface.get(feature['properties'].get('id'))
            if value:
                feature['properties']['superficie'] = value
                tagged += 1
            out.write(json.dumps(feature, ensure_ascii=False) + '\n')
    return tagged


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('ciudad', nargs='?', default='bagua')
    parser.add_argument('--parquet', help='transportation_segment.parquet de la versión de las calles')
    parser.add_argument('--sin-cobertura', action='store_true')
    args = parser.parse_args()
    in_dir = ROOT / 'datos-fuente' / args.ciudad
    cfg = json.loads((in_dir / 'ambito.json').read_text(encoding='utf8'))
    con = connect(cfg['overture']['region_s3'])
    report = {'arboles': trees(in_dir)}
    if not args.sin_cobertura:
        report['cobertura'] = land_cover(con, in_dir, cfg['ambito']['descarga_bbox'])
    if args.parquet:
        report['vias_con_superficie'] = surfaces(con, in_dir, args.parquet)
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
