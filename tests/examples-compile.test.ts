// @vitest-environment node
// Die Beispielseiten der Doku (Svelte) übersetzen ohne Fehler: ein Syntaxfehler (z. B. TypeScript ohne lang="ts") bricht sonst erst den Storybook-Build.
import { compile } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';
import { read } from './helpers/docs-code';

describe('Beispielseiten übersetzen', () => {
  it.each([
    'stories/components/TabsExamples.svelte',
    'stories/components/ModalExamples.svelte',
    'stories/Foundation/VanillaDemo.svelte',
    'stories/components/PageNavExamples.svelte',
  ])('%s', (path) => {
    const source = read(path);
    expect(() => compile(source, { filename: path, generate: 'client' })).not.toThrow();
    if (/\blet\s+\w+\s*:\s|\(\w+\s*:\s*\w+/.test(source.slice(0, source.indexOf('</script>')))) expect(source.slice(0, 40)).toContain('lang="ts"');
  });
});
