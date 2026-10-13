// Vanilla-Beispiele „Markup aus Daten erzeugen“ (renderX / mountX), gezeigt auf den Seiten der Komponenten. Die Tests
// (tests/render-docs-code.test.ts) führen jedes Beispiel in jsdom aus und vergleichen das Ergebnis mit der Ausgabe der Svelte- und der
// React-Komponente zu denselben Daten (`DOCS` am Ende nennt Variablen, Behälter und Komponente). Alle Daten sind erfunden.
const IMPORT = (names: string) => `import { ${names} } from '@bbv/dss-design-system/render.js';`;

/** Ligencard: mountLeagueCard in ein Element, renderLeagueCard als Zeichenkette (Crawler). */
export const ligaRender = `<div id="liga"></div>

<script type="module">
  ${IMPORT('mountLeagueCard, renderLeagueCard')}

  // dieselben Eigenschaften wie bei LeagueCard (Svelte, React); eigene Mannschaft: own
  const liga = {
    title: 'Oberliga Nordhain Männer',
    teams: [
      { rank: 1, name: 'Lindenberg Hawks', short: 'Hawks', played: 11, won: 10, lost: 1, diff: 85, points: 20, zone: 'up', form: ['S', 'S', 'S', 'N', 'S'] },
      { rank: 2, name: 'BG Seeberg', played: 11, won: 9, lost: 2, diff: 40, points: 18, zone: 'up', form: ['S', 'U', 'S'] },
      { rank: 3, name: 'TSV Nordhain 1920', short: 'Nordhain', played: 11, won: 7, lost: 4, diff: 12.5, points: 14, own: true, form: ['N', 'S', 'S'], href: '/teams/nordhain' },
      { rank: 4, name: 'SV Kiefernau', played: 10, won: 6, lost: 4, diff: 0, points: 12 },
      { rank: 5, name: 'Elbach Eagles', short: 'Eagles', played: 11, won: 5, lost: 6, diff: -8, points: 10, zone: 'playoff' },
    ],
    teamCount: 12, played: 66, total: 132, columns: ['diff', 'form'], href: '/ligen/oberliga', live: 2,
  };

  // Im Browser: einsetzen (createContextualFragment), später aktualisieren und aufräumen
  const karte = mountLeagueCard(document.querySelector('#liga'), liga);
  function stand(played) {
    karte.update({ ...liga, played });   // ersetzt den Inhalt, der Fokus bleibt
  }
  // karte.destroy();                      // Listener und Markup entfernen, der frühere Inhalt kommt zurück

  // In Node (Crawler, statische Seite): dasselbe als Zeichenkette
  const html = renderLeagueCard(liga);
</script>`;

/** Ligencard einklappbar: das Accordion-Verhalten startet mountLeagueCard selbst. */
export const ligaEinklappbarRender = `<div id="liga-zu"></div>

<script type="module">
  ${IMPORT('mountLeagueCard')}

  const ligaZu = {
    title: 'Kreisliga Süd',
    teams: [
      { rank: 1, name: 'TuS Waldmark', played: 9, points: 16 },
      { rank: 2, name: 'BG Seeberg II', played: 9, points: 14 },
      { rank: 3, name: 'SG Elbtal', played: 10, points: 12 },
    ],
    teamCount: 10, played: 28, total: 90,
    collapsible: true, id: 'kreisliga-sued',   // ohne id: kein Deep-Link; open: true öffnet die Karte beim Start
  };

  // collapsible startet initAccordion für diesen Container; update hält den Zustand offen/zu, solange open gleich bleibt
  mountLeagueCard(document.querySelector('#liga-zu'), ligaZu);
</script>`;

