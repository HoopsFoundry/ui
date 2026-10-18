// Code-Beispiele der Seite „Vanilla“. Die Tests (tests/vanilla-docs.test.ts, tests/vanilla-docs-dom.test.ts) führen das Markup mit initAll in jsdom aus,
// prüfen die Liste der Exporte gegen das gebaute Bündel und die Größenangaben gegen die Messung.
import project from '../../project.config.json';
import { themeBootScript } from '../../js/theme.js';
import { buttonMarkup as accordionMarkup } from '../Accordion.code';
import { dialogMarkup } from '../Modal.code';
import { registerMarkup } from '../Tabs.code';

/** Die Seite „Vereinsregister“ im Kleinen: Tabs mit Panels, ein Dialog, ein Accordion. Die Doku zeigt das Markup und führt es auch aus (`initAll`). */
export const pageMarkup = `${registerMarkup}

${dialogMarkup}

${accordionMarkup}`;

/** Eine vollständige Seite ohne Build: Stylesheet, Boot-Skript gegen Flackern, Markup mit `data-hoops`, ein Aufruf. */
export const vanilla = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vereinsregister</title>
  <!-- Aus node_modules nach _site/hoops kopiert (siehe unten): hoops.css = tokens.css + components.css -->
  <link rel="stylesheet" href="/hoops/hoops.css" />
  <!-- optional: <link rel="stylesheet" href="/hoops/fonts/fonts.css" /> -->

  <!-- Gegen Flackern im Dunkelmodus: das Ergebnis von themeBootScript() (siehe Dark Mode, CSP unten) -->
  <script>${themeBootScript()}</script>
</head>
<body>
  <button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--icon" data-hoops="theme" hidden></button>

  <main>
    <h1>TSV Nordhain 1920</h1>
    <!-- Jedes Element mit data-hoops startet beim Aufruf von initAll: Tabs, Dialog, Accordion … -->
${pageMarkup.split('\n').map((line) => (line ? `    ${line}` : line)).join('\n')}
  </main>

  <script type="module">
    import { initAll, VERSION, checkVersion } from '/hoops/hoops.min.js';

    const hoops = initAll(document);           // startet alles mit data-hoops; hoops.count, hoops.destroy()
    console.log(VERSION, checkVersion());   // { js: '0.10.0', css: '0.10.0', match: true }
  </script>
</body>
</html>`;

/** Optionen und Einzelaufrufe */
export const options = `<!-- Optionen je Element als JSON (ungültiges JSON, Listen und Schlüssel wie __proto__ fallen weg) -->
<div class="hoops-tabs hoops-tabs--segmented" role="tablist" aria-label="Spielort" data-hoops="tabs" data-hoops-options='{"activation":"manual","hash":true}'>…</div>

<script type="module">
  import { initAll, initTabs, initModal, openModal, closeModal } from '/hoops/hoops.min.js';

  // Optionen für alle Elemente eines Bausteins; das JSON am Element gewinnt gegen options
  const hoops = initAll(document, { tabs: { hash: true }, modal: { dismissOnBackdrop: false }, only: ['tabs', 'modal'] });

  // Oder einzeln, auf einem Element, das du selbst wählst (auch nachträglich eingefügt)
  const leiste = initTabs(document.querySelector('.hoops-tabs'), { onChange: ({ id }) => console.log(id) });

  // Ein zweiter Aufruf für dasselbe Element ersetzt den ersten (kein doppelter Listener)
  // destroy() ist mehrfach aufrufbar und stellt das Markup wieder her
  leiste.destroy();
  hoops.destroy();
</script>`;

/** Lebenszyklus bei dynamisch eingefügtem Inhalt */
export const dynamic = `<script type="module">
  import { initAll } from '/hoops/hoops.min.js';

  const bereich = document.querySelector('#inhalt');
  let hoops = null;

  async function laden(url) {
    hoops?.destroy();                                   // alte Instanzen abbauen, bevor der Inhalt verschwindet
    const antwort = await fetch(url);
    const html = await antwort.text();
    // Kein innerHTML: das Markup wird geparst und als Fragment eingesetzt (geprüftes Markup, Texte aus Daten gehören in textContent)
    bereich.replaceChildren(document.createRange().createContextualFragment(html));
    hoops = initAll(bereich);                           // nur unterhalb von #inhalt
  }
</script>`;

export const cspHeader = `# Das Bündel braucht nur script-src 'self' (eine Datei von der eigenen Domain): kein eval, keine Inline-Handler, kein innerHTML,
# keine Fremd-Skripte. Styles setzt es nur über das CSSOM (element.style.x), das style-src nicht blockiert.
Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-<Hash des Boot-Skripts>'; style-src 'self'

