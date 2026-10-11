<script lang="ts">
  import MapView from '../../svelte/Map.svelte';

  // Prüfstand für die Svelte-Karte: Props von außen ändern (set), wie eine App es mit Zustand täte
  let { initial }: { initial: Record<string, unknown> } = $props();
  // svelte-ignore state_referenced_locally -- Startwerte, danach nur über set()
  let props = $state<Record<string, unknown>>({ ...initial });
  export function set(patch: Record<string, unknown>) {
    Object.assign(props, patch);
  }
</script>

<MapView {...(props as any)} />
