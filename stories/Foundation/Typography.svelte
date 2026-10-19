<script>
  import { onMount } from 'svelte';

  // Stufen der Type scale (tokens.css: --hoops-fs-*, --hoops-lh-*, --hoops-ls-*, --hoops-fw-*) und die zugehörige Klasse
  const steps = [
    { id: 'display', use: 'Spielstand-Anzeige, Trikotnummer groß', sample: '87 : 64' },
    { id: 'clock',   use: 'Spielzeit, 24-s-Uhr (Mono)',           sample: '08:42' },
    { id: 'h1',      use: 'Seitentitel',                           sample: 'Spielbericht' },
    { id: 'hero',    use: 'Name in Hero-Karten',                   sample: 'Jonas Tanner' },
    { id: 'h2',      use: 'Abschnitte, Modal-Titel, Kennzahl groß', sample: 'Aufstellung Heim' },
    { id: 'stat',    use: 'Kennzahlen in Karten (Pkt., Reb.)',     sample: '17.4' },
    { id: 'h3',      use: 'Karten-Titel, Gruppen',                 sample: 'Kampfgericht' },
    { id: 'body-lg', use: 'Einleitung, hervorgehobener Text',      sample: 'Das Spiel beginnt um 19:30 Uhr in der Halle.' },
    { id: 'body',    use: 'Standard-Fließtext, Formulare',         sample: 'Das Spiel beginnt um 19:30 Uhr in der Halle.' },
    { id: 'body-md', use: 'Kompakte UI: Tabellen, Listen',         sample: 'Das Spiel beginnt um 19:30 Uhr in der Halle.' },
    { id: 'body-sm', use: 'Hilfetexte, Fußnoten',                  sample: 'Das Spiel beginnt um 19:30 Uhr in der Halle.' },
    { id: 'label',   use: 'Feld-Beschriftung, Tabellenkopf',       sample: 'Spielernummer' },
    { id: 'caption', use: 'Mono-Beschriftung, Chips, Meta',        sample: 'Q4 · 02:14' },
  ];

  // Live-Werte aus den CSS-Variablen, folgen der Marke (data-brand und data-type) und dem Handy-Breakpoint
  let live = $state({});
  function read() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim();
    const next = {};
    for (const s of steps) next[s.id] = { fs: v(`--hoops-fs-${s.id}`), sm: v(`--hoops-fs-${s.id}-sm`), lh: v(`--hoops-lh-${s.id}`), ls: v(`--hoops-ls-${s.id}`), fw: v(`--hoops-fw-${s.id}`) };
    live = next;
  }
  onMount(() => {
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true });
    window.addEventListener('resize', read);
    return () => { mo.disconnect(); window.removeEventListener('resize', read); };
  });

  const first = (stack) => (stack || '').split(',')[0].replace(/['"]/g, '').trim();

  const weights = [300, 400, 500, 600, 700, 800];

  // Beide Schriften fest nebeneinander, unabhängig vom Umschalter „Marke“ (der koppelt Marke und Schrift). Die Stapel stehen wörtlich in
  // tokens/tokens.css (:root und :root[data-type="dbb"]); tests/storybook-preview-pages.test.ts vergleicht sie.
  const SCHRIFTEN = [
    {
      id: 'bbv', label: 'BBV · Standardschrift (Sora, Manrope)', tt: 'none',
      families: { display: "'Sora', system-ui, sans-serif", heading: "'Sora', system-ui, sans-serif", body: "'Manrope', system-ui, sans-serif", mono: "'JetBrains Mono', ui-monospace, monospace" },
    },
    {
      id: 'dbb', label: 'DBB · Schrift von basketball-bund.de (Rubik, Sucrose)', tt: 'uppercase',
      families: { display: "'Sucrose', 'Barlow Condensed', 'Rubik', system-ui, sans-serif", heading: "'Sucrose', 'Barlow Condensed', 'Rubik', system-ui, sans-serif", body: "'Rubik', system-ui, sans-serif", mono: "'JetBrains Mono', ui-monospace, monospace" },
    },
  ];
  const pangram = 'Zwölf Boxkämpfer jagen Viktor quer über den großen Sylter Deich';

  // Audit: Schriftgrößen in css/ und svelte/ (zur Laufzeit aus den Quelltexten gezählt)
  const sources = import.meta.glob(['../../css/*.css', '../../svelte/*.svelte'], { query: '?raw', import: 'default', eager: true });
  const scalePx = [88, 64, 44, 32, 28, 22, 20, 18, 15, 14, 13, 12, 11];
  const literal = new Map(); // feste px-Werte (sollten leer sein)
  const viaToken = new Map(); // Nutzung der Tokens --hoops-fs-*
  for (const src of Object.values(sources)) {
    for (const m of String(src).matchAll(/font-size:\s*([0-9.]+)px/g)) literal.set(+m[1], (literal.get(+m[1]) || 0) + 1);
    for (const m of String(src).matchAll(/font-size:\s*var\(--hoops-fs-([a-z-]+)\)/g)) viaToken.set(m[1], (viaToken.get(m[1]) || 0) + 1);
  }
  const literalRows = [...literal.entries()]
    .map(([px, n]) => {
      const near = scalePx.reduce((a, b) => (Math.abs(b - px) < Math.abs(a - px) ? b : a));
      return { px, n, on: scalePx.includes(px), near };
    })
    .sort((a, b) => b.px - a.px);
  const tokenRows = steps.map((st) => ({ id: st.id, n: viaToken.get(st.id) || 0 })).filter((r) => r.n > 0);
  const literalTotal = literalRows.reduce((t, r) => t + r.n, 0);
  const tokenTotal = tokenRows.reduce((t, r) => t + r.n, 0);

  let { mode = 'scale' } = $props();
</script>

<div class="wrap">
  {#if mode === 'scale'}
    {#each steps as s}
      <div class="row">
        <div class="meta">
          <div class="name">.hoops-t-{s.id}</div>
          <div class="spec">{live[s.id]?.fs} / {live[s.id]?.lh} · {live[s.id]?.fw} · {live[s.id]?.ls}{live[s.id]?.sm ? ` · Handy ${live[s.id].sm}` : ''}</div>
          <div class="use">{s.use}</div>
        </div>
        <div class="sample"><div class={`hoops-t-${s.id}`}>{s.sample}</div></div>
      </div>
    {/each}

  {:else if mode === 'families'}
    <div class="fam-grid">
      {#each SCHRIFTEN as schrift}
        <section class="fam-col" aria-label={schrift.label}>
          <div class="cap">{schrift.label}</div>
          {#each [['Display', 'display', 'Scoreboard, Headlines, Trikotnummern'], ['Heading', 'heading', 'Überschriften'], ['Body', 'body', 'UI, Fließtext, Formulare'], ['Mono', 'mono', 'Spielzeit, Tabellen, Beschriftungen']] as [label, key, use]}
            <div class="fam">
              <div class="fam-h"><span class="name">{label}</span><span class="spec">{first(schrift.families[key])}</span><span class="use">{use}</span></div>
              <div class="weights">
                {#each weights as w}
                  <div class="w"><span class="wl">{w}</span><span style={`font-family: ${schrift.families[key]}; font-weight: ${w}; font-size: 20px;`}>Aa Gg 0123</span></div>
                {/each}
              </div>
              <div style={`font-family: ${schrift.families[key]}; font-size: 17px; margin-top: 10px;${key === 'display' ? ` text-transform: ${schrift.tt};` : ''}`}>{pangram}</div>
            </div>
          {/each}
        </section>
      {/each}
    </div>

  {:else if mode === 'numbers'}
    <div class="pair">
      <div>
        <div class="cap">proportional (Standard)</div>
        <div class="num" style="font-variant-numeric: proportional-nums;">
          {#each ['111', '808', '1:11', '98 : 67', '04:20'] as n}<div>{n}</div>{/each}
        </div>
      </div>
      <div>
        <div class="cap">tabular-nums (.hoops-tnum)</div>
        <div class="num hoops-tnum">
          {#each ['111', '808', '1:11', '98 : 67', '04:20'] as n}<div>{n}</div>{/each}
        </div>
      </div>
    </div>
    <div class="cap" style="margin-top: 28px;">Uhr und Anzeige</div>
    <div class="sb-row" style="gap: 40px;">
      <div class="hoops-t-display">87 : 64</div>
      <div class="hoops-t-clock">08:42</div>
      <div class="hoops-t-caption">Q4 · 02:14 · 24 s</div>
    </div>

  {:else if mode === 'context'}
    <article class="ctx">
      <div class="hoops-t-caption">BBL · 17. Spieltag</div>
      <h1 class="hoops-t-h1">TSV Nordhain gegen Lindenberg Hawks</h1>
      <p class="hoops-t-body-lg hoops-measure">Das Topspiel der Bayernliga beginnt um 19:30 Uhr. Beide Mannschaften stehen punktgleich an der Tabellenspitze.</p>
      <div class="scoreline">
        <div class="hoops-t-display">87 : 64</div>
        <div><div class="hoops-t-clock">08:42</div><div class="hoops-t-caption">Q4</div></div>
      </div>
      <h2 class="hoops-t-h2">Aufstellung Heim</h2>
      <h3 class="hoops-t-h3">Starter</h3>
      <table class="tbl">
        <thead><tr><th class="hoops-t-label">Nr.</th><th class="hoops-t-label">Spieler</th><th class="hoops-t-label num-r">Pkt.</th></tr></thead>
        <tbody>
          {#each [['4', 'J. Tanner', 22], ['7', 'M. Okafor', 19], ['13', 'K. Vogler', 12]] as [n, name, p]}
            <tr><td class="hoops-t-body-md hoops-tnum">{n}</td><td class="hoops-t-body-md">{name}</td><td class="hoops-t-body-md hoops-tnum num-r">{p}</td></tr>
          {/each}
        </tbody>
      </table>
      <label class="hoops-t-label" for="ctx-in">Spielernummer</label>
      <input id="ctx-in" class="hoops-t-body ctx-in" value="23" />
      <p class="hoops-t-body-sm hint">Hilfetext: Nummern von 0 bis 99, bei Gleichstand entscheidet der Schiedsrichter.</p>
    </article>

  {:else}
    <p class="muted">
      Gezählt aus <code>css/*.css</code> und <code>svelte/*.svelte</code>: <strong>{tokenTotal}</strong> Angaben über <code>--hoops-fs-*</code>,
      <strong>{literalTotal}</strong> mit festem px-Wert.
    </p>
    {#if literalRows.length}
      <div class="cap">Feste px-Werte (auf Tokens umstellen)</div>
      <table class="audit">
        <thead><tr><th>px</th><th>Vorkommen</th><th>Status</th><th>nächste Stufe</th></tr></thead>
        <tbody>
          {#each literalRows as a}
            <tr class:off={!a.on}><td>{a.px}</td><td>{a.n}</td><td>{a.on ? 'auf der Skala' : 'neben der Skala'}</td><td>{a.on ? '' : a.near + ' px'}</td></tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p class="ok">Keine festen px-Werte. Alle Größen laufen über die Skala.</p>
    {/if}
    <div class="cap" style="margin-top: 24px;">Nutzung der Stufen</div>
    <table class="audit">
      <thead><tr><th>Stufe</th><th>Vorkommen</th></tr></thead>
      <tbody>{#each tokenRows as r}<tr><td>--hoops-fs-{r.id}</td><td>{r.n}</td></tr>{/each}</tbody>
    </table>
  {/if}
</div>

<style>
  .wrap { font-family: var(--hoops-font-body); color: var(--hoops-page-fg); }
  .muted { color: var(--hoops-page-mute); margin: 0 0 20px; max-width: 72ch; }
  code { font-family: var(--hoops-font-mono); font-size: 0.9em; }
  .row { display: grid; grid-template-columns: 260px 1fr; gap: 24px; padding: 18px 0; border-top: 1px solid var(--hoops-page-line); align-items: baseline; }
  .meta .name { font-family: var(--hoops-font-mono); font-size: 12px; font-weight: 700; }
  .meta .spec { font-family: var(--hoops-font-mono); font-size: 11px; color: var(--hoops-page-mute); margin-top: 2px; }
  .meta .use { font-size: 12px; color: var(--hoops-page-mute); margin-top: 4px; }
  .sample { overflow: hidden; }
  .fam-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 8px 32px; }
  .fam-col { min-width: 0; }
  .fam { padding: 18px 0 22px; border-top: 1px solid var(--hoops-page-line); }
  .fam-h { display: flex; gap: 16px; align-items: baseline; margin-bottom: 10px; flex-wrap: wrap; }
  .fam-h .name { font-family: var(--hoops-font-mono); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
  .fam-h .spec { font-family: var(--hoops-font-mono); font-size: 12px; }
  .fam-h .use { font-size: 12px; color: var(--hoops-page-mute); }
  .weights { display: flex; flex-wrap: wrap; gap: 8px 28px; }
  .w { display: flex; flex-direction: column; gap: 2px; }
  .wl { font-family: var(--hoops-font-mono); font-size: 10.5px; color: var(--hoops-page-mute); }
  .pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr)); gap: 32px; max-width: 640px; }
  .cap { font-family: var(--hoops-font-mono); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); margin-bottom: 8px; }
  .num { font-family: var(--hoops-font-mono); font-size: 28px; font-weight: 700; line-height: 1.3; }
  .ctx { max-width: 720px; display: flex; flex-direction: column; gap: 14px; }
  .scoreline { display: flex; gap: 40px; align-items: center; padding: 8px 0; }
  .tbl { border-collapse: collapse; width: 100%; max-width: 420px; }
  .tbl th, .tbl td { text-align: left; padding: 8px 12px 8px 0; border-bottom: 1px solid var(--hoops-page-line); }
  .num-r { text-align: right !important; }
  .ctx-in { width: 120px; height: 44px; padding: 0 12px; border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-md); background: var(--hoops-page-surface-0); color: var(--hoops-page-fg); }
  .hint { color: var(--hoops-page-mute); margin: 0; }
  .audit { border-collapse: collapse; font-family: var(--hoops-font-mono); font-size: 13px; }
  .audit th, .audit td { text-align: left; padding: 6px 28px 6px 0; border-bottom: 1px solid var(--hoops-page-line); }
  .audit th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .audit tr.off td { font-weight: 700; }
  /* letzte Spalte ohne Abstand rechts: bei 420 px lief die Prüftabelle sonst 14 px über und machte die Vorschau scrollbar (axe scrollable-region-focusable) */
  .audit th:last-child, .audit td:last-child { padding-right: 0; }
  .ok { font-family: var(--hoops-font-mono); font-size: 13px; color: var(--hoops-chip-ok-fg); }
  @media (max-width: 640px) {
    .row { grid-template-columns: minmax(0, 1fr); gap: 8px; }
    .scoreline { flex-wrap: wrap; gap: 16px 32px; }
    .audit { font-size: 12px; }
    /* feste Spaltenaufteilung auf volle Breite: Zellen brechen um, die Tabelle läuft auch bei 320 px nicht über */
    .audit { width: 100%; table-layout: fixed; }
    .audit th, .audit td { padding-right: 12px; overflow-wrap: anywhere; }
    .audit th:last-child, .audit td:last-child { padding-right: 0; }
  }
</style>
