// Regeln der Render-Funktionen (V2a) als prüfbare Aussagen. tests/render-mutation.test.ts lädt die Module aus dem echten Quelltext (alle Regeln
// müssen gelten) und aus verfälschtem Quelltext (die zugehörige Regel muss kippen). Eine Regel prüft das erzeugte Markup als Zeichenkette.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { read, type Rules } from './mutation';

export const FILES = ['escape', 'core', 'stats', 'empty-state', 'table', 'league-card', 'schedule', 'match-card', 'team-card', 'venue-card', 'map-view'] as const;
/** Gemeinsame Module, die die Render-Funktionen nutzen und die ebenfalls verfälscht werden können (`js:league` steht für js/league.js). */
export const SHARED = ['league', 'schedule', 'team', 'venue', 'map', 'url', 'heading', 'periods', 'stats'] as const;
export type FileName = (typeof FILES)[number] | `js:${(typeof SHARED)[number]}`;
export type RenderFile = (typeof FILES)[number];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mod = Record<string, (...args: any[]) => any>;
export type Mods = Record<RenderFile, Mod>;

const pathOf = (file: FileName) => (file.startsWith('js:') ? `js/${file.slice(3)}.js` : `js/render/${file}.js`);
export const sourceOf = (file: FileName) => read(pathOf(file));

/**
 * Lädt die Render-Module und die gemeinsamen Module, aus denen sie bestehen, jeweils aus Quelltext (data-URL); relative Importe zeigen auf diese
 * Fassungen, sodass eine verfälschte Datei (`override`) bei allen wirkt, die sie importieren. Alles andere (mount.js, accordion.js …) kommt aus den Dateien.
 */
export async function loadAll(override?: { file: FileName; source: string }): Promise<Mods> {
  const known = new Set<string>([...FILES.map((f) => `js/render/${f}.js`), ...SHARED.map((f) => `js/${f}.js`)]);
  const urls = new Map<string, string>();
  const urlOf = (path: string): string => {
    if (!known.has(path)) return pathToFileURL(resolve(process.cwd(), path)).href;
    const cached = urls.get(path);
    if (cached) return cached;
    const source = override && pathOf(override.file) === path ? override.source : read(path);
    const dir = path.slice(0, path.lastIndexOf('/'));
    const code = source.replace(/from '(\.{1,2}\/[\w-]+\.js)'/g, (_m, spec: string) => {
      const target = spec.startsWith('../') ? `${dir.slice(0, dir.lastIndexOf('/'))}/${spec.slice(3)}` : `${dir}/${spec.slice(2)}`;
      return `from '${urlOf(target)}'`;
    });
    const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
    urls.set(path, url);
    return url;
  };
  const entries = await Promise.all(FILES.map(async (file) => [file, await import(/* @vite-ignore */ urlOf(`js/render/${file}.js`))] as const));
  return Object.fromEntries(entries) as Mods;
}

const safely = (fn: () => unknown) => {
  try {
    return fn() === true;
  } catch {
    return false;
  }
};
const count = (text: string, part: string) => text.split(part).length - 1;
const ranks = (html: string) => [...html.matchAll(/<td class="dss-league-rank">(\d*)<\/td>/g)].map((m) => m[1]).join(',');
const many = Array.from({ length: 12 }, (_v, i) => ({ rank: i + 1, name: `Team ${i + 1}`, points: 24 - i }));
const own7 = many.map((t, i) => ({ ...t, own: i === 6 }));
const HOSTILE = '<img src=x onerror=alert(1)>';
const JS = 'javascript:alert(1)';
const game = (extra: Record<string, unknown> = {}) => ({ id: 'a', state: 'scheduled', heim: { name: 'Heim' }, gast: { name: 'Gast' }, ...extra });