export const teamRender = `<div id="team"></div>

<script type="module">
  ${IMPORT('mountTeamCard, renderTeamCard')}

  const team = {
    name: 'TSV Nordhain 1920', short: 'Nordhain', league: 'Oberliga Nordhain Männer', leagueHref: '/ligen/oberliga', season: '2026/27',
    record: { w: 8, l: 3 }, rank: 3, rankOf: 12, points: 16,
    next: { opponent: { name: 'BG Seeberg', short: 'Seeberg' }, at: 'heim', date: 'Sa, 17.10.', time: '17:30', venue: 'Sporthalle Nordhain' },
    last: { opponent: { name: 'Elbach Eagles', short: 'Eagles' }, at: 'gast', date: 'Sa, 10.10.', ownScore: 92, opponentScore: 79 },
    squad: { players: 14, staff: 3 },
    stats: { twoPtPct: 48.5, threePtPct: 33, trb: 38.2, to: 12 },
  };

  // Ohne href und ohne onClick ist die Karte nicht klickbar; mit href (nur sichere Ziele) ist der Name ein Link über die ganze Karte
  const karte = mountTeamCard(document.querySelector('#team'), team);
  // mit Handler: mountTeamCard(el, team, { onClick: (event) => … }) macht den Namen zum Button

  const html = renderTeamCard(team);
</script>`;

export const hallenRender = `<div id="halle"></div>

<script type="module">
  ${IMPORT('mountVenueCard, renderVenueCard')}

  const halle = {
    name: 'Sporthalle Nordhain',
    address: { street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' },
    lat: 49.3, lng: 7.9,
    info: 'Zwei Spielfelder, Zugang über den Haupteingang.',
    contact: { name: 'Jonas Weide', phone: '030 23125 100', email: 'hallenwart@example.org' },
    games: [
      { id: 'a', state: 'scheduled', date: 'Sa, 17.10.2026', time: '17:30', league: { name: 'Oberliga Nordhain Männer' }, heim: { name: 'TSV Nordhain 1920', short: 'Nordhain' }, gast: { name: 'BG Seeberg' } },
      { id: 'b', state: 'live', date: 'Sa, 17.10.2026', time: '19:30', heim: { name: 'Lindenberg Hawks', short: 'Hawks' }, gast: { name: 'Elbach Eagles', short: 'Eagles' } },
      { id: 'c', state: 'finished', date: 'Sa, 10.10.2026', heim: { name: 'SG Elbtal' }, gast: { name: 'TuS Waldmark' } },
    ],
    limit: 3, href: '/hallen/nordhain',
  };

  // Die Karte ist hier der Platzhalter mit Hinweis und Schaltfläche „Karte laden“ (kein Netzverkehr, kein Leaflet).
  // Adresse und Links stehen als Text daneben; lebendig wird die Karte erst mit initMap (nächste Stufe).
  const karte = mountVenueCard(document.querySelector('#halle'), halle);

  const html = renderVenueCard(halle);   // beendete Spiele und Freilose fehlen, limit gilt (1 bis 5)
</script>`;

export const spielplanRender = `<div id="plan"></div>

<script type="module">
  ${IMPORT('mountScheduleTable, renderScheduleTable')}

  const plan = {
    title: 'Spielplan Oberliga', meta: 'Stand 12.10.2026',
    games: [
      { id: 'a', state: 'finished', date: 'Sa, 10.10.2026', time: '17:00', venue: 'Sporthalle Nordhain',
        heim: { name: 'TSV Nordhain 1920', short: 'Nordhain', own: true, score: 78 }, gast: { name: 'Lindenberg Hawks', short: 'Hawks', score: 71, href: '/teams/hawks' } },
      { id: 'b', state: 'live', time: '19:00', heim: { name: 'BG Seeberg', score: 12 }, gast: { name: 'Elbach Eagles', short: 'Eagles', score: 9 }, provisional: true },
      { id: 'c', state: 'scheduled', date: 'So, 18.10.2026', time: '11:00', heim: { name: 'TSV Nordhain 1920', short: 'Nordhain', own: true }, gast: { name: 'Sieger Halbfinale', placeholder: true } },
      { id: 'd', state: 'postponed', date: 'So, 18.10.2026', time: '13:00', heim: { name: 'SG Elbtal' }, gast: { name: 'TuS Waldmark' }, note: 'neuer Termin folgt' },
    ],
    names: 'short', logos: false,
  };

  // Optionen { time, notice } liefern Text je Spiel (kein Markup) und ersetzen die Uhrzeit bzw. ergänzen eine Spalte; hier nicht gesetzt
  const tabelle = mountScheduleTable(document.querySelector('#plan'), plan);
  const html = renderScheduleTable(plan);
</script>`;

