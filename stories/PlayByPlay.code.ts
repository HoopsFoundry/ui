export const vanilla = `<!-- Einmal im App-Root einbinden -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />
<!-- optional: <link rel="stylesheet" href="fonts/fonts.css" /> -->

<!-- Dunkel: hoops-pbp-frame--dark. Teamstreifen: hoops-pbp-strip--heim | --gast | --none.
     Art: hoops-pbp-event--score-2p | --score-3p | --ft | --foul | --timeout | --sub | --turnover -->
<div class="hoops-pbp-frame">
  <div class="hoops-pbp-head">
    <h3 class="hoops-pbp-title">Play-by-Play · neueste oben</h3>
    <div class="hoops-pbp-meta">
      <span>2 Events</span>
      <span class="hoops-pbp-live"><span class="hoops-pbp-dot" aria-hidden="true"></span> Live</span>
    </div>
  </div>
  <div class="hoops-pbp-feed" role="log" aria-label="Play-by-Play · neueste oben" tabindex="0">
    <div class="hoops-pbp-event hoops-pbp-event--score-3p">
      <div class="hoops-pbp-time">02:14<span class="hoops-pbp-q"><span aria-hidden="true">V4</span><span class="hoops-sr-only">4. Viertel</span></span></div>
      <div class="hoops-pbp-strip hoops-pbp-strip--heim" aria-hidden="true"></div>
      <div class="hoops-pbp-body">
        <div class="hoops-pbp-action">
          <span class="hoops-sr-only">Heim: </span><b>Drei-Punkte-Wurf</b> · Spieler #7
        </div>
        <div class="hoops-pbp-detail">Assist · Spieler #13</div>
      </div>
      <div class="hoops-pbp-score">
        <span aria-hidden="true">87<span class="hoops-pbp-sep">:</span>64</span>
        <span class="hoops-sr-only">Spielstand 87 zu 64</span>
      </div>
    </div>
    <div class="hoops-pbp-event hoops-pbp-event--timeout">…</div>
  </div>
</div>

<!-- Neues Ereignis: oben einfügen (neueste zuerst) -->
<script>
  document.querySelector('.hoops-pbp-feed').prepend(eintrag);
</script>`;

export const svelte = `<script>
  import PlayByPlay from '@hoopsfoundry/ui/svelte/PlayByPlay';

  let events = $state([
    { id: 2, time: '02:38', period: 4, team: 'gast', title: 'Defensiv-Rebound · Spieler #23', score: { heim: 84, gast: 64 } },
    { id: 1, time: '02:14', period: 4, team: 'heim', kind: 'score-3p', titleBold: 'Drei-Punkte-Wurf', title: 'Spieler #7', detail: 'Assist · Spieler #13', score: { heim: 87, gast: 64 } },
  ]);

  // Neues Ereignis kommt oben dazu; der Baustein sortiert nicht selbst.
  // subscribe: deine Live-Quelle (z. B. WebSocket); sie liefert eine Funktion zum Abmelden.
  let { subscribe } = $props();
  $effect(() => subscribe((e) => { events = [e, ...events]; }));
</script>

<PlayByPlay meta={\`\${events.length} Events\`} {events} />
<!-- title, titleAs ('h2' bis 'h6', Standard h3 bzw. Ebene aus HeadingLevel), meta, live (Standard true), dark, periods (4 | 8, Standard 4) -->`;

export const react = `import { useEffect, useState } from 'react';
import { PlayByPlay, type PbpEvent } from '@hoopsfoundry/ui/react';

const start: PbpEvent[] = [
  { id: 2, time: '02:38', period: 4, team: 'gast', title: 'Defensiv-Rebound · Spieler #23', score: { heim: 84, gast: 64 } },
  { id: 1, time: '02:14', period: 4, team: 'heim', kind: 'score-3p', titleBold: 'Drei-Punkte-Wurf', title: 'Spieler #7', detail: 'Assist · Spieler #13', score: { heim: 87, gast: 64 } },
];

export function Feed({ subscribe }: { subscribe: (cb: (e: PbpEvent) => void) => () => void }) {
  const [events, setEvents] = useState(start);
  // Neues Ereignis kommt oben dazu; der Baustein sortiert nicht selbst.
  // subscribe: deine Live-Quelle (z. B. WebSocket); sie liefert eine Funktion zum Abmelden.
  useEffect(() => subscribe((e) => setEvents((prev) => [e, ...prev])), [subscribe]);
  return <PlayByPlay meta={\`\${events.length} Events\`} events={events} />;
}`;
