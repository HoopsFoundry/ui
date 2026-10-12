// Seitennavigation und Nach-oben-Knopf: Aussagen aus tests/helpers/pagenav-rules.ts am echten Quelltext.
import { describe, expect, it } from 'vitest';
import * as backtop from '../js/backtop.js';
import * as pagenav from '../js/pagenav.js';
import { read } from './helpers/mutation';
import { backtopLogicRules, pagenavCssRules, pagenavLogicRules, pagenavSourceRules } from './helpers/pagenav-rules';

describe('Seitennavigation: Aussagen', () => {
  it('Verhalten', async () => {
    expect(Object.entries(await pagenavLogicRules(pagenav as never)).filter(([, ok]) => !ok)).toEqual([]);
  });
});
describe('Nach-oben-Knopf: Aussagen', () => {
  it('Verhalten', async () => {
    expect(Object.entries(await backtopLogicRules(backtop as never)).filter(([, ok]) => !ok)).toEqual([]);
  });
});
describe('CSS und Quelltext: Aussagen', () => {
  it.each(Object.entries(pagenavCssRules(read('css/components.css'))))('CSS: %s', (_n, ok) => expect(ok).toBe(true));
  it.each(Object.entries(pagenavSourceRules({ pagenav: read('js/pagenav.js'), backtop: read('js/backtop.js') })))('%s', (_n, ok) => expect(ok).toBe(true));
});
