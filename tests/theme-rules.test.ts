// Dunkelmodus-Umschalter: Aussagen aus tests/helpers/theme-rules.ts am echten Quelltext.
import { describe, expect, it } from 'vitest';
import * as theme from '../js/theme.js';
import { read } from './helpers/mutation';
import { themeCssRules, themeLogicRules, themeSourceRules } from './helpers/theme-rules';

describe('Theme: Aussagen', () => {
  it('Verhalten', async () => {
    expect(Object.entries(await themeLogicRules(theme as never)).filter(([, ok]) => !ok)).toEqual([]);
  });
  it.each(Object.entries(themeCssRules(read('css/components.css'))))('CSS: %s', (_n, ok) => expect(ok).toBe(true));
  it.each(Object.entries(themeSourceRules(read('js/theme.js'))))('%s', (_n, ok) => expect(ok).toBe(true));
});
