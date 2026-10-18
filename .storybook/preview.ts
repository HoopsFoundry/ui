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
// Sprache der Bausteine: Die Bibliothek startet mit Englisch (Katalog im Kern), dieser Import registriert den deutschen Katalog. Welche Sprache
// gilt, wählt der Umschalter „Sprache“ in der Werkzeugleiste (Global `locale`, Start `de`, weil die Doku-Texte deutsch sind); der Decorator unten
// ruft `setLocale`. Svelte-Komponenten rendern über das Abonnement am Kern neu, gemountete Vanilla-Bausteine über `hoops:localechange`.
import '../js/i18n/de-register.js';
import { getLocale, setLocale } from '../js/i18n/index.js';

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
    locale: {
      description: 'Sprache der eingebauten Texte (setLocale); die Doku-Texte bleiben deutsch',
      toolbar: {
        title: 'Sprache',
        icon: 'globe',
        items: [
          { value: 'de', title: 'Deutsch (de)' },
          { value: 'en', title: 'English (en)' },
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
    locale: 'de',
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
        page: { name: 'page',     value: 'var(--hoops-page-bg)' },
        surface: { name: 'surface',  value: 'var(--hoops-page-surface-0)' },
        kampf: { name: 'kampf',    value: 'var(--hoops-n-1000)' }
      }
    },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Foundation', ['Colors', 'Typography', 'Headings', 'Focus & Hover', 'Live', 'Dark Mode', 'Vanilla', 'Internationalisierung'],
          'Components', ['Button', 'TextInput', 'Select', 'Checkbox', 'Modal', 'Banner', 'Card', 'Card Library', 'TeamCard', 'LeagueCard', 'Kennzahlen', 'Map', 'VenueCard', 'Tabs', 'Accordion', 'PageNav', 'Navigation', 'AppNav', 'Table', 'Spielplan', ['Spielplan', 'Tabelle', 'Zeitraster', 'Spielwiese'], 'EmptyState', 'CourtLines', 'PlayByPlay', 'Icon'],
        ],
      },
    },
    a11y: {
      // HoopsFoundry UI targets WCAG 2.1 AAA on text pairs
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
      // Sprache der Bausteine (Umschalter „Sprache“): nur bei einem Wechsel setzen, sonst meldete jeder Durchlauf allen Abonnenten eine Änderung.
      // Svelte-Komponenten und gemountete Vanilla-Bausteine folgen dem Kern ohne Neuaufbau der Story.
      const locale = context.globals.locale === 'en' ? 'en' : 'de';
      if (getLocale() !== locale) setLocale(locale);
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
