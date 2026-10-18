<script lang="ts">
  // Testhilfe für svelte/i18n.js: liest Texte in der Vorlage, in einem $derived und mit eigenen `texts`.
  import { useI18n } from '../../svelte/i18n.js';

  let { texts = undefined }: { texts?: Record<string, string> } = $props();
  const i18n = useI18n(() => texts);
  const closeLabel = $derived(i18n.t('modal.close'));
  const count = $derived(i18n.t('team.squad.players', { count: 2 }));
</script>

<span data-probe="tpl" lang={i18n.lang}>{i18n.t('modal.close')}</span>
<span data-probe="derived">{closeLabel}</span>
<span data-probe="plural">{count}</span>
<span data-probe="locale">{i18n.locale}</span>