# Hash des Boot-Skripts (der Text zwischen <script> und </script>, ohne Änderung):
printf '%s' "$(node -e "import('@hoopsfoundry/ui/theme.js').then((m) => process.stdout.write(m.themeBootScript()))")" \\
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
  import { initAll } from '/hoops/hoops.min.js';
  import { mountLeagueCard, mountScheduleTable, mountVenueCard } from '/hoops/hoops-render.min.js';

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

  // Danach das Verhalten der Bausteine mit data-hoops (Tabs, Accordion …) wie gewohnt
  initAll(document);
</script>`;

/** Dasselbe in Node: Markup als Zeichenkette, zum Beispiel im Crawler für statische Seiten. */
export const renderNode = `// seite.mjs: läuft in Node ohne DOM (kein window, kein document)
import { esc, renderLeagueCard, renderTeamCard } from '@hoopsfoundry/ui/vanilla/hoops-render.js';

const verein = { name: 'TSV Nordhain <1920>', liga: { title: 'Oberliga', teams: [{ rank: 1, name: 'Lindenberg Hawks', points: 20 }] }, team: { name: 'TSV Nordhain 1920', rank: 3 } };

// esc für jeden Text, der nicht von einer Render-Funktion kommt (hier der Seitentitel)
const seite = \`<!doctype html>
<html lang="de">
<head><meta charset="utf-8"><title>\${esc(verein.name)}</title><link rel="stylesheet" href="/hoops/hoops.css"></head>
<body>
  \${renderLeagueCard(verein.liga)}
  \${renderTeamCard(verein.team, { uid: 'team' })}
</body>
</html>\`;`;

/** Escaping: was durch esc, attr und safeHref läuft. */
export const renderEscape = `import { esc, attr, renderEmptyState } from '@hoopsfoundry/ui/vanilla/hoops-render.js';
import { safeHref } from '@hoopsfoundry/ui/vanilla';

esc('<img src=x onerror=alert(1)>');   // → '&lt;img src=x onerror=alert(1)&gt;'
esc(null);                              // → ''   (nur Text und endliche Zahlen)
attr('" onmouseover="x');               // → '&quot; onmouseover=&quot;x'   (für Attributwerte in doppelten Anführungszeichen)
safeHref('javascript:alert(1)');        // → undefined   (Links dieser Art erscheinen nie im Markup)
safeHref('/ligen/oberliga');            // → '/ligen/oberliga'

// Eine Render-Funktion maskiert alles selbst: das Ergebnis enthält nur Text
renderEmptyState({ title: '<script>alert(1)</script>', actions: [{ label: 'Los', href: 'javascript:alert(1)' }] });`;

/** Gemessene Größen des Bündels (Bytes); der Test misst neu und verlangt, dass die Angaben um höchstens 5 % abweichen. */
export const bundleSizes = { js: 82007, min: 48069, gzip: 16674, css: 192900 };
/** Budgets in KiB (1 KiB = 1024 Byte); die Namen behalten das alte Kürzel. */
export const budget = { minKB: 48, gzipKB: 17 };
/** Das Render-Bündel (hoops-render.js) hat ein eigenes Budget: es ist größer als der Kern (zehn Komponenten mit Markup und Logik) und importiert den Kern. */
export const renderSizes = { js: 92233, min: 57814, gzip: 18698 };
export const renderBudget = { minKB: 57, gzipKB: 19 };
/** Das Karten-Bündel (hoops-map.js) hat ein eigenes Budget: Zustände, Markup und Leaflet-Anbindung; Leaflet selbst gehört nicht dazu. */
export const mapSizes = { js: 45150, min: 25622, gzip: 10127 };
export const mapBudget = { minKB: 26, gzipKB: 10 };

/** Release-Adresse aus project.config.json (die eine Quelle; keine feste Adresse im Code). */
const RELEASE = project.releaseBaseUrl;

/** Das Hilfsskript holen und prüfen: Release-Anhang `hoops-sync.mjs` mit eigener Prüfsumme. */
export const getSync = `# Im Projekt des Portals (neben der package.json): das Skript und seine Prüfsumme aus demselben Release laden und prüfen
curl -LO ${RELEASE}/v0.10.0/hoops-sync.mjs
curl -LO ${RELEASE}/v0.10.0/hoops-sync.mjs.sha256
shasum -a 256 -c hoops-sync.mjs.sha256        # muss "hoops-sync.mjs: OK" melden (Linux: sha256sum -c)
node --version                              # Node 18 oder neuer

# Alternative aus dem npm-Paket (ab 1.0 der Regelweg): derselbe Code, Befehl hoops-sync
npm install --save-dev @hoopsfoundry/ui
npx hoops-sync --from-package`;

