<script lang="ts">
  /**
   * HoopsFoundry UI Banner · Svelte 5
   * --------------------------------------------------------------
   * Inline-Hinweis (info · ok · warn · danger). Nutzt nur die Klassen aus
   * css/components.css. `role` ist standardmäßig "alert" für warn/danger
   * und "status" für info/ok.
   */
  import type { Snippet } from 'svelte';

  type Severity = 'info' | 'ok' | 'warn' | 'danger';

  let {
    severity = 'info',
    title = '',
    icon = true,
    role = undefined,
    children,
  }: {
    severity?: Severity;
    title?: string;
    icon?: boolean;
    role?: 'alert' | 'status' | 'none';
    children: Snippet;
  } = $props();

  const resolvedRole = $derived(role ?? (severity === 'warn' || severity === 'danger' ? 'alert' : 'status'));
</script>

<div class="hoops-banner hoops-banner--{severity}" role={resolvedRole}>
  {#if icon}
    <svg class="hoops-banner-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      {#if severity === 'danger'}
        <g stroke-width="1.8"><circle cx="8" cy="8" r="6.5" /><path d="M5.2 10.8l5.6-5.6" /></g>
      {:else if severity === 'warn'}
        <g stroke-width="1.8"><path d="M8 1.5L15 14H1z" /><path d="M8 6v3M8 11.5v.05" /></g>
      {:else if severity === 'ok'}
        <g stroke-width="2.2"><path d="M3 8.2l3.5 3.5L13 5" /></g>
      {:else}
        <g stroke-width="1.8"><circle cx="8" cy="8" r="6.5" /><path d="M8 7v4M8 4.5v.05" /></g>
      {/if}
    </svg>
  {/if}
  <div class="hoops-banner-body">
    {#if title}<p class="hoops-banner-title">{title}</p>{/if}
    {@render children()}
  </div>
</div>
