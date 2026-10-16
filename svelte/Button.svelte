<script lang="ts">
  /**
   * HoopsFoundry UI Button · Svelte 5 example
   * --------------------------------------------------------------
   * Wraps the design-system button variants in a single component.
   * Nutzt ausschließlich die Klassen aus css/components.css (kein eigener Scoped-Style);
   * tokens.css und components.css müssen im App-Root importiert sein.
   *
   * Variants:  primary · amber · secondary · danger · ghost
   * Sizes:     sm · md · lg
   * Touch:     opt-in via `touch` (auto-applies 64px hallen-target)
   */
  import type { Snippet } from 'svelte';

  type Variant = 'primary' | 'amber' | 'secondary' | 'danger' | 'ghost';
  type Size = 'sm' | 'md' | 'lg';

  let {
    variant = 'primary',
    size = 'md',
    touch = false,
    disabled = false,
    type = 'button',
    children,
    onclick,
  }: {
    variant?: Variant;
    size?: Size;
    touch?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    children: Snippet;
    onclick?: (e: MouseEvent) => void;
  } = $props();
</script>

<button
  {type}
  {disabled}
  class="hoops-btn hoops-btn--{variant} hoops-btn--{size}"
  class:is-touch={touch}
  {onclick}
>
  {@render children()}
</button>
