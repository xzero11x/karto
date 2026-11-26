import * as Menu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, Layers } from 'lucide-react';
import { MAP_THEMES, THEME_NAMES, type MapTheme } from '../mapa/themes';

export function SelectorEstilo({
  tema,
  onCambio,
}: {
  tema: MapTheme;
  onCambio: (tema: MapTheme) => void;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        className="karto-style-trigger"
        aria-label={`Estilo del mapa: ${MAP_THEMES[tema].label}`}
      >
        <Layers size={16} aria-hidden="true" />
        <span>{MAP_THEMES[tema].label}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          className="karto-style-menu"
          align="start"
          sideOffset={8}
          collisionPadding={12}
        >
          <Menu.Label className="karto-style-label">Apariencia del mapa</Menu.Label>
          <Menu.RadioGroup value={tema} onValueChange={(value) => onCambio(value as MapTheme)}>
            {THEME_NAMES.map((name) => (
              <Menu.RadioItem className="karto-style-option" key={name} value={name}>
                <span className={`karto-style-swatch karto-swatch-${name}`} aria-hidden="true" />
                <span>{MAP_THEMES[name].label}</span>
                <Menu.ItemIndicator className="karto-style-check">
                  <Check size={16} />
                </Menu.ItemIndicator>
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
          <p className="karto-style-note">Overture Maps · cambia solo la apariencia</p>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
