<script>
  import Modal from '../../svelte/Modal.svelte';
  import Button from '../../svelte/Button.svelte';
  import { resolveHeading } from '../../js/heading.js';
  import { t } from '../../js/i18n/index.js';

  let {
    severity = 'default',
    size = 'md',
    title = 'Spielbericht freigeben',
    titleAs = undefined,
    subtitle = 'BBL · 17. Spieltag · Heim 87 : 74',
    closable = true,
    body = 'Nach Freigabe ist eine Korrektur nur noch über den Verband möglich. Schiedsrichter und beide Trainer müssen unterschrieben haben.',
    cancelLabel = 'Abbrechen',
    confirmLabel = 'Freigeben',
    confirmVariant = 'primary',
    footer: withFooter = true,
    inline = false,
  } = $props();

  // `inline`: nur für Beispiele auf Doku-Seiten. Die echte Komponente startet `initModal`, das beim Öffnen die ganze Seite dahinter inert
  // schaltet und das Scrollen sperrt; mit 20 offenen Modalen auf einer Seite wäre sie komplett tot (Liste der Vorschau, Tabellen, Links).
  // Das Beispiel zeigt deshalb dasselbe Markup ohne Verhalten (kein aria-modal, kein Fokusfang). Die Story „Standard“ und die Stories
  // der Werkzeugleiste verwenden weiter die echte Komponente; tests/modal-docs.test.ts hält beide Markups gleich.
  const uid = $props.id();
  const titleId = `hoops-modal-demo-${uid}`;
  const titleTag = $derived(resolveHeading(titleAs, 2));

  // In der Doku ist das Modal immer offen: Schließen (Escape, Hintergrund, Button) öffnet es sofort wieder,
  // sonst würde ein Escape alle Vorschauen der Seite schließen.
  let open = $state(true);
</script>

{#snippet icon()}
  {#if severity === 'danger'}
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5"/><path d="M5.2 10.8l5.6-5.6"/></svg>
  {:else if severity === 'warn'}
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M8 1.5L15 14H1z"/><path d="M8 6v3M8 11.5v.05"/></svg>
  {:else if severity === 'ok'}
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 8.2l3.5 3.5L13 5"/></svg>
  {:else}
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5"/><path d="M8 7v4M8 4.5v.05"/></svg>
  {/if}
{/snippet}

{#if inline}
  <div>
    <div class="hoops-backdrop" role="presentation"></div>
    <div class="hoops-modal-wrap" role="dialog" aria-labelledby={titleId}>
      <div class="hoops-modal hoops-modal--{size}">
        <div class="hoops-m-head">
          {#if severity !== 'default'}
            <div class="hoops-m-head-icon hoops-m-head-icon--{severity}">{@render icon()}</div>
          {/if}
          <div class="hoops-m-head-text">
            <svelte:element this={titleTag} class="hoops-m-title" id={titleId}>{title}</svelte:element>
            {#if subtitle}<div class="hoops-m-subtitle">{subtitle}</div>{/if}
          </div>
          {#if closable}
            <button type="button" class="hoops-m-close" aria-label={t('modal.close')}>
              <svg width="16" height="16" aria-hidden="true" focusable="false" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
            </button>
          {/if}
        </div>
        <div class="hoops-m-body">{body}</div>
        {#if withFooter}
          <div class="hoops-m-footer">
            <Button variant="secondary">{cancelLabel}</Button>
            <Button variant={confirmVariant}>{confirmLabel}</Button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{:else if withFooter}
  <Modal bind:open {title} {titleAs} {subtitle} {severity} {size} {closable} onclose={() => (open = true)}>
    {body}
    {#snippet footer()}
      <Button variant="secondary">{cancelLabel}</Button>
      <Button variant={confirmVariant}>{confirmLabel}</Button>
    {/snippet}
  </Modal>
{:else}
  <Modal bind:open {title} {titleAs} {subtitle} {severity} {size} {closable} onclose={() => (open = true)}>
    {body}
  </Modal>
{/if}
