const CLOSE_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8"/></svg>`;

/** Weg 1 (empfohlen): natives `<dialog>`. Auslöser und Dialog; die Doku zeigt das Markup und führt es auch aus. */
export const dialogMarkup = `<button type="button" class="hoops-btn hoops-btn--primary hoops-btn--md" data-hoops-modal-open="freigabe">Spielbericht freigeben</button>

<dialog class="hoops-modal-dialog" id="freigabe" data-hoops="modal" aria-labelledby="freigabe-titel">
  <div class="hoops-modal">
    <div class="hoops-m-head">
      <div class="hoops-m-head-text">
        <h2 class="hoops-m-title" id="freigabe-titel">Spielbericht freigeben?</h2>
        <div class="hoops-m-subtitle">BBL · 17. Spieltag · Heim 87 : 74</div>
      </div>
      <button type="button" class="hoops-m-close" aria-label="Schließen">
        ${CLOSE_ICON}
      </button>
    </div>
    <div class="hoops-m-body">Nach Freigabe ist eine Korrektur nur noch über den Verband möglich.</div>
    <div class="hoops-m-footer">
      <button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--md" data-hoops-modal-close>Abbrechen</button>
      <button type="button" class="hoops-btn hoops-btn--primary hoops-btn--md" data-hoops-modal-close>Freigeben</button>
    </div>
  </div>
</dialog>`;

/** Weg 2: Markup ohne `<dialog>` (Hintergrund und Fläche in einem Element mit `hidden`); Rolle, `aria-modal` und inerte Seite setzt das Skript. */
export const divMarkup = `<button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--md" data-hoops-modal-open="verwerfen">Spielbericht verwerfen</button>

<div id="verwerfen" data-hoops="modal" hidden>
  <div class="hoops-backdrop"></div>
  <div class="hoops-modal-wrap">
    <div class="hoops-modal hoops-modal--sm" role="dialog" aria-modal="true" aria-labelledby="verwerfen-titel">
      <div class="hoops-m-head">
        <!-- Symbol nur bei Schweregrad: hoops-m-head-icon--danger | --warn | --ok | --info -->
        <div class="hoops-m-head-icon hoops-m-head-icon--danger">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.5"/><path d="M5.2 10.8l5.6-5.6"/></svg>
        </div>
        <div class="hoops-m-head-text">
          <h2 class="hoops-m-title" id="verwerfen-titel">Spielbericht verwerfen?</h2>
          <div class="hoops-m-subtitle">Nicht wiederherstellbar</div>
        </div>
        <button type="button" class="hoops-m-close" aria-label="Schließen">
          ${CLOSE_ICON}
        </button>
      </div>
      <div class="hoops-m-body">Alle erfassten Aktionen werden gelöscht. Das lässt sich nicht rückgängig machen.</div>
      <div class="hoops-m-footer">
        <!-- Der Fokus startet auf der sicheren Wahl, nicht auf der zerstörerischen -->
        <button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--md" data-hoops-modal-close data-hoops-modal-focus>Behalten</button>
        <button type="button" class="hoops-btn hoops-btn--danger hoops-btn--md" data-hoops-modal-close>Verwerfen</button>
      </div>
    </div>
  </div>
</div>`;

