// @vitest-environment node
// Mutationstests der Render-Funktionen (V2a): Jede Regel aus tests/helpers/render-rules.ts muss gelten (echter Quelltext) und kippen, wenn man den
// zugehörigen Quelltext gezielt verfälscht: Escaping weglassen, safeHref weglassen, Grenze limit, Filter finished/bye, Fensterregel, titleAs.
import { describe, expect, it } from 'vitest';
import { mutate } from './helpers/mutation';
import { loadAll, renderRules, sourceOf, type FileName } from './helpers/render-rules';

type Mutation = { file: FileName; name: string; rule: string; from: string; to: string };

const M: Mutation[] = [
  // escape.js
  { file: 'escape', name: 'Anführungszeichen nicht maskiert', rule: "esc: & < > \" ' werden maskiert", from: `'"': '&quot;',`, to: '' },
  { file: 'escape', name: 'kleiner-als nicht maskiert', rule: "esc: & < > \" ' werden maskiert", from: `'<': '&lt;', `, to: '' },
  { file: 'escape', name: 'Steuerzeichen bleiben', rule: 'esc: Steuerzeichen entfallen, Tabulator und Zeilenumbruch bleiben', from: ".replace(CONTROL, '')", to: '' },
  { file: 'escape', name: 'Objekte werden zu Text', rule: 'esc: nur Text und endliche Zahlen, alles andere ist leer', from: "else if (typeof value === 'number' && Number.isFinite(value)) text = String(value);\n  else if (typeof value === 'bigint') text = String(value);", to: "else text = String(value ?? '');" },
  { file: 'escape', name: 'attr ohne Maskierung', rule: 'attr: maskiert Anführungszeichen wie esc', from: 'return esc(value);', to: 'return String(value);' },
  // core.js
  { file: 'core', name: 'url ohne safeHref', rule: 'url: nur sichere Ziele', from: "typeof value === 'string' ? safeHref(value) : undefined", to: "typeof value === 'string' ? value : undefined" },
  { file: 'core', name: 'Logo ohne Prüfung', rule: 'teamOf: Logo und Ziel nur sicher', from: 'logo: url(team.logo),', to: 'logo: str(team.logo) || undefined,' },
  { file: 'core', name: 'Ziel des Teams ohne Prüfung', rule: 'teamOf: Logo und Ziel nur sicher', from: 'href: url(team.href),', to: 'href: str(team.href) || undefined,' },
  { file: 'core', name: 'Kurzname nicht versteckt', rule: 'nameText: Kurzname ist versteckt, der volle Name steht im title', from: 'aria-hidden="true" title=', to: 'title=' },
  { file: 'core', name: 'Name im title ungeschützt', rule: 'nameText: ohne Kurzform oder bei gleichem Namen nur der Name, maskiert', from: 'if (!short) return esc(team.name);', to: 'if (!short) return String(team.name);' },
  { file: 'core', name: 'Modifier short fehlt', rule: 'nameText: names=short setzt den Modifier, full nicht', from: "names === 'short' && 'dss-team-name--short'", to: 'false' },
  { file: 'core', name: 'Logo mit Alternativtext fehlt', rule: 'logoBadge: Bild ohne Alternativtext, versteckt; ohne Logo die Initialen', from: 'alt="" loading="lazy"', to: 'loading="lazy"' },
  { file: 'core', name: 'Logo nicht versteckt', rule: 'logoBadge: Bild ohne Alternativtext, versteckt; ohne Logo die Initialen', from: '" aria-hidden="true">${inner}</span>', to: '">${inner}</span>' },
  { file: 'core', name: 'Rahmen zu ohne hidden', rule: 'collapsibleFrame: geschlossen mit hidden, inert und aria-expanded=false', from: ": ' hidden inert'}>", to: ": ''}>" },
  { file: 'core', name: 'aria-expanded fest', rule: 'collapsibleFrame: offen ohne hidden, mit is-open und aria-expanded=true', from: `aria-expanded="\${open ? 'true' : 'false'}"`, to: 'aria-expanded="false"' },
  { file: 'core', name: 'aria-controls zeigt ins Leere', rule: 'collapsibleFrame: der Button steuert das Panel (aria-controls, ids)', from: 'aria-controls="${attr(key)}-panel"', to: 'aria-controls="${attr(key)}-x"' },
  { file: 'core', name: 'Titel des Rahmens ohne esc', rule: 'collapsibleFrame: Titel und Untertitel werden maskiert, Komma trennt den Namen', from: 'let label = esc(title);', to: 'let label = String(title);' },
  { file: 'core', name: 'Untertitel ohne esc', rule: 'collapsibleFrame: Titel und Untertitel werden maskiert, Komma trennt den Namen', from: 'dss-acc-sub">${esc(sub)}', to: 'dss-acc-sub">${sub}' },
  { file: 'core', name: 'Rahmen ohne Schlüssel', rule: 'collapsibleFrame: ohne id ein stabiler Schlüssel aus uid', from: 'const key = id || `dss-cf-${uid}`;', to: "const key = id || 'dss-cf';" },
  { file: 'core', name: 'Hash ohne Eingabe', rule: 'uidFor: gleiche Eingabe gleiche id, andere Eingabe andere id', from: 'hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;', to: 'hash = 0;' },
  { file: 'core', name: 'uid ohne Bereinigung', rule: 'uidFor: options.uid gilt und wird bereinigt', from: ".replace(/[^A-Za-z0-9_-]/g, '')", to: '' },
  { file: 'core', name: 'Form nicht versteckt', rule: 'formChips: Zeichen versteckt, Text aus formLabel, höchstens fünf', from: '<span class="dss-form-list" aria-hidden="true">', to: '<span class="dss-form-list">' },
  { file: 'core', name: 'Form ohne formLabel', rule: 'formChips: Zeichen versteckt, Text aus formLabel, höchstens fünf', from: 'esc(formLabel(form))', to: "esc('Form')" },
  { file: 'core', name: 'titleAs ohne Prüfung', rule: 'headingOf: h2 bis h6, sonst h3', from: 'resolveHeading(titleAs)', to: "(typeof titleAs === 'string' ? titleAs : 'h3')" },
  { file: 'core', name: 'pick lässt alles zu', rule: 'pick: nur erlaubte Werte', from: 'allowed.includes(value) ? value : fallback', to: 'value ?? fallback' },
  // stats.js
  { file: 'stats', name: 'Wert ohne esc', rule: 'renderStats: Werte und Beschriftungen werden maskiert', from: ': esc(item.value);', to: ': String(item.value);' },
  { file: 'stats', name: 'Beschriftung ohne esc', rule: 'renderStats: Werte und Beschriftungen werden maskiert', from: 'dss-stat-label">${esc(item.label)}', to: 'dss-stat-label">${item.label}' },
  { file: 'stats', name: 'leerer Wert ohne versteckten Text', rule: 'renderStats: fehlender Wert mit Gedankenstrich und verstecktem Text', from: '<span class="dss-sr-only">${esc(statEmptyText)}</span>', to: '' },
  { file: 'stats', name: 'compact ohne Modifier', rule: 'renderStats: compact und leer', from: "p.compact === true && 'dss-stats--compact'", to: 'false' },
  { file: 'core', name: 'immer Buchstaben', rule: 'renderFormChips: variant nur dots oder letters', from: "variant === 'letters' && 'dss-form--letters'", to: "variant && 'dss-form--letters'" },
  // empty-state.js
  { file: 'empty-state', name: 'Titel ohne esc', rule: 'renderEmptyState: Text maskiert', from: '>${esc(title)}</${tag}>', to: '>${title}</${tag}>' },
  { file: 'empty-state', name: 'Text ohne esc', rule: 'renderEmptyState: Text maskiert', from: '<p class="dss-empty-body">${esc(body)}</p>', to: '<p class="dss-empty-body">${body}</p>' },
  { file: 'empty-state', name: 'Ton frei', rule: 'renderEmptyState: Ton bestimmt Klasse und Button', from: "pick(p.tone, TONES, 'neutral')", to: "str(p.tone) || 'neutral'" },
  { file: 'empty-state', name: 'Aktion ohne safeHref', rule: 'renderEmptyState: Aktionen nur mit sicherem Ziel', from: 'const href = url(item.href);', to: 'const href = str(item.href);' },
  { file: 'empty-state', name: 'Symbol ohne Prüfung', rule: 'renderEmptyState: Symbol nur aus erlaubten Zeichen', from: '/^[A-Za-z0-9_-]+$/.test(icon)', to: 'icon' },
  { file: 'empty-state', name: 'Ebene frei', rule: 'renderEmptyState: titleAs h2 bis h6', from: 'const tag = headingOf(p.titleAs);', to: "const tag = str(p.titleAs) || 'h3';" },
  // table.js
  { file: 'table', name: 'Zelle ohne esc', rule: 'renderTable: Zellen, Titel und Kopf maskiert', from: ': esc(c.text);', to: ': String(c.text);' },
  { file: 'table', name: 'Titel ohne esc', rule: 'renderTable: Zellen, Titel und Kopf maskiert', from: 'class="dss-frame-title">${esc(title)}', to: 'class="dss-frame-title">${title}' },
  { file: 'table', name: 'Spaltenkopf ohne esc', rule: 'renderTable: Zellen, Titel und Kopf maskiert', from: '>${esc(col.label)}</th>', to: '>${col.label}</th>' },
  { file: 'table', name: 'Zelle ohne safeHref', rule: 'renderTable: Link der Zelle nur sicher', from: 'const href = url(c.href);', to: 'const href = str(c.href);' },
  { file: 'table', name: 'Breite frei', rule: 'renderTable: Spaltenbreite nur als Länge, kein freies CSS', from: 'WIDTH.test(width) ? ', to: 'width ? ' },
  { file: 'table', name: 'aria-sort fehlt', rule: 'renderTable: Sortierung setzt aria-sort und Klassen', from: '${sort ? ` aria-sort="${ARIA_SORT[sort]}"` : \'\'}', to: '' },
  { file: 'table', name: 'Sortierrichtung frei', rule: 'renderTable: Sortierung setzt aria-sort und Klassen', from: "pick(col.sort, SORTS, undefined)", to: 'str(col.sort) || undefined' },
  { file: 'table', name: 'Dichte frei', rule: 'renderTable: Dichte nur aus der Liste', from: "pick(p.density, DENSITIES, 'default')", to: "str(p.density) || 'default'" },
  { file: 'table', name: 'einklappbar ohne Titel', rule: 'renderTable: einklappbar braucht einen Titel', from: 'p.collapsible === true && title)', to: 'p.collapsible === true)' },
  { file: 'table', name: 'Bereichsname ohne caption', rule: 'renderTable: Bereichsname aus caption, Titel, sonst Tabelle', from: "attr(caption || title || 'Tabelle')", to: "attr(title || 'Tabelle')" },
  // league-card.js
  { file: 'league-card', name: 'limit ohne Wirkung', rule: 'LeagueCard: ohne eigene Mannschaft die ersten limit Zeilen', from: '{ limit: p.limit }', to: '{ limit: 99 }' },
  { file: 'league-card', name: 'ungültiges limit wird übernommen', rule: 'LeagueCard: ungültiges limit fällt auf 3', from: '{ limit: p.limit }', to: '{ limit: Number(p.limit) }' },
  { file: 'league-card', name: 'kein Fenster um die eigene Mannschaft', rule: 'LeagueCard: eigene Mannschaft mit zwei davor und einer dahinter', from: 'leagueWindow(teams.filter', to: '((rows, o) => rows.slice(0, o.limit ?? 3))(teams.filter' },
  { file: 'league-card', name: 'Titel ohne esc', rule: 'LeagueCard: Titel, Namen und Link-Text maskiert', from: 'class="dss-league-title">${esc(title)}', to: 'class="dss-league-title">${title}' },
  { file: 'league-card', name: 'Link-Text ohne esc', rule: 'LeagueCard: Titel, Namen und Link-Text maskiert', from: '${esc(linkLabel)}<span', to: '${linkLabel}<span' },
  { file: 'league-card', name: 'Beschriftung ohne esc', rule: 'LeagueCard: Titel, Namen und Link-Text maskiert', from: 'aria-label="${attr(title ? `Tabelle: ${title}` : \'Tabelle\')}"', to: 'aria-label="${title ? `Tabelle: ${title}` : \'Tabelle\'}"' },
  { file: 'league-card', name: 'Link ohne safeHref', rule: 'LeagueCard: Link und Teamlink nur sicher', from: 'const target = url(p.href);', to: "const target = str(p.href) || undefined;" },
  { file: 'league-card', name: 'Teamlink ohne safeHref', rule: 'LeagueCard: Link und Teamlink nur sicher', from: 'const { name, short, logo, href, own } = teamOf(t);', to: 'const { name, short, own } = teamOf(t);\n  const logo = str(t.logo) || undefined;\n  const href = str(t.href) || undefined;' },
  { file: 'league-card', name: 'eigene Zeile ohne Text', rule: 'LeagueCard: eigene Zeile mit is-own und verstecktem Text', from: "(t.own ? '<span class=\"dss-sr-only\">, eigene Mannschaft</span>' : '')", to: "''" },
  { file: 'league-card', name: 'eigene Zeile ohne Klasse', rule: 'LeagueCard: eigene Zeile mit is-own und verstecktem Text', from: 'cls(t.own && \'is-own\', ', to: 'cls(' },
  { file: 'league-card', name: 'keine Legende', rule: 'LeagueCard: Zonen mit Klasse, verstecktem Text und Legende', from: 'const legend = zoneLegend(rows);', to: 'const legend = [];' },
  { file: 'league-card', name: 'Spalten immer', rule: 'LeagueCard: Spalten nur, wenn gewünscht', from: "['won', 'lost', 'diff', 'form'].map((name) => columns.includes(name))", to: "['won', 'lost', 'diff', 'form'].map(() => true)" },
  { file: 'league-card', name: 'kompakt mit Untertitel', rule: 'LeagueCard: kompakt ohne Untertitel, Standard mit', from: "size === 'compact' ? '' : leagueSummary(", to: "false ? '' : leagueSummary(" },
  { file: 'league-card', name: 'einklappbar ohne Titel', rule: 'LeagueCard: einklappbar braucht einen Titel; Untertitel und Live im Kopf', from: 'p.collapsible === true && title)', to: 'p.collapsible === true)' },
  { file: 'league-card', name: 'Live ohne Text', rule: 'LeagueCard: einklappbar braucht einen Titel; Untertitel und Live im Kopf', from: "${tag.text ? `<span class=\"dss-league-live-n\">${esc(tag.text)}</span>` : ''}", to: '' },
  { file: 'league-card', name: 'Ebene frei', rule: 'LeagueCard: titleAs h2 bis h6', from: 'const tag = headingOf(p.titleAs);', to: "const tag = str(p.titleAs) || 'h3';" },
  { file: 'league-card', name: 'Zahlen als Text', rule: 'LeagueCard: Plätze und Zahlen nur gültig', from: 'esc(cellNumber(t.played))', to: 'esc(t.played)' },
  // schedule.js
  { file: 'schedule', name: 'Datum ohne esc', rule: 'Spielplan: Texte und Namen maskiert', from: '<span class="dss-sch-date">${esc(game.date)}</span>', to: '<span class="dss-sch-date">${game.date}</span>' },
  { file: 'schedule', name: 'Hinweis ohne esc', rule: 'Spielplan: Texte und Namen maskiert', from: 'dss-sch-note">${esc(game.note)}', to: 'dss-sch-note">${game.note}' },
  { file: 'schedule', name: 'Gruppenzeile ohne esc', rule: 'Spielplan: Texte und Namen maskiert', from: 'colspan="${cols.length}">${esc(group.section)}', to: 'colspan="${cols.length}">${group.section}' },
  { file: 'schedule', name: 'Titel ohne esc', rule: 'Spielplan: Texte und Namen maskiert', from: 'class="dss-frame-title">${esc(title)}', to: 'class="dss-frame-title">${title}' },
  { file: 'schedule', name: 'Liga-Link ohne safeHref', rule: 'Spielplan: Links nur sicher (Team, Liga)', from: 'href: url(obj(g.league).href)', to: 'href: str(obj(g.league).href) || undefined' },
  { file: 'schedule', name: 'Logo des Gegners ohne Prüfung', rule: 'Spielplan: Links nur sicher (Team, Liga)', from: 'const team = (value) => (value === undefined || value === null ? undefined : teamOf(value));', to: 'const team = (value) => (value === undefined || value === null ? undefined : { ...teamOf(value), href: str(obj(value).href) || undefined, logo: str(obj(value).logo) || undefined });' },
  { file: 'schedule', name: 'Ergebnis auch bei angesetzt', rule: 'Spielplan: Ergebnis nur bei beendet oder live', from: "(game.state === 'finished' || game.state === 'live') && hasScore(game, mode)", to: 'hasScore(game, mode)' },
  { file: 'schedule', name: 'Verlierer vertauscht', rule: 'Spielplan: Verlierer abgeblendet, Sieger nicht', from: "tn(game.heim, winner === 'gast', logos === true) + '<span class=\"dss-sch-sep\"", to: "tn(game.heim, winner === 'heim', logos === true) + '<span class=\"dss-sch-sep\"" },
  { file: 'schedule', name: 'Zustandstext fehlt', rule: 'Spielplan: Zustände mit Klasse und Text (abgesagt, verschoben, live)', from: "(stateLabel(game.state) ? `<span class=\"dss-sr-only\"> ${esc(stateLabel(game.state))}</span>` : '')", to: "''" },
  { file: 'schedule', name: 'Zustandsklasse fehlt', rule: 'Spielplan: Zustände mit Klasse und Text (abgesagt, verschoben, live)', from: "game.state === 'postponed' && 'is-postponed', game.state === 'bye'", to: "game.state === 'bye'" },
  { file: 'schedule', name: 'Freilos nur eine Spalte', rule: 'Spielplan: Freilos über alle Spalten', from: 'class="dss-sch-bye" colspan="${cols.length}"', to: 'class="dss-sch-bye" colspan="1"' },
  { file: 'schedule', name: 'Ergebnis-Chip fehlt', rule: 'Spielplan: Perspektive mit Chip, „vs.“ und „@“', from: "const result = mode === 'opponent' ? resolveOutcome(game) : undefined;", to: 'const result = undefined;' },
  { file: 'schedule', name: 'notice ohne esc', rule: 'Spielplan: time und notice als Text, maskiert', from: 'return esc(fn(game));', to: 'return String(fn(game));' },
  { file: 'schedule', name: 'Layout frei', rule: 'Spielplan: Layout und Dichte nur aus der Liste', from: "pick(p.layout, ['versus', 'opponent', 'columns'], undefined)", to: '(str(p.layout) || undefined)' },
  { file: 'schedule', name: 'einklappbar ohne Titel', rule: 'Spielplan: einklappbar braucht einen Titel', from: 'p.collapsible === true && title)', to: 'p.collapsible === true)' },
  { file: 'schedule', name: 'leere Zelle ohne Beschriftung', rule: 'Raster: leere Zelle zeigt die Beschriftung, belegte das Spiel', from: '`<span class="dss-sg-empty">${esc(emptyLabel)}</span>`', to: "''" },
  { file: 'schedule', name: 'Pausen fehlen', rule: 'Raster: Pausen und Freilose als eigene Zeilen', from: "const breaks = list(p.breaks).map(", to: "const breaks = [].map(" },
  { file: 'schedule', name: 'Spaltenkopf ohne esc', rule: 'Raster: Spalten- und Zellenbeschriftung maskiert', from: 'role="columnheader">${esc(c.label)}</th>', to: 'role="columnheader">${c.label}</th>' },
  { file: 'schedule', name: 'data-label ohne attr', rule: 'Raster: Spalten- und Zellenbeschriftung maskiert', from: 'data-label="${attr(columns[index].label)}"', to: 'data-label="${columns[index].label}"' },
  // match-card.js
  { file: 'match-card', name: 'Verlierer ohne Zustand', rule: 'MatchCard: Verlierer nur bei beendetem Spiel', from: "const gastWin = state === 'finished' && ", to: 'const gastWin = ' },
  { file: 'match-card', name: 'Verlierer bei live', rule: 'MatchCard: Verlierer nur bei beendetem Spiel', from: "const heimWin = state === 'finished' && ", to: "const heimWin = state !== 'scheduled' && " },
  { file: 'match-card', name: 'Punkte immer', rule: 'MatchCard: Punkte erst ab Spielbeginn', from: "const showScore = state !== 'scheduled';", to: 'const showScore = true;' },
  { file: 'match-card', name: 'Ziel ohne safeHref', rule: 'MatchCard: Ziel nur sicher; ohne Ziel div, mit button Button', from: 'const href = url(p.href);', to: 'const href = str(p.href) || undefined;' },
  { file: 'match-card', name: 'Button ignoriert', rule: 'MatchCard: Ziel nur sicher; ohne Ziel div, mit button Button', from: "if (obj(options).button === true) return", to: "if (false) return" },
  { file: 'match-card', name: 'Live-Text ohne Abschnitt', rule: 'MatchCard: Live-Text aus Abschnitt und Uhr', from: '[label, clock].filter(Boolean)', to: '[clock].filter(Boolean)' },
  { file: 'match-card', name: 'Liga ohne esc', rule: 'MatchCard: Texte maskiert', from: '<span>${esc(league)}</span>', to: '<span>${league}</span>' },
  { file: 'match-card', name: 'Halle ohne esc', rule: 'MatchCard: Texte maskiert', from: '<span>${esc(venue)}</span>', to: '<span>${venue}</span>' },
  { file: 'match-card', name: 'Datum ohne esc', rule: 'MatchCard: Texte maskiert', from: 'dss-match-when">${esc(date)}', to: 'dss-match-when">${date}' },
  { file: 'match-card', name: 'Kurzname ohne Klasse', rule: 'MatchCard: Namen kurz, Logos als dekoratives Bild', from: "nameText(team, names, 'dss-match-name')", to: 'nameText(team, names)' },
  // team-card.js
  { file: 'team-card', name: 'Liga-Link auch mit Aktion', rule: 'TeamCard: Liga-Link nur ohne Aktion', from: 'leagueHref && !clickable', to: 'leagueHref' },
  { file: 'team-card', name: 'Karte ohne safeHref', rule: 'TeamCard: Karte als Link nur mit sicherem Ziel, sonst Name', from: 'const href = url(p.href);', to: 'const href = str(p.href) || undefined;' },
  { file: 'team-card', name: 'Liga-Ziel ohne safeHref', rule: 'TeamCard: Liga-Link nur ohne Aktion', from: 'const leagueHref = url(p.leagueHref);', to: 'const leagueHref = str(p.leagueHref) || undefined;' },
  { file: 'team-card', name: 'Punkte ungeprüft', rule: 'TeamCard: Bilanz, Platz und Punkte nur mit gültigen Werten', from: 'const points = num(p.points);', to: 'const points = typeof p.points === \'number\' ? p.points : undefined;' },
  { file: 'team-card', name: 'Statistik immer', rule: 'TeamCard: Statistik nur mit übergebenen Feldern', from: 'statList.length\n    ?', to: 'true\n    ?' },
  { file: 'team-card', name: 'kompakt mit Blöcken', rule: 'TeamCard: kompakt als Zeile ohne Blöcke', from: "if (size === 'compact') {", to: "if (size === 'compact' && false) {" },
  { file: 'team-card', name: 'Präfix fehlt', rule: 'TeamCard: Spielzeilen mit Gegner, Heim/Auswärts und Ergebnis', from: '<span class="dss-sr-only">${esc(opponentPrefix(at))}</span>', to: '' },
  { file: 'team-card', name: 'Name ohne esc', rule: 'TeamCard: Texte maskiert', from: '<div class="dss-team-game-venue">${esc(next.venue)}</div>', to: '<div class="dss-team-game-venue">${next.venue}</div>' },
  { file: 'team-card', name: 'Saison ohne esc', rule: 'TeamCard: Texte maskiert', from: '${season ? `<span>${esc(season)}</span>` : \'\'}', to: '${season ? `<span>${season}</span>` : \'\'}' },
  // venue-card.js
  { file: 'venue-card', name: 'limit ohne Wirkung', rule: 'VenueCard: limit von 1 bis 5', from: '.map(gameOf), p.limit)', to: '.map(gameOf), 99)' },
  { file: 'js:venue', name: 'limit nicht begrenzt', rule: 'VenueCard: limit von 1 bis 5', from: 'return Math.min(limit, MAX_GAMES);', to: 'return limit;' },
  { file: 'js:venue', name: 'ungültiges limit ohne Standard', rule: 'VenueCard: limit von 1 bis 5', from: 'if (!Number.isInteger(limit) || limit < 1) return DEFAULT_GAMES;', to: 'if (!Number.isInteger(limit)) return DEFAULT_GAMES;' },
  { file: 'js:venue', name: 'beendete Spiele bleiben', rule: 'VenueCard: Spiele ohne beendete und Spielfrei, Standard 2', from: "g.state !== 'finished' && g.state !== 'bye' &&", to: "g.state !== 'bye' &&" },
  { file: 'js:venue', name: 'Spielfrei bleibt', rule: 'VenueCard: Spiele ohne beendete und Spielfrei, Standard 2', from: "g.state !== 'finished' && g.state !== 'bye' &&", to: "g.state !== 'finished' &&" },
  { file: 'js:league', name: 'Fenster ohne Rand-Verschiebung', rule: 'LeagueCard: eigene Mannschaft mit zwei davor und einer dahinter', from: 'const start = Math.min(Math.max(ownIndex - before, 0), sorted.length - size);', to: 'const start = Math.max(ownIndex - before, 0);' },
  { file: 'js:league', name: 'Standard-limit 5', rule: 'LeagueCard: ungültiges limit fällt auf 3', from: 'positive(options?.limit, 3)', to: 'positive(options?.limit, 5)' },
  { file: 'js:url', name: 'safeHref lässt javascript zu', rule: 'url: nur sichere Ziele', from: "return /^(https?|mailto|tel)$/i.test(scheme[1]) ? href : undefined;", to: 'return href;' },
  { file: 'js:heading', name: 'h1 erlaubt', rule: 'headingOf: h2 bis h6, sonst h3', from: "const TAGS = ['h2', 'h3', 'h4', 'h5', 'h6'];", to: "const TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];" },
  { file: 'js:schedule', name: 'Sieger nicht erkannt', rule: 'Spielplan: Verlierer abgeblendet, Sieger nicht', from: "if (game.heim.score > game.gast.score) return 'heim';", to: "if (game.heim.score > game.gast.score) return 'gast';" },
  { file: 'venue-card', name: 'beendete bleiben', rule: 'VenueCard: Spiele ohne beendete und Spielfrei, Standard 2', from: "state: str(g.state), date:", to: "state: g.state === 'finished' || g.state === 'bye' ? 'scheduled' : str(g.state), date:" },
  { file: 'venue-card', name: 'kompakt mit Spielen', rule: 'VenueCard: kompakt ohne Spiele', from: "size === 'compact' ? [] :", to: "false ? [] :" },
  { file: 'venue-card', name: 'Karte immer', rule: 'VenueCard: Karte nur mit gültigen Koordinaten', from: 'const hasMap = isCoord(lat, lng);', to: 'const hasMap = true;' },
  { file: 'venue-card', name: 'Hallenseite ohne safeHref', rule: 'VenueCard: Hallenseite nur sicher, Link-Text mit Namen', from: "venueHref(typeof p.href === 'string' ? p.href : undefined)", to: "(typeof p.href === 'string' ? p.href : undefined)" },
  { file: 'venue-card', name: 'Name im Link-Text fehlt', rule: 'VenueCard: Hallenseite nur sicher, Link-Text mit Namen', from: "${esc(linkLabel)}${title ? `<span class=\"dss-sr-only\">, ${esc(title)}</span>` : ''}</a></div>", to: '${esc(linkLabel)}</a></div>' },
  { file: 'venue-card', name: 'Kontakt ohne Prüfung', rule: 'VenueCard: Kontakt mit tel- und mailto-Link nur bei gültigen Werten', from: 'const person = contactInfo(obj(p.contact));', to: "const person = (() => { const c = obj(p.contact); return { name: str(c.name), phone: c.phone ? { text: str(c.phone), href: str(c.phone) } : undefined, email: c.email ? { text: str(c.email), href: str(c.email) } : undefined }; })();" },
  { file: 'venue-card', name: 'Name ohne esc', rule: 'VenueCard: Name, Adresse, Info, Spiele maskiert', from: 'class="dss-venue-title">${esc(title)}', to: 'class="dss-venue-title">${title}' },
  { file: 'venue-card', name: 'Adresse ohne esc', rule: 'VenueCard: Name, Adresse, Info, Spiele maskiert', from: '<span class="dss-venue-line">${esc(line)}</span>', to: '<span class="dss-venue-line">${line}</span>' },
  { file: 'venue-card', name: 'Info ohne esc', rule: 'VenueCard: Name, Adresse, Info, Spiele maskiert', from: '<p class="dss-venue-info">${esc(info)}</p>', to: '<p class="dss-venue-info">${info}</p>' },
  { file: 'venue-card', name: 'Adresse als Link', rule: 'VenueCard: Ortsliste mit Adresse als Text und Links', from: '<address class="dss-venue-address">', to: '<address class="dss-venue-address" data-x="">' },
  // map-view.js
  { file: 'map-view', name: 'Kachel-Adresse ungeprüft', rule: 'VenueCard: ungültige Kachel-Adresse ergibt den Fehlerzustand mit Hinweis', from: "!validTileUrl(tileUrl) ? 'error'", to: "false ? 'error'" },
  { file: 'map-view', name: 'immer laden', rule: 'VenueCard: vor dem Klick keine Kartenfläche und kein Bild (kein Netz)', from: "p.load === 'auto' ? 'loading' : 'idle'", to: "'loading'" },
  { file: 'map-view', name: 'auto ohne Fläche', rule: 'VenueCard: load=auto zeigt die Kartenfläche (inert) ohne Schaltfläche', from: "state === 'loading' ? `<div class=\"dss-map-canvas\"", to: "false ? `<div class=\"dss-map-canvas\"" },
  { file: 'map-view', name: 'Hinweis ohne esc', rule: 'VenueCard: Name, Adresse, Info, Spiele maskiert', from: '<p class="dss-map-note">${esc(privacy)}</p>', to: '<p class="dss-map-note">${privacy}</p>' },
  { file: 'map-view', name: 'Beschriftung ohne attr', rule: 'VenueCard: Name, Adresse, Info, Spiele maskiert', from: 'aria-label="${attr(str(p.label))}"', to: 'aria-label="${str(p.label)}"' },
];

describe('Mutationstests: Render-Funktionen', () => {
  it('Ausgangslage: alle Aussagen gelten', async () => {
    const rules = renderRules(await loadAll());
    expect(Object.entries(rules).filter(([, ok]) => !ok).map(([name]) => name)).toEqual([]);
    expect(Object.keys(rules).length).toBeGreaterThan(80);
  });
  it('jede Regel wird von mindestens einer Mutation geprüft', async () => {
    const rules = Object.keys(renderRules(await loadAll()));
    const covered = new Set(M.map((m) => m.rule));
    expect(rules.filter((name) => !covered.has(name))).toEqual([]);
    expect([...covered].filter((name) => !rules.includes(name))).toEqual([]);
  });
  it.each(M)('$file: $name', async ({ file, rule, from, to }) => {
    const base = renderRules(await loadAll());
    expect(base[rule], `Regel fehlt oder gilt nicht: ${rule}`).toBe(true);
    const mutated = renderRules(await loadAll({ file, source: mutate(sourceOf(file), from, to) }));
    expect(mutated[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
});
