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

/** Gemessene Größen des Bündels (Bytes); der Test misst neu und verlangt, dass die Angaben um höchstens 5 % abweichen. */
export const bundleSizes = { js: 62961, min: 35563, gzip: 12596, css: 178941 };
export const budget = { minKB: 40, gzipKB: 15 };
