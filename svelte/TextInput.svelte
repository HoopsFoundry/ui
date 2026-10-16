<script lang="ts">
  /**
   * HoopsFoundry UI TextInput · Svelte 5 example
   * --------------------------------------------------------------
   * Standard form input with label, help text, and validation states.
   * Supports density (touch/default/compact), prefix/suffix addons,
   * and error/success/warning states. Nutzt ausschließlich die Klassen aus
   * css/components.css (kein eigener Scoped-Style); gleiche Struktur wie die
   * React-Fassung.
   */
  import type { Snippet } from 'svelte';

  type State = 'default' | 'error' | 'ok' | 'warn';
  type Density = 'touch' | 'default' | 'compact';

  let {
    label = '',
    value = $bindable(''),
    placeholder = '',
    help = '',
    state = 'default',
    density = 'default',
    type = 'text',
    required = false,
    optional = '',
    disabled = false,
    pattern = '',
    inputmode,
    maxlength,
    id = undefined,
    name = undefined,
    prefix,
    suffix,
  }: {
    label?: string;
    value?: string;
    placeholder?: string;
    help?: string;
    state?: State;
    density?: Density;
    type?: string;
    required?: boolean;
    optional?: string;
    disabled?: boolean;
    pattern?: string;
    inputmode?: 'numeric' | 'decimal' | 'text' | 'tel' | 'email';
    maxlength?: number;
    id?: string;
    name?: string;
    prefix?: Snippet;
    suffix?: Snippet;
  } = $props();

  const uid = $props.id();
  const inputId = $derived(id ?? `hoops-input-${uid}`);
  const helpId = $derived(`${inputId}-help`);
</script>

<div class="hoops-field" class:is-error={state === 'error'} class:is-ok={state === 'ok'} class:is-warn={state === 'warn'}>
  {#if label}
    <label class="hoops-field-label" for={inputId}>
      {label}
      {#if required}<span class="req" aria-hidden="true">*</span>{/if}
      {#if optional}<span class="opt">{optional}</span>{/if}
    </label>
  {/if}

  <div class="hoops-input-group">
    {#if prefix}<span class="hoops-addon">{@render prefix()}</span>{/if}
    <input
      id={inputId}
      {name}
      class="hoops-input"
      class:hoops-input--default={density === 'default'}
      class:hoops-input--compact={density === 'compact'}
      bind:value
      {type}
      {placeholder}
      {disabled}
      {required}
      {pattern}
      {inputmode}
      {maxlength}
      aria-invalid={state === 'error' ? 'true' : undefined}
      aria-describedby={help ? helpId : undefined}
    />
    {#if suffix}<span class="hoops-addon hoops-addon--right">{@render suffix()}</span>{/if}
  </div>

  {#if help}
    <div
      id={helpId}
      class="hoops-field-help"
      class:hoops-field-help--err={state === 'error'}
      class:hoops-field-help--ok={state === 'ok'}
      class:hoops-field-help--warn={state === 'warn'}
    >
      {help}
    </div>
  {/if}
</div>
