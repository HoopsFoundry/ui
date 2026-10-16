// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const css = readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');
const hasClass = (name: string) => new RegExp(`\\.${name}(?![\\w-])`).test(css);

// Klassen, die React-Paket und neue Svelte-Komponenten voraussetzen (v0.7).
const REQUIRED = [
  // Button
  'dss-btn--danger', 'is-touch',
  // Felder
  'dss-field-label', 'dss-field-help', 'dss-field-help--err', 'dss-field-help--ok',
  'dss-field-help--warn', 'is-error', 'is-ok', 'is-warn',
  'dss-input--default', 'dss-input--compact', 'dss-addon--right', 'dss-select--compact',
  // Banner
  'dss-banner', 'dss-banner--info', 'dss-banner--ok', 'dss-banner--warn', 'dss-banner--danger',
  'dss-banner-icon', 'dss-banner-body', 'dss-banner-title',
  // Modal
  'dss-backdrop', 'dss-modal-wrap', 'dss-modal', 'dss-modal--sm', 'dss-modal--wide', 'dss-modal--xwide',
  'dss-m-head', 'dss-m-head-icon', 'dss-m-head-icon--danger', 'dss-m-head-icon--warn',
  'dss-m-head-icon--ok', 'dss-m-head-icon--info', 'dss-m-head-text', 'dss-m-title',
  'dss-m-subtitle', 'dss-m-close', 'dss-m-body', 'dss-m-footer',
  // Tabs
  'dss-tabs--sm', 'dss-tabs--lg', 'dss-tabs--vertical', 'dss-tab-ic', 'dss-tab-count',
  // Checkbox (v0.8)
  'dss-check', 'dss-check--compact', 'dss-check-input', 'dss-check-text', 'dss-check-label', 'dss-check-hint',
  // Table (v0.8)
  'dss-frame--dark', 'dss-frame-head', 'dss-frame-title', 'dss-frame-meta', 'dss-crumb', 'dss-crumb-dot',
  'dss-tbl--touch', 'dss-tbl--dense', 'dss-tbl--striped', 'dss-tn', 'dss-player', 'dss-pos', 'dss-pill-s',
  // TopBar (v0.8)
  'dss-topbar--dark', 'dss-topbar-brand', 'dss-topbar-mark', 'dss-topbar-ctx', 'dss-topbar-live',
  'dss-topbar-score', 'dss-topbar-clock', 'dss-topbar-center', 'dss-topbar-spacer', 'dss-topbar-user', 'dss-topbar-av',
  // EmptyState (v0.8)
  'dss-empty--neutral', 'dss-empty--action', 'dss-empty--error', 'dss-empty-icon', 'dss-empty-title',
  'dss-empty-body', 'dss-empty-actions', 'dss-empty-extra',
  // Stepper (v0.8)
  'dss-step--h', 'dss-step--c', 'dss-step--v', 'dss-step-item', 'dss-step-dot', 'dss-step-label',
  'dss-step-line', 'dss-step-rail', 'dss-step-vline', 'dss-step-body', 'dss-step-desc',
  'dss-step-track', 'dss-step-fill', 'dss-step-info', 'dss-step-num', 'dss-step-cur',
  // AppNav (v0.8)
  'dss-appnav', 'dss-appnav--dark', 'dss-appnav-bar', 'dss-appnav-list', 'dss-appnav-item', 'dss-appnav-link',
  'dss-appnav-group-btn', 'dss-appnav-chev', 'dss-appnav-panel', 'dss-appnav-toggle', 'dss-appnav-context',
  // BottomNav (v0.9)
  'dss-bnav', 'dss-bnav-item', 'dss-bnav-ic', 'dss-bnav-lbl', 'dss-bnav-badge', 'dss-bnav-fab',
  // Breadcrumbs (v0.9)
  'dss-crumbs', 'dss-crumbs--tagged', 'dss-crumbs--chip', 'dss-crumbs-item', 'dss-crumbs-sep', 'dss-crumbs-tag', 'dss-crumbs-chip',
  // Skeleton (v0.9)
  'dss-skel', 'dss-skel--line', 'dss-skel--block', 'dss-skel--circle', 'dss-skel-row', 'dss-skel-who',
  'dss-skel-match', 'dss-skel-match-head', 'dss-skel-match-row',
  // Icon
  'dss-icon',
  // MatchCard (v0.9)
  'dss-match', 'dss-match--live', 'dss-match-head', 'dss-match-muted', 'dss-match-when', 'dss-match-final',
  'dss-match-live', 'dss-match-pulse', 'dss-match-body', 'dss-match-team', 'dss-match-team--gast', 'dss-match-dot',
  'dss-match-name', 'dss-match-score', 'dss-match-foot',
  // PlayerCard (v0.9)
  'dss-pc-row', 'dss-pc-who', 'dss-pc-name', 'dss-pc-meta', 'dss-pc-stat', 'dss-pc-stat-l', 'dss-pc-card', 'dss-pc-head',
  'dss-pc-nm', 'dss-pc-role', 'dss-pc-cap', 'dss-pc-vitals', 'dss-pc-v', 'dss-pc-v--amber', 'dss-pc-l', 'dss-pc-hero',
  'dss-pc-hero-left', 'dss-pc-hero-right',
  // PlayByPlay (v0.9)
  'dss-pbp-frame', 'dss-pbp-frame--dark', 'dss-pbp-head', 'dss-pbp-title', 'dss-pbp-meta', 'dss-pbp-live', 'dss-pbp-dot',
  'dss-pbp-feed', 'dss-pbp-event', 'dss-pbp-time', 'dss-pbp-q', 'dss-pbp-strip', 'dss-pbp-strip--heim', 'dss-pbp-strip--gast',
  'dss-pbp-strip--none', 'dss-pbp-body', 'dss-pbp-action', 'dss-pbp-detail', 'dss-pbp-score', 'dss-pbp-sep',
  'dss-pbp-event--foul', 'dss-pbp-event--timeout', 'dss-pbp-event--score-3p',
  // CourtLines (v0.9)
  'dss-courtbg', 'dss-courtbg--absolute', 'dss-courtlines',
];

