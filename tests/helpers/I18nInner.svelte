<script lang="ts">
  // Testhilfe: innerer Anbieter (geschachtelt), darin die Sonde.
  import { provideI18n } from '../../svelte/i18n.js';
  import I18nProbe from './I18nProbe.svelte';

  let { locale = undefined, texts = undefined }: { locale?: string; texts?: Record<string, string> } = $props();
  provideI18n(() => ({ locale, texts }));
</script>

<I18nProbe />
