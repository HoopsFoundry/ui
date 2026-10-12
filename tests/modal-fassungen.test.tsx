// Vergleich der Fassungen (Tabelle „Verhalten je Fassung“ in stories/Modal.mdx): Fokus beim Öffnen und Schließen, Seite dahinter, Scroll-Sperre.
// Svelte und React haben bekannte Lücken; die Vanilla-Fassung schließt sie. Die Komponenten werden hier nicht geändert.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
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
  it('Fokus ins Modal, Seite abgeschaltet, Scrollen gesperrt; beim Schließen fällt der Fokus nicht an den Auslöser zurück', async () => {
    render(<ReactPage />);
    const trigger = document.getElementById('auf')!;
    trigger.focus();
    await act(async () => { fireEvent.click(trigger); });
    expect(document.querySelector('[role="dialog"]')!.contains(document.activeElement)).toBe(true);
    expect(document.getElementById('seite')!.closest('[aria-hidden="true"]') ?? document.getElementById('seite')!.getAttribute('aria-hidden')).toBeTruthy();
    expect(document.body.hasAttribute('data-scroll-locked')).toBe(true);
    await act(async () => { fireEvent.keyDown(document.activeElement!, { key: 'Escape' }); });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).not.toBe(trigger);
  });
});

describe('Svelte', () => {
  it('der Fokus bleibt auf dem Auslöser, die Seite bleibt bedienbar, das Scrollen ist nicht gesperrt, nach dem Schließen bleibt der Fokus unberührt', () => {
    const target = document.createElement('div');
    document.body.append(target);
    const instance = mount(SvelteHost, { target });
    flushSync();
    const trigger = document.getElementById('auf')!;
    trigger.focus();
    fireEvent.click(trigger);
    flushSync();
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog).not.toBeNull();
    expect(dialog.contains(document.activeElement)).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(document.getElementById('seite')!.hasAttribute('inert')).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.hasAttribute('data-scroll-locked')).toBe(false);
    unmount(instance);
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
