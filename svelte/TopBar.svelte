<script lang="ts">
  /**
   * DSS TopBar · Svelte 5
   * --------------------------------------------------------------
   * App-Shell-Leiste, dunkle Fläche, 56 px. Marke links, optionaler
   * Spielkontext, Aktionen rechts. Nutzt nur Klassen aus css/components.css
   * (`dss-topbar dss-topbar--dark`; die helle `.dss-topbar` bleibt dem
   * Vereinsregister).
   *
   *   default — ruhig, ohne Live-Anzeige
   *   live    — grüner Puls + Spielstand + Uhr (Schiri-/Coach-App)
   *   admin   — Breadcrumb-Kontext (Vereinsregister, Einstellungen)
   */
  import type { Snippet } from 'svelte';

  let {
    brand = 'DSS',
    mark = 'D',
    context = 'default',
    matchLabel = '',
    score = '',
    clock = '',
    user = '',
    userInitials = '',
    leading,
    center,
    actions,
    contained = false,
  }: {
    brand?: string;
    mark?: string;
    context?: 'default' | 'live' | 'admin';
    matchLabel?: string;
    score?: string;
    clock?: string;
    user?: string;
    userInitials?: string;
    leading?: Snippet;
    center?: Snippet;
    actions?: Snippet;
    /** Begrenzt den Inhalt auf `--hoops-shell-max` (Hintergrund bleibt voll breit). */
    contained?: boolean;
  } = $props();
</script>

<div class="dss-topbar dss-topbar--dark" class:dss-topbar--contained={contained}>
  <div class="dss-topbar-brand">
    <span class="dss-topbar-mark" aria-hidden="true">{mark}</span>
    {brand}
  </div>

  {#if leading}{@render leading()}{/if}

  {#if center}
    <div class="dss-topbar-center">{@render center()}</div>
  {:else if context === 'live'}
    <div class="dss-topbar-ctx">
      <span class="dss-topbar-live">Live</span>
      {#if matchLabel}<span>{matchLabel}</span>{/if}
      {#if score}<span class="dss-topbar-score">{score}</span>{/if}
      {#if clock}<span class="dss-topbar-clock">{clock}</span>{/if}
    </div>
  {:else if context === 'admin' && matchLabel}
    <div class="dss-topbar-ctx">
      <span>{matchLabel}</span>
    </div>
  {/if}

  <span class="dss-topbar-spacer"></span>

  {#if actions}{@render actions()}{/if}

  {#if user}
    <div class="dss-topbar-user">
      {#if userInitials}<span class="dss-topbar-av">{userInitials}</span>{/if}
      {user}
    </div>
  {/if}
</div>
