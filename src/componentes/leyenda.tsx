import { ROOF_COLORS, ROOF_LABELS } from '../mapa/ciudad/palette';
import { MAP_THEMES, type MapTheme } from '../mapa/themes';
import type { Vista } from '../tipos';

type Item = { label: string; color: string; shape?: 'dot' | 'line' };

// Leyenda del mapa: qué significa cada color en el tema elegido. Se abre bajo demanda.
export function Leyenda({
  tema: theme,
  vista: view,
  ciudad3d,
}: {
  tema: MapTheme;
  vista: Vista;
  ciudad3d: boolean;
}) {
  const P = MAP_THEMES[theme].palette;
  const roofs: Item[] = P.techosColor
    ? [0, 7, 1, 4, 3, 2, 8].map((i) => ({ label: ROOF_LABELS[i]!, color: ROOF_COLORS[i]! }))
    : [{ label: 'Edificaciones', color: P.edificio }];
  const groups: { title: string; items: Item[] }[] = [
    { title: P.techosColor ? 'Techos' : 'Edificios', items: roofs },
    {
      title: 'Vías',
      items: [
        { label: 'Carretera', color: P.troncal, shape: 'line' },
        { label: 'Avenida', color: P.principal, shape: 'line' },
        { label: 'Calle', color: P.local, shape: 'line' },
      ],
    },
    {
      title: 'Áreas',
      items: [
        { label: 'Árboles', color: P.arbol, shape: 'dot' },
        { label: 'Bosque', color: P.cobBosque },
        { label: 'Cultivos y arrozales', color: P.cobCultivo },
        { label: 'Parques', color: P.verde },
        { label: 'Canchas', color: P.deporte },
        { label: 'Colegios', color: P.educacion },
        { label: 'Salud', color: P.salud },
        { label: 'Ríos', color: P.agua },
      ],
    },
    {
      title: 'Lugares',
      items: [
        { label: 'Comida', color: P.poiComida, shape: 'dot' },
        { label: 'Comercio', color: P.poiComercio, shape: 'dot' },
        { label: 'Salud', color: P.poiSalud, shape: 'dot' },
        { label: 'Educación', color: P.poiEducacion, shape: 'dot' },
        { label: 'Hospedaje', color: P.poiHospedaje, shape: 'dot' },
        { label: 'Iglesias y cultura', color: P.poiCultura, shape: 'dot' },
        { label: 'Ocio y deporte', color: P.poiOcio, shape: 'dot' },
        { label: 'Servicios públicos', color: P.poiServicio, shape: 'dot' },
      ],
    },
  ];
  return (
    <details className="karto-legend" data-testid="karto-leyenda">
      <summary>Leyenda</summary>
      <div className="karto-legend-body">
        {groups.map((group) => (
          <section key={group.title}>
            <h3>{group.title}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item.label}>
                  <span
                    className={`karto-legend-swatch karto-legend-${item.shape ?? 'area'}`}
                    style={{ background: item.color }}
                    aria-hidden="true"
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          </section>
        ))}
        {view !== '2d' && ciudad3d && (
          <p className="karto-legend-note">
            Techos y paredes según el Censo 2017 (INEI) para las viviendas urbanas de Bagua:
            calamina o fibrocemento 67 %, concreto 29 %; ladrillo 49 %, adobe 45 %, quincha 4 %. Una
            y dos plantas. Árboles por satélite (Meta y WRI). Calles sin pavimentar, plazas,
            parques, estadio y canchas según OpenStreetMap; el resto del suelo varía por sector. La
            casa concreta, los postes, las bancas, las señales y los vehículos son representativos,
            no un levantamiento.
          </p>
        )}
      </div>
    </details>
  );
}
