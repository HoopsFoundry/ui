// @vitest-environment jsdom
// Die Story „AppNav Zustände“ warf nach I4 „e(...) is not a function“: AppNavExamples.svelte importierte `t` und nutzte `t` zugleich als
// Schleifenvariable ({#each tones as t}), die den Import verdeckte. Gefunden mit scripts/check-docs-axe.mjs (Story-Fehler, axe-Kontrast am Stapeltext).
// Jedes Beispiel muss sich ohne Fehler einhängen lassen.
import { flushSync, mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';
import AppNavExamples from '../stories/components/AppNavExamples.svelte';

// @ts-expect-error Vite liefert den Quelltext als Zeichenkette
import stories from '../stories/AppNav.stories.ts?raw';
const examples = [...new Set([...stories.matchAll(/example\('([a-z-]+)'\)/g)].map((m) => m[1]))];

describe('AppNav-Beispiele', () => {
  it('die Liste der Beispiele ist nicht leer und enthält die Zustandsmatrix', () => {
    expect(examples).toContain('zustaende');
  });
  it.each(examples)('„%s“ hängt sich ohne Fehler ein', (example) => {
    const target = document.createElement('div');
    document.body.append(target);
    const instance = mount(AppNavExamples, { target, props: { example } });
    flushSync();
    expect(target.textContent!.trim().length).toBeGreaterThan(0);
    unmount(instance);
    target.remove();
  });
  it('die Zustandsmatrix zeigt den Menü-Text aus dem Katalog', () => {
    const target = document.createElement('div');
    document.body.append(target);
    const instance = mount(AppNavExamples, { target, props: { example: 'zustaende' } });
    flushSync();
    expect([...target.querySelectorAll('.hoops-appnav-toggle span')].map((s) => s.textContent)).toContain('Menü');
    unmount(instance);
    target.remove();
  });
});
