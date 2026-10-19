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
// gilt, wählt der Umschalter „Sprache“ in der Werkzeugleiste (Global `locale`, Start `de`, weil die Doku-Texte deutsch sind). `applyLocale`
// läuft als `beforeEach` vor jedem Rendern, nicht im Decorator (dort liefe `setLocale` mitten im Svelte-Rendern); nach einem Wechsel baut
// Storybook die Stories neu auf (neue Knoten, Fokus auf `body`). `<html lang>` ist `de`, die Sprache der Doku-Texte.
import '../js/i18n/de-register.js';
import { applyLocale } from './locale';
import { applyBrand } from './brand';
import { BREITEN, VIEWPORT_OPTIONS, type Breite } from './breite';

const preview: Preview = {
  globalTypes: {
    brand: {
      description: 'Marke mit ihrer Schrift (BBV: Sora und Manrope, DBB: Rubik und Sucrose); setzt data-brand und data-type',
      toolbar: {
        title: 'Marke',
        icon: 'paintbrush',
        items: [
          { value: 'bbv', title: 'BBV (Ink · Amber · Sky; Sora · Manrope)' },
          { value: 'dbb', title: 'DBB (Schwarz · Gold · Orange; Rubik · Sucrose*)' },
        ],
        dynamicTitle: true,
      },
    },
    breite: {
      description: 'Breite der eingebetteten Vorschauen (Docs-Seiten); das Viewport-Werkzeug von Storybook wirkt nur in der Story-Ansicht',
      toolbar: {
        title: 'Breite',
        icon: 'mobile',
        items: (Object.keys(BREITEN) as Breite[]).map((value) => ({ value, title: BREITEN[value].title })),
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
    breite: 'voll',
    framework: 'svelte',
    motion: 'normal',
    locale: 'de',
    state: 'normal',

    backgrounds: {
      value: 'page'
    }
  },
  parameters: {
    // Sprache der Doku für Hilfstechnik: Storybook setzt `lang` an den Docs-Inhalt (`docs.lang`) und an jede eingebettete Story (`htmlLang`),
    // Standard wäre `en`. Die Doku ist deutsch; Bausteine in Englisch tragen dann `lang="en"` an ihrer Wurzel.
    htmlLang: 'de',
    docs: { lang: 'de' },
    // Viewport-Werkzeug der Story-Ansicht mit denselben Geräten wie der Umschalter „Breite“ (in der Docs-Ansicht wirkt es nicht, siehe breite.ts)
    viewport: { options: VIEWPORT_OPTIONS },
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
          'Foundation', ['Colors', 'Typography', 'Headings', 'Focus & Hover', 'Live', 'Dark Mode', 'Vanilla', 'Internationalisierung', 'Logo'],
          'Components', ['Button', 'TextInput', 'Select', 'Checkbox', 'Modal', 'Banner', 'Card', 'Card Library', 'TeamCard', 'LeagueCard', 'Kennzahlen', 'Map', 'VenueCard', 'Tabs', 'Accordion', 'PageNav', 'Navigation', 'AppNav', 'Table', 'Spielplan', ['Spielplan', 'Tabelle', 'Zeitraster', 'Spielwiese'], 'EmptyState', 'CourtLines', 'PlayByPlay', 'Icon'],
        ],
      },
    },
    a11y: {
      // HoopsFoundry UI targets WCAG 2.1 AAA on text pairs
      config: { rules: [{ id: 'color-contrast', enabled: true }] },
    },
  },
  // Sprache vor jedem Rendern (auch nach einem Wechsel der Globals), außerhalb des Svelte-Renderns; siehe .storybook/locale.ts
  beforeEach: [(context) => {
    applyLocale(context.globals);
  }],
  decorators: [
    (story, context) => {
      installPseudoStates(); // idempotent: Kopien der Hover-/Fokus-/Active-Regeln für feste Zustands-Vorschauen
      applyBrand(context.globals); // Marke und Schrift gekoppelt: data-brand und data-type (.storybook/brand.ts)
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
