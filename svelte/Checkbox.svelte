<script lang="ts" module>
  let seq = 0;
</script>

<script lang="ts">
  /**
   * HoopsFoundry UI Checkbox · Svelte 5
   * --------------------------------------------------------------
   * Natives Kontrollkästchen im HoopsFoundry-UI-Look. Die Klickfläche ist das
   * gesamte Label (≥ 44 px, `density="compact"` 36 px). Nutzt nur
   * die Klassen aus css/components.css.
   */
  let {
    label,
    hint = '',
    checked = $bindable(false),
    disabled = false,
    density = 'default',
    id = undefined,
    name = undefined,
    onchange = undefined,
  }: {
    label: string;
    hint?: string;
    checked?: boolean;
    disabled?: boolean;
    density?: 'default' | 'compact';
    id?: string;
    name?: string;
    onchange?: (checked: boolean) => void;
  } = $props();

  const autoId = `hoops-check-${++seq}`;
  const inputId = $derived(id ?? autoId);
</script>

<label
  for={inputId}
  class="hoops-check"
  class:hoops-check--compact={density === 'compact'}
  class:is-disabled={disabled}
>
  <input
    id={inputId}
    {name}
    type="checkbox"
    class="hoops-check-input"
    bind:checked
    {disabled}
    aria-describedby={hint ? `${inputId}-hint` : undefined}
    onchange={() => onchange?.(checked)}
  />
  <span class="hoops-check-text">
    <span class="hoops-check-label">{label}</span>
    {#if hint}<span id={`${inputId}-hint`} class="hoops-check-hint">{hint}</span>{/if}
  </span>
</label>
