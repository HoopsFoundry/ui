// Lückenplan 2.3/2.5 (Review W1): die Ausnahme für Storybook-Bausteine in scripts/check-docs-axe.mjs ist eng. MDX-Links und Inline-Code
// (die Fehler aus 2.5) bleiben in der Prüfung; im Browser belegt mit --extra-css (Inline-Code #333, Link #2a2a5a: beide Läufe rot).
import { describe, it, expect } from 'vitest';
import { isStorybookChrome, STORYBOOK_CHROME } from '../scripts/docs-axe-chrome.mjs';

const build = (markup: string) => {
  const range = document.createRange();
  document.body.replaceChildren(range.createContextualFragment(markup));
};

describe('Ausnahme für Storybook-Bausteine', () => {
  it('MDX-Link, Inline-Code in einer Überschrift und eigene Beispiele zählen zu unseren Inhalten', () => {
    build(`<div class="sbdocs sbdocs-wrapper"><div class="sbdocs-content css-abc">
      <h2 class="css-0 sb-unstyled">Vanilla mit <code id="c" class="css-ztvjyi">initAll</code></h2>
      <p><a id="a" class="sbdocs sbdocs-a css-1khello" href="?path=/docs/x">Table</a></p>
      <div class="docs-story"><span id="s" class="hoops-sch-score">78 : 74</span></div></div></div>`);
    for (const id of ['c', 'a', 's']) expect(isStorybookChrome(document.getElementById(id)), id).toBe(false);
  });

  it('Argumenttabelle, „Show code“, Vorschau-Aktionen, Codeblock und Syntaxfarben sind Storybook', () => {
    build(`<table class="docblock-argstable"><tbody><tr><td><button id="j" class="rejt-accordion-button">x</button></td></tr></tbody></table>
      <button id="t" class="docblock-code-toggle">Show code</button>
      <div class="sbdocs-preview-actions css-1"><button id="p" class="css-2">Copy</button></div>
      <div class="docblock-source"><pre><code><span id="k" class="token comment">// x</span></code></pre></div>`);
    for (const id of ['j', 't', 'p', 'k']) expect(isStorybookChrome(document.getElementById(id)), id).toBe(true);
  });

  it('keine breiten Klassenmuster mehr (.css-…, .sbdocs, .sb-unstyled)', () => {
    expect(STORYBOOK_CHROME).not.toMatch(/\.css-|\.sbdocs(?!-preview-actions)|\.sb-unstyled/);
  });
});
