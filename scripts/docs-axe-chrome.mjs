/**
 * Was auf einer Docs-Seite Storybook selbst erzeugt und deshalb nicht zu unseren Inhalten zählt (scripts/check-docs-axe.mjs, Lückenplan 2.3 und 2.5).
 * Bewusst eng: nur ganze Storybook-Bausteine, keine Klassenmuster wie `.css-…` oder `.sbdocs`, die auch unsere MDX-Links (`.sbdocs-a`) und
 * Inline-Code (`code.css-…`) tragen. Diese bleiben in der Prüfung (tests/docs-axe-script.test.ts).
 */
export const STORYBOOK_CHROME = [
  '.docblock-argstable', // Argumenttabelle (Controls)
  '.sb-argstableBlock',
  '.docblock-code-toggle', // Schalter „Show code“
  '.sbdocs-preview-actions', // Aktionen unter einer Vorschau
  '.docblock-source', // Codeblock von Storybook (Source)
  '.token', // Syntaxfarben (Prism)
].join(', ');

/** true, wenn das Element zu einem Storybook-Baustein gehört. */
export const isStorybookChrome = (el) => Boolean(el && typeof el.closest === 'function' && el.closest(STORYBOOK_CHROME));
