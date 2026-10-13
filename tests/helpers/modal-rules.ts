// Regeln für das Modal (js/modal.js) als prüfbare Aussagen: tests/modal-rules.test.ts prüft sie am echten Quelltext, tests/vanilla-mutation-v1b.test.ts
// verfälscht den Quelltext und prüft, dass jede Aussage kippt. Läuft unter jsdom.
import { trapErrors, type Rules } from './mutation';
import { dialogMarkup, divMarkup, polyfillDialog, removeDialogPolyfill } from './modal-markup';

type Modal = {
  initModal: (el: Element, o?: Record<string, unknown>) => { destroy(): void; open(t?: Element): void; close(r?: string): void; isOpen(): boolean };
};

export function modalLogicRules(mod: Modal): Rules {
  const out: Rules = {};
  const el = (id: string) => document.getElementById(id)!;
  const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
  const click = (target: Element) => target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  const down = (target: Element) => target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  const rule = (name: string, fn: (h: ReturnType<Modal['initModal']>) => unknown, html = divMarkup(), options: Record<string, unknown> = {}, id = 'verwerfen', native = true) => {
    if (native) polyfillDialog();
    else removeDialogPolyfill();
    document.body.replaceChildren(document.createRange().createContextualFragment(html));
    let handle: ReturnType<Modal['initModal']> | undefined;
    const trap = trapErrors();
    try {
      handle = mod.initModal(el(id), options);
      out[name] = fn(handle) === true;
    } catch {
      out[name] = false;
    } finally {
      try {
        handle?.destroy();
      } catch {
        // verfälschte Quelle
      }
      if (trap.stop().length) out[name] = false; // eine Ausnahme im Listener der (verfälschten) Quelle verletzt die Regel
      document.body.replaceChildren();
      document.documentElement.removeAttribute('style');
      removeDialogPolyfill();
    }
  };
  const modalEl = () => el('verwerfen').querySelector('.dss-modal') as HTMLElement;

  rule('Modal: Öffnen holt den Fokus auf die Fläche und gibt ihn beim Schließen an den Auslöser zurück', () => {
    el('verwerfen-auf').focus();
    click(el('verwerfen-auf'));
    const inside = document.activeElement === modalEl();
    key(document.activeElement!, 'Escape');
    return inside && document.activeElement === el('verwerfen-auf');
  });
  rule('Modal: data-dss-modal-focus bekommt den Fokus', () => {
    click(el('verwerfen-auf'));
    return document.activeElement === el('verwerfen-ok');
  }, divMarkup().replace('id="verwerfen-ok"', 'id="verwerfen-ok" data-dss-modal-focus'));
  rule('Modal: Escape schließt', () => {
    click(el('verwerfen-auf'));
    key(document.activeElement!, 'Escape');
    return el('verwerfen').hidden;
  });
  rule('Modal: closable false: Escape schließt nicht, der Schließen-Knopf schon', () => {
    click(el('verwerfen-auf'));
    key(document.activeElement!, 'Escape');
    const open = !el('verwerfen').hidden;
    click(el('verwerfen').querySelector('.dss-m-close')!);
    return open && el('verwerfen').hidden;
  }, divMarkup(), { closable: false });
  rule('Modal: ein Klick auf den Hintergrund schließt standardmäßig nicht', () => {
    click(el('verwerfen-auf'));
    const b = el('verwerfen').querySelector('.dss-backdrop')!;
    down(b);
    click(b);
    return !el('verwerfen').hidden;
  });
  rule('Modal: mit dismissOnBackdrop schließt der Hintergrund, ein Klick im Modal nicht', () => {
    click(el('verwerfen-auf'));
    const body = el('verwerfen').querySelector('.dss-m-body')!;
    down(body);
    click(body);
    const stay = !el('verwerfen').hidden;
    const b = el('verwerfen').querySelector('.dss-backdrop')!;
    down(b);
    click(b);
    return stay && el('verwerfen').hidden;
  }, divMarkup(), { dismissOnBackdrop: true });
  rule('Modal: gedrückt im Modal, losgelassen auf dem Hintergrund schließt nicht', () => {
    click(el('verwerfen-auf'));
    down(el('verwerfen').querySelector('.dss-m-body')!);
    click(el('verwerfen').querySelector('.dss-backdrop')!);
    return !el('verwerfen').hidden;
  }, divMarkup(), { dismissOnBackdrop: true });
  rule('Modal: Tab von der letzten zur ersten Schaltfläche, Umschalt+Tab zurück', () => {
    click(el('verwerfen-auf'));
    const list = [...el('verwerfen').querySelectorAll<HTMLElement>('button')];
    list[2].focus();
    key(list[2], 'Tab');
    const wrapped = document.activeElement === list[0];
    key(list[0], 'Tab', { shiftKey: true });
    return wrapped && document.activeElement === list[2];
  });
  rule('Modal: Tab geht auch in der Mitte über das Modal auf das nächste Element', () => {
    click(el('verwerfen-auf'));
    const list = [...el('verwerfen').querySelectorAll<HTMLElement>('button')];
    list[0].focus();
    key(list[0], 'Tab');
    return document.activeElement === list[1];
  });
  rule('Modal: Tab von der Fläche geht auf das erste Element', () => {
    click(el('verwerfen-auf'));
    const list = [...el('verwerfen').querySelectorAll<HTMLElement>('button')];
    modalEl().focus();
    key(modalEl(), 'Tab');
    return document.activeElement === list[0];
  });
  rule('Modal: Fokus von außen kommt zurück', () => {
    click(el('verwerfen-auf'));
    el('verwerfen-seitenlink').focus();
    return el('verwerfen').contains(document.activeElement);
  });
  rule('Modal: der Hintergrund wird inert und beim Schließen zurückgebaut', () => {
    click(el('verwerfen-auf'));
    const inert = el('verwerfen-seite').hasAttribute('inert') && !el('verwerfen').hasAttribute('inert');
    key(document.activeElement!, 'Escape');
    return inert && !el('verwerfen-seite').hasAttribute('inert');
  });
  rule('Modal: role dialog, aria-modal und aria-labelledby aus dem Titel', () => {
    const d = modalEl();
    const title = el('verwerfen').querySelector('.dss-m-title')!;
    return d.getAttribute('role') === 'dialog' && d.getAttribute('aria-modal') === 'true' && title.id !== '' && d.getAttribute('aria-labelledby') === title.id;
  });
  rule('Modal: startet geschlossen', () => el('verwerfen').hidden, divMarkup().replace(' hidden', ''));
  rule('Modal: die Scroll-Sperre setzt overflow hidden und baut zurück', () => {
    document.documentElement.style.overflow = 'auto';
    click(el('verwerfen-auf'));
    const locked = document.documentElement.style.overflow === 'hidden';
    key(document.activeElement!, 'Escape');
    return locked && document.documentElement.style.overflow === 'auto';
  });
  rule('Modal: zwei offene Modals sperren einmal', () => {
    const second = mod.initModal(el('b'));
    try {
      click(el('verwerfen-auf'));
      second.open();
      second.close();
      const still = document.documentElement.style.overflow === 'hidden';
      key(document.activeElement!, 'Escape');
      return still && document.documentElement.style.overflow === '';
    } finally {
      second.destroy();
    }
  }, divMarkup() + divMarkup('b'));
  rule('Modal: Escape schließt nur das oberste von zwei Modals', () => {
    const second = mod.initModal(el('b'));
    try {
      click(el('verwerfen-auf'));
      second.open();
      key(document.activeElement!, 'Escape');
      return el('b').hidden && !el('verwerfen').hidden;
    } finally {
      second.destroy();
    }
  }, divMarkup() + divMarkup('b'));
  rule('Modal: ein Auslöser öffnet nur das Modal mit seiner id', () => {
    click(el('x'));
    return el('verwerfen').hidden;
  }, divMarkup() + '<button id="x" data-dss-modal-open="gibt-es-nicht">x</button>');
  rule('Modal: Ereignisse mit Grund', () => {
    const log: string[] = [];
    el('verwerfen').addEventListener('dss:modalopen', () => log.push('open'));
    el('verwerfen').addEventListener('dss:modalclose', (e) => log.push((e as CustomEvent).detail.reason));
    click(el('verwerfen-auf'));
    key(document.activeElement!, 'Escape');
    click(el('verwerfen-auf'));
    click(el('verwerfen-abbr'));
    return log.join() === 'open,escape,open,close-button';
  });
  rule('Modal: destroy im offenen Zustand baut alles zurück', (h) => {
    el('verwerfen-auf').focus();
    click(el('verwerfen-auf'));
    h.destroy();
    const d = modalEl();
    return !d.hasAttribute('role') && !d.hasAttribute('aria-modal') && !d.hasAttribute('tabindex') && !d.hasAttribute('aria-labelledby') && el('verwerfen').hidden
      && !el('verwerfen-seite').hasAttribute('inert') && !el('verwerfen').querySelector('.dss-m-title')!.hasAttribute('id') && !document.documentElement.hasAttribute('style') && document.activeElement === el('verwerfen-auf');
  });
  rule('Modal: ein zweiter Aufruf ersetzt den ersten', () => {
    const second = mod.initModal(el('verwerfen'));
    try {
      let n = 0;
      el('verwerfen').addEventListener('dss:modalopen', () => n++);
      click(el('verwerfen-auf'));
      return n === 1;
    } finally {
      second.destroy();
    }
  });
  rule('Modal: natives Dialog nutzt showModal und räumt beim Schließen von außen auf', () => {
    el('freigabe-auf').focus();
    click(el('freigabe-auf'));
    const modalOpen = el('freigabe').hasAttribute('data-test-modal');
    key(document.activeElement!, 'Escape');
    return modalOpen && !el('freigabe').hasAttribute('open') && document.activeElement === el('freigabe-auf');
  }, dialogMarkup(), {}, 'freigabe');
  rule('Modal: natives Dialog: cancel wird abgefangen', () => {
    click(el('freigabe-auf'));
    const cancel = new Event('cancel', { cancelable: true });
    el('freigabe').dispatchEvent(cancel);
    return cancel.defaultPrevented && !el('freigabe').hasAttribute('open');
  }, dialogMarkup(), {}, 'freigabe');
  rule('Modal: natives Dialog: Klick auf das Dialog selbst ist der Hintergrund', () => {
    click(el('freigabe-auf'));
    down(el('freigabe'));
    click(el('freigabe'));
    return !el('freigabe').hasAttribute('open');
  }, dialogMarkup(), { dismissOnBackdrop: true }, 'freigabe');
  rule('Modal: ein Dialog ohne showModal bekommt inert statt Top-Layer', () => {
    click(el('freigabe-auf'));
    return el('freigabe').hasAttribute('open') && el('freigabe-auf').hasAttribute('inert');
  }, dialogMarkup(), {}, 'freigabe', false);
  rule('Modal: open, close, open im selben Tick auf natives Dialog: das späte close-Ereignis ändert nichts', (h) => {
    h.open();
    h.close();
    h.open();
    el('freigabe').dispatchEvent(new Event('close'));
    return h.isOpen() && el('freigabe').hasAttribute('open') && document.documentElement.style.overflow === 'hidden';
  }, dialogMarkup(), {}, 'freigabe');
  rule('Modal: ohne dialog gestapelt: das zweite Modal ist nicht inert, hat den Fokus, das erste ist inert und wird beim Schließen frei', () => {
    const second = mod.initModal(el('b'));
    try {
      click(el('verwerfen-auf'));
      second.open();
      const ok = !el('b').hasAttribute('inert') && el('b').contains(document.activeElement) && el('verwerfen').hasAttribute('inert');
      second.close();
      return ok && !el('verwerfen').hasAttribute('inert') && el('verwerfen').contains(document.activeElement) === true && !el('b').hasAttribute('inert');
    } finally {
      second.destroy();
    }
  }, divMarkup() + divMarkup('b'));
  rule('Modal: ist der Auslöser weg, bekommt main den Fokus', () => {
    click(el('verwerfen-auf'));
    el('verwerfen-auf').remove();
    key(document.activeElement!, 'Escape');
    return document.activeElement === el('verwerfen-seite');
  });
  return out;
}
