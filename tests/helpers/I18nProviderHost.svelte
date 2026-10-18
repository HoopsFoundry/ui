<script lang="ts">
  // Testhilfe: Anbieter (provideI18n) mit Sprache und Texten, darin die Sonde; optional ein innerer Anbieter.
  import { provideI18n } from '../../svelte/i18n.js';
  import I18nProbe from './I18nProbe.svelte';
  import I18nInner from './I18nInner.svelte';

  let { locale = undefined, texts = undefined, documentLang = undefined, innerLocale = undefined, innerTexts = undefined, probeTexts = undefined }: {
    locale?: string; texts?: Record<string, string>; documentLang?: string; innerLocale?: string; innerTexts?: Record<string, string>; probeTexts?: Record<string, string>;
  } = $props();
  // Laufzeitwechsel des Anbieters für den Test (ersetzt `locale`)
  let dyn = $state<string | undefined>(undefined);
  export function set(next: string) {
    dyn = next;
  }
  provideI18n(() => ({ locale: dyn ?? locale, texts, documentLang }));
</script>

<div data-host="outer"><I18nProbe texts={probeTexts} /></div>
{#if innerLocale || innerTexts}<div data-host="inner"><I18nInner locale={innerLocale} texts={innerTexts} /></div>{/if}
