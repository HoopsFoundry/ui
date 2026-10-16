// Vergleich der Fassungen (Tabelle „Verhalten je Fassung“ in stories/Modal.mdx): Fokus beim Öffnen und Schließen, Seite dahinter, Scroll-Sperre.
// Alle drei Fassungen verhalten sich gleich (Welle 1, Punkte 1.1 und 1.2 im Lückenplan); Svelte nutzt initModal aus js/modal.js.
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { flushSync, mount, unmount } from 'svelte';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button, Modal as ReactModal } from '../react';
import SvelteHost from './helpers/ModalFocusHost.svelte';
import { initModal } from '../js/modal.js';
import { divMarkup } from './helpers/modal-markup';
import { mountHtml } from './helpers/tabs-markup';

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  document.body.removeAttribute('style');
  document.documentElement.removeAttribute('style');
});

function ReactPage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" id="auf" onClick={() => setOpen(true)}>Auf</button>
      <main id="seite"><a href="#x" id="seitenlink">Seite</a></main>
      <ReactModal open={open} onOpenChange={setOpen} title="Titel" footer={<Button onClick={() => setOpen(false)}>Zu</Button>}>Inhalt</ReactModal>
    </>
  );
}

describe('React (Radix Dialog)', () => {
  it('Fokus ins Modal, Seite abgeschaltet, Scrollen gesperrt; beim Schließen kehrt der Fokus zum Auslöser zurück', async () => {
    render(<ReactPage />);
    const trigger = document.getElementById('auf')!;
    trigger.focus();
    await act(async () => { fireEvent.click(trigger); });
    expect(document.querySelector('[role="dialog"]')!.contains(document.activeElement)).toBe(true);
    expect(document.getElementById('seite')!.closest('[aria-hidden="true"]') ?? document.getElementById('seite')!.getAttribute('aria-hidden')).toBeTruthy();
    expect(document.body.hasAttribute('data-scroll-locked')).toBe(true);
    await act(async () => { fireEvent.keyDown(document.activeElement!, { key: 'Escape' }); });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    // Radix gibt den Fokus erst im nächsten Zeitschlitz zurück (setTimeout 0 beim Abbau der Fokusfalle)
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('Fokusrückgabe auch beim Schließen über die Fußzeile (open per Zustand)', async () => {
    render(<ReactPage />);
    const trigger = document.getElementById('auf')!;
    trigger.focus();
    await act(async () => { fireEvent.click(trigger); });
    await act(async () => { fireEvent.click(document.querySelector<HTMLElement>('.hoops-m-footer button')!); });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});

describe('Svelte (initModal aus js/modal.js)', () => {
  const setup = (props: { dismissOnBackdrop?: boolean } = {}) => {
    const target = document.createElement('div');
    document.body.append(target);
    const instance = mount(SvelteHost, { target, props });
    flushSync();
    const trigger = document.getElementById('auf')!;
    trigger.focus();
    fireEvent.click(trigger);
    flushSync();
    return { instance, trigger };
  };
  it('Fokus ins Modal, Seite inert, Scrollen gesperrt; beim Schließen zurück an den Auslöser', () => {
    const { instance, trigger } = setup();
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.getElementById('seite')!.hasAttribute('inert')).toBe(true);
    expect(trigger.hasAttribute('inert')).toBe(true);
    expect(document.documentElement.style.overflow).toBe('hidden');
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    flushSync();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.getElementById('seite')!.hasAttribute('inert')).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
    unmount(instance);
  });
  it('Tab bleibt im Modal (Falle) und der Schließen-Knopf schließt, das Symbol ist aria-hidden', () => {
    const { instance, trigger } = setup();
    const dialog = document.querySelector('[role="dialog"]')!;
    const close = dialog.querySelector<HTMLElement>('.hoops-m-close')!;
    expect(close.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    close.focus();
    fireEvent.keyDown(close, { key: 'Tab' });
    expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.click(close);
    flushSync();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    unmount(instance);
  });
  it('ein Klick auf den Hintergrund schließt nur mit dismissOnBackdrop (Standard aus)', () => {
    const first = setup();
    const click = () => { const b = document.querySelector<HTMLElement>('.hoops-backdrop')!; fireEvent.mouseDown(b); fireEvent.click(b); flushSync(); };
    click();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    unmount(first.instance);
    document.body.replaceChildren();
    const second = setup({ dismissOnBackdrop: true });
    click();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    unmount(second.instance);
  });
  it('wird das Modal mit der Komponente abgeräumt, bleibt weder inert noch eine Scroll-Sperre zurück', () => {
    const { instance } = setup();
    unmount(instance);
    expect(document.querySelector('[inert]')).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');
  });
});

describe('Vanilla (initModal)', () => {
  it('Fokus ins Modal, Seite inert, Scrollen gesperrt; beim Schließen zurück an den Auslöser', () => {
    mountHtml(divMarkup());
    const handle = initModal(document.getElementById('verwerfen')!);
    const trigger = document.getElementById('verwerfen-auf')!;
    trigger.focus();
    trigger.click();
    expect(document.getElementById('verwerfen')!.contains(document.activeElement)).toBe(true);
    expect(document.getElementById('verwerfen-seite')!.hasAttribute('inert')).toBe(true);
    expect(document.documentElement.style.overflow).toBe('hidden');
    handle.close();
    expect(document.activeElement).toBe(trigger);
    expect(document.documentElement.style.overflow).toBe('');
    handle.destroy();
  });
});
