// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const css = readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');
const hasClass = (name: string) => new RegExp(`\\.${name}(?![\\w-])`).test(css);

// Klassen, die React-Paket und neue Svelte-Komponenten voraussetzen (v0.7).
const REQUIRED = [
  // Button
  'hoops-btn--danger', 'is-touch',
  // Felder
  'hoops-field-label', 'hoops-field-help', 'hoops-field-help--err', 'hoops-field-help--ok',
  'hoops-field-help--warn', 'is-error', 'is-ok', 'is-warn',
  'hoops-input--default', 'hoops-input--compact', 'hoops-addon--right', 'hoops-select--compact',
  // Banner
  'hoops-banner', 'hoops-banner--info', 'hoops-banner--ok', 'hoops-banner--warn', 'hoops-banner--danger',
  'hoops-banner-icon', 'hoops-banner-body', 'hoops-banner-title',
  // Modal
  'hoops-backdrop', 'hoops-modal-wrap', 'hoops-modal', 'hoops-modal--sm', 'hoops-modal--wide', 'hoops-modal--xwide',
  'hoops-m-head', 'hoops-m-head-icon', 'hoops-m-head-icon--danger', 'hoops-m-head-icon--warn',
  'hoops-m-head-icon--ok', 'hoops-m-head-icon--info', 'hoops-m-head-text', 'hoops-m-title',
  'hoops-m-subtitle', 'hoops-m-close', 'hoops-m-body', 'hoops-m-footer',
  // Tabs
  'hoops-tabs--sm', 'hoops-tabs--lg', 'hoops-tabs--vertical', 'hoops-tab-ic', 'hoops-tab-count',
  // Checkbox (v0.8)
  'hoops-check', 'hoops-check--compact', 'hoops-check-input', 'hoops-check-text', 'hoops-check-label', 'hoops-check-hint',
  // Table (v0.8)
  'hoops-frame--dark', 'hoops-frame-head', 'hoops-frame-title', 'hoops-frame-meta', 'hoops-crumb', 'hoops-crumb-dot',
  'hoops-tbl--touch', 'hoops-tbl--dense', 'hoops-tbl--striped', 'hoops-tn', 'hoops-player', 'hoops-pos', 'hoops-pill-s',
  // TopBar (v0.8)
  'hoops-topbar--dark', 'hoops-topbar-brand', 'hoops-topbar-mark', 'hoops-topbar-ctx', 'hoops-topbar-live',
  'hoops-topbar-score', 'hoops-topbar-clock', 'hoops-topbar-center', 'hoops-topbar-spacer', 'hoops-topbar-user', 'hoops-topbar-av',
  // EmptyState (v0.8)
  'hoops-empty--neutral', 'hoops-empty--action', 'hoops-empty--error', 'hoops-empty-icon', 'hoops-empty-title',
  'hoops-empty-body', 'hoops-empty-actions', 'hoops-empty-extra',
  // Stepper (v0.8)
  'hoops-step--h', 'hoops-step--c', 'hoops-step--v', 'hoops-step-item', 'hoops-step-dot', 'hoops-step-label',
  'hoops-step-line', 'hoops-step-rail', 'hoops-step-vline', 'hoops-step-body', 'hoops-step-desc',
  'hoops-step-track', 'hoops-step-fill', 'hoops-step-info', 'hoops-step-num', 'hoops-step-cur',
  // AppNav (v0.8)
  'hoops-appnav', 'hoops-appnav--dark', 'hoops-appnav-bar', 'hoops-appnav-list', 'hoops-appnav-item', 'hoops-appnav-link',
  'hoops-appnav-group-btn', 'hoops-appnav-chev', 'hoops-appnav-panel', 'hoops-appnav-toggle', 'hoops-appnav-context',
  // BottomNav (v0.9)
  'hoops-bnav', 'hoops-bnav-item', 'hoops-bnav-ic', 'hoops-bnav-lbl', 'hoops-bnav-badge', 'hoops-bnav-fab',
  // Breadcrumbs (v0.9)
  'hoops-crumbs', 'hoops-crumbs--tagged', 'hoops-crumbs--chip', 'hoops-crumbs-item', 'hoops-crumbs-sep', 'hoops-crumbs-tag', 'hoops-crumbs-chip',
  // Skeleton (v0.9)
  'hoops-skel', 'hoops-skel--line', 'hoops-skel--block', 'hoops-skel--circle', 'hoops-skel-row', 'hoops-skel-who',
  'hoops-skel-match', 'hoops-skel-match-head', 'hoops-skel-match-row',
  // Icon
  'hoops-icon',
  // MatchCard (v0.9)
  'hoops-match', 'hoops-match--live', 'hoops-match-head', 'hoops-match-muted', 'hoops-match-when', 'hoops-match-final',
  'hoops-match-live', 'hoops-match-pulse', 'hoops-match-body', 'hoops-match-team', 'hoops-match-team--gast', 'hoops-match-dot',
  'hoops-match-name', 'hoops-match-score', 'hoops-match-foot',
  // PlayerCard (v0.9)
  'hoops-pc-row', 'hoops-pc-who', 'hoops-pc-name', 'hoops-pc-meta', 'hoops-pc-stat', 'hoops-pc-stat-l', 'hoops-pc-card', 'hoops-pc-head',
  'hoops-pc-nm', 'hoops-pc-role', 'hoops-pc-cap', 'hoops-pc-vitals', 'hoops-pc-v', 'hoops-pc-v--amber', 'hoops-pc-l', 'hoops-pc-hero',
  'hoops-pc-hero-left', 'hoops-pc-hero-right',
  // PlayByPlay (v0.9)
  'hoops-pbp-frame', 'hoops-pbp-frame--dark', 'hoops-pbp-head', 'hoops-pbp-title', 'hoops-pbp-meta', 'hoops-pbp-live', 'hoops-pbp-dot',
  'hoops-pbp-feed', 'hoops-pbp-event', 'hoops-pbp-time', 'hoops-pbp-q', 'hoops-pbp-strip', 'hoops-pbp-strip--heim', 'hoops-pbp-strip--gast',
  'hoops-pbp-strip--none', 'hoops-pbp-body', 'hoops-pbp-action', 'hoops-pbp-detail', 'hoops-pbp-score', 'hoops-pbp-sep',
  'hoops-pbp-event--foul', 'hoops-pbp-event--timeout', 'hoops-pbp-event--score-3p',
  // CourtLines (v0.9)
  'hoops-courtbg', 'hoops-courtbg--absolute', 'hoops-courtlines',
];

