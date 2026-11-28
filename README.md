# karto

Mapa urbano para React, hecho con MapLibre y teselas propias (PMTiles) de Overture Maps. Incluye
seis temas, vistas 2D, 2.5D y 3D libre con transiciones de cámara, alturas de edificios,
edificaciones complementarias de otras fuentes abiertas, nombres de calles y una ficha al tocar
cualquier elemento. No necesita backend: los datos son archivos estáticos.

Cada ciudad es una carpeta de datos. La primera es **Bagua** (Amazonas, Perú).

## Instalar en un proyecto

Se instala directo desde GitHub, con una versión fija:

```sh
npm install maplibre-gl@^6.14 github:xzero11x/karto#v1.0.0
```

En `vite.config.ts`, el plugin publica los datos y el worker de MapLibre en `/karto/`, tanto en
desarrollo como al compilar:

```ts
import { karto } from 'karto/vite';

export default defineConfig({
  plugins: [react(), karto()], // karto({ ciudades: ['bagua'] }) para copiar solo algunas
});
```

En la aplicación:

```tsx
import { Karto } from 'karto';
import 'karto/estilos.css';

<div style={{ height: 600 }}>
  <Karto ciudad="bagua" temaInicial="positron" onSeleccion={(s) => console.log(s)} />
</div>;
```

El mapa ocupa todo su contenedor. Sin Vite, copia los datos a la carpeta pública con
`npx karto-datos public/karto` y sírvelos en `/karto/` (el servidor debe admitir rangos HTTP).

Para actualizar a otra versión: `npm install github:xzero11x/karto#v1.1.0`.

### Props de `<Karto />`

| Prop                                    | Para qué                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `ciudad`                                | Carpeta de datos de la ciudad (por defecto `bagua`)                                            |
| `datos`                                 | URL base de los datos (por defecto `/karto/`)                                                  |
| `temaInicial` · `tema` + `onTema`       | Tema: `positron`, `bagua` (a color), `bright`, `liberty`, `dark`, `fjord`, `mono`              |
| `vistaInicial` · `vista` + `onVista`    | Vista: `2d`, `2.5d`, `3d`                                                                      |
| `modo3dInicial` · `modo3d` + `onModo3d` | Edificios en 2.5D/3D: `clasico` (volúmenes simples, por defecto) o `ciudad` (ciudad detallada) |
| `leyenda`                               | Muestra la leyenda de colores (por defecto sí)                                                 |
| `controles`, `selectorTema`, `ficha`    | Muestran u ocultan cada parte de la interfaz (por defecto todas)                               |
| `alturasModeladas`                      | Muestra también las alturas modeladas (por defecto sí)                                         |
| `onSeleccion`                           | Elemento tocado: `{ tabla, id, propiedades }` o `null`                                         |
| `onMapa`                                | Instancia de MapLibre lista, para añadir capas propias                                         |
| `children`                              | Paneles o leyendas propios encima del mapa                                                     |

**Capas propias.** Con `onMapa` se pueden añadir capas (rutas, puntos, zonas). Para que queden
debajo de los nombres de calles, se insertan antes de la capa `bm-calles-texto`. Los id de capa
`bm-*` son estables entre versiones.

También se exportan `Mapa` (el visor sin interfaz), `buildStyle`, `MAP_THEMES`, `THEME_NAMES` y
los tipos.

## Desarrollar

```sh
npm install
npm run dev        # demo en http://127.0.0.1:5180 (?ciudad=bagua)
npm test           # valida el estilo de MapLibre y las anchuras de las vías
npm run build      # compila la librería en dist/
```

