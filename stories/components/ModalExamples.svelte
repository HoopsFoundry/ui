<script lang="ts">
  import Modal from '../../svelte/Modal.svelte';
  import Button from '../../svelte/Button.svelte';
  import ModalDemo from './ModalDemo.svelte';
  import { initAll } from '../../js/vanilla-core.js';
  import { dialogMarkup, divMarkup } from '../Modal.code';

  let { example }: { example: string } = $props();

  const severities = [
    { severity: 'default', title: 'Spielbericht freigeben', subtitle: 'Standard', body: 'Nach Freigabe ist eine Korrektur nur noch über den Verband möglich.', cancelLabel: 'Abbrechen', confirmLabel: 'Freigeben' },
    { severity: 'danger', title: 'Spielbericht verwerfen?', subtitle: 'Nicht wiederherstellbar', body: 'Alle erfassten Aktionen werden gelöscht. Das lässt sich nicht rückgängig machen.', cancelLabel: 'Behalten', confirmLabel: 'Verwerfen', confirmVariant: 'danger' },
    { severity: 'warn', title: 'Anwurfzeit nach 22:00 Uhr', subtitle: 'Hallenordnung prüfen', body: 'Die Halle schließt um 23:00, Spielzeit und Verlängerung passen evtl. nicht hinein.', cancelLabel: 'Zeit ändern', confirmLabel: 'Trotzdem ansetzen', confirmVariant: 'amber' },
    { severity: 'ok', title: 'Spielbericht synchronisiert', subtitle: 'Verband BBV · gerade eben', body: 'Alle 47 Aktionen wurden an den Verband übertragen.', cancelLabel: 'Schließen', confirmLabel: 'OK' },
    { severity: 'info', title: 'Bonus-Status', subtitle: 'FIBA-Regel 35', body: 'Ab dem 5. Mannschafts-Foul eines Viertels gibt es für jedes weitere Foul 2 Freiwürfe.', cancelLabel: 'Schließen', confirmLabel: 'Verstanden' },
  ];
  const sizes = [
    { size: 'sm', label: 'sm · 380 px' },
    { size: 'md', label: 'md · 480 px (Standard)' },
    { size: 'wide', label: 'wide · 560 px' },
    { size: 'xwide', label: 'xwide · 720 px' },
  ];
  const cols = ['Standard', 'Hover', 'Fokus', 'Aktiv', 'Gesperrt'];
  const buttons = [
    { name: 'Primär', variant: 'primary', label: 'Freigeben' },
    { name: 'Sekundär', variant: 'secondary', label: 'Abbrechen' },
    { name: 'Danger', variant: 'danger', label: 'Verwerfen' },
  ];
  const stateClass = { Standard: '', Hover: 'pseudo-hover', Fokus: 'pseudo-focus-visible', Aktiv: 'pseudo-hover pseudo-active', Gesperrt: '' };

  let interactiveOpen = $state(false);

  // Vanilla-Beispiele: das Markup aus dem Code-Beispiel (createContextualFragment statt HTML-Zuweisung), gestartet mit initAll.
  function vanillaModal(node: HTMLElement, markup: string) {
    node.replaceChildren(document.createRange().createContextualFragment(markup));
    const handle = initAll(node, { only: ['modal'] });
    return { destroy: () => handle.destroy() };
  }
</script>