describe('css/components.css', () => {
  it.each(REQUIRED)('definiert .%s', (name) => {
    expect(hasClass(name)).toBe(true);
  });
});

describe('AppNav · Untermenü-Links bleiben im Panel', () => {
  // width: 100% plus Padding ragt ohne box-sizing: border-box über das Panel hinaus
  it('Links im Dropdown-Panel haben box-sizing: border-box', () => {
    const rule = css.match(/\.hoops-appnav-panel \.hoops-appnav-link \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('width: 100%');
    expect(rule).toContain('box-sizing: border-box');
  });

  it('Links und Gruppen-Buttons in der mobilen Navigation haben box-sizing: border-box', () => {
    const rule = css.match(/\.hoops-appnav-link, \.hoops-appnav-group-btn \{([^}]*width: 100%[^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('box-sizing: border-box');
  });
});

describe('AppNav · gesperrter Zustand ist sichtbar', () => {
  it('gesperrte Links und Gruppen sind abgedunkelt, haben ein Schloss und keinen Hover', () => {
    const rule = css.match(/\.hoops-appnav-link\.is-disabled, \.hoops-appnav-group-btn\.is-disabled \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('opacity');
    expect(rule).toContain('not-allowed');
    expect(css).toMatch(/\.hoops-appnav-link\.is-disabled::after[^{]*\{[^}]*mask/);
    expect(css).toMatch(/\.hoops-appnav-group-btn\.is-disabled:hover/);
  });
});

describe('Spielplan · ScheduleTable (Variante A)', () => {
  const CLASSES = [
    'hoops-tbl--schedule', 'hoops-sch-group', 'hoops-sch-nr', 'hoops-sch-when', 'hoops-sch-date', 'hoops-sch-time', 'hoops-sch-live',
    'hoops-sch-venue', 'hoops-sch-ha', 'hoops-sch-match', 'hoops-sch-opp', 'hoops-sch-logo', 'hoops-sch-sub', 'hoops-sch-team',
    'hoops-sch-ph', 'hoops-sch-sep', 'hoops-sch-note', 'hoops-sch-res', 'hoops-sch-score', 'hoops-sch-none', 'hoops-sch-field',
    'hoops-sch-bye', 'hoops-sch-notice', 'hoops-sch--columns', 'hoops-sch-resbox', 'hoops-sch-prov',
  ];
  it.each(CLASSES)('definiert .%s', (name) => {
    expect(hasClass(name)).toBe(true);
  });

  it('Gruppenzeilen heben das Sticky-Verhalten der Kopfzellen auf', () => {
    const rule = css.match(/\.hoops-tbl--schedule tr\.hoops-sch-group th \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('position: static');
  });

  it('Tabellenzellen haben vertikalen Innenabstand, die Handy-Karten setzen ihn zurück', () => {
    expect(css).toMatch(/\.hoops-tbl--schedule td \{ box-sizing: border-box; padding-block: 8px; \}/);
    expect(css).toMatch(/\.hoops-tbl\.hoops-tbl--schedule tbody tr\.hoops-sch-row td \{[^}]*padding: 0;/);
  });

  it('Dichte compact: Schedule-Zellen haben kleineres padding-block, damit die Zeile 40 px misst', () => {
    const m = css.match(/\.hoops-tbl--schedule\.hoops-tbl--compact td \{ padding-block: (\d+)px; \}/);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeLessThan(8);
  });

  it('Hinweise nutzen die Dark-Mode-fähige Chip-Warnfarbe statt der festen warn-text', () => {
    const rule = css.match(/\.hoops-sch-note \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('color: var(--hoops-chip-warn-fg)');
    expect(rule).not.toContain('--hoops-warn-text');
  });

  it('Handy: Zeilen werden zu Karten', () => {
    expect(css).toMatch(/@media \(max-width: 640px\) \{[^@]*\.hoops-tbl--schedule tr\.hoops-sch-row[^{]*\{[^}]*display: grid/);
  });

  const mobile = css.slice(css.indexOf('Handy: jede Zeile wird zur Karte'));
  const ruleOf = (src: string, selector: string) => {
    const i = src.indexOf(selector + ' {');
    return i < 0 ? '' : src.slice(i, src.indexOf('}', i));
  };

  it.each([
    ['hoops-sch-nr', 'nr'], ['hoops-sch-when', 'when'], ['hoops-sch-ha', 'ha'], ['hoops-sch-match', 'match'],
    ['hoops-sch-res', 'res'], ['hoops-sch-heim', 'heim'], ['hoops-sch-gast', 'gast'],
    ['hoops-sch-field-cell', 'field'], ['hoops-sch-venue-cell', 'venue'], ['hoops-sch-notice', 'notice'],
  ])('Handy: .%s liegt im Bereich "%s"', (cls, area) => {
    expect(ruleOf(mobile, `.hoops-tbl--schedule td.${cls}`)).toContain(`grid-area: ${area};`);
  });

  it.each([
    ['versus', '"when when" "match res"'],
    ['opponent', '"when when when" "ha match res"'],
    ['columns', '"nr field" "when venue" "heim res" "gast res" "notice notice"'],
  ])('Handy: Layout %s hat explizite grid-template-areas', (layout, areas) => {
    expect(ruleOf(mobile, `.hoops-sch--${layout} tr.hoops-sch-row`)).toContain(`grid-template-areas: ${areas};`);
  });

  it('Ergebnis bricht nicht um', () => {
    expect(ruleOf(css, '.hoops-tbl--schedule td.hoops-sch-res')).toContain('white-space: nowrap');
  });

  it('Abgesagt: Durchstreichung nur für Team, Datum und Zeit', () => {
    const rule = css.match(/([^{}]*)\{\s*text-decoration: line-through;\s*\}/)?.[1] ?? '';
    const selectors = rule.split(',').map((x) => x.trim().replace('.hoops-tbl--schedule tr.is-cancelled ', ''));
    expect(selectors).toEqual(['.hoops-sch-team', '.hoops-sch-date', '.hoops-sch-time']);
  });

  it('Abgesagt und verschoben: Datum und Zeit gedämpft', () => {
    for (const state of ['is-cancelled', 'is-postponed']) {
      const m = css.match(new RegExp(`\\.hoops-tbl--schedule tr\\.${state} \\.hoops-sch-time \\{([^}]*)\\}`));
      expect(m?.[1]).toContain('color: var(--hoops-mute)');
      expect(css).toContain(`.hoops-tbl--schedule tr.${state} .hoops-sch-date`);
    }
  });

  it('sr-only-Texte in Zellen bleiben in der Tabelle (td ist positioniert)', () => {
    const rule = css.match(/\.hoops-tbl--schedule td \{ position: relative; \}/);
    expect(rule).not.toBeNull();
  });

  it('Handy: leere Zellen (z. B. Hinweis ohne Inhalt) nehmen keinen Platz', () => {
    expect(ruleOf(mobile, '.hoops-tbl.hoops-tbl--schedule tbody tr.hoops-sch-row td:empty')).toContain('display: none');
  });

  it('Handy: Hervorhebung und Hover liegen an der Zeile', () => {
    expect(ruleOf(mobile, '.hoops-tbl--schedule tr.hoops-sch-row.is-own')).toContain('background: var(--hoops-selected-bg)');
    expect(ruleOf(mobile, '.hoops-tbl--schedule tr.hoops-sch-row:hover')).toContain('background: var(--hoops-hover-bg)');
  });
});

describe('Spielplan · ScheduleGrid (Variante B)', () => {
  const CLASSES = [
    'hoops-sgrid', 'hoops-sg-time', 'hoops-sg-cell', 'hoops-sg-game', 'hoops-sg-teams', 'hoops-sg-result', 'hoops-sg-meta',
    'hoops-sg-empty', 'hoops-sg-break', 'hoops-sg-bye',
  ];
  it.each(CLASSES)('definiert .%s', (name) => {
    expect(hasClass(name)).toBe(true);
  });

  it('die Zeitspalte bleibt beim seitlichen Scrollen stehen', () => {
    const rule = css.match(/\.hoops-sgrid tbody th\.hoops-sg-time \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('position: sticky');
    expect(rule).toContain('left: 0');
  });

  it('Handy: jede Zeitzeile wird ein Block mit Spalten-Beschriftung', () => {
    expect(css).toMatch(/@media \(max-width: 640px\) \{[^@]*\.hoops-sgrid td\.hoops-sg-cell::before[^{]*\{[^}]*attr\(data-label\)/);
  });
  const grid = css.slice(css.indexOf('Spielplan · ScheduleGrid (Variante B'));
  const gridMobile = grid.slice(grid.indexOf('@media (max-width: 640px)'));
  const gridRule = (src: string, selector: string) => {
    const at = src.indexOf(`${selector} {`);
    return at < 0 ? '' : src.slice(at, src.indexOf('}', at));
  };

  it('Zeitspalte im Kopf wird nicht sticky und die im Rumpf ist deckend', () => {
    expect(gridRule(grid, '.hoops-sgrid th.hoops-sg-time')).toContain('position: static');
    expect(gridRule(grid, '.hoops-sgrid tbody th.hoops-sg-time')).toContain('background: var(--hoops-surface)');
  });

  it('die Kopfzelle "Zeit" behält den Kopfzellen-Stil, die Schriftregeln gelten nur im Rumpf', () => {
    const head = gridRule(grid, '.hoops-sgrid th.hoops-sg-time');
    expect(head).toContain('width: 96px');
    expect(head).toContain('min-width: 96px');
    for (const prop of ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'text-transform']) {
      expect(head).not.toContain(prop);
    }
    const body = gridRule(grid, '.hoops-sgrid tbody th.hoops-sg-time');
    expect(body).toContain('text-transform: none');
    expect(body).toContain('font-family: var(--hoops-font-mono)');
  });

  it('kompaktes Raster: engere Karten und Zellen', () => {
    expect(gridRule(grid, '.hoops-tbl--compact .hoops-sg-game')).toMatch(/min-height: 0;[^}]*padding: 4px 8px/);
    expect(grid).toMatch(/@media \(min-width: 641px\) \{[^@]*\.hoops-sgrid\.hoops-tbl--compact td\.hoops-sg-cell \{[^}]*padding: 4px 8px/);
    expect(grid).toMatch(/\.hoops-sgrid\.hoops-tbl--compact tbody th\.hoops-sg-time \{[^}]*padding: 6px 12px/);
  });

  it('sr-only-Texte bleiben im Scroll-Container (kein Seiten-Overflow)', () => {
    expect(gridRule(grid, '.hoops-sg-game')).toContain('position: relative');
  });

  it('mehrere Spiele in einer Zelle haben Abstand', () => {
    expect(gridRule(grid, '.hoops-sg-game + .hoops-sg-game')).toContain('margin-top: 6px');
  });

  it('Kopfzellen liegen über der sticky Zeitzelle im Rumpf', () => {
    expect(gridRule(grid, '.hoops-sgrid thead th')).toContain('z-index: 2');
  });

  it('Hover färbt auch die Zeitzelle (deckend, wegen sticky)', () => {
    expect(gridRule(grid, '.hoops-sgrid tbody tr:hover th.hoops-sg-time')).toContain('background: var(--hoops-hover-bg)');
  });

  it('Handy: leere Zellen sind ausgeblendet, Kopfzeile nur für Screenreader', () => {
    expect(gridRule(gridMobile, '.hoops-sgrid td.hoops-sg-cell.is-empty')).toContain('display: none');
    expect(gridRule(gridMobile, '.hoops-sgrid thead')).toContain('clip: rect(0, 0, 0, 0)');
  });

  it('Handy: Zeitzelle nicht sticky, Hover liegt an der Zeile', () => {
    expect(gridMobile).toMatch(/\.hoops-sgrid tbody th\.hoops-sg-time[^{]*\{[^}]*position: static/);
    expect(gridRule(gridMobile, '.hoops-sgrid tbody tr:hover')).toContain('background: var(--hoops-hover-bg)');
    expect(gridRule(gridMobile, '.hoops-sgrid tbody tr:hover td')).toContain('background: none');
  });

  it('Handy: Pause und Freilos laufen über die volle Breite', () => {
    expect(gridRule(gridMobile, '.hoops-sgrid tr.hoops-sg-break td, .hoops-sgrid tr.hoops-sg-bye td')).toContain('display: block');
  });
});

describe('Button-Höhen', () => {
  const rule = (sel: string) => new RegExp(`\\${sel}\\s*\\{[^}]*\\}`).exec(css)?.[0] ?? '';
  it('sm und md sind 44 px hoch (WCAG 2.5.5, Zielgröße)', () => {
    expect(rule('.hoops-btn--sm')).toContain('height: var(--hoops-touch-sm)');
    expect(rule('.hoops-btn--md')).toContain('height: var(--hoops-touch-sm)');
  });
});

describe('Hilfetext und Pflicht-Sternchen im Dunkelmodus', () => {
  // --hoops-err-text, --hoops-ok-text und --hoops-warn-text haben keinen Dunkelmodus (2.3:1 auf Schwarz); die Chip-Tokens schon.
  const rule = (sel: string) => new RegExp(`\\${sel}\\s*\\{[^}]*\\}`).exec(css)?.[0] ?? '';
  it.each([
    ['.hoops-field-help--err', '--hoops-chip-err-fg'],
    ['.hoops-field-help--ok', '--hoops-chip-ok-fg'],
    ['.hoops-field-help--warn', '--hoops-chip-warn-fg'],
  ])('%s nutzt %s', (sel, token) => {
    expect(rule(sel)).toContain(`var(${token})`);
  });
  it('das Pflicht-Sternchen nutzt --hoops-chip-err-fg', () => {
    expect(css).toMatch(/\.hoops-field-label \.req\s*\{[^}]*var\(--hoops-chip-err-fg\)/);
  });
});