export const rasterRender = `<div id="raster"></div>

<script type="module">
  ${IMPORT('mountScheduleGrid, renderScheduleGrid')}

  const raster = {
    title: 'Turnier Samstag', meta: 'Halle A und B',
    columns: [{ id: 'a', label: 'Halle A' }, { id: 'b', label: 'Halle B' }],
    breaks: [{ time: '10:30', label: 'Pause' }],
    games: [
      { id: 'g1', state: 'finished', nr: '#1', time: '09:00', column: 'a', heim: { name: 'Lindenberg Hawks', score: 21 }, gast: { name: 'BG Seeberg', score: 14 } },
      { id: 'g2', state: 'live', nr: '#2', time: '09:00', column: 'b', heim: { name: 'TSV Nordhain 1920', score: 8 }, gast: { name: 'Elbach Eagles', score: 6 } },
      { id: 'g3', state: 'scheduled', nr: '#3', time: '11:00', column: 'a', heim: { name: 'SG Elbtal' }, gast: { name: 'TuS Waldmark' } },
      { id: 'g4', state: 'bye', time: '11:00', heim: { name: 'BG Seeberg' } },
    ],
    emptyLabel: 'frei',
  };

  const tabelle = mountScheduleGrid(document.querySelector('#raster'), raster);
  const html = renderScheduleGrid(raster);
</script>`;

export const tabelleRender = `<div id="tabelle"></div>

<script type="module">
  ${IMPORT('mountTable, renderTable')}

  // Zellen sind Daten, kein Markup: Text, Zahl oder { text, className, href, header }; Zeilen: Liste oder { cells, className }
  const tabelle = {
    title: 'Saisonwerte', meta: 'Stand 12.10.', caption: 'Saisonwerte der Mannschaften', density: 'compact', striped: true,
    columns: [
      { key: 'team', label: 'Mannschaft' },
      { key: 'sp', label: 'SP', align: 'right' },
      { key: 'pkt', label: 'PKT', align: 'right', sortable: true, sort: 'desc' },
    ],
    rows: [
      [{ text: 'Lindenberg Hawks', href: '/teams/hawks' }, { text: 11, className: 'num' }, { text: 20, className: 'num lead' }],
      { cells: ['TSV Nordhain 1920', { text: 11, className: 'num' }, { text: 14, className: 'num lead' }], className: 'is-own' },
    ],
  };

  const karte = mountTable(document.querySelector('#tabelle'), tabelle);
  const html = renderTable(tabelle);
</script>`;

export const spielRender = `<div id="spiel"></div>

<script type="module">
  ${IMPORT('mountMatchCard, renderMatchCard')}

  const spiel = {
    state: 'live', league: 'Oberliga', matchday: 'Spieltag 5', period: 3, clock: '04:12',
    heim: { name: 'Lindenberg Hawks', short: 'Hawks', score: 41 },
    gast: { name: 'TSV Nordhain 1920', short: 'Nordhain', score: 39 },
    venue: 'Sporthalle Lindenberg', href: '/spiele/oberliga-5-3',
  };

  // Mit href ein Link; mountMatchCard(el, spiel, { onClick }) macht die Karte ohne href zum Button
  const karte = mountMatchCard(document.querySelector('#spiel'), spiel);
  const html = renderMatchCard(spiel);
</script>`;