/** Auslieferung bis Version 1.0: Release-Anhänge auf GitHub. Der Befehl holt, prüft und ersetzt `_site/hoops` in einem Schritt. */
export const releaseSync = `# Im Projekt (nicht im Paket): hoops-sync.mjs liegt neben der package.json des Portals
node hoops-sync.mjs --from-release 0.10.0
# → lädt hoops-ui-0.10.0.tgz und hoops-ui-0.10.0.sha256 von
#   ${RELEASE}/v0.10.0/
# → prüft die SHA-256 des Tarballs und jeder Datei darin, die Version in version.json und den Ordnernamen
# → ersetzt erst danach _site/hoops (bei einer Abweichung bleibt das alte Ziel unverändert, Exit-Code 1)

# Weitere Quellen (derselbe Aufbau von dist/vanilla):
node hoops-sync.mjs --from-package                 # installiertes npm-Paket aus node_modules (Standard)
node hoops-sync.mjs --from-dir ./hoops-ui-0.10.0 # entpackter Release-Ordner, offline
node hoops-sync.mjs --from-release 0.10.0 --base-url https://intern.example/hoops   # eigener Spiegel (https; Weiterleitungen nur auf denselben Host)
node hoops-sync.mjs --from-release 0.10.0 --base-url http://spiegel.lan/hoops --allow-insecure-http   # unverschlüsselt nur mit ausdrücklicher Freigabe
node hoops-sync.mjs --from-release 0.10.0 --debug   # bei einem Fehler zusätzlich der Stack`;

/** Prüfsumme von Hand, ohne das Skript. */
export const manualCheck = `# Beide Dateien eines Releases in einen leeren Ordner laden, den Tarball daneben entpacken, dann prüfen
mkdir hoops-0.10.0 && cd hoops-0.10.0
curl -LO ${RELEASE}/v0.10.0/hoops-ui-0.10.0.tgz
curl -LO ${RELEASE}/v0.10.0/hoops-ui-0.10.0.sha256
curl -LO ${RELEASE}/v0.10.0/hoops-ui-0.10.0.tgz.sha256
shasum -a 256 -c hoops-ui-0.10.0.tgz.sha256   # nur der Tarball (Linux: sha256sum -c)
tar xzf hoops-ui-0.10.0.tgz
shasum -a 256 -c hoops-ui-0.10.0.sha256      # Tarball und jede Datei darin; jede Zeile muss "OK" sein`;

/** Aktualisieren und Zurückrollen im Portal. */
export const updateFlow = `# 1. Neue Version holen und prüfen
node hoops-sync.mjs --from-release 0.10.1

# 2. Versionen im Browser abgleichen (data-hoops-versions am html-Element der Beispielseite, oder checkVersion() im Start-Skript)
# 3. Portal veröffentlichen

# Rollback: dieselbe Zeile mit der letzten guten Version; das Ziel wird vollständig ersetzt
node hoops-sync.mjs --from-release 0.10.0`;

/** Wechsel auf npm ab 1.0: nur die Quelle ändert sich. */
export const npmSwitch = `# bis 1.0 (Release-Anhang)
node hoops-sync.mjs --from-release 0.10.0

# ab 1.0 (npm, Paketname und Aufbau von dist/vanilla bleiben)
npm install @hoopsfoundry/ui@1.0.0
npx hoops-sync --from-package`;

/** Das Ergebnis der Browser-Prüfung der Beispiel-Portalseite (scripts/check-portal-seite.mjs); Stand der Messung. */
export const compat = {
  checks: 89,
  browsers: [
    { name: 'Chromium', version: '153.0.8010.12', checks: 50, result: 'bestanden', note: 'Seiten, Karte, Tastatur, Layout bis 320 px, Unterpfad, ohne JavaScript, axe in BBV und DBB, hell und dunkel, 1280 und 420 px' },
    { name: 'WebKit (Safari-Engine)', version: '26.6', checks: 36, result: 'bestanden', note: 'wie Chromium; axe nur BBV hell bei 420 px; auf macOS erreicht Tab Links und Schaltflächen nur mit Alt+Tab (Systemeinstellung); der Fokus darf am Dialogende kurz in die Browser-Oberfläche laufen' },
    { name: 'Firefox', version: 'Playwright 1543 (155.0) und System-Firefox 138.0.1', checks: 0, result: 'nicht gelaufen', note: 'Ursache ungeklärt: Playwrights Build bricht beim Start mit „Could not find profile folder“ ab, der System-Firefox öffnet keinen Debug-Port. Befehl für einen anderen Rechner: node scripts/check-portal-seite.mjs --browsers=firefox' },
  ],
};

/** Node-Versionen, mit denen das Release-Skript und hoops-sync.mjs (--from-dir und --from-release gegen einen lokalen Server) gelaufen sind. */
export const nodeVersions = ['18.20.8', '20.20.2', '22.21.0'];
