<script lang="ts">
  import { t } from '../../js/i18n/index.js';
  import { localizeMarkup } from '../docs/localize-markup';
  import { initAll } from '../../js/vanilla-core.js';
  import { initTheme } from '../../js/theme.js';
  import { buttonMarkup } from './DarkMode.code';

  // Beispiele der Seite „Dark Mode“. Das echte Umschalten (Attribut auf <html>) läuft nur im eigenen Rahmen (iframe); auf der Doku-Seite
  // selbst würde es das Theme der Werkzeugleiste überschreiben. Die Matrix der Zustände nutzt deshalb ein Ersatz-Element als Ziel.
  let { example }: { example: string } = $props();

  let report = $state({ mode: '–', state: '–', pressed: '–' });
  function demo(node: HTMLElement) {
    const button = node.querySelector<HTMLButtonElement>('button')!;
    const theme = initTheme(button, {
      onChange: (mode, state) => { report = { mode, state, pressed: button.getAttribute('aria-pressed') ?? '–' }; },
    });
    report = { mode: theme.getMode(), state: button.getAttribute('data-theme-state') ?? '–', pressed: button.getAttribute('aria-pressed') ?? '–' };
    return { destroy: () => theme.destroy() };
  }

  // Vanilla-Beispiel: dasselbe Markup wie im Code-Beispiel, gestartet mit initAll (Ziel ist ein Ersatz-Element, nicht <html>)
  function vanillaButton(node: HTMLElement) {
    node.replaceChildren(document.createRange().createContextualFragment(localizeMarkup(buttonMarkup)));
    const handle = initAll(node, { theme: { target: node, storage: null } });
    return { destroy: () => handle.destroy() };
  }

  // Zustandsmatrix: Zustände erzwingt .storybook/pseudo-states.ts über die Klassen
  const cols = ['Standard', 'Hover', 'Fokus', 'Gedrückt'] as const;
  const stateClass: Record<(typeof cols)[number], string> = { Standard: '', Hover: 'pseudo-hover', Fokus: 'pseudo-focus-visible', Gedrückt: '' };
  function cell(node: HTMLElement, options: { pressed: boolean; cls: string }) {
    const button = node.querySelector<HTMLButtonElement>('button')!;
    if (options.cls) button.classList.add(...options.cls.split(' '));
    const theme = initTheme(button, { target: node, storage: null, mode: options.pressed ? 'dark' : 'light' });
    return { destroy: () => theme.destroy() };
  }
</script>

