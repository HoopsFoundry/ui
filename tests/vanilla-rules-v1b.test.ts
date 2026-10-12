// Die Regeln für Tabs und Modal gelten am echten Quelltext (die Mutationstests verfälschen ihn dann und prüfen, dass jede Regel kippt).
import { describe, expect, it } from 'vitest';
import { read } from './helpers/mutation';
import * as modal from '../js/modal.js';
import * as tabs from '../js/tabs.js';
import { modalLogicRules } from './helpers/modal-rules';
import { tabsLogicRules } from './helpers/tabs-rules';

describe('Regeln: Tabs', () => {
  for (const [name, ok] of Object.entries(tabsLogicRules(tabs as never))) it(name, () => expect(ok).toBe(true));
});
describe('Regeln: Modal', () => {
  for (const [name, ok] of Object.entries(modalLogicRules(modal as never))) it(name, () => expect(ok).toBe(true));
});

describe('Quelltext: Tabs, Modal, Bündel-Einstieg', () => {
  const files = { tabs: read('js/tabs.js'), modal: read('js/modal.js'), vanilla: read('js/vanilla.js'), core: read('js/vanilla-core.js') };
  it.each(Object.entries(files))('%s: kein innerHTML, outerHTML, insertAdjacentHTML, eval, Inline-Handler', (_name, source) => {
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const needle of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'eval(', 'new Function', 'document.write', "setAttribute('on", 'srcdoc']) expect(code).not.toContain(needle);
  });
  it('Tabs und Modal bauen auf js/lifecycle.js (Muster init/destroy), Tabs nutzen die Hilfen des Accordions', () => {
    expect(files.tabs).toContain("from './lifecycle.js'");
    expect(files.tabs).toContain("from './accordion.js'");
    expect(files.modal).toContain("from './lifecycle.js'");
    expect(files.tabs).toContain('createRegistry');
    expect(files.modal).toContain('createRegistry');
  });
  it('kein Zugriff auf window oder document beim Import (nur in Funktionen)', () => {
    for (const code of [files.tabs, files.modal]) {
      const top = code.split('\n').filter((line) => /^(const|let|var|export const) /.test(line));
      for (const line of top) expect(line, line).not.toMatch(/\b(window|document|localStorage)\b/);
    }
  });
  it('Modal: nur Framework-freie Importe, kein Leaflet', () => {
    expect(files.modal.match(/^import .*$/gm)).toEqual(["import { createCleanups, createRegistry, listen, snapshotAttributes } from './lifecycle.js';"]);
  });
});
