// Code-Beispiele der Seite „Vanilla“. Die Tests (tests/vanilla-docs.test.ts, tests/vanilla-docs-dom.test.ts) führen das Markup mit initAll in jsdom aus,
// prüfen die Liste der Exporte gegen das gebaute Bündel und die Größenangaben gegen die Messung.
import { themeBootScript } from '../../js/theme.js';
import { buttonMarkup as accordionMarkup } from '../Accordion.code';
import { dialogMarkup } from '../Modal.code';
import { registerMarkup } from '../Tabs.code';

/** Die Seite „Vereinsregister“ im Kleinen: Tabs mit Panels, ein Dialog, ein Accordion. Die Doku zeigt das Markup und führt es auch aus (`initAll`). */
export const pageMarkup = `${registerMarkup}

${dialogMarkup}

${accordionMarkup}`;

/** Eine vollständige Seite ohne Build: Stylesheet, Boot-Skript gegen Flackern, Markup mit `data-dss`, ein Aufruf. */
export const vanilla = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vereinsregister</title>
  <!-- Aus node_modules nach _site/dss kopiert (siehe unten): dss.css = tokens.css + components.css -->
  <link rel="stylesheet" href="/dss/dss.css" />
  <!-- optional: <link rel="stylesheet" href="/dss/fonts/fonts.css" /> -->

  <!-- Gegen Flackern im Dunkelmodus: das Ergebnis von themeBootScript() (siehe Dark Mode, CSP unten) -->
  <script>${themeBootScript()}</script>
</head>
<body>
  <button type="button" class="dss-btn dss-btn--secondary dss-btn--icon" data-dss="theme" hidden></button>

  <main>
    <h1>TSV Nordhain 1920</h1>
    <!-- Jedes Element mit data-dss startet beim Aufruf von initAll: Tabs, Dialog, Accordion … -->
${pageMarkup.split('\n').map((line) => (line ? `    ${line}` : line)).join('\n')}
  </main>

  <script type="module">
    import { initAll, VERSION, checkVersion } from '/dss/dss.min.js';

    const dss = initAll(document);           // startet alles mit data-dss; dss.count, dss.destroy()
    console.log(VERSION, checkVersion());   // { js: '0.9.0', css: '0.9.0', match: true }
  </script>
</body>
</html>`;

/** Optionen und Einzelaufrufe */
export const options = `<!-- Optionen je Element als JSON (ungültiges JSON, Listen und Schlüssel wie __proto__ fallen weg) -->
<div class="dss-tabs dss-tabs--segmented" role="tablist" aria-label="Spielort" data-dss="tabs" data-dss-options='{"activation":"manual","hash":true}'>…</div>

<script type="module">
  import { initAll, initTabs, initModal, openModal, closeModal } from '/dss/dss.min.js';

  // Optionen für alle Elemente eines Bausteins; das JSON am Element gewinnt gegen options
  const dss = initAll(document, { tabs: { hash: true }, modal: { dismissOnBackdrop: false }, only: ['tabs', 'modal'] });

  // Oder einzeln, auf einem Element, das du selbst wählst (auch nachträglich eingefügt)
  const leiste = initTabs(document.querySelector('.dss-tabs'), { onChange: ({ id }) => console.log(id) });

  // Ein zweiter Aufruf für dasselbe Element ersetzt den ersten (kein doppelter Listener)
  // destroy() ist mehrfach aufrufbar und stellt das Markup wieder her
  leiste.destroy();
  dss.destroy();
</script>`;

/** Lebenszyklus bei dynamisch eingefügtem Inhalt */
export const dynamic = `<script type="module">
  import { initAll } from '/dss/dss.min.js';

  const bereich = document.querySelector('#inhalt');
  let dss = null;

  async function laden(url) {
    dss?.destroy();                                   // alte Instanzen abbauen, bevor der Inhalt verschwindet
    const antwort = await fetch(url);
    const html = await antwort.text();
    // Kein innerHTML: das Markup wird geparst und als Fragment eingesetzt (geprüftes Markup, Texte aus Daten gehören in textContent)
    bereich.replaceChildren(document.createRange().createContextualFragment(html));
    dss = initAll(bereich);                           // nur unterhalb von #inhalt
  }
</script>`;

export const cspHeader = `# Das Bündel braucht nur script-src 'self' (eine Datei von der eigenen Domain): kein eval, keine Inline-Handler, kein innerHTML,
# keine Fremd-Skripte. Styles setzt es nur über das CSSOM (element.style.x), das style-src nicht blockiert.
Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-<Hash des Boot-Skripts>'; style-src 'self'

# Hash des Boot-Skripts (der Text zwischen <script> und </script>, ohne Änderung):
printf '%s' "$(node -e "import('@bbv/dss-design-system/theme.js').then((m) => process.stdout.write(m.themeBootScript()))")" \\
  | openssl dgst -sha256 -binary | openssl base64

# Alternative mit nonce: der Server erzeugt je Antwort einen Wert und setzt ihn in Header und Tag
Content-Security-Policy: script-src 'self' 'nonce-<zufällig je Antwort>'
<script nonce="<zufällig je Antwort>">…</script>`;

/** Eine Seite aus Daten: Container im HTML, das Markup erzeugen die mountX-Funktionen (Kern und Render-Bündel liegen im selben Ordner). */
export const renderPage = `<main>
  <h1>TSV Nordhain 1920</h1>
  <div id="tabelle"></div>
  <div id="spielplan"></div>
  <div id="halle"></div>
