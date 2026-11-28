# Base cartográfica coherente

La base es lo que va debajo de todo diseño (2D, 3D clásico y ciudad 3D): red vial, corredores,
veredas, manzanas, edificios, usos del suelo, equipamientos, lugares y árboles. Estas herramientas
la construyen desde fuentes abiertas y la dejan **coherente**:

- ningún edificio ni huella complementaria pisa la calzada ni el corredor de una vía;
- cada edificio cae dentro de una sola manzana;
- ninguna manzana pisa una calzada;
- ningún árbol está sobre la calzada.

## Fuentes

| Capa | Fuente | Licencia |
|---|---|---|
| Red vial | Overture 2026-09-23.1 (calles de OpenStreetMap), actualizada con OSM vigente | ODbL |
| Edificios | Overture (OSM, Microsoft, Google) | ODbL / CC BY 4.0 |
| Huellas complementarias | OSM, Microsoft, Google | ODbL / CC BY 4.0 |
| Equipamientos | Polígonos de OpenStreetMap (municipalidad, iglesia, hospitales, colegios…) | ODbL |
| Árboles | Meta y WRI, modelo de dosel 1 m | CC BY 4.0 |

Google Maps y Apple Maps no se usan como fuente: sus condiciones prohíben extraer su geometría.
Sirven solo como referencia visual.

## Modelo (en metros, UTM 17S)

1. **Red vial**: se agregan los tramos urbanos que OSM tiene y la base no (solo calles nuevas de
   al menos 30 m, no redibujos), y se quitan los que OSM ya borró.
2. **Alineación**: una traslación global de la red centra las calles entre sus fachadas (mínimos
   cuadrados sobre la asimetría izquierda/derecha de cada tramo).
3. **Corredor** de cada tramo: del eje a la línea de fachada, a cada lado (percentil 30 de la
   distancia a las fachadas reales, acotado por clase). La **calzada** va centrada (`ancho`) y lo
   que queda a cada lado es **vereda**. Propiedades en `red_vial`: `ancho`, `paramento_izq`,
   `paramento_der`.
4. **Manzanas**: caras de la red vehicular (sin los accesos de servicio) menos los corredores.
5. **Edificios**: se recortan a su manzana; si más de la mitad estaba en la vía, se quitan. También
   se quitan las falsas edificaciones dentro de plazas, parques y canchas (copas de árbol detectadas
   como techo) y las huellas complementarias duplicadas.
6. **Lugares**: se quitan las geocodificaciones de otras localidades y las de coordenadas
   aproximadas; se reubican con el polígono de OSM cuando coincide el equipamiento; los puntos
   que caían en la vía pasan al edificio más cercano.

## Fidelidad de los edificios (`edificios.py`)

1. **Ajuste por manzana**: antes de recortar, los edificios de cada manzana se trasladan como
   bloque (hasta 2,5 m) para que cada calle quede centrada entre sus dos frentes. Mínimos
   cuadrados conjuntos con todas las manzanas: `n·t_izq + n·t_der = d_der − d_izq` por tramo, más
   suavidad entre vecinas y preferencia por desplazamientos pequeños.
2. **Lotes del CAD municipal** (`datos-fuente/<ciudad>/privado/lotes_cad.geojson`, fuera del
   repositorio): están en el marco de los edificios de Google, así que se mueven con su manzana y
   se afinan ±1 m minimizando la diferencia simétrica con la manzana.
3. **Una casa por lote**: las huellas que el modelo fusionó sobre varios lotes se dividen por los
   lotes. Ninguna pieza queda con menos de 2,8 m de ancho (las tiras se unen a su vecina). No se
   dividen equipamientos (colegios, hospitales, mercado…) ni edificios de más de 1.500 m².
4. **Lotes vacíos con evidencia**: solo si la presencia de Google Open Buildings 2.5D (2023, 2 m;
   `presencia.py` la vectoriza en `origen/presencia_google.geojsonl`) cubre al menos el 35 % del
   lote. La huella va al frente del lote con el área construida medida; sin evidencia no se agrega
   nada.
5. **Fachadas y medianeras**: los vértices a menos de 0,7 m de la línea de fachada se pegan a
   ella; los huecos de menos de 0,5 m entre vecinas se cierran sin solaparlas.

Las piezas de una huella dividida conservan el id original con un sufijo (`<id>#1`, `<id>#2`) y la
propiedad `origen_id`; heredan su altura.

## Uso

```sh
# 1. (opcional) OSM vigente desde Overpass: vías y equipamientos del ámbito.
curl -s --data-urlencode 'data=[out:json][timeout:120];(way["highway"](S,W,N,E);way["building"](S,W,N,E);way["leisure"](S,W,N,E);way["landuse"](S,W,N,E);way["amenity"](S,W,N,E););out geom tags;' https://overpass-api.de/api/interpreter -o osm.json

# 2. Corregir (lee siempre de datos-fuente/<ciudad>/origen/, se puede repetir).
python herramientas/base/corregir.py bagua --osm osm.json

# 3. Verificar las reglas (sale con código 1 si alguna falla).
python herramientas/base/verificar.py bagua

# 4. Teselas.
python herramientas/generar_teselas.py bagua
```

Requiere Python con `shapely`, `pyproj` y `numpy`. El informe de cada corrección queda en
`datos-fuente/<ciudad>/base-informe.json`. Otras herramientas:

- `diagnostico.py`: mide la coherencia de cualquier versión de la base.
- `comparar_osm.py osm.json`: calles que faltan o sobran frente a OSM.
- `vista_previa.py`: PNG antes/después a 0,25 m/px (con rasterio).