describe('css/components.css', () => {
  it.each(REQUIRED)('definiert .%s', (name) => {
    expect(hasClass(name)).toBe(true);
  });
});

describe('AppNav · Untermenü-Links bleiben im Panel', () => {
  // width: 100% plus Padding ragt ohne box-sizing: border-box über das Panel hinaus
  it('Links im Dropdown-Panel haben box-sizing: border-box', () => {
    const rule = css.match(/\.dss-appnav-panel \.dss-appnav-link \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('width: 100%');
    expect(rule).toContain('box-sizing: border-box');
  });

  it('Links und Gruppen-Buttons in der mobilen Navigation haben box-sizing: border-box', () => {
    const rule = css.match(/\.dss-appnav-link, \.dss-appnav-group-btn \{([^}]*width: 100%[^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('box-sizing: border-box');
  });
});

describe('AppNav · gesperrter Zustand ist sichtbar', () => {
  it('gesperrte Links und Gruppen sind abgedunkelt, haben ein Schloss und keinen Hover', () => {
    const rule = css.match(/\.dss-appnav-link\.is-disabled, \.dss-appnav-group-btn\.is-disabled \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('opacity');
    expect(rule).toContain('not-allowed');
    expect(css).toMatch(/\.dss-appnav-link\.is-disabled::after[^{]*\{[^}]*mask/);
    expect(css).toMatch(/\.dss-appnav-group-btn\.is-disabled:hover/);
  });
});

describe('Spielplan · ScheduleTable (Variante A)', () => {
  const CLASSES = [
    'dss-tbl--schedule', 'dss-sch-group', 'dss-sch-nr', 'dss-sch-when', 'dss-sch-date', 'dss-sch-time', 'dss-sch-live',
    'dss-sch-venue', 'dss-sch-ha', 'dss-sch-match', 'dss-sch-opp', 'dss-sch-logo', 'dss-sch-sub', 'dss-sch-team',
    'dss-sch-ph', 'dss-sch-sep', 'dss-sch-note', 'dss-sch-res', 'dss-sch-score', 'dss-sch-none', 'dss-sch-field',
    'dss-sch-bye', 'dss-sch-notice', 'dss-sch--columns', 'dss-sch-resbox', 'dss-sch-prov',
  ];
  it.each(CLASSES)('definiert .%s', (name) => {
    expect(hasClass(name)).toBe(true);
  });

  it('Gruppenzeilen heben das Sticky-Verhalten der Kopfzellen auf', () => {
    const rule = css.match(/\.dss-tbl--schedule tr\.dss-sch-group th \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('position: static');
  });

  it('Tabellenzellen haben vertikalen Innenabstand, die Handy-Karten setzen ihn zurück', () => {
    expect(css).toMatch(/\.dss-tbl--schedule td \{ box-sizing: border-box; padding-block: 8px; \}/);
    expect(css).toMatch(/\.dss-tbl\.dss-tbl--schedule tbody tr\.dss-sch-row td \{[^}]*padding: 0;/);
  });

  it('Dichte compact: Schedule-Zellen haben kleineres padding-block, damit die Zeile 40 px misst', () => {
    const m = css.match(/\.dss-tbl--schedule\.dss-tbl--compact td \{ padding-block: (\d+)px; \}/);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeLessThan(8);
  });

  it('Hinweise nutzen die Dark-Mode-fähige Chip-Warnfarbe statt der festen warn-text', () => {
    const rule = css.match(/\.dss-sch-note \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('color: var(--hoops-chip-warn-fg)');
    expect(rule).not.toContain('--hoops-warn-text');
  });

  it('Handy: Zeilen werden zu Karten', () => {
    expect(css).toMatch(/@media \(max-width: 640px\) \{[^@]*\.dss-tbl--schedule tr\.dss-sch-row[^{]*\{[^}]*display: grid/);
  });

  const mobile = css.slice(css.indexOf('Handy: jede Zeile wird zur Karte'));
  const ruleOf = (src: string, selector: string) => {
    const i = src.indexOf(selector + ' {');
    return i < 0 ? '' : src.slice(i, src.indexOf('}', i));
  };

  it.each([
    ['dss-sch-nr', 'nr'], ['dss-sch-when', 'when'], ['dss-sch-ha', 'ha'], ['dss-sch-match', 'match'],
    ['dss-sch-res', 'res'], ['dss-sch-heim', 'heim'], ['dss-sch-gast', 'gast'],
    ['dss-sch-field-cell', 'field'], ['dss-sch-venue-cell', 'venue'], ['dss-sch-notice', 'notice'],
  ])('Handy: .%s liegt im Bereich "%s"', (cls, area) => {
    expect(ruleOf(mobile, `.dss-tbl--schedule td.${cls}`)).toContain(`grid-area: ${area};`);
  });

  it.each([
    ['versus', '"when when" "match res"'],
    ['opponent', '"when when when" "ha match res"'],
    ['columns', '"nr field" "when venue" "heim res" "gast res" "notice notice"'],
  ])('Handy: Layout %s hat explizite grid-template-areas', (layout, areas) => {
    expect(ruleOf(mobile, `.dss-sch--${layout} tr.dss-sch-row`)).toContain(`grid-template-areas: ${areas};`);
  });

  it('Ergebnis bricht nicht um', () => {
    expect(ruleOf(css, '.dss-tbl--schedule td.dss-sch-res')).toContain('white-space: nowrap');
  });

  it('Abgesagt: Durchstreichung nur für Team, Datum und Zeit', () => {
    const rule = css.match(/([^{}]*)\{\s*text-decoration: line-through;\s*\}/)?.[1] ?? '';
    const selectors = rule.split(',').map((x) => x.trim().replace('.dss-tbl--schedule tr.is-cancelled ', ''));
    expect(selectors).toEqual(['.dss-sch-team', '.dss-sch-date', '.dss-sch-time']);
  });

  it('Abgesagt und verschoben: Datum und Zeit gedämpft', () => {
    for (const state of ['is-cancelled', 'is-postponed']) {
      const m = css.match(new RegExp(`\\.dss-tbl--schedule tr\\.${state} \\.dss-sch-time \\{([^}]*)\\}`));
      expect(m?.[1]).toContain('color: var(--hoops-mute)');
      expect(css).toContain(`.dss-tbl--schedule tr.${state} .dss-sch-date`);
    }
  });

  it('sr-only-Texte in Zellen bleiben in der Tabelle (td ist positioniert)', () => {
    const rule = css.match(/\.dss-tbl--schedule td \{ position: relative; \}/);
    expect(rule).not.toBeNull();
  });

  it('Handy: leere Zellen (z. B. Hinweis ohne Inhalt) nehmen keinen Platz', () => {
    expect(ruleOf(mobile, '.dss-tbl.dss-tbl--schedule tbody tr.dss-sch-row td:empty')).toContain('display: none');
  });

  it('Handy: Hervorhebung und Hover liegen an der Zeile', () => {
    expect(ruleOf(mobile, '.dss-tbl--schedule tr.dss-sch-row.is-own')).toContain('background: var(--hoops-selected-bg)');
    expect(ruleOf(mobile, '.dss-tbl--schedule tr.dss-sch-row:hover')).toContain('background: var(--hoops-hover-bg)');
  });
});

describe('Spielplan · ScheduleGrid (Variante B)', () => {
  const CLASSES = [
    'dss-sgrid', 'dss-sg-time', 'dss-sg-cell', 'dss-sg-game', 'dss-sg-teams', 'dss-sg-result', 'dss-sg-meta',
    'dss-sg-empty', 'dss-sg-break', 'dss-sg-bye',
  ];
  it.each(CLASSES)('definiert .%s', (name) => {
    expect(hasClass(name)).toBe(true);
  });

  it('die Zeitspalte bleibt beim seitlichen Scrollen stehen', () => {
    const rule = css.match(/\.dss-sgrid tbody th\.dss-sg-time \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('position: sticky');
    expect(rule).toContain('left: 0');
  });

  it('Handy: jede Zeitzeile wird ein Block mit Spalten-Beschriftung', () => {
    expect(css).toMatch(/@media \(max-width: 640px\) \{[^@]*\.dss-sgrid td\.dss-sg-cell::before[^{]*\{[^}]*attr\(data-label\)/);
  });
  const grid = css.slice(css.indexOf('Spielplan · ScheduleGrid (Variante B'));
  const gridMobile = grid.slice(grid.indexOf('@media (max-width: 640px)'));
  const gridRule = (src: string, selector: string) => {
    const at = src.indexOf(`${selector} {`);
    return at < 0 ? '' : src.slice(at, src.indexOf('}', at));
  };

  it('Zeitspalte im Kopf wird nicht sticky und die im Rumpf ist deckend', () => {
    expect(gridRule(grid, '.dss-sgrid th.dss-sg-time')).toContain('position: static');
    expect(gridRule(grid, '.dss-sgrid tbody th.dss-sg-time')).toContain('background: var(--hoops-surface)');
  });

  it('die Kopfzelle "Zeit" behält den Kopfzellen-Stil, die Schriftregeln gelten nur im Rumpf', () => {
    const head = gridRule(grid, '.dss-sgrid th.dss-sg-time');
    expect(head).toContain('width: 96px');
    expect(head).toContain('min-width: 96px');
    for (const prop of ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'text-transform']) {
      expect(head).not.toContain(prop);
    }
    const body = gridRule(grid, '.dss-sgrid tbody th.dss-sg-time');
    expect(body).toContain('text-transform: none');
    expect(body).toContain('font-family: var(--hoops-font-mono)');
  });

  it('kompaktes Raster: engere Karten und Zellen', () => {
    expect(gridRule(grid, '.dss-tbl--compact .dss-sg-game')).toMatch(/min-height: 0;[^}]*padding: 4px 8px/);
    expect(grid).toMatch(/@media \(min-width: 641px\) \{[^@]*\.dss-sgrid\.dss-tbl--compact td\.dss-sg-cell \{[^}]*padding: 4px 8px/);
    expect(grid).toMatch(/\.dss-sgrid\.dss-tbl--compact tbody th\.dss-sg-time \{[^}]*padding: 6px 12px/);
  });

  it('sr-only-Texte bleiben im Scroll-Container (kein Seiten-Overflow)', () => {
    expect(gridRule(grid, '.dss-sg-game')).toContain('position: relative');
  });

  it('mehrere Spiele in einer Zelle haben Abstand', () => {
    expect(gridRule(grid, '.dss-sg-game + .dss-sg-game')).toContain('margin-top: 6px');
  });

  it('Kopfzellen liegen über der sticky Zeitzelle im Rumpf', () => {
    expect(gridRule(grid, '.dss-sgrid thead th')).toContain('z-index: 2');
  });

  it('Hover färbt auch die Zeitzelle (deckend, wegen sticky)', () => {
    expect(gridRule(grid, '.dss-sgrid tbody tr:hover th.dss-sg-time')).toContain('background: var(--hoops-hover-bg)');
  });

  it('Handy: leere Zellen sind ausgeblendet, Kopfzeile nur für Screenreader', () => {
    expect(gridRule(gridMobile, '.dss-sgrid td.dss-sg-cell.is-empty')).toContain('display: none');
    expect(gridRule(gridMobile, '.dss-sgrid thead')).toContain('clip: rect(0, 0, 0, 0)');
  });

  it('Handy: Zeitzelle nicht sticky, Hover liegt an der Zeile', () => {
    expect(gridMobile).toMatch(/\.dss-sgrid tbody th\.dss-sg-time[^{]*\{[^}]*position: static/);
    expect(gridRule(gridMobile, '.dss-sgrid tbody tr:hover')).toContain('background: var(--hoops-hover-bg)');
    expect(gridRule(gridMobile, '.dss-sgrid tbody tr:hover td')).toContain('background: none');
  });

  it('Handy: Pause und Freilos laufen über die volle Breite', () => {
    expect(gridRule(gridMobile, '.dss-sgrid tr.dss-sg-break td, .dss-sgrid tr.dss-sg-bye td')).toContain('display: block');
  });
});

describe('Button-Höhen', () => {
  const rule = (sel: string) => new RegExp(`\\${sel}\\s*\\{[^}]*\\}`).exec(css)?.[0] ?? '';
  it('sm und md sind 44 px hoch (WCAG 2.5.5, Zielgröße)', () => {
    expect(rule('.dss-btn--sm')).toContain('height: var(--hoops-touch-sm)');
    expect(rule('.dss-btn--md')).toContain('height: var(--hoops-touch-sm)');
  });
});

describe('Hilfetext und Pflicht-Sternchen im Dunkelmodus', () => {
  // --hoops-err-text, --hoops-ok-text und --hoops-warn-text haben keinen Dunkelmodus (2.3:1 auf Schwarz); die Chip-Tokens schon.
  const rule = (sel: string) => new RegExp(`\\${sel}\\s*\\{[^}]*\\}`).exec(css)?.[0] ?? '';
  it.each([
    ['.dss-field-help--err', '--hoops-chip-err-fg'],
    ['.dss-field-help--ok', '--hoops-chip-ok-fg'],
    ['.dss-field-help--warn', '--hoops-chip-warn-fg'],
  ])('%s nutzt %s', (sel, token) => {
    expect(rule(sel)).toContain(`var(${token})`);
  });
  it('das Pflicht-Sternchen nutzt --hoops-chip-err-fg', () => {
    expect(css).toMatch(/\.dss-field-label \.req\s*\{[^}]*var\(--hoops-chip-err-fg\)/);
  });
});
