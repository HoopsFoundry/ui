// @vitest-environment node
// Lange Code-Stücke im Fließtext brechen nicht um und weiten die Seite über 420 px hinaus (im Browser gemessen: ein 60 Zeichen langer Wert machte
// die Docs-Seite 546 px breit). Darum bleibt jedes Code-Stück im Fließtext der neuen und erweiterten Seiten kurz; lange Werte gehören in Code-Blöcke.
import { describe, expect, it } from 'vitest';
import { read } from './helpers/docs-code';

const MAX = 44;
describe.each(['stories/Stats.mdx', 'stories/PageNav.mdx', 'stories/Foundation/DarkMode.mdx', 'stories/Map.mdx', 'stories/Foundation/Internationalisierung.mdx'])('%s', (file) => {
  it(`jedes Code-Stück im Fließtext hat höchstens ${MAX} Zeichen`, () => {
    const text = read(file).replace(/```[\s\S]*?```/g, '');
    const longest = [...text.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]).filter((c) => c.length > MAX);
    expect(longest).toEqual([]);
  });
});
