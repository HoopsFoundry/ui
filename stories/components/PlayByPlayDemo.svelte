<script>
  import PlayByPlay from '../../svelte/PlayByPlay.svelte';
  import Button from '../../svelte/Button.svelte';
  import { initialEvents, liveBank } from './pbpData';

  let { mode = 'static', dark = false } = $props();

  let events = $state([...initialEvents]);
  let timer = $state(null);
  let liveIndex = $state(0);
  let isLive = $state(false);

  // Live-Scoring simulieren: alle 2,2 Sekunden kommt ein Ereignis oben dazu
  function startLive() {
    if (isLive) return;
    isLive = true;
    events = [...initialEvents];
    liveIndex = 0;
    timer = setInterval(() => {
      if (liveIndex >= liveBank.length) {
        stopLive();
        return;
      }
      const next = liveBank[liveIndex];
      events = [{ ...next, id: `live-${liveIndex}` }, ...events];
      liveIndex++;
    }, 2200);
  }
  function stopLive() {
    isLive = false;
    if (timer) clearInterval(timer);
    timer = null;
  }
  function reset() {
    stopLive();
    events = [...initialEvents];
    liveIndex = 0;
  }

  $effect(() => () => { if (timer) clearInterval(timer); });
</script>

<div style="padding: 24px;">
  {#if mode === 'live'}
    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; align-items: center;">
      <Button size="sm" onclick={startLive} disabled={isLive}>▶ Live-Scoring starten</Button>
      <Button size="sm" variant="secondary" onclick={stopLive} disabled={!isLive}>⏸ Pause</Button>
      <Button size="sm" variant="secondary" onclick={reset}>↻ Zurücksetzen</Button>
      <span style="margin-left: auto; font-family: var(--hoops-font-mono); font-size: 11px; color: var(--hoops-page-mute); text-transform: uppercase; letter-spacing: 0.08em;">
        {isLive ? `Live · ${liveIndex}/${liveBank.length}` : `Bereit · ${liveBank.length} Events in der Pipeline`}
      </span>
    </div>
  {/if}

  <PlayByPlay
    meta={`${events.length} Events`}
    live={mode === 'live' ? isLive : true}
    {dark}
    {events}
  />
</div>
