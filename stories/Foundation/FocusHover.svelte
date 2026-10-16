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
        <button class="hoops-btn hoops-btn--primary hoops-btn--md">Ruhe</button>
        <button class="hoops-btn hoops-btn--primary hoops-btn--md pseudo-hover">Hover</button>
        <button class="hoops-btn hoops-btn--primary hoops-btn--md pseudo-focus-visible">Fokus</button>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Button · amber (CTA)</div>
      <div class="states">
        <button class="hoops-btn hoops-btn--amber hoops-btn--md">Ruhe</button>
        <button class="hoops-btn hoops-btn--amber hoops-btn--md pseudo-hover">Hover</button>
        <button class="hoops-btn hoops-btn--amber hoops-btn--md pseudo-focus-visible">Fokus</button>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Button · secondary und ghost</div>
      <div class="states">
        <button class="hoops-btn hoops-btn--secondary hoops-btn--md pseudo-hover">Hover</button>
        <button class="hoops-btn hoops-btn--secondary hoops-btn--md pseudo-focus-visible">Fokus</button>
        <button class="hoops-btn hoops-btn--ghost hoops-btn--md pseudo-hover">Hover</button>
        <button class="hoops-btn hoops-btn--ghost hoops-btn--md pseudo-focus-visible">Fokus</button>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Link</div>
      <div class="states">
        <a class="hoops-link" href="#x" onclick={(e) => e.preventDefault()}>Ruhe</a>
        <a class="hoops-link pseudo-hover" href="#x" onclick={(e) => e.preventDefault()}>Hover</a>
        <a class="hoops-link pseudo-focus-visible" href="#x" onclick={(e) => e.preventDefault()}>Fokus</a>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Eingabefeld</div>
      <div class="states col">
        <div class="hoops-field"><div class="hoops-input-group"><input class="hoops-input hoops-input--default" placeholder="Ruhe" aria-label="Ruhe" /></div></div>
        <div class="hoops-field"><div class="hoops-input-group pseudo-focus-within"><input class="hoops-input hoops-input--default" value="Fokus" aria-label="Fokus" /></div></div>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Select</div>
      <div class="states col">
        <select class="hoops-select" aria-label="Ruhe"><option>Ruhe</option></select>
        <select class="hoops-select pseudo-focus-visible" aria-label="Fokus"><option>Fokus</option></select>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Tabs · underline · aktiv, Hover, Fokus</div>
      <div class="hoops-tabs hoops-tabs--underline hoops-tabs--md tabrow" role="tablist">
        <button class="hoops-tab is-active" role="tab" aria-selected="true">{tabs[0]}</button>
        <button class="hoops-tab pseudo-hover" role="tab" aria-selected="false">{tabs[1]}</button>
        <button class="hoops-tab pseudo-focus-visible" role="tab" aria-selected="false">{tabs[2]}</button>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Karte · hoverable</div>
      <div class="states">
        <div class="hoops-card hoops-card--hoverable hoops-card--pad-sm"><div class="hoops-card-body">Ruhe</div></div>
        <div class="hoops-card hoops-card--hoverable hoops-card--pad-sm pseudo-hover"><div class="hoops-card-body">Hover</div></div>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Checkbox</div>
      <div class="states">
        <label class="hoops-check"><input type="checkbox" class="hoops-check-input" /><span class="hoops-check-text">Ruhe</span></label>
        <label class="hoops-check"><input type="checkbox" class="hoops-check-input pseudo-focus-visible" checked /><span class="hoops-check-text">Fokus</span></label>
      </div>
    </div>

    <div class="cell dark">
      <div class="cap">Fokus auf dunkler Fläche</div>
      <div class="states">
        <button class="hoops-btn hoops-btn--secondary hoops-btn--md pseudo-focus-visible">Fokus</button>
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
  .states.col :global(.hoops-field), .states.col :global(.hoops-input-group), .states.col :global(.hoops-input), .states.col :global(.hoops-select) { min-width: 0; max-width: 100%; box-sizing: border-box; }
</style>
