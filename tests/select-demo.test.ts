// @vitest-environment jsdom
// Die Select-Stories zeigten „e.subscribe is not a function“: in SelectDemo.svelte hieß eine Prop `state`, und `$state(...)` wurde
// dadurch als Store-Zugriff auf diese Prop übersetzt. Die Demo und die Beispielseite müssen sich ohne Fehler einhängen lassen.
import { flushSync, mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';
import SelectDemo from '../stories/components/SelectDemo.svelte';
import SelectExamples from '../stories/components/SelectExamples.svelte';

describe('Select-Stories', () => {
  it('SelectDemo hängt sich ohne Fehler ein, state und Wert wirken', () => {
    const target = document.createElement('div');
    document.body.append(target);
    const instance = mount(SelectDemo, { target, props: { state: 'error', help: 'Bitte wählen.' } });
    flushSync();
    expect(target.querySelector('select')!.value).toBe('round-robin');
    expect(target.querySelector('.hoops-field')!.classList.contains('is-error')).toBe(true);
    unmount(instance);
    target.remove();
  });
  it.each(['varianten', 'zustaende', 'do-label', 'dont-label', 'do-fehler', 'dont-fehler', 'do-dichte', 'dont-dichte', 'do-gesperrt', 'dont-gesperrt'])('SelectExamples „%s“ hängt sich ohne Fehler ein', (example) => {
    const target = document.createElement('div');
    document.body.append(target);
    const instance = mount(SelectExamples, { target, props: { example } });
    flushSync();
    expect(target.querySelector('select')).not.toBeNull();
    unmount(instance);
    target.remove();
  });
});
