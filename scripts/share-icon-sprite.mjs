// Einmaliges Skript: zieht Namen + Sprite aus svelte/Icon.svelte nach icons/sprite.ts und lässt
// Icon.svelte dieselbe Quelle importieren (damit Svelte und React einen Sprite teilen).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const svelteFile = 'svelte/Icon.svelte';
const src = readFileSync(svelteFile, 'utf8');

const names = src.match(/export const ICON_NAMES = (\[[\s\S]*?\]) as const;/);
const sprite = src.match(/const SPRITE = `([\s\S]*?)`;/);
const header = src.match(/<script lang="ts" module>\s*(\/\*\*[\s\S]*?\*\/)/);
if (!names || !sprite || !header) {
  throw new Error('svelte/Icon.svelte hat nicht mehr die erwartete Struktur — Skript anpassen.');
}

mkdirSync('icons', { recursive: true });
writeFileSync(
  'icons/sprite.ts',
  `/**
 * HoopsFoundry UI Icon-Sprite · gemeinsame Quelle für svelte/Icon.svelte und react/Icon.tsx.
 * Namen und Symbole stammen 1:1 aus der Icons-Spec (HoopsFoundry UI - Icons.html).
 */
export const ICON_NAMES = ${names[1]} as const;

export type IconName = typeof ICON_NAMES[number];

export const SPRITE_ID = 'hoops-icon-sprite';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Der Sprite als SVG-Quelltext (ohne Namespace, siehe parseSprite). */
export const SPRITE = \`${sprite[1]}\`;

/** Parst den Sprite zu einem SVG-Element (kein HTML-String-Einfügen, kaputtes XML fällt im Test auf). */
export function parseSprite(): SVGElement {
  const xml = SPRITE.replace('<svg ', \`<svg xmlns="\${SVG_NS}" \`);
  const doc = new DOMParser().parseFromString(xml, 'image/svg+xml');
  return doc.documentElement as unknown as SVGElement;
}
`,
);

const moduleEnd = src.indexOf('</script>') + '</script>'.length;
const rest = src.slice(moduleEnd);

writeFileSync(
  svelteFile,
  `<script lang="ts" module>
  ${header[1]}

  import { ICON_NAMES, SPRITE_ID, parseSprite, type IconName } from '../icons/sprite';

  export { ICON_NAMES };
  export type { IconName };

  // ── Sprite wird beim ersten Gebrauch einmal ins Dokument eingefügt ──
  export function ensureSprite() {
    if (typeof document === 'undefined' || document.getElementById(SPRITE_ID)) return;
    const wrap = document.createElement('div');
    wrap.id = SPRITE_ID;
    wrap.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.appendChild(document.importNode(parseSprite(), true));
    document.body.insertBefore(wrap, document.body.firstChild);
  }
</script>${rest}`,
);
console.log(`icons/sprite.ts geschrieben, ${svelteFile} umgestellt.`);
