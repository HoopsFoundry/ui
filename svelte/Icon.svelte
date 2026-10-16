<script lang="ts" module>
  /**
   * HoopsFoundry UI Icon · Svelte 5 example
   * --------------------------------------------------------------
   * Central icon renderer for the v0.6 Icons spec — 67 glyphs in 8 groups
   * (gallery: Components/Icon in Storybook).
   *
   *   <Icon name="2p" />
   *   <Icon name="whistle" size={32} class="text-amber-700" />
   *
   * Format: 24×24, stroke 1.75, fill="currentColor" (mostly).
   *
   * The component injects a single hidden SVG sprite into <body> on
   * first mount, then renders <svg><use href="#i-…"/></svg>. The
   * sprite is shared across all Icon instances on the page.
   */

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
</script>

<script lang="ts">
  import { onMount } from 'svelte';

  let {
    name,
    size = 24,
    title = undefined,
    class: klass = '',
  }: {
    name: IconName;
    size?: number | string;
    title?: string;
    class?: string;
  } = $props();

  onMount(ensureSprite);
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  class={`hoops-icon ${klass}`}
  role={title ? 'img' : 'presentation'}
  aria-label={title}
  aria-hidden={title ? undefined : true}
  focusable="false"
>
  {#if title}<title>{title}</title>{/if}
  <use href={`#i-${name}`}></use>
</svg>
