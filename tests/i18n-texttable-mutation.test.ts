// js/i18n/text-table.js: Zuweisung, undefined und delete nehmen eine Überschreibung zurück; Mutation muss die Regel kippen.
import { describe, expect, it } from 'vitest';
import { loadModule, mutate, read } from './helpers/mutation';

const source = read('js/i18n/text-table.js');
type Mod = { textTable: (keys: Record<string, string>) => { table: Record<string, string>; lookup: (n: string, o?: object) => string } };
const load = async (text: string) => (await loadModule(text, 'js/i18n')) as Mod;
const rule = (m: Mod) => {
  const { table } = m.textTable({ a: 'modal.close' });
  const catalog = table.a;
  table.a = 'X';
  delete table.a;
  return table.a === catalog && catalog !== 'X' && catalog !== undefined;
};
describe('textTable', () => {
  it('delete nimmt die Überschreibung zurück', async () => expect(rule(await load(source))).toBe(true));
  it('Mutation: delete entfernt die Zugriffsfunktion', async () => {
    expect(rule(await load(mutate(source, 'own.delete(name);\n        return true;', 'return Reflect.deleteProperty(target, name);')))).toBe(false);
  });
});
