<script lang="ts">
  import { initAll } from '../../js/vanilla-core.js';
  import { buttonMarkup as accordionMarkup } from '../Accordion.code';
  import { pageMarkup } from './Vanilla.code';
  import { registerMarkup } from '../Tabs.code';

  // Beispiele der Seite „Vanilla“. Das Markup ist das des Code-Beispiels und wird mit createContextualFragment eingesetzt (statt HTML-Zuweisung),
  // gestartet mit initAll. Jede id kommt nur einmal je Seite vor.
  let { example }: { example: string } = $props();

  function page(node: HTMLElement, markup: string) {
    node.replaceChildren(document.createRange().createContextualFragment(markup));
    const handle = initAll(node, { only: ['tabs', 'modal', 'accordion'], accordion: { syncHash: false } });
    return { destroy: () => handle.destroy() };
  }

  const code = (text: string) => text;
</script>

{#if example === 'seite'}
  <div class="page" use:page={pageMarkup}></div>
{:else if example === 'handy'}
  <div class="narrow page" use:page={registerMarkup}></div>
{:else if example === 'handy-dunkel'}
  <div class="narrow page" use:page={accordionMarkup}></div>
{:else if example === 'do-text'}
  <pre class="code">{code('name.textContent = spiel.gegner;')}</pre>
{:else if example === 'dont-text'}
  <pre class="code">{code("name.innerHTML = '<b>' + spiel.gegner + '</b>';")}</pre>
{:else if example === 'do-boot'}
  <pre class="code">{code('<head>\n  <link rel="stylesheet" href="/dss/dss.css">\n  <script>/* themeBootScript() */</script>\n</head>')}</pre>
{:else if example === 'dont-boot'}
  <pre class="code">{code('<body>\n  …\n  <script type="module">\n    initTheme(knopf);   // erst nach dem ersten Zeichnen: Flackern\n  </script>\n</body>')}</pre>
{:else if example === 'do-kopie'}
  <pre class="code">{code('node portal-sync.mjs\n<script type="module" src="/dss/dss.min.js">')}</pre>
{:else if example === 'dont-kopie'}
  <pre class="code">{code('<script type="module"\n  src="https://unpkg.com/@bbv/dss-design-system/…">')}</pre>
{/if}

<style>
  .page { box-sizing: border-box; max-width: 720px; padding: 14px 18px; background: var(--dss-surface); border: 1px solid var(--dss-line); border-radius: var(--radius-lg); color: var(--dss-fg); }
  .narrow { max-width: 390px; }
  .page :global([role='tabpanel']) { margin: 12px 0; font-size: var(--fs-body-sm); }
  .page :global([role='tabpanel'] p) { margin: 0; }
  .page :global(.dss-tabs) { margin-top: 10px; }
  .code { margin: 0; padding: 12px 14px; overflow-x: auto; font-family: var(--font-mono); font-size: var(--fs-caption); line-height: 1.5; background: var(--dss-surface-2); border: 1px solid var(--dss-line); border-radius: var(--radius-md); color: var(--dss-fg); white-space: pre; }
</style>
