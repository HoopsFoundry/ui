import type { Preview } from '@storybook/svelte-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';

// Pull in design-system tokens so every story renders with the real
// color, type, spacing scale.
import '../fonts/fonts.css';
import '../tokens/tokens.css';
import '../css/components.css';
import 'leaflet/dist/leaflet.css';
import './storybook.css';
import { installPseudoStates } from './pseudo-states';
import { setForcedState, type ForcedState } from './state-switch';


const preview: Preview = {
  globalTypes: {
    brand: {
      description: 'Marke',
      toolbar: {
        title: 'Marke',
        icon: 'paintbrush',
        items: [
          { value: 'bbv', title: 'BBV (Ink · Amber · Sky)' },
          { value: 'dbb', title: 'DBB (Schwarz · Gold · Orange)' },
        ],
        dynamicTitle: true,
      },
    },
    type: {
      description: 'Schrift',
      toolbar: {
        title: 'Schrift',
        icon: 'edit',
        items: [
          { value: 'standard', title: 'Standard (Sora · Manrope)' },
          { value: 'dbb', title: 'DBB-Original (Rubik · Sucrose*)' },
        ],
        dynamicTitle: true,
      },
    },
    framework: {
      description: 'Fassung der Code-Beispiele',
      toolbar: {
        title: 'Fassung',
        icon: 'code',
        items: [
          { value: 'vanilla', title: 'Vanilla (HTML + CSS)' },
          { value: 'svelte', title: 'Svelte' },
          { value: 'react', title: 'React' },
        ],
        dynamicTitle: true,
      },
    },
    motion: {
      description: 'Bewegung (Live-Puls); Reduziert setzt data-motion="reduce" auf <html>',
      toolbar: {
        title: 'Bewegung',
        icon: 'play',
        items: [
          { value: 'normal', title: 'Normal' },
          { value: 'reduce', title: 'Reduziert (Pause)' },
        ],
        dynamicTitle: true,
      },
    },
    state: {
      description: 'Zustand erzwingen (Hover, Fokus, Aktiv)',
      toolbar: {
        title: 'Zustand',
        icon: 'lightning',
        items: [
          { value: 'normal', title: 'Normal' },
          { value: 'hover', title: 'Hover' },
          { value: 'focus', title: 'Fokus' },
          { value: 'active', title: 'Aktiv' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    brand: 'bbv',
    type: 'standard',
    framework: 'svelte',
    motion: 'normal',
    state: 'normal',

    backgrounds: {
      value: 'page'
    }
  },
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    backgrounds: {
      options: {
        page: { name: 'page',     value: 'var(--page-bg)' },
        surface: { name: 'surface',  value: 'var(--surface-0)' },
        kampf: { name: 'kampf',    value: 'var(--n-1000)' }
      }
    },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Foundation', ['Colors', 'Typography', 'Headings', 'Focus & Hover', 'Live'],
          'Components', ['Button', 'TextInput', 'Select', 'Checkbox', 'Modal', 'Banner', 'Card', 'Card Library', 'TeamCard', 'LeagueCard', 'Map', 'VenueCard', 'Tabs', 'Accordion', 'Navigation', 'AppNav', 'Table', 'Spielplan', ['Spielplan', 'Tabelle', 'Zeitraster', 'Spielwiese'], 'EmptyState', 'CourtLines', 'PlayByPlay', 'Icon'],
        ],
      },
    },
    a11y: {
      // DSS targets WCAG 2.1 AAA on text pairs
      config: { rules: [{ id: 'color-contrast', enabled: true }] },
    },
  },
  decorators: [
    (story, context) => {
      installPseudoStates(); // idempotent: Kopien der Hover-/Fokus-/Active-Regeln für feste Zustands-Vorschauen
      const brand = context.globals.brand;
      if (brand === 'dbb') document.documentElement.setAttribute('data-brand', 'dbb');
      else document.documentElement.removeAttribute('data-brand');
      if (context.globals.type === 'dbb') document.documentElement.setAttribute('data-type', 'dbb');
      else document.documentElement.removeAttribute('data-type');
      // Code-Beispiele der Spec-Seiten folgen dem Umschalter "Fassung" (reines CSS, siehe stories/docs/blocks/useActiveFramework.ts)
      document.documentElement.dataset.framework = context.globals.framework ?? 'svelte';
      // Pause-Schalter der Live-Animation (wie in der App: Attribut auf <html>)
      if (context.globals.motion === 'reduce') document.documentElement.dataset.motion = 'reduce';
      else delete document.documentElement.dataset.motion;
      setForcedState((context.globals.state ?? 'normal') as ForcedState);
      return story();
    },
    withThemeByDataAttribute({
      themes: { Light: 'light', Dark: 'dark' },
      defaultTheme: 'Light',
      attributeName: 'data-theme',
    }),
  ],
};

export default preview;
