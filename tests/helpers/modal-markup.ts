// Markup und jsdom-Ersatz für die Modal-Tests. jsdom kennt HTMLDialogElement, aber weder showModal() noch close():
// `polyfillDialog()` baut beides nach (open-Attribut, close-Ereignis als eigene Aufgabe wie im Browser).
export const dialogMarkup = (id = 'freigabe', extra = '') => `
<button type="button" id="${id}-auf" data-hoops-modal-open="${id}">Spielbericht freigeben</button>
<dialog class="hoops-modal-dialog" id="${id}" data-hoops="modal" ${extra}>
  <div class="hoops-modal hoops-modal--sm">
    <div class="hoops-m-head">
      <div class="hoops-m-head-text"><h2 class="hoops-m-title" id="${id}-titel">Spielbericht freigeben?</h2></div>
      <button type="button" class="hoops-m-close" aria-label="Schließen">x</button>
    </div>
    <div class="hoops-m-body"><p>Nach Freigabe ist eine Korrektur nur noch über den Verband möglich.</p><a href="/regeln" id="${id}-link">Regeln</a></div>
    <div class="hoops-m-footer">
      <button type="button" class="hoops-btn" id="${id}-abbr" data-hoops-modal-close>Abbrechen</button>
      <button type="button" class="hoops-btn" id="${id}-ok" data-hoops-modal-focus>Freigeben</button>
    </div>
  </div>
</dialog>`;

export const divMarkup = (id = 'verwerfen', extra = '') => `
<main id="${id}-seite"><button type="button" id="${id}-auf" data-hoops-modal-open="${id}">Verwerfen</button><a href="/x" id="${id}-seitenlink">Seite</a></main>
<div id="${id}" class="hoops-modal-root" data-hoops="modal" hidden ${extra}>
  <div class="hoops-backdrop"></div>
  <div class="hoops-modal-wrap">
    <div class="hoops-modal hoops-modal--sm">
      <div class="hoops-m-head"><h2 class="hoops-m-title">Spielbericht verwerfen?</h2><button type="button" class="hoops-m-close" aria-label="Schließen">x</button></div>
      <div class="hoops-m-body"><p>Das lässt sich nicht rückgängig machen.</p></div>
      <div class="hoops-m-footer"><button type="button" class="hoops-btn" id="${id}-abbr" data-hoops-modal-close>Behalten</button><button type="button" class="hoops-btn" id="${id}-ok">Verwerfen</button></div>
    </div>
  </div>
</div>`;

let installed = false;
export function polyfillDialog() {
  const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  proto.showModal = function (this: HTMLDialogElement) {
    if (this.hasAttribute('open')) throw new DOMException('already open', 'InvalidStateError');
    this.setAttribute('open', '');
    this.setAttribute('data-test-modal', '');
  };
  proto.close = function (this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.removeAttribute('data-test-modal');
    setTimeout(() => this.dispatchEvent(new Event('close')), 0);
  };
  installed = true;
}
export function removeDialogPolyfill() {
  if (!installed) return;
  const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  delete proto.showModal;
  delete proto.close;
  installed = false;
}
export const tick = () => new Promise((resolve) => setTimeout(resolve, 5));
