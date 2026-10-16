// Code-Beispiele der Seite „Dark Mode“. Die Tests (tests/darkmode-docs.test.ts) übersetzen das React-Beispiel mit dem TypeScript-Compiler,
// rendern das Svelte-Beispiel und führen das Vanilla-Markup mit initAll in jsdom aus.
import { themeBootScript } from '../../js/theme.js';

/** Das Boot-Skript mit den Standardwerten, genau so, wie die Funktion es liefert. */
export const bootScript = themeBootScript();

/** Markup des Umschalters; die Doku zeigt es und führt es auch aus (`initAll`). Leer, mit hidden: Das Skript legt die Symbole an und zeigt den Button. */
export const buttonMarkup = `<button type="button" class="dss-btn dss-btn--secondary dss-btn--icon" data-dss="theme" hidden></button>`;

export const vanilla = `<!doctype html>
<html lang="de">
<head>
  <link rel="stylesheet" href="tokens/tokens.css" />
  <link rel="stylesheet" href="css/components.css" />

  <!-- Gegen Flackern: setzt die gemerkte Wahl vor dem ersten Zeichnen. Der Code ist das Ergebnis von
       themeBootScript() (js/theme.js). Mit Content-Security-Policy: nonce oder Hash (siehe unten). -->
  <script>${bootScript}</script>
</head>
<body>
  <!-- Leer und mit hidden: initTheme legt Sonne und Mond an, setzt aria-pressed und zeigt den Button -->
  ${buttonMarkup}

  <script type="module">
    import { initAll } from '@bbv/dss-design-system/vanilla-core.js';

    initAll(document);
  </script>
</body>
</html>

<!-- Oder einzeln, mit Optionen -->
<script type="module">
  import { initTheme } from '@bbv/dss-design-system/theme.js';

  const theme = initTheme(document.querySelector('[data-dss="theme"]'), {
    storageKey: 'dss-theme',   // Standard; bei mehreren Apps auf einer Domain je App einen eigenen
    onChange: (mode, state) => console.log(mode, state),  // 'dark' 'dark' nach einem Klick
  });

  theme.setMode('system');     // zurück zur Systemeinstellung (Attribut und Eintrag entfallen)
  theme.getMode();             // 'light' | 'dark' | 'system'
  // theme.destroy();
</script>`;

export const svelte = `<script>
  import { onMount } from 'svelte';
  import { initTheme } from '@bbv/dss-design-system/theme.js';

  // Es gibt keine Svelte-Komponente: der Umschalter ist die Vanilla-Funktion auf einem Button.
  // Das Boot-Skript (themeBootScript) gehört in den <head> der HTML-Vorlage (app.html), nicht in die Komponente.
  let knopf;

  onMount(() => {
    const theme = initTheme(knopf);
    return () => theme.destroy();
  });
</script>

<button bind:this={knopf} type="button" class="dss-btn dss-btn--secondary dss-btn--icon" hidden></button>`;

export const react = `import { useEffect, useRef } from 'react';
import { initTheme } from '@bbv/dss-design-system/theme.js';

// Es gibt keine React-Komponente: der Umschalter ist die Vanilla-Funktion auf einem Button.
// Das Boot-Skript (themeBootScript) gehört in den <head> der HTML-Vorlage, nicht in die Komponente.
export function ThemeToggle() {
  const knopf = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!knopf.current) return;
    const theme = initTheme(knopf.current);
    return () => theme.destroy();
  }, []);

  return <button ref={knopf} type="button" className="dss-btn dss-btn--secondary dss-btn--icon" hidden />;
}`;

export const cspHeader = `# Hash des Boot-Skripts (der Text zwischen <script> und </script>, ohne Änderung):
printf '%s' "$(node -e "import('@bbv/dss-design-system/theme.js').then((m) => process.stdout.write(m.themeBootScript()))")" \\
  | openssl dgst -sha256 -binary | openssl base64

# Content-Security-Policy (Header oder meta): der Hash erlaubt genau dieses Skript, nichts anderes Inline
Content-Security-Policy: script-src 'self' 'sha256-<Ausgabe des Befehls>'

# Alternative mit nonce: der Server erzeugt je Antwort einen Wert und setzt ihn in Header und Tag
Content-Security-Policy: script-src 'self' 'nonce-<zufällig je Antwort>'
<script nonce="<zufällig je Antwort>">…</script>`;

export const cssTokens = `/* Tokens reagieren nur auf <html>: data-theme="light|dark" erzwingt, ohne Attribut gilt prefers-color-scheme. */
.karte {
  background: var(--hoops-surface);       /* nie ein festes #fff */
  color: var(--hoops-fg);
  border: 1px solid var(--hoops-line);
}`;