{#if example === 'demo'}
  <div class="demo" use:demo>
    <p class="row">
      <button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--icon" hidden></button>
      <span>Hell, dunkel oder System: Klicke auf den Knopf.</span>
    </p>
    <div class="card">
      <strong>Beispielkarte</strong>
      <p>Flächen und Texte folgen den Tokens, die Seite wechselt sofort.</p>
    </div>
    <dl class="report">
      <div><dt>Modus</dt><dd>{report.mode}</dd></div>
      <div><dt>Zustand</dt><dd>{report.state}</dd></div>
      <div><dt>aria-pressed</dt><dd>{report.pressed}</dd></div>
    </dl>
  </div>
{:else if example === 'vanilla'}
  <div class="demo"><div use:vanillaButton></div></div>
{:else if example === 'zustaende'}
  <div class="surface">
    <div class="states">
      {#each cols as name, i (name)}
        <div class="cell">
          <div class="cap">{name}</div>
          <div class="holder" use:cell={{ pressed: name === 'Gedrückt', cls: stateClass[name] }}><button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--icon" hidden></button></div>
        </div>
      {/each}
    </div>
  </div>
{:else if example === 'handy'}
  <div class="narrow demo" use:demo>
    <p class="row"><button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--icon" hidden></button><span>{t('theme.toggle')}</span></p>
    <div class="card"><strong>TSV Nordhain 1920</strong><p>Platz 3 von 12 in der Bayernliga Süd.</p></div>
    <dl class="report"><div><dt>Modus</dt><dd>{report.mode}</dd></div><div><dt>aria-pressed</dt><dd>{report.pressed}</dd></div></dl>
  </div>
{:else if example === 'handy-dunkel'}
  <div class="narrow demo" use:demo>
    <p class="row"><button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--icon" hidden></button><span>{t('theme.toggle')}</span></p>
    <div class="card"><strong>Lindenberg Hawks</strong><p>Nächstes Spiel: Samstag, 19:30 Uhr.</p></div>
    <dl class="report"><div><dt>Zustand</dt><dd>{report.state}</dd></div><div><dt>aria-pressed</dt><dd>{report.pressed}</dd></div></dl>
  </div>
{:else if example === 'do-name'}
  <p class="row">
    <button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--icon hoops-theme-toggle" aria-label={t('theme.toggle')} aria-pressed="true" data-theme-state="dark">
      <svg class="hoops-theme-icon hoops-theme-icon--sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /></svg>
      <svg class="hoops-theme-icon hoops-theme-icon--moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
    </button>
    <span>Name „Dunkelmodus“, <code>aria-pressed="true"</code></span>
  </p>
{:else if example === 'dont-name'}
  <!-- Falsch: der Name wechselt mit dem Zustand; ein Screenreader liest „Zum Dark-Modus wechseln“ und wer ihn schon benutzt hat, erfährt nicht, was jetzt gilt -->
  <p class="row">
    <button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--icon" aria-label="Zum Light-Modus wechseln">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /></svg>
    </button>
    <span>Name „Zum Light-Modus wechseln“, kein <code>aria-pressed</code></span>
  </p>
{:else if example === 'do-symbol'}
  <p class="row">
    <button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--icon" aria-label={t('theme.toggle')} aria-pressed="false">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /></svg>
    </button>
    <span>Symbol mit Namen</span>
  </p>
{:else if example === 'dont-symbol'}
  <!-- Falsch: nur ein Symbol, kein Name; Sprachsteuerung und Screenreader können den Knopf nicht ansprechen -->
  <p class="row">
    <button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /></svg>
    </button>
    <span>Symbol ohne Namen</span>
  </p>
{:else if example === 'do-token'}
  <div class="card"><strong>Farben aus Tokens</strong><p>Fläche <code>--hoops-surface</code>, Text <code>--hoops-fg</code>: im Dunkelmodus dunkel.</p></div>
{:else if example === 'dont-token'}
  <!-- Falsch: feste Farben bleiben im Dunkelmodus hell und blenden -->
  <div class="card fixed"><strong>Feste Farben</strong><p>Fläche <code>#ffffff</code>, Text <code>#111111</code>: bleibt im Dunkelmodus hell.</p></div>
{/if}

<style>
  .demo { max-width: 520px; padding: 16px; color: var(--hoops-fg); background: var(--hoops-surface); font-family: var(--hoops-font-body); }
  .narrow { max-width: 380px; }
  .row { display: flex; align-items: center; gap: 12px; margin: 0 0 14px; font-size: var(--hoops-fs-body-md); color: var(--hoops-page-fg); }
  .demo .row { color: var(--hoops-fg); }
  .card { padding: 14px 16px; background: var(--hoops-surface); border: 1px solid var(--hoops-line); border-radius: var(--hoops-radius-lg); color: var(--hoops-fg); font-size: var(--hoops-fs-body-md); }
  .card p { margin: 4px 0 0; color: var(--hoops-fg-soft); }
  .card.fixed { background: #ffffff; color: #111111; border-color: #cccccc; }
  .card.fixed p { color: #111111; }
  .report { display: flex; flex-wrap: wrap; gap: 8px 20px; margin: 14px 0 0; font-size: var(--hoops-fs-body-sm); }
  .report div { display: flex; gap: 6px; }
  .report dt { color: var(--hoops-mute); }
  .report dd { margin: 0; font-family: var(--hoops-font-mono); color: var(--hoops-fg); }
  .surface { position: relative; background: var(--hoops-page-bg); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 16px; }
  .cap { margin-bottom: 8px; font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cell { padding: 6px; }
</style>
