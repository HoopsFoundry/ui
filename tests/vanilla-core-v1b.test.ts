// initAll mit tabs und modal: mehrere Elemente je Baustein, Optionen je Element, only, destroy, Mehrfachaufruf.
import { describe, expect, it } from 'vitest';
import * as core from '../js/vanilla-core.js';
import { tabsModalCoreRules } from './helpers/tabs-modal-core-rules';
import { polyfillDialog, removeDialogPolyfill } from './helpers/modal-markup';

polyfillDialog(); // die Regeln laufen beim Einsammeln
const rules = tabsModalCoreRules(core as never);
removeDialogPolyfill();

describe('initAll mit tabs und modal', () => {
  for (const [name, ok] of Object.entries(rules)) {
    it(name, () => expect(ok).toBe(true));
  }
});
