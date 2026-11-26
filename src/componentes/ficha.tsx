import { X } from 'lucide-react';
import type { Seleccion, Tabla } from '../tipos';

// Ficha del elemento tocado, con lo que traen sus teselas o su GeoJSON.
const TITULO: Record<Tabla, string> = {
  edificio: 'Edificación',
  edificio_complemento: 'Edificación complementaria',
  red_vial: 'Vía',
  conector: 'Intersección',
  lugar: 'Lugar',
  uso_suelo: 'Uso del suelo',
  agua: 'Agua',
  terreno: 'Terreno',
};
const ETIQUETA: Record<string, string> = {
  nombre: 'Nombre',
  clase: 'Clase',
  subtipo: 'Subtipo',
  categoria: 'Categoría',
  area_m2: 'Área',
  altura_m: 'Altura',
  tipo: 'Origen de la altura',
  fuente: 'Fuente',
  confianza: 'Confianza',
  origen_altura: 'Origen de la altura',
};

function valor(clave: string, v: unknown) {
  if (clave === 'area_m2') return `${Number(v).toLocaleString('es-PE')} m²`;
  if (clave === 'altura_m') return `${Number(v).toLocaleString('es-PE')} m`;
  return String(v).replaceAll('_', ' ');
}

export function Ficha({ seleccion, onCerrar }: { seleccion: Seleccion; onCerrar: () => void }) {
  const filas = Object.entries(seleccion.propiedades).filter(
    ([k, v]) => k in ETIQUETA && v !== null && v !== '' && v !== undefined,
  );
  const nombre = seleccion.propiedades.nombre;
  return (
    <aside className="karto-info" aria-label={TITULO[seleccion.tabla]}>
      <header>
        <div>
          <p className="karto-info-eyebrow">{TITULO[seleccion.tabla]}</p>
          <h2>{typeof nombre === 'string' && nombre ? nombre : 'Sin nombre'}</h2>
        </div>
        <button type="button" aria-label="Cerrar ficha" onClick={onCerrar}>
          <X size={18} />
        </button>
      </header>
      <dl>
        {filas
          .filter(([k]) => k !== 'nombre')
          .map(([k, v]) => (
            <div key={k}>
              <dt>{ETIQUETA[k]}</dt>
              <dd>{valor(k, v)}</dd>
            </div>
          ))}
        <div>
          <dt>Identificador</dt>
          <dd className="karto-info-id">{seleccion.id}</dd>
        </div>
      </dl>
    </aside>
  );
}
