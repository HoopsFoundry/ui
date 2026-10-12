// Die Regeln für Tabs und Modal gelten am echten Quelltext (die Mutationstests verfälschen ihn dann und prüfen, dass jede Regel kippt).
import { describe, expect, it } from 'vitest';
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