export const leerRender = `<div id="leer"></div>

<script type="module">
  ${IMPORT('mountEmptyState, renderEmptyState')}

  const leer = {
    tone: 'neutral', title: 'Noch keine Spiele angesetzt',
    body: 'Sobald Spiele für den aktuellen Spieltag eingetragen sind, erscheinen sie hier.',
    cta: 'Spielplan öffnen', titleAs: 'h2',
  };

  // Der Klick auf cta kommt über options.onCta; weitere Aktionen sind Links (actions: [{ label, href }])
  const karte = mountEmptyState(document.querySelector('#leer'), leer, { onCta: () => { location.href = '/spielplan'; } });
  const html = renderEmptyState(leer);
</script>`;

export const kennzahlenRender = `<div id="kennzahlen"></div>
<div id="form"></div>

<script type="module">
  ${IMPORT('mountStats, mountFormChips, renderStats, renderFormChips')}

  // Zahlen bekommen das Dezimalkomma, ein fehlender Wert zeigt einen Gedankenstrich mit verstecktem Text
  const kennzahlen = {
    items: [
      { label: 'Siege', value: 8 },
      { label: 'Punkte pro Spiel', value: 74.2 },
      { label: 'Bilanz', value: '8–3' },
      { label: 'Zuschauer', value: null },
    ],
  };
  const form = { form: ['S', 'S', 'N', 'S', 'U'], variant: 'letters' };

  mountStats(document.querySelector('#kennzahlen'), kennzahlen);
  mountFormChips(document.querySelector('#form'), form);

  const html = renderStats(kennzahlen);
  const htmlForm = renderFormChips(form);
</script>`;

/**
 * Beschreibung für die Tests: je Beispiel der Code, die Komponente (Svelte-Datei und React-Export), die Variablen mit ihren Behältern
 * (`id` im HTML) und die Variable der Zeichenkette (`html`).
 */
export const DOCS = {
  liga: { code: ligaRender, component: 'LeagueCard', mounts: [{ variable: 'liga', id: 'liga' }], strings: [{ variable: 'html', of: 'liga' }] },
  ligaEinklappbar: { code: ligaEinklappbarRender, component: 'LeagueCard', mounts: [{ variable: 'ligaZu', id: 'liga-zu' }], strings: [] },
  team: { code: teamRender, component: 'TeamCard', mounts: [{ variable: 'team', id: 'team' }], strings: [{ variable: 'html', of: 'team' }] },
  halle: { code: hallenRender, component: 'VenueCard', mounts: [{ variable: 'halle', id: 'halle' }], strings: [{ variable: 'html', of: 'halle' }] },
  spielplan: { code: spielplanRender, component: 'ScheduleTable', mounts: [{ variable: 'plan', id: 'plan' }], strings: [{ variable: 'html', of: 'plan' }] },
  raster: { code: rasterRender, component: 'ScheduleGrid', mounts: [{ variable: 'raster', id: 'raster' }], strings: [{ variable: 'html', of: 'raster' }] },
  tabelle: { code: tabelleRender, component: 'Table', mounts: [{ variable: 'tabelle', id: 'tabelle' }], strings: [{ variable: 'html', of: 'tabelle' }] },
  spiel: { code: spielRender, component: 'MatchCard', mounts: [{ variable: 'spiel', id: 'spiel' }], strings: [{ variable: 'html', of: 'spiel' }] },
  leer: { code: leerRender, component: 'EmptyState', mounts: [{ variable: 'leer', id: 'leer' }], strings: [{ variable: 'html', of: 'leer' }] },
  kennzahlen: { code: kennzahlenRender, component: 'StatGrid', mounts: [{ variable: 'kennzahlen', id: 'kennzahlen' }], strings: [{ variable: 'html', of: 'kennzahlen' }] },
  form: { code: kennzahlenRender, component: 'FormChips', mounts: [{ variable: 'form', id: 'form' }], strings: [{ variable: 'htmlForm', of: 'form' }] },
} as const;
