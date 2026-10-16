// Markup für die Tabs-Tests: Leiste mit Panels (Register-Beispiel: Alle/Heim/Auswärts) im Aufbau, den die Doku zeigt.
export const tabsMarkup = (extra = '', ids = 'r') => `
<div class="hoops-tabs hoops-tabs--segmented hoops-tabs--md" role="tablist" aria-label="Spiele filtern" data-hoops="tabs" id="${ids}-bar" ${extra}>
  <button type="button" class="hoops-tab is-active" role="tab" id="${ids}-alle" aria-selected="true" aria-controls="${ids}-p-alle" tabindex="0"><span class="hoops-tab-label">Alle</span></button>
  <button type="button" class="hoops-tab" role="tab" id="${ids}-heim" aria-selected="false" aria-controls="${ids}-p-heim" tabindex="-1"><span class="hoops-tab-label">Heim</span></button>
  <button type="button" class="hoops-tab" role="tab" id="${ids}-aus" aria-selected="false" aria-controls="${ids}-p-aus" tabindex="-1" disabled><span class="hoops-tab-label">Gesperrt</span></button>
  <button type="button" class="hoops-tab" role="tab" id="${ids}-ausw" aria-selected="false" aria-controls="${ids}-p-ausw" tabindex="-1"><span class="hoops-tab-label">Auswärts</span></button>
</div>
<div id="${ids}-p-alle" role="tabpanel" aria-labelledby="${ids}-alle"><p>Alle 12 Spiele</p></div>
<div id="${ids}-p-heim" role="tabpanel" aria-labelledby="${ids}-heim" hidden inert><p id="${ids}-in-heim">6 Heimspiele</p></div>
<div id="${ids}-p-aus" role="tabpanel" aria-labelledby="${ids}-aus" hidden inert><p>nie</p></div>
<div id="${ids}-p-ausw" role="tabpanel" aria-labelledby="${ids}-ausw" hidden inert><p>6 Auswärtsspiele</p></div>`;

export const mountHtml = (html: string) => document.body.replaceChildren(document.createRange().createContextualFragment(html));
export const keydown = (el: Element, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return event;
};