</main>

<script type="module">
  import { initAll } from '/dss/dss.min.js';
  import { mountLeagueCard, mountScheduleTable, mountVenueCard } from '/dss/dss-render.min.js';

  // Daten aus deiner Quelle (hier erfunden); die Eigenschaften sind die der Komponenten.
  // titleAs gibt die Ebene der Überschrift vor (h2 bis h6, Standard h3): hier folgt sie der h1 der Seite
  const verein = {
    liga: {
      title: 'Oberliga Nordhain Männer', titleAs: 'h2', href: '/ligen/oberliga', teamCount: 12, played: 66, total: 132,
      teams: [
        { rank: 2, name: 'BG Seeberg', played: 11, points: 18 },
        { rank: 3, name: 'TSV Nordhain 1920', short: 'Nordhain', played: 11, points: 14, own: true },
        { rank: 4, name: 'SV Kiefernau', played: 10, points: 12 },
      ],
    },
    plan: {
      title: 'Spielplan', titleAs: 'h2', names: 'short',
      games: [
        { id: 'a', state: 'finished', date: 'Sa, 10.10.2026', time: '17:00', heim: { name: 'TSV Nordhain 1920', short: 'Nordhain', own: true, score: 78 }, gast: { name: 'BG Seeberg', score: 71 } },
        { id: 'b', state: 'scheduled', date: 'So, 18.10.2026', time: '11:00', heim: { name: 'SV Kiefernau' }, gast: { name: 'TSV Nordhain 1920', short: 'Nordhain', own: true } },
      ],
    },
    halle: { name: 'Sporthalle Nordhain', titleAs: 'h2', address: { street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' }, lat: 49.3, lng: 7.9, href: '/hallen/nordhain' },
  };

  // Je Baustein ein Aufruf; das Ergebnis hat update(props) und destroy()
  const tabelle = mountLeagueCard(document.querySelector('#tabelle'), verein.liga);
  const spielplan = mountScheduleTable(document.querySelector('#spielplan'), verein.plan);
  const halle = mountVenueCard(document.querySelector('#halle'), verein.halle);

  // Danach das Verhalten der Bausteine mit data-dss (Tabs, Accordion …) wie gewohnt
  initAll(document);
</script>`;

/** Dasselbe in Node: Markup als Zeichenkette, zum Beispiel im Crawler für statische Seiten. */
export const renderNode = `// seite.mjs: läuft in Node ohne DOM (kein window, kein document)
import { esc, renderLeagueCard, renderTeamCard } from '@bbv/dss-design-system/vanilla/dss-render.js';

const verein = { name: 'TSV Nordhain <1920>', liga: { title: 'Oberliga', teams: [{ rank: 1, name: 'Lindenberg Hawks', points: 20 }] }, team: { name: 'TSV Nordhain 1920', rank: 3 } };

// esc für jeden Text, der nicht von einer Render-Funktion kommt (hier der Seitentitel)
const seite = \`<!doctype html>
<html lang="de">
<head><meta charset="utf-8"><title>\${esc(verein.name)}</title><link rel="stylesheet" href="/dss/dss.css"></head>
<body>
  \${renderLeagueCard(verein.liga)}
  \${renderTeamCard(verein.team, { uid: 'team' })}
</body>
</html>\`;`;

/** Escaping: was durch esc, attr und safeHref läuft. */
export const renderEscape = `import { esc, attr, renderEmptyState } from '@bbv/dss-design-system/vanilla/dss-render.js';
import { safeHref } from '@bbv/dss-design-system/vanilla';

esc('<img src=x onerror=alert(1)>');   // → '&lt;img src=x onerror=alert(1)&gt;'
esc(null);                              // → ''   (nur Text und endliche Zahlen)
attr('" onmouseover="x');               // → '&quot; onmouseover=&quot;x'   (für Attributwerte in doppelten Anführungszeichen)
safeHref('javascript:alert(1)');        // → undefined   (Links dieser Art erscheinen nie im Markup)
safeHref('/ligen/oberliga');            // → '/ligen/oberliga'

// Eine Render-Funktion maskiert alles selbst: das Ergebnis enthält nur Text
renderEmptyState({ title: '<script>alert(1)</script>', actions: [{ label: 'Los', href: 'javascript:alert(1)' }] });`;

/** Gemessene Größen des Bündels (Bytes); der Test misst neu und verlangt, dass die Angaben um höchstens 5 % abweichen. */
export const bundleSizes = { js: 65423, min: 36976, gzip: 13209, css: 179156 };
/** Budgets in KiB (1 KiB = 1024 Byte); die Namen behalten das alte Kürzel. */
export const budget = { minKB: 40, gzipKB: 15 };
/** Das Render-Bündel (dss-render.js) hat ein eigenes Budget: es ist größer als der Kern (zehn Komponenten mit Markup und Logik) und importiert den Kern. */
export const renderSizes = { js: 78417, min: 49877, gzip: 16902 };
export const renderBudget = { minKB: 52, gzipKB: 18 };