<!-- Statisches Modal (nicht gestartet) für Handy-Vorschauen und Do/Don't; focusDanger/focusSafe setzt den Fokus-Ring fest -->
{#snippet staticModal(p: { id: string; severity?: string; title: string; subtitle: string; body: string; safe: string; danger?: string; ok?: string; ring?: string })}
  <div class="hoops-backdrop"></div>
  <div class="hoops-modal-wrap">
    <div class="hoops-modal hoops-modal--sm" role="dialog" aria-modal="true" aria-labelledby="{p.id}-titel">
      <div class="hoops-m-head">
        {#if p.severity}
          <div class="hoops-m-head-icon hoops-m-head-icon--{p.severity}">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5"/><path d="M8 7v4M8 4.5v.05"/></svg>
          </div>
        {/if}
        <div class="hoops-m-head-text">
          <h2 class="hoops-m-title" id="{p.id}-titel">{p.title}</h2>
          <div class="hoops-m-subtitle">{p.subtitle}</div>
        </div>
        <button type="button" class="hoops-m-close" aria-label="Schließen"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>
      </div>
      <div class="hoops-m-body">{p.body}</div>
      <div class="hoops-m-footer">
        <button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--md {p.ring === 'safe' ? 'pseudo-focus-visible' : ''}">{p.safe}</button>
        {#if p.danger}<button type="button" class="hoops-btn hoops-btn--danger hoops-btn--md {p.ring === 'danger' ? 'pseudo-focus-visible' : ''}">{p.danger}</button>{/if}
        {#if p.ok}<button type="button" class="hoops-btn hoops-btn--primary hoops-btn--md">{p.ok}</button>{/if}
      </div>
    </div>
  </div>
{/snippet}

{#snippet mock()}
  <div class="mock" aria-hidden="true">
    <div class="mock-h">Spielbericht · Spieltag 17</div>
    <div class="mock-l"></div><div class="mock-l mock-s"></div><div class="mock-l"></div>
  </div>
{/snippet}

{#if example === 'anatomie'}
  <div class="frame" style="height: 440px">
    {@render mock()}
    <ModalDemo title="Spielbericht beenden?" subtitle="Schiedsrichter-Unterschrift" body="Nach dem Senden kann der Spielbericht nicht mehr bearbeitet werden. Beide Schiedsrichter müssen unterschreiben." cancelLabel="Abbrechen" confirmLabel="Senden" />
  </div>
{:else if example === 'schweregrade'}
  <div class="grid2">
    {#each severities as s}
      <div>
        <div class="cap">{s.severity}</div>
        <div class="frame" style="height: 400px">
          {@render mock()}
          <ModalDemo {...s} size="sm" />
        </div>
      </div>
    {/each}
  </div>
{:else if example === 'groessen'}
  <div class="stack">
    {#each sizes as s}
      <div>
        <div class="cap">{s.label}</div>
        <div class="frame" style="height: 320px">
          {@render mock()}
          <ModalDemo size={s.size} title="Spielbericht freigeben" subtitle="BBL · 17. Spieltag" body="Nach Freigabe ist eine Korrektur nur noch über den Verband möglich." />
        </div>
      </div>
    {/each}
  </div>
{:else if example === 'interaktiv'}
  <div class="frame" style="height: 440px">
    <div class="page">
      <p class="page-t">Spielbericht · 17. Spieltag · Heim 87 : 74</p>
      <Button variant="primary" onclick={() => (interactiveOpen = true)}>Spielbericht freigeben</Button>
    </div>
    <Modal bind:open={interactiveOpen} title="Spielbericht freigeben?" subtitle="BBL · 17. Spieltag · Heim 87 : 74">
      Nach Freigabe ist eine Korrektur nur noch über den Verband möglich.
      {#snippet footer()}
        <Button variant="secondary" onclick={() => (interactiveOpen = false)}>Abbrechen</Button>
        <Button variant="primary" onclick={() => (interactiveOpen = false)}>Freigeben</Button>
      {/snippet}
    </Modal>
  </div>
{:else if example === 'zustaende'}
  <!-- data-fixed-states: die Werkzeugleiste "Zustand" lässt diese Matrix in Ruhe -->
  <div class="matrix" data-fixed-states>
    <div class="surface">
      <div class="states">
        <div class="head"></div>
        {#each cols as c}<div class="head">{c}</div>{/each}
        <div class="rowlabel">Schließen</div>
        {#each cols as c}
          <div class="cell cell-body">
            {#if c === 'Gesperrt'}
              <span class="none">nicht vorgesehen</span>
            {:else}
              <button type="button" class="hoops-m-close {stateClass[c]}" aria-label="Schließen"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg></button>
            {/if}
          </div>
        {/each}
        {#each buttons as b}
          <div class="rowlabel">{b.name}</div>
          {#each cols as c}
            <div class="cell cell-foot">
              <button type="button" class="hoops-btn hoops-btn--{b.variant} hoops-btn--md {stateClass[c]}" disabled={c === 'Gesperrt'}>{b.label}</button>
            </div>
          {/each}
        {/each}
      </div>
    </div>
  </div>

{:else if example === 'vanilla-dialog'}
  <div class="page">
    <p class="page-t">Spielbericht · 17. Spieltag · Heim 87 : 74</p>
    <div class="vanilla" use:vanillaModal={dialogMarkup}></div>
  </div>
{:else if example === 'vanilla-div'}
  <div class="frame" style="height: 380px">
    <div class="page">
      <p class="page-t">Spielbericht · 17. Spieltag</p>
      <div class="vanilla" use:vanillaModal={divMarkup}></div>
    </div>
  </div>
{:else if example === 'handy'}
  <div class="frame phone">
    {@render mock()}
    {@render staticModal({ id: 'hm', severity: 'warn', title: 'Anwurfzeit nach 22:00 Uhr', subtitle: 'Hallenordnung prüfen', body: 'Die Halle schließt um 23:00, Spielzeit und Verlängerung passen evtl. nicht hinein.', safe: 'Zeit ändern', ok: 'Trotzdem ansetzen' })}
  </div>
{:else if example === 'handy-dunkel'}
  <div class="frame phone">
    {@render mock()}
    {@render staticModal({ id: 'hd', severity: 'danger', title: 'Spielbericht verwerfen?', subtitle: 'Nicht wiederherstellbar', body: 'Alle erfassten Aktionen werden gelöscht. Das lässt sich nicht rückgängig machen.', safe: 'Behalten', danger: 'Verwerfen', ring: 'safe' })}
  </div>

<!-- Dos und Don'ts -->
{:else if example === 'do-fokus'}
  <div class="frame" style="height: 380px">
    {@render mock()}
    {@render staticModal({ id: 'df', severity: 'danger', title: 'Spielbericht verwerfen?', subtitle: 'Nicht wiederherstellbar', body: 'Alle erfassten Aktionen werden gelöscht.', safe: 'Behalten', danger: 'Verwerfen', ring: 'safe' })}
  </div>
{:else if example === 'dont-fokus'}
  <!-- Falsch: Der Fokus startet auf der zerstörerischen Aktion; ein versehentliches Enter verwirft den Bericht -->
  <div class="frame" style="height: 380px">
    {@render mock()}
    {@render staticModal({ id: 'dg', severity: 'danger', title: 'Spielbericht verwerfen?', subtitle: 'Nicht wiederherstellbar', body: 'Alle erfassten Aktionen werden gelöscht.', safe: 'Behalten', danger: 'Verwerfen', ring: 'danger' })}
  </div>
{:else if example === 'do-aktion'}
  <ModalDemo size="sm" title="Spielbericht senden?" subtitle="Letzter Schritt" body="Nach dem Senden ist der Bericht final." cancelLabel="Noch prüfen" confirmLabel="Senden" />
{:else if example === 'dont-aktion'}
  <ModalDemo size="sm" title="Achtung" subtitle="" body="Nach dem Senden ist der Bericht final." cancelLabel="Nein" confirmLabel="OK" />
{:else if example === 'do-danger'}
  <ModalDemo size="sm" severity="danger" title="Spielbericht verwerfen?" subtitle="Nicht wiederherstellbar" body="Alle erfassten Aktionen werden gelöscht." cancelLabel="Behalten" confirmLabel="Verwerfen" confirmVariant="danger" />
{:else if example === 'dont-danger'}
  <ModalDemo size="sm" title="Spielbericht verwerfen?" subtitle="Nicht wiederherstellbar" body="Alle erfassten Aktionen werden gelöscht." cancelLabel="Behalten" confirmLabel="Verwerfen" />
{:else if example === 'do-ausweg'}
  <ModalDemo size="sm" title="Verbindung verloren" subtitle="Offline" body="Aktionen werden lokal gespeichert und später hochgeladen." cancelLabel="Später" confirmLabel="Verstanden" />
{:else if example === 'dont-ausweg'}
  <!-- closable=false ohne Footer: kein Schließen-Button, kein Escape, keine Aktion -->
  <ModalDemo size="sm" closable={false} footer={false} title="Verbindung verloren" subtitle="Offline" body="Aktionen werden lokal gespeichert und später hochgeladen." />
{:else if example === 'do-schwere'}
  <ModalDemo size="sm" severity="info" title="Bonus-Status" subtitle="FIBA-Regel 35" body="Ab dem 5. Mannschafts-Foul eines Viertels gibt es 2 Freiwürfe." cancelLabel="Schließen" confirmLabel="Verstanden" />
{:else if example === 'dont-schwere'}
  <ModalDemo size="sm" severity="danger" title="Bonus-Status" subtitle="FIBA-Regel 35" body="Ab dem 5. Mannschafts-Foul eines Viertels gibt es 2 Freiwürfe." cancelLabel="Schließen" confirmLabel="Verstanden" />
{/if}

<style>
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr)); gap: 24px; }
  .stack { display: flex; flex-direction: column; gap: 24px; }
  .cap, .head, .rowlabel { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cap { margin-bottom: 8px; }
  /* Das Modal ist position: fixed. transform macht den Rahmen zum Bezugsrahmen, sonst überdeckt es die ganze Seite. */
  .frame { position: relative; transform: translateZ(0); overflow: hidden; width: 100%; height: 400px; border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); background: var(--hoops-page-bg); }
  .mock { padding: 24px; display: flex; flex-direction: column; gap: 10px; color: var(--hoops-page-fg); }
  .mock-h { font-family: var(--hoops-font-display); font-weight: 700; }
  .mock-l { height: 10px; border-radius: 5px; background: var(--hoops-page-line); }
  .mock-s { width: 60%; }
  .phone { max-width: 390px; height: 520px; }
  .page { padding: 24px; display: flex; flex-direction: column; align-items: flex-start; gap: 16px; }
  .page-t { margin: 0; font-family: var(--hoops-font-display); font-weight: 700; color: var(--hoops-page-fg); }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  .surface { background: var(--hoops-page-bg); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: 90px repeat(5, minmax(120px, 1fr)); gap: 10px 12px; align-items: center; }
  .cell { display: flex; align-items: center; justify-content: center; min-height: 64px; border-radius: var(--hoops-radius-md); padding: 8px; }
  .cell-body { background: var(--hoops-surface); }
  .cell-foot { background: var(--hoops-surface-2); }
  .none { font-size: var(--hoops-fs-caption); color: var(--hoops-page-mute); }
</style>
