<script lang="ts">
  /**
   * HoopsFoundry UI TopBar · Svelte 5
   * --------------------------------------------------------------
   * App-Shell-Leiste, dunkle Fläche, 56 px. Marke links, optionaler
   * Spielkontext, Aktionen rechts. Nutzt nur Klassen aus css/components.css
   * (`hoops-topbar hoops-topbar--dark`; die helle `.hoops-topbar` bleibt dem
   * Vereinsregister).
   *
   *   default — ruhig, ohne Live-Anzeige
   *   live    — grüner Puls + Spielstand + Uhr (Schiri-/Coach-App)
   *   admin   — Breadcrumb-Kontext (Vereinsregister, Einstellungen)
   */
  import type { Snippet } from 'svelte';
  import { useI18n } from './i18n.js';

  let {
    brand = 'Hoops',
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

  const i18n = useI18n();
</script>

<div class="hoops-topbar hoops-topbar--dark" class:hoops-topbar--contained={contained} lang={i18n.lang}>
  <div class="hoops-topbar-brand">
    <span class="hoops-topbar-mark" aria-hidden="true">{mark}</span>
    {brand}
  </div>

  {#if leading}{@render leading()}{/if}

  {#if center}
    <div class="hoops-topbar-center">{@render center()}</div>
  {:else if context === 'live'}
    <div class="hoops-topbar-ctx">
      <span class="hoops-topbar-live">{i18n.t('common.live')}</span>
      {#if matchLabel}<span>{matchLabel}</span>{/if}
      {#if score}<span class="hoops-topbar-score">{score}</span>{/if}
      {#if clock}<span class="hoops-topbar-clock">{clock}</span>{/if}
    </div>
  {:else if context === 'admin' && matchLabel}
    <div class="hoops-topbar-ctx">
      <span>{matchLabel}</span>
    </div>
  {/if}

  <span class="hoops-topbar-spacer"></span>

  {#if actions}{@render actions()}{/if}

  {#if user}
    <div class="hoops-topbar-user">
      {#if userInitials}<span class="hoops-topbar-av">{userInitials}</span>{/if}
      {user}
    </div>
  {/if}
</div>