export const vanilla = `<!-- Einmal im App-Root einbinden (oder hoops.css aus dem Vanilla-Bündel) -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />
<!-- optional: <link rel="stylesheet" href="fonts/fonts.css" /> -->

<!-- Weg 1, empfohlen: natives <dialog class="hoops-modal-dialog">. Der Browser stellt es in die oberste Ebene, schaltet die Seite
     dahinter ab und zeichnet den Hintergrund (::backdrop). Größen: hoops-modal--sm | (ohne = md) | --wide | --xwide.
     Auslöser ist jedes Element mit data-hoops-modal-open="<id des Dialogs>", Schließen jedes Element im Modal mit data-hoops-modal-close
     (und der Knopf .hoops-m-close). Der Titel (.hoops-m-title) benennt den Dialog; der Tag ist h2 und darunter h3 (siehe Überschriftenebene). -->
${dialogMarkup}

<!-- Weg 2: Hintergrund und Fläche in einem Element mit hidden (kein <dialog>). Das Skript ergänzt role="dialog" und aria-modal
     (falls sie fehlen), macht die Geschwister inert und schaltet hidden um. -->
${divMarkup}

<script type="module">
  import { initAll } from '@hoopsfoundry/ui/vanilla-core.js';

  // Startet jedes Element mit data-hoops="modal" (geschlossen). Optionen je Element in data-hoops-options='{"dismissOnBackdrop":true}'
  const dss = initAll(document);
</script>

<!-- Oder einzeln, mit Optionen und aus dem Code -->
<script type="module">
  import { initModal, openModal, closeModal } from '@hoopsfoundry/ui/modal.js';

  const dialog = initModal(document.getElementById('freigabe'), {
    dismissOnBackdrop: false, // Standard: ein Klick daneben schließt nicht (am Kampfgericht verwirft ein Fehltipp sonst die Eingabe)
    closable: true,           // false: Escape und Hintergrund schließen nicht; data-hoops-modal-close schließt immer
    initialFocus: '[data-hoops-modal-focus]', // Anfangsfokus; sonst die Fläche (.hoops-modal, tabindex -1)
    // returnFocus: andereTaste,            // Standard: der Auslöser, sonst das zuvor fokussierte Element
    onClose: ({ reason }) => console.log('geschlossen:', reason), // escape | backdrop | close-button | native | api
  });

  // Ereignisse blubbern bis zum Dokument
  document.addEventListener('hoops:modalopen', (e) => console.log('offen', e.detail.trigger));
  document.addEventListener('hoops:modalclose', (e) => console.log('zu', e.detail.reason));

  dialog.open();                                  // oder openModal(element), closeModal(element)
  dialog.close();
  // dialog.destroy();                            // Markup wie vorher, Fokus und Scrollen frei
</script>`;

export const svelte = `<script>
  import Modal from '@hoopsfoundry/ui/svelte/Modal';
  import Button from '@hoopsfoundry/ui/svelte/Button';

  let open = $state(false);
  let verwerfen = $state(false);
</script>

<Button onclick={() => (open = true)}>Spielbericht freigeben</Button>

<!-- Escape schließt, solange closable gilt (Standard). Ein Klick auf den Hintergrund schließt nicht; mit dismissOnBackdrop schon. -->
<Modal bind:open title="Spielbericht freigeben?" subtitle="BBL · 17. Spieltag" onclose={() => console.log('geschlossen')}>
  Nach Freigabe ist eine Korrektur nur noch über den Verband möglich.
  {#snippet footer()}
    <Button variant="secondary" onclick={() => (open = false)}>Abbrechen</Button>
    <Button onclick={() => (open = false)}>Freigeben</Button>
  {/snippet}
</Modal>

<!-- Zerstörerische Aktion: Schweregrad danger, Button danger, kleine Breite -->
<Modal bind:open={verwerfen} title="Spielbericht verwerfen?" subtitle="Nicht wiederherstellbar" severity="danger" size="sm">
  Alle erfassten Aktionen werden gelöscht.
  {#snippet footer()}
    <Button variant="secondary" onclick={() => (verwerfen = false)}>Behalten</Button>
    <Button variant="danger" onclick={() => (verwerfen = false)}>Verwerfen</Button>
  {/snippet}
</Modal>`;

export const react = `import { useState } from 'react';
import { Button, Modal } from '@hoopsfoundry/ui/react';

export function Freigabe() {
  const [open, setOpen] = useState(false);
  const [verwerfen, setVerwerfen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Spielbericht freigeben</Button>

      {/* Radix Dialog: Fokus ins Modal, Fokusfalle, Escape. Den Fokus nach dem Schließen setzt du selbst zurück. */}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Spielbericht freigeben?"
        subtitle="BBL · 17. Spieltag"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={() => setOpen(false)}>Freigeben</Button>
          </>
        }
      >
        Nach Freigabe ist eine Korrektur nur noch über den Verband möglich.
      </Modal>

      {/* Zerstörerische Aktion: Der Dialog endet nur über einen Button (ein Klick daneben schließt nicht, Standard) */}
      <Modal
        open={verwerfen}
        onOpenChange={setVerwerfen}
        title="Spielbericht verwerfen?"
        subtitle="Nicht wiederherstellbar"
        severity="danger"
        size="sm"
        footer={<Button variant="danger" onClick={() => setVerwerfen(false)}>Verwerfen</Button>}
      >
        Alle erfassten Aktionen werden gelöscht.
      </Modal>
    </>
  );
}`;