export function renderRules(m: Mods): Rules {
  const { esc, attr } = m.escape as unknown as { esc: (v: unknown) => string; attr: (v: unknown) => string };
  const c = m.core;
  const league = (props: Record<string, unknown>, options?: unknown) => m['league-card'].renderLeagueCard(props, options) as string;
  const table = (props: Record<string, unknown>) => m.table.renderTable(props) as string;
  const sched = (props: Record<string, unknown>, options?: unknown) => m.schedule.renderScheduleTable(props, options) as string;
  const grid = (props: Record<string, unknown>) => m.schedule.renderScheduleGrid(props) as string;
  const match = (props: Record<string, unknown>, options?: unknown) => m['match-card'].renderMatchCard(props, options) as string;
  const teamCard = (props: Record<string, unknown>, options?: unknown) => m['team-card'].renderTeamCard(props, options) as string;
  const venue = (props: Record<string, unknown>) => m['venue-card'].renderVenueCard(props) as string;
  const R: Rules = {};
  const rule = (name: string, fn: () => unknown) => {
    R[name] = safely(fn);
  };

  // ── escape.js ──
  rule('esc: & < > " \' werden maskiert', () => esc(`<&>"'`) === '&lt;&amp;&gt;&quot;&#39;');
  rule('esc: Steuerzeichen entfallen, Tabulator und Zeilenumbruch bleiben', () => esc('a\u0000b\u001fc\u007fd\te\nf') === 'abcd\te\nf');
  rule('esc: nur Text und endliche Zahlen, alles andere ist leer', () => [null, undefined, {}, [], true, Number.NaN, Infinity, () => 1].every((v) => esc(v) === '') && esc(5) === '5');
  rule('attr: maskiert Anführungszeichen wie esc', () => attr('" onclick="x') === '&quot; onclick=&quot;x');

  // ── core.js ──
  rule('url: nur sichere Ziele', () => c.url(JS) === undefined && c.url('/a') === '/a' && c.url('https://example.org/') === 'https://example.org/' && c.url(5) === undefined);
  rule('teamOf: Logo und Ziel nur sicher', () => {
    const t = c.teamOf({ name: 'A', logo: JS, href: 'data:text/html,x', short: {}, score: Number.NaN });
    return t.logo === undefined && t.href === undefined && t.short === undefined && t.score === undefined && c.teamOf({ name: 'A', logo: '/l.svg' }).logo === '/l.svg';
  });
  rule('nameText: Kurzname ist versteckt, der volle Name steht im title', () => {
    const html = c.nameText({ name: 'Lindenberg Hawks', short: 'Hawks' }, 'full') as string;
    return html.includes('<span class="dss-name-short" aria-hidden="true" title="Lindenberg Hawks">Hawks</span>') && html.includes('<span class="dss-name-full">Lindenberg Hawks</span>');
  });
  rule('nameText: names=short setzt den Modifier, full nicht', () =>
    (c.nameText({ name: 'A B', short: 'AB' }, 'short') as string).includes('dss-team-name dss-team-name--short') && !(c.nameText({ name: 'A B', short: 'AB' }, 'full') as string).includes('--short'));
  rule('nameText: ohne Kurzform oder bei gleichem Namen nur der Name, maskiert', () => c.nameText({ name: 'A', short: 'A' }, 'full') === 'A' && c.nameText({ name: '<b>' }, 'full') === '&lt;b&gt;');
  rule('logoBadge: Bild ohne Alternativtext, versteckt; ohne Logo die Initialen', () => {
    const img = c.logoBadge({ name: 'Lindenberg Hawks', logo: '/l.svg' }) as string;
    const ini = c.logoBadge({ name: 'Lindenberg Hawks' }) as string;
    return img.includes('<img src="/l.svg" alt="" loading="lazy">') && img.includes('aria-hidden="true"') && ini.includes('dss-team-logo--initials') && ini.includes('>LH<');
  });
  const frame = (open: boolean) => c.collapsibleFrame({ kind: 'frame', rootClass: 'dss-frame', id: 'x', title: 'Titel', open, content: '<p>x</p>', uid: 'u' }) as string;
  rule('collapsibleFrame: geschlossen mit hidden, inert und aria-expanded=false', () => frame(false).includes('aria-expanded="false"') && frame(false).includes(' hidden inert>'));
  rule('collapsibleFrame: offen ohne hidden, mit is-open und aria-expanded=true', () => frame(true).includes('aria-expanded="true"') && !frame(true).includes(' hidden') && frame(true).includes('is-collapsible is-open'));
  rule('collapsibleFrame: der Button steuert das Panel (aria-controls, ids)', () => {
    const html = frame(true);
    return html.includes('id="x-trigger"') && html.includes('aria-controls="x-panel"') && html.includes('id="x-panel"') && html.includes('<h3 class="dss-frame-title"><button');
  });
  rule('collapsibleFrame: Titel und Untertitel werden maskiert, Komma trennt den Namen', () => {
    const html = c.collapsibleFrame({ kind: 'league', rootClass: 'dss-league', title: HOSTILE, sub: HOSTILE, meta: '<i></i>', open: true, content: '', uid: 'u' }) as string;
    return !html.includes('<img') && html.includes('&lt;img') && html.includes('<span class="dss-acc-sep">,</span><span class="dss-acc-sub">');
  });
  rule('collapsibleFrame: ohne id ein stabiler Schlüssel aus uid', () => (c.collapsibleFrame({ kind: 'frame', rootClass: 'f', title: 'T', open: false, content: '', uid: 'abc' }) as string).includes('id="dss-cf-abc-trigger"'));
  rule('uidFor: gleiche Eingabe gleiche id, andere Eingabe andere id', () => c.uidFor(['a', 1]) === c.uidFor(['a', 1]) && c.uidFor(['a', 1]) !== c.uidFor(['b', 1]));
  rule('uidFor: options.uid gilt und wird bereinigt', () => c.uidFor('x', { uid: 'a"b c' }) === 'abc' && c.uidFor('x', { uid: '' }) === c.uidFor('x'));
  rule('formChips: Zeichen versteckt, Text aus formLabel, höchstens fünf', () => {
    const html = c.formChips(['S', 'N', 'U', 'S', 'N', 'S']) as string;
    return html.includes('<span class="dss-form-list" aria-hidden="true">') && count(html, 'dss-form-item ') === 5 && html.includes('Form: Niederlage, Unentschieden, Sieg, Niederlage, Sieg') && c.formChips([]) === '';
  });
  rule('headingOf: h2 bis h6, sonst h3', () => c.headingOf('h2') === 'h2' && c.headingOf('h6') === 'h6' && c.headingOf('h1') === 'h3' && c.headingOf('div') === 'h3' && c.headingOf(undefined) === 'h3');
  rule('pick: nur erlaubte Werte', () => c.pick('a', ['a', 'b'], 'x') === 'a' && c.pick('constructor', ['a'], 'x') === 'x' && c.pick(undefined, ['a'], 'x') === 'x');

  // ── stats.js ──
  rule('renderStats: Werte und Beschriftungen werden maskiert', () => {
    const html = m.stats.renderStats({ items: [{ label: HOSTILE, value: HOSTILE }] }) as string;
    return !html.includes('<img') && html.includes('&lt;img');
  });
  rule('renderStats: fehlender Wert mit Gedankenstrich und verstecktem Text', () => (m.stats.renderStats({ items: [{ label: 'A', value: null }] }) as string).includes('<span aria-hidden="true">–</span><span class="dss-sr-only">keine Angabe</span>'));
  rule('renderStats: compact und leer', () => (m.stats.renderStats({ items: [{ label: 'A', value: 1 }], compact: true }) as string).startsWith('<dl class="dss-stats dss-stats--compact">') && m.stats.renderStats({ items: [] }) === '');
  rule('renderFormChips: variant nur dots oder letters', () => (m.stats.renderFormChips({ form: ['S'], variant: 'letters' }) as string).includes('dss-form--letters') && !(m.stats.renderFormChips({ form: ['S'] }) as string).includes('--letters')
    && !(m.stats.renderFormChips({ form: ['S'], variant: '"><x>' }) as string).includes('<x>'));

  // ── empty-state.js ──
  rule('renderEmptyState: Text maskiert', () => {
    const html = m['empty-state'].renderEmptyState({ title: HOSTILE, body: HOSTILE, cta: HOSTILE, extra: HOSTILE }) as string;
    return !html.includes('<img') && count(html, '&lt;img') === 4;
  });
  rule('renderEmptyState: Ton bestimmt Klasse und Button', () => {
    const a = m['empty-state'].renderEmptyState({ tone: 'error', title: 'x', cta: 'y' }) as string;
    const z = m['empty-state'].renderEmptyState({ tone: 'zzz', title: 'x', cta: 'y' }) as string;
    return a.includes('dss-empty--error') && a.includes('dss-btn--danger') && z.includes('dss-empty--neutral') && z.includes('dss-btn--primary') && !z.includes('zzz');
  });
  rule('renderEmptyState: Aktionen nur mit sicherem Ziel', () => {
    const html = m['empty-state'].renderEmptyState({ title: 'x', actions: [{ label: 'a', href: JS }, { label: 'b', href: '/b' }] }) as string;
    return !html.includes('javascript') && html.includes('href="/b"');
  });
  rule('renderEmptyState: Symbol nur aus erlaubten Zeichen', () => !(m['empty-state'].renderEmptyState({ title: 'x', icon: '"><script>' }) as string).includes('<script') && (m['empty-state'].renderEmptyState({ title: 'x', icon: 'i-calendar' }) as string).includes('href="#i-calendar"'));
  rule('renderEmptyState: titleAs h2 bis h6', () => (m['empty-state'].renderEmptyState({ title: 'x', titleAs: 'h2' }) as string).includes('<h2 class="dss-empty-title">') && (m['empty-state'].renderEmptyState({ title: 'x', titleAs: 'h1' }) as string).includes('<h3 class="dss-empty-title">'));

  // ── table.js ──
  rule('renderTable: Zellen, Titel und Kopf maskiert', () => {
    const html = table({ title: HOSTILE, meta: HOSTILE, caption: HOSTILE, columns: [{ key: 'a', label: HOSTILE }], rows: [[HOSTILE, { text: HOSTILE, className: HOSTILE }]] });
    return !html.includes('<img') && !html.includes('onerror="') && html.includes('&lt;img');
  });
  rule('renderTable: Link der Zelle nur sicher', () => {
    const html = table({ rows: [[{ text: 'a', href: JS }, { text: 'b', href: '/b' }]] });
    return !html.includes('javascript') && html.includes('<a class="dss-link" href="/b">b</a>');
  });
  rule('renderTable: Spaltenbreite nur als Länge, kein freies CSS', () => {
    const html = table({ columns: [{ key: 'a', label: 'a', width: '80px' }, { key: 'b', label: 'b', width: 'red;background:url(x)' }, { key: 'c', label: 'c', width: 120 }] });
    return html.includes('style="width: 80px;"') && html.includes('style="width: 120px;"') && !html.includes('url(') && count(html, 'style=') === 2;
  });
  rule('renderTable: Sortierung setzt aria-sort und Klassen', () => {
    const html = table({ columns: [{ key: 'a', label: 'a', sortable: true, sort: 'desc' }, { key: 'b', label: 'b', sort: 'bogus' }] });
    return html.includes('aria-sort="descending"') && html.includes('class="left sortable sort-desc"') && count(html, 'aria-sort') === 1;
  });
  rule('renderTable: Dichte nur aus der Liste', () => table({ density: 'dense' }).includes('dss-tbl--dense') && table({ density: '"><x>' }).includes('dss-tbl--default'));
  rule('renderTable: einklappbar braucht einen Titel', () => table({ collapsible: true, title: 'T' }).includes('is-collapsible') && !table({ collapsible: true }).includes('is-collapsible'));
  rule('renderTable: Bereichsname aus caption, Titel, sonst Tabelle', () => table({ caption: 'C', title: 'T' }).includes('aria-label="C"') && table({ title: 'T' }).includes('aria-label="T"') && table({}).includes('aria-label="Tabelle"'));

  // ── league-card.js ──
  rule('LeagueCard: ohne eigene Mannschaft die ersten limit Zeilen', () => ranks(league({ title: 'T', teams: many, limit: 2 })) === '1,2' && ranks(league({ title: 'T', teams: many })) === '1,2,3');
  rule('LeagueCard: eigene Mannschaft mit zwei davor und einer dahinter', () => ranks(league({ title: 'T', teams: own7 })) === '5,6,7,8' && ranks(league({ title: 'T', teams: own7.map((t, i) => ({ ...t, own: i === 0 })) })) === '1,2,3,4'
    && ranks(league({ title: 'T', teams: own7.map((t, i) => ({ ...t, own: i === 11 })) })) === '9,10,11,12');
  rule('LeagueCard: ungültiges limit fällt auf 3', () => [0, -1, 1.5, '2', Number.NaN].every((limit) => ranks(league({ title: 'T', teams: many, limit })) === '1,2,3'));
  rule('LeagueCard: Titel, Namen und Link-Text maskiert', () => {
    const html = league({ title: HOSTILE, teams: [{ rank: 1, name: HOSTILE, short: HOSTILE, points: 1 }], href: '/x', linkLabel: HOSTILE });
    return !html.includes('<img') && !html.includes('onerror="') && count(html, '&lt;img') >= 5;
  });
  rule('LeagueCard: Link und Teamlink nur sicher', () => {
    const html = league({ title: 'T', teams: [{ rank: 1, name: 'A', href: JS, logo: JS }], href: JS, logos: true });
    return !html.includes('javascript') && !html.includes('<a ') && !html.includes('<img');
  });
  rule('LeagueCard: eigene Zeile mit is-own und verstecktem Text', () => {
    const html = league({ title: 'T', teams: own7 });
    return html.includes('<tr class="is-own">') && html.includes('<span class="dss-sr-only">, eigene Mannschaft</span>');
  });
  rule('LeagueCard: Zonen mit Klasse, verstecktem Text und Legende', () => {
    const html = league({ title: 'T', teams: [{ rank: 1, name: 'A', zone: 'up' }, { rank: 2, name: 'B', zone: 'down' }, { rank: 3, name: 'C', zone: '__proto__' }] });
    return html.includes('dss-league-zone dss-league-zone--up') && html.includes(', Aufstiegsplatz') && html.includes('<ul class="dss-league-legend" aria-label="Legende">') && count(html, 'dss-league-key ') === 2;
  });
  rule('LeagueCard: Spalten nur, wenn gewünscht', () => {
    const none = league({ title: 'T', teams: many.slice(0, 1) });
    const all = league({ title: 'T', teams: many.slice(0, 1), columns: ['won', 'lost', 'diff', 'form'] });
    return !none.includes('Siege') && !none.includes('Form') && all.includes('Siege') && all.includes('Niederlagen') && all.includes('Korbdifferenz') && all.includes('>Form<');
  });
  rule('LeagueCard: kompakt ohne Untertitel, Standard mit', () => !league({ title: 'T', teams: many, size: 'compact' }).includes('dss-league-sub') && league({ title: 'T', teams: many, teamCount: 12 }).includes('dss-league-sub'));
  rule('LeagueCard: einklappbar braucht einen Titel; Untertitel und Live im Kopf', () => {
    const open = league({ title: 'T', teams: many, collapsible: true, open: true, teamCount: 12, live: 2, id: 'l' });
    return open.includes('dss-league-head--acc') && open.includes('<span class="dss-acc-sub">12 Teams') && open.includes('2 Spiele laufen') && !league({ title: '', teams: many, collapsible: true }).includes('is-collapsible');
  });
  rule('LeagueCard: titleAs h2 bis h6', () => league({ title: 'T', teams: many, titleAs: 'h5' }).includes('<h5 class="dss-league-title">') && league({ title: 'T', teams: many, titleAs: 'h1' }).includes('<h3 class="dss-league-title">'));
  rule('LeagueCard: Plätze und Zahlen nur gültig', () => {
    const html = league({ title: 'T', teams: [{ rank: 0, name: 'A', played: Number.NaN, points: Infinity }, { rank: 1.5, name: 'B', played: '3' }] });
    return !html.includes('NaN') && !html.includes('Infinity') && count(html, '<td class="dss-league-rank"></td>') === 2 && !html.includes('<td class="num">3</td>');
  });

  // ── schedule.js ──
  rule('Spielplan: Texte und Namen maskiert', () => {
    const html = sched({ games: [game({ date: HOSTILE, time: HOSTILE, venue: HOSTILE, note: HOSTILE, nr: HOSTILE, section: HOSTILE, heim: { name: HOSTILE, short: HOSTILE }, gast: { name: HOSTILE } })], title: HOSTILE, meta: HOSTILE, caption: HOSTILE });
    return !html.includes('<img') && !html.includes('onerror="');
  });
  rule('Spielplan: Links nur sicher (Team, Liga)', () => {
    const html = sched({ games: [game({ heim: { name: 'A', href: JS, logo: JS }, gast: { name: 'B', href: '/b' }, league: { name: 'L', href: JS } })], logos: true });
    return !html.includes('javascript') && html.includes('<a class="dss-link" href="/b">');
  });
  rule('Spielplan: Ergebnis nur bei beendet oder live', () => {
    const base = { heim: { name: 'A', score: 3 }, gast: { name: 'B', score: 2 } };
    return sched({ games: [game({ ...base, state: 'scheduled' })] }).includes('dss-sch-none') && sched({ games: [game({ ...base, state: 'finished' })] }).includes('<span class="dss-sch-score" aria-hidden="true">3 : 2</span>')
      && sched({ games: [game({ ...base, state: 'live' })] }).includes('3 : 2') && sched({ games: [game({ ...base, state: 'cancelled' })] }).includes('dss-sch-none');
  });
  rule('Spielplan: Verlierer abgeblendet, Sieger nicht', () => {
    const html = sched({ games: [game({ state: 'finished', heim: { name: 'A', score: 3 }, gast: { name: 'B', score: 2 } })] });
    return count(html, 'dss-sch-team is-loser') === 1 && html.indexOf('is-loser') > html.indexOf('>A<');
  });
  rule('Spielplan: Zustände mit Klasse und Text (abgesagt, verschoben, live)', () => {
    const c1 = sched({ games: [game({ state: 'cancelled', time: '17:00' })] });
    const c2 = sched({ games: [game({ state: 'postponed' })] });
    const c3 = sched({ games: [game({ state: 'live', time: '17:00' })] });
    return c1.includes('is-cancelled') && c1.includes('> abgesagt<') && c2.includes('is-postponed') && c2.includes('> verschoben<') && c3.includes('is-live') && c3.includes('dss-sch-live');
  });
  rule('Spielplan: Freilos über alle Spalten', () => {
    const html = sched({ games: [game({ state: 'bye', time: '15:00', heim: { name: 'A' } }), game({ id: 'b', state: 'bye', note: 'Feiertag', heim: undefined, gast: undefined })] });
    return html.includes('colspan="3"') && html.includes('hat Freilos') && html.includes('Feiertag') && html.includes('is-bye');
  });
  rule('Spielplan: Perspektive mit Chip, „vs.“ und „@“', () => {
    const html = sched({ games: [game({ heim: undefined, gast: undefined, state: 'finished', ownScore: 80, opponent: { name: 'X', score: 70 }, at: 'gast' })] });
    return html.includes('dss-chip--amber">@<') && html.includes('dss-chip--ok" aria-hidden="true">S<') && html.includes('80 : 70');
  });
  rule('Spielplan: time und notice als Text, maskiert', () => {
    const html = sched({ games: [game({ time: '17:30' })], layout: 'columns' }, { time: () => HOSTILE, notice: () => HOSTILE });
    return !html.includes('<img') && count(html, '&lt;img') === 2;
  });
  rule('Spielplan: Layout und Dichte nur aus der Liste', () => sched({ games: [game()], layout: '"><x>', density: '"><x>' }).includes('dss-sch--versus') && !sched({ games: [game()], layout: '"><x>' }).includes('<x>'));
  rule('Spielplan: einklappbar braucht einen Titel', () => sched({ games: [game()], title: 'T', collapsible: true }).includes('is-collapsible') && !sched({ games: [game()], collapsible: true }).includes('is-collapsible'));
  rule('Raster: leere Zelle zeigt die Beschriftung, belegte das Spiel', () => {
    const html = grid({ games: [game({ time: '09:00', column: 'a' })], columns: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], emptyLabel: 'frei' });
    return html.includes('dss-sg-cell is-empty') && html.includes('<span class="dss-sg-empty">frei</span>') && count(html, 'class="dss-sg-game') === 1;
  });
  rule('Raster: Pausen und Freilose als eigene Zeilen', () => {
    const html = grid({ games: [game({ time: '09:00', column: 'a' }), game({ id: 'b', state: 'bye', time: '10:00', heim: { name: 'Z' } })], columns: [{ id: 'a', label: 'A' }], breaks: [{ time: '09:30', label: 'Pause' }] });
    return html.includes('dss-sg-break') && html.includes('>Pause<') && html.includes('dss-sg-bye') && html.includes('hat Freilos');
  });
  rule('Raster: Spalten- und Zellenbeschriftung maskiert', () => {
    const html = grid({ games: [game({ time: '09:00', column: 'a' })], columns: [{ id: 'a', label: HOSTILE }] });
    return !html.includes('<img') && !html.includes('onerror="');
  });

  // ── match-card.js ──
  const mc = (props: Record<string, unknown>) => match({ heim: { name: 'A', score: 80 }, gast: { name: 'B', score: 70 }, ...props });
  rule('MatchCard: Verlierer nur bei beendetem Spiel', () => {
    const fin = mc({ state: 'finished' });
    const back = { heim: { name: 'A', score: 70 }, gast: { name: 'B', score: 80 } };
    return count(fin, 'dss-match-team dss-match-team--gast is-loser') === 1 && count(mc({ state: 'finished', ...back }), 'dss-match-team is-loser') === 1
      && !mc({ state: 'live' }).includes('is-loser') && !mc({ state: 'scheduled' }).includes('is-loser') && !mc({ state: 'live', ...back }).includes('is-loser');
  });
  rule('MatchCard: Punkte erst ab Spielbeginn', () => !mc({ state: 'scheduled' }).includes('dss-match-score') && count(mc({ state: 'live' }), 'dss-match-score') === 2);
  rule('MatchCard: Ziel nur sicher; ohne Ziel div, mit button Button', () =>
    mc({ href: JS }).startsWith('<div ') && mc({ href: '/s/1' }).startsWith('<a class="dss-match dss-match--scheduled" href="/s/1">') && match({ heim: { name: 'A' }, gast: { name: 'B' } }, { button: true }).startsWith('<button type="button"'));
  rule('MatchCard: Live-Text aus Abschnitt und Uhr', () => mc({ state: 'live', period: 3, clock: '04:12' }).includes('Live · 3. Viertel 04:12') && mc({ state: 'live', period: 10, periods: 8 }).includes('2. Verlängerung'));
  rule('MatchCard: Texte maskiert', () => {
    const html = mc({ league: HOSTILE, matchday: HOSTILE, date: HOSTILE, time: HOSTILE, venue: HOSTILE, heim: { name: HOSTILE, short: HOSTILE, logo: JS }, gast: { name: HOSTILE }, logos: true });
    return !html.includes('<img') && !html.includes('javascript') && !html.includes('onerror="');
  });
  rule('MatchCard: Namen kurz, Logos als dekoratives Bild', () => mc({ heim: { name: 'Lindenberg', short: 'LIN' }, names: 'short' }).includes('dss-match-name dss-team-name dss-team-name--short') && mc({ logos: true, heim: { name: 'A', logo: '/l.svg' } }).includes('<img src="/l.svg" alt="" loading="lazy">'));

  // ── team-card.js ──
  const tc = (props: Record<string, unknown>, options?: unknown) => teamCard({ name: 'Hawks', ...props }, options);
  rule('TeamCard: Liga-Link nur ohne Aktion', () => tc({ league: 'L', leagueHref: '/l' }).includes('<a class="dss-link" href="/l">') && !tc({ league: 'L', leagueHref: JS }).includes('javascript') && !tc({ league: 'L', leagueHref: '/l', href: '/t' }).includes('href="/l"') && !tc({ league: 'L', leagueHref: '/l' }, { button: true }).includes('href="/l"'));
  rule('TeamCard: Karte als Link nur mit sicherem Ziel, sonst Name', () => tc({ href: '/t' }).includes('<a class="dss-team-link" href="/t">') && !tc({ href: JS }).includes('<a ') && tc({ href: JS }).includes('dss-team--standard"'));
  rule('TeamCard: Bilanz, Platz und Punkte nur mit gültigen Werten', () => {
    const none = tc({ record: { w: -1, l: 2.5 }, rank: 0, points: Number.NaN });
    const all = tc({ record: { w: 8, l: 3 }, rank: 3, rankOf: 12, points: 16 });
    return !none.includes('dss-team-vitals') && all.includes('8–3') && all.includes('Platz von 12') && all.includes('Punkte: 16');
  });
  rule('TeamCard: Statistik nur mit übergebenen Feldern', () => !tc({ stats: {} }).includes('dss-team-stats') && tc({ stats: { trb: 38.2 } }).includes('38,2') && !tc({ stats: { trb: 38.2 } }).includes('2PP'));
  rule('TeamCard: kompakt als Zeile ohne Blöcke', () => {
    const html = tc({ size: 'compact', record: { w: 1, l: 0 }, next: { opponent: { name: 'B' } }, squad: { players: 5 } });
    return html.includes('dss-team--compact') && !html.includes('dss-team-games') && !html.includes('dss-team-squad') && html.includes('dss-team-rec');
  });
  rule('TeamCard: Spielzeilen mit Gegner, Heim/Auswärts und Ergebnis', () => {
    const html = tc({ next: { opponent: { name: 'B' }, at: 'heim', date: 'Sa' }, last: { opponent: { name: 'C' }, at: 'gast', ownScore: 80, opponentScore: 70 } });
    return html.includes('Heimspiel gegen ') && html.includes('Auswärtsspiel bei ') && html.includes('dss-chip--ok" aria-hidden="true">S<') && html.includes('80 : 70');
  });
  rule('TeamCard: Texte maskiert', () => {
    const html = tc({ name: HOSTILE, short: HOSTILE, league: HOSTILE, season: HOSTILE, next: { opponent: { name: HOSTILE }, venue: HOSTILE, date: HOSTILE }, logo: JS });
    return !html.includes('<img') && !html.includes('javascript') && !html.includes('onerror="');
  });

  // ── venue-card.js / map-view.js ──
  const vgames = Array.from({ length: 9 }, (_v, i) => ({ id: `s${i}`, state: i === 0 ? 'finished' : i === 1 ? 'bye' : 'scheduled', heim: { name: `Heim ${i}` }, gast: { name: `Gast ${i}` } }));
  const gameCount = (html: string) => count(html, 'class="dss-venue-game"');
  rule('VenueCard: Spiele ohne beendete und Spielfrei, Standard 2', () => gameCount(venue({ name: 'H', games: vgames })) === 2 && !venue({ name: 'H', games: vgames, limit: 5 }).includes('Heim 0') && !venue({ name: 'H', games: vgames, limit: 5 }).includes('Heim 1'));
  rule('VenueCard: limit von 1 bis 5', () => gameCount(venue({ name: 'H', games: vgames, limit: 1 })) === 1 && gameCount(venue({ name: 'H', games: vgames, limit: 99 })) === 5 && gameCount(venue({ name: 'H', games: vgames, limit: 0 })) === 2);
  rule('VenueCard: kompakt ohne Spiele', () => gameCount(venue({ name: 'H', games: vgames, size: 'compact' })) === 0 && venue({ name: 'H', size: 'compact' }).includes('dss-venue--compact'));
  rule('VenueCard: Karte nur mit gültigen Koordinaten', () => venue({ name: 'H', lat: 49.3, lng: 7.9 }).includes('dss-venue-map') && !venue({ name: 'H', lat: 95, lng: 7.9 }).includes('dss-venue-map') && !venue({ name: 'H', lat: 49.3 }).includes('dss-venue-map') && !venue({ name: 'H', lat: '49.3', lng: '7.9' }).includes('dss-venue-map'));
  rule('VenueCard: vor dem Klick keine Kartenfläche und kein Bild (kein Netz)', () => {
    const html = venue({ name: 'H', lat: 49.3, lng: 7.9 });
    return html.includes('data-state="idle"') && html.includes('dss-map-load') && !html.includes('dss-map-canvas') && !html.includes('<img');
  });
  rule('VenueCard: load=auto zeigt die Kartenfläche (inert) ohne Schaltfläche', () => {
    const html = venue({ name: 'H', lat: 49.3, lng: 7.9, load: 'auto' });
    return html.includes('data-state="loading"') && html.includes('dss-map-canvas') && html.includes('inert') && !html.includes('dss-map-load');
  });
  rule('VenueCard: ungültige Kachel-Adresse ergibt den Fehlerzustand mit Hinweis', () => {
    const bad = venue({ name: 'H', lat: 49.3, lng: 7.9, tileUrl: 'http://example.org/{z}/{x}/{y}.png' });
    const good = venue({ name: 'H', lat: 49.3, lng: 7.9, tileUrl: '/tiles/{z}/{x}/{y}.png' });
    return bad.includes('data-state="error"') && bad.includes('konnte nicht geladen werden') && good.includes('data-state="idle"');
  });
  rule('VenueCard: Hallenseite nur sicher, Link-Text mit Namen', () => {
    const html = venue({ name: 'Halle Nord', href: '/h' });
    return html.includes('href="/h"') && html.includes('<span class="dss-sr-only">, Halle Nord</span>') && !venue({ name: 'H', href: JS }).includes('dss-venue-foot');
  });
  rule('VenueCard: Kontakt mit tel- und mailto-Link nur bei gültigen Werten', () => {
    const html = venue({ name: 'H', contact: { name: 'N', phone: '030 123456', email: 'a@example.org' } });
    const bad = venue({ name: 'H', contact: { phone: 'tel:+49;evil', email: 'a@b.de?cc=x' } });
    return html.includes('href="tel:030123456"') && html.includes('href="mailto:a@example.org"') && !bad.includes('href=');
  });
  rule('VenueCard: Name, Adresse, Info, Spiele maskiert', () => {
    const html = venue({ name: HOSTILE, address: { street: HOSTILE, city: HOSTILE }, info: HOSTILE, contact: { name: HOSTILE }, games: [{ id: 'a', state: 'scheduled', date: HOSTILE, field: HOSTILE, league: { name: HOSTILE }, heim: { name: HOSTILE, short: HOSTILE, logo: JS }, gast: { name: HOSTILE } }], logos: true, lat: 49.3, lng: 7.9, privacyNote: HOSTILE });
    return !html.includes('<img') && !html.includes('javascript') && !html.includes('onerror="');
  });
  rule('VenueCard: Ortsliste mit Adresse als Text und Links', () => {
    const html = venue({ name: 'Halle', lat: 49.3, lng: 7.9, address: { street: 'Weg 1', zip: '12345', city: 'Ort' } });
    return html.includes('<address class="dss-venue-address"><span class="dss-venue-line">Weg 1</span><span class="dss-venue-line">12345 Ort</span></address>') && html.includes('Größere Karte') && html.includes('Route planen') && html.includes('openstreetmap.org');
  });
  return R;
}
