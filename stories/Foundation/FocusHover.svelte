<script>
  // Fokus-Ring und Hover-Zustände wichtiger Komponenten, fest angezeigt (Klassen .pseudo-*, nur Storybook).
  // Live: mit der Maus darüberfahren, mit Tab hineinspringen. Marke und Light/Dark in der Toolbar umschalten.
  const tabs = ['Spielplan', 'Tabelle', 'Statistik'];
</script>

<div class="wrap">
  <div class="grid">
    <div class="cell">
      <div class="cap">Button · primary</div>
      <div class="states">
        <button class="dss-btn dss-btn--primary dss-btn--md">Ruhe</button>
        <button class="dss-btn dss-btn--primary dss-btn--md pseudo-hover">Hover</button>
        <button class="dss-btn dss-btn--primary dss-btn--md pseudo-focus-visible">Fokus</button>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Button · amber (CTA)</div>
      <div class="states">
        <button class="dss-btn dss-btn--amber dss-btn--md">Ruhe</button>
        <button class="dss-btn dss-btn--amber dss-btn--md pseudo-hover">Hover</button>
        <button class="dss-btn dss-btn--amber dss-btn--md pseudo-focus-visible">Fokus</button>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Button · secondary und ghost</div>
      <div class="states">
        <button class="dss-btn dss-btn--secondary dss-btn--md pseudo-hover">Hover</button>
        <button class="dss-btn dss-btn--secondary dss-btn--md pseudo-focus-visible">Fokus</button>
        <button class="dss-btn dss-btn--ghost dss-btn--md pseudo-hover">Hover</button>
        <button class="dss-btn dss-btn--ghost dss-btn--md pseudo-focus-visible">Fokus</button>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Link</div>
      <div class="states">
        <a class="dss-link" href="#x" onclick={(e) => e.preventDefault()}>Ruhe</a>
        <a class="dss-link pseudo-hover" href="#x" onclick={(e) => e.preventDefault()}>Hover</a>
        <a class="dss-link pseudo-focus-visible" href="#x" onclick={(e) => e.preventDefault()}>Fokus</a>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Eingabefeld</div>
      <div class="states col">
        <div class="dss-field"><div class="dss-input-group"><input class="dss-input dss-input--default" placeholder="Ruhe" aria-label="Ruhe" /></div></div>
        <div class="dss-field"><div class="dss-input-group pseudo-focus-within"><input class="dss-input dss-input--default" value="Fokus" aria-label="Fokus" /></div></div>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Select</div>
      <div class="states col">
        <select class="dss-select" aria-label="Ruhe"><option>Ruhe</option></select>
        <select class="dss-select pseudo-focus-visible" aria-label="Fokus"><option>Fokus</option></select>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Tabs · underline · aktiv, Hover, Fokus</div>
      <div class="dss-tabs dss-tabs--underline dss-tabs--md tabrow" role="tablist">
        <button class="dss-tab is-active" role="tab" aria-selected="true">{tabs[0]}</button>
        <button class="dss-tab pseudo-hover" role="tab" aria-selected="false">{tabs[1]}</button>
        <button class="dss-tab pseudo-focus-visible" role="tab" aria-selected="false">{tabs[2]}</button>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Karte · hoverable</div>
      <div class="states">
        <div class="dss-card dss-card--hoverable dss-card--pad-sm"><div class="dss-card-body">Ruhe</div></div>
        <div class="dss-card dss-card--hoverable dss-card--pad-sm pseudo-hover"><div class="dss-card-body">Hover</div></div>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Checkbox</div>
      <div class="states">
        <label class="dss-check"><input type="checkbox" class="dss-check-input" /><span class="dss-check-text">Ruhe</span></label>
        <label class="dss-check"><input type="checkbox" class="dss-check-input pseudo-focus-visible" checked /><span class="dss-check-text">Fokus</span></label>
      </div>
    </div>

    <div class="cell dark">
      <div class="cap">Fokus auf dunkler Fläche</div>
      <div class="states">
        <button class="dss-btn dss-btn--secondary dss-btn--md pseudo-focus-visible">Fokus</button>
      </div>
    </div>
  </div>
</div>

<style>
  .wrap { font-family: var(--hoops-font-body); color: var(--hoops-page-fg); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr)); gap: 16px; }
  .cell { padding: 20px 22px 26px; border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); background: var(--hoops-page-surface-0); }
  .cell.dark { background: var(--hoops-base-1000); color: var(--hoops-n-100); }
  .cap { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); margin-bottom: 16px; }
  .cell.dark .cap { color: var(--hoops-n-300); }
  .cell { overflow: hidden; }
  .tabrow { flex-wrap: wrap; }
  .states { display: flex; flex-wrap: wrap; gap: 20px; align-items: center; }
  .states.col { flex-direction: column; align-items: stretch; gap: 14px; }
  .states.col :global(.dss-field), .states.col :global(.dss-input-group), .states.col :global(.dss-input), .states.col :global(.dss-select) { min-width: 0; max-width: 100%; box-sizing: border-box; }
</style>