| Ruta                     | Qué es                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `src/karto.tsx`          | Componente completo: mapa, controles, temas, alturas y ficha                       |
| `src/mapa/style.ts`      | Estilo: capas, anchuras de vías, edificios 2D/3D, rótulos                          |
| `src/mapa/themes.ts`     | Paletas de los seis temas                                                          |
| `src/mapa/mapa.tsx`      | Visor MapLibre: vistas, cámara, selección, alturas y correcciones                  |
| `src/componentes/`       | Controles, selector de tema y ficha                                                |
| `src/estilos.css`        | Estilos, todos bajo `.karto` (variables `--karto-*`)                               |
| `vite.mjs`, `bin/`       | Plugin de Vite y comando `karto-datos`                                             |
| `datos/fuentes/`         | Tipografía Noto Sans, común a todas las ciudades                                   |
| `datos/<ciudad>/`        | `ciudad.json`, `teselas.pmtiles`, alturas, complemento, correcciones               |
| `datos-fuente/<ciudad>/` | Capas de origen de las teselas (GeoJSON por líneas)                                |
| `src/mapa/ciudad/`       | Ciudad 3D detallada: motor WebGL2 propio (worker, suelo, techos, árboles, tráfico) |
| `herramientas/`          | Generación de teselas con Docker (tippecanoe + pmtiles), capas extra y ciudad 3D   |
| `demo/`                  | Página de desarrollo                                                               |

### Publicar una versión

`dist/` se guarda en el repositorio, así instalar desde GitHub no compila nada. Para publicar:

```sh
npm version minor   # compila, añade dist/, crea el commit y la etiqueta (v1.1.0)
git push --follow-tags
```

### Agregar una ciudad

1. Crea `datos-fuente/<ciudad>/` con las capas (`red_vial`, `calles_rotulo`, `conectores`,
   `edificios`, `usos_suelo`, `agua`, `terreno`, `lugares` en `.geojsonl`) y su `ambito.json`.
2. Genera las teselas: `npm run teselas -- <ciudad>` (requiere Python 3 y la imagen Docker,
   ver abajo).
3. Crea `datos/<ciudad>/ciudad.json` (copia el de Bagua y cambia centro, límites, zoom y
   atribución). Alturas, complemento y correcciones son opcionales.
4. Úsala con `<Karto ciudad="<ciudad>" />`.

### Ciudad 3D detallada

El modo `ciudad` dibuja la ciudad con techos a una y dos aguas, fachadas, ventanas, sombras,
árboles reales, suelo por sectores, río, tráfico y peatones de ejemplo. Se activa con el botón
**Ciudad** de los controles (o `modo3dInicial="ciudad"`) y solo aparece si la ciudad tiene
`datos/<ciudad>/ciudad3d.json` y la clave `ciudad3d` en su `ciudad.json`. El 3D clásico no cambia.

El paquete y los árboles se generan desde la base de webgis-residuos (rama `main`, con los datos
importados); los pasos están en `herramientas/ciudad3d/LEEME.md`. El paquete usa como origen de
coordenadas el `centro` de `ciudad.json`: si cambia el centro, hay que regenerarlo.

### Capas extra de las teselas

Cobertura del suelo, árboles y superficie de las calles:

```sh
python herramientas/capas_extra.py bagua --parquet <descarga>/transportation_segment.parquet
```

Requiere `duckdb` y lee la cobertura de Overture en S3. Luego hay que regenerar las teselas.

### Regenerar las teselas

```sh
docker build -f herramientas/tiles.Dockerfile -t bagua-master-tiles:2.79.0 herramientas
npm run teselas -- bagua
```

Es reproducible: con las capas actuales sale idéntico byte a byte (sha256 en
`datos-fuente/bagua/teselas-manifiesto.json`). Después sube `revisionTeselas` en `ciudad.json`
para que los navegadores no usen una copia anterior.

## Fuentes y licencias (Bagua)

- Overture Maps Foundation 2026-09-23.1 y OpenStreetMap (ODbL).
- 61 rótulos de calles recuperados de planos municipales (DWG, sector Tomaque).
- Alturas: Google Open Buildings 2.5D Temporal 2023 (CC BY 4.0); el resto son alturas modeladas.
  La atribución cita también GlobalBuildingAtlas (CC BY-NC 4.0, uso no comercial).
- Edificaciones complementarias: OpenStreetMap y Microsoft (ODbL), Google (CC BY 4.0).
- Cobertura del suelo: ESA WorldCover vía Overture (CC BY 4.0).
- Árboles: Meta y World Resources Institute, High Resolution Canopy Height Maps v1 (CC BY 4.0).
- Ciudad 3D: techos y paredes según el Censo 2017 (INEI); los postes, las bancas, las señales,
  los vehículos y los peatones son representativos, no un levantamiento.
- Tipografía Noto Sans (SIL Open Font License, `datos/fuentes/OFL.txt`).

Las atribuciones se muestran en el mapa y deben mantenerse visibles.
