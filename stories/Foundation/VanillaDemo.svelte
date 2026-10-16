<script lang="ts">
  import { initAll } from '../../js/vanilla-core.js';
  import { buttonMarkup as accordionMarkup } from '../Accordion.code';
  import { pageMarkup } from './Vanilla.code';
  import { registerMarkup } from '../Tabs.code';
  import {
    mountEmptyState, mountLeagueCard, mountMatchCard, mountScheduleTable, mountStats, mountTeamCard, mountVenueCard,
  } from '../../js/render/index.js';
  import { halle, kennzahlen, leer, liga, ligaKompakt, plan, spiel, spielEnde, team } from './VanillaRender.data';

  // Beispiele der Seite „Vanilla“. Das Markup ist das des Code-Beispiels und wird mit createContextualFragment eingesetzt (statt HTML-Zuweisung),
  // gestartet mit initAll. Jede id kommt nur einmal je Seite vor.
  let { example }: { example: string } = $props();

  function page(node: HTMLElement, markup: string) {
    node.replaceChildren(document.createRange().createContextualFragment(markup));
    const handle = initAll(node, { only: ['tabs', 'modal', 'accordion'], accordion: { syncHash: false } });
    return { destroy: () => handle.destroy() };
  }

  // Markup aus Daten: die mountX-Funktionen setzen es per createContextualFragment in den Container; destroy beim Abbau
  type Mount = (el: Element, props: never, options?: never) => { update(props: never): void; destroy(): void };
  function run(node: HTMLElement, [mount, props]: [Mount, unknown]) {
    const handle = mount(node, props as never);
    return { update: ([, next]: [Mount, unknown]) => handle.update(next as never), destroy: () => handle.destroy() };
  }

  const code = (text: string) => text;
</script>

{#if example === 'seite'}
  <div class="page" use:page={pageMarkup}></div>
{:else if example === 'handy'}
  <div class="narrow page" use:page={registerMarkup}></div>
{:else if example === 'handy-dunkel'}
  <div class="narrow page" use:page={accordionMarkup}></div>
{:else if example === 'markup'}
  <div class="page stack">
    <div use:run={[mountLeagueCard as Mount, liga]}></div>
    <div use:run={[mountScheduleTable as Mount, plan]}></div>
    <div class="two">
      <div use:run={[mountMatchCard as Mount, spiel]}></div>
      <div use:run={[mountMatchCard as Mount, spielEnde]}></div>
    </div>
    <div use:run={[mountVenueCard as Mount, halle]}></div>
    <div use:run={[mountStats as Mount, kennzahlen]}></div>
  </div>
{:else if example === 'markup-handy'}
  <div class="narrow page stack">
    <div use:run={[mountLeagueCard as Mount, ligaKompakt]}></div>
    <div use:run={[mountMatchCard as Mount, spiel]}></div>
    <div use:run={[mountStats as Mount, kennzahlen]}></div>
  </div>
{:else if example === 'markup-handy-dunkel'}
  <div class="narrow page stack">
    <div use:run={[mountTeamCard as Mount, team]}></div>
    <div use:run={[mountVenueCard as Mount, { ...halle, name: 'Sporthalle Lindenberg', games: [], href: undefined }]}></div>
    <div use:run={[mountEmptyState as Mount, leer]}></div>
  </div>
{:else if example === 'do-render'}
  <pre class="code">{code("mountLeagueCard(el, { title: liga.name, teams });\n// Texte werden maskiert, Ziele geprüft")}</pre>
{:else if example === 'dont-render'}
  <pre class="code">{code("let html = '';\nfor (const t of teams) html += '<td>' + t.name + '</td>';\n// ein Name mit < oder \" bricht das Markup")}</pre>
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
  .page { box-sizing: border-box; max-width: 720px; padding: 14px 18px; background: var(--hoops-surface); border: 1px solid var(--hoops-line); border-radius: var(--hoops-radius-lg); color: var(--hoops-fg); }
  .narrow { max-width: 390px; }
  .stack { display: grid; gap: 16px; }
  .two { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(15rem, 100%), 1fr)); gap: 12px; }
  .page :global([role='tabpanel']) { margin: 12px 0; font-size: var(--hoops-fs-body-sm); }
  .page :global([role='tabpanel'] p) { margin: 0; }
  .page :global(.dss-tabs) { margin-top: 10px; }
  .code { margin: 0; padding: 12px 14px; overflow-wrap: anywhere; font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); line-height: 1.5; background: var(--hoops-surface-2); border: 1px solid var(--hoops-line); border-radius: var(--hoops-radius-md); color: var(--hoops-fg); white-space: pre-wrap; }
</style>
