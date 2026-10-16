<script>
  import Select from '../../svelte/Select.svelte';

  let {
    label = 'Turniermodus',
    // Nicht `state` nennen: ein Name `state` macht aus `$state(...)` unten einen Store-Zugriff („state is not a store with a subscribe method“)
    state: fieldState = 'default',
    density = 'default',
    disabled = false,
    required = false,
    help = '',
  } = $props();

  const options = [
    { value: 'round-robin', label: 'Jeder gegen Jeden' },
    { value: 'round-robin+finals', label: 'Gruppenphase + Endrunde' },
    { value: 'swiss', label: 'Einstufungsturnier (Schweizer System)' },
  ];
  let value = $state('round-robin');
</script>

<div style="max-width: 360px">
  <Select {label} {options} state={fieldState} {density} {disabled} {required} {help} bind:value />
</div>
