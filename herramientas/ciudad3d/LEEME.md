# Ciudad 3D: paquete `ciudad3d.json`

El paquete de la ciudad 3D se genera **solo con archivos de karto**, desde la base corregida
(`herramientas/base`). No necesita base de datos.

```sh
python herramientas/base/corregir.py bagua      # base coherente (calles, manzanas, edificios)
python herramientas/base/verificar.py bagua     # reglas de coherencia
python herramientas/ciudad3d/generar.py bagua   # datos/bagua/ciudad3d.json
```

Contenido (coordenadas enteras en decímetros, locales al `centro` de `ciudad.json`):

| Clave | Qué es |
|---|---|
| `edificios` | Edificios de Overture divididos por lote y huellas complementarias, con pisos: altura satelital / 2,8 m donde hay medición; en el resto, 72 % una planta y 28 % dos |
| `vias` | Calles con su clase, tierra, berma verde y malecón |
| `anchos` | Por calle: media calzada y distancia del eje a cada fachada; el motor dibuja calzada y veredas con estas medidas |
| `arboles` | Copas del modelo de dosel de Meta y WRI, fuera de la calzada |
| `suelo.areas` | Plazas, parques, estadio, canchas, colegios, cementerio y hospitales |
| `suelo.especiales` | Edificios con forma propia, tomados de los polígonos de OpenStreetMap: municipalidad, iglesia, comisaría, hospitales, colegios, mercado y terminal |
| `suelo.agua`, `rios`, `piscinas` | Río Utcubamba y piscina municipal |

## Árboles (opcional, se regeneran pocas veces)

`arboles.py` detecta copas en el modelo de dosel de Meta y WRI (1 m) y descarta las que caen
dentro de edificaciones. Hoy lee los edificios de la base de datos de webgis-residuos; corre en la
imagen Docker de alturas:

```sh
docker compose -f compose.yaml -f infrastructure/compose.heights.yaml run --rm \
  -e BAGUA_HEIGHTS_DIRECT_DB=1 \
  -v "$KARTO/herramientas/ciudad3d/arboles.py:/app/k/bm/arboles.py:ro" \
  -v "$KARTO/datos-fuente/bagua:/app/data/bagua-master/ciudad" \
  heights python k/bm/arboles.py
```

`paquete.ts` y `generar.mts` son el generador anterior (desde PostGIS); quedan como referencia.
