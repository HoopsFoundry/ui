<script lang="ts">
  import { initAccordion } from '../../js/accordion.js';
  import Accordion from '../../svelte/Accordion.svelte';
  import AccordionItem from '../../svelte/AccordionItem.svelte';
  import HeadingLevel from '../../svelte/HeadingLevel.svelte';
  import Table from '../../svelte/Table.svelte';
  import Banner from '../../svelte/Banner.svelte';
  import { buttonMarkup, detailsMarkup } from '../Accordion.code';

  // Alle Beispiele stehen auf einer Seite: jede id kommt nur einmal vor, und nur das Deep-Link-Beispiel schreibt den Anker (syncHash).
  let { example }: { example: string } = $props();

  const TABELLE = 'Platz 3 von 12 in der Bayernliga Süd, 12 Siege, 3 Niederlagen.';
  const SPIELPLAN = 'Nächstes Spiel: Samstag, 19:30 Uhr in der Nordhain-Halle gegen die Lindenberg Hawks.';
  const KADER = 'Zehn Spieler im Aufgebot, dazu zwei Trainer und zwei Betreuer.';
  const STATISTIK = 'Im Schnitt 82,4 Punkte pro Spiel, 41,3 Rebounds und 18,7 Assists.';
  const LANG = [
    'Die Mannschaft von Trainer Jens Albrecht spielt seit drei Jahren in der Bayernliga Süd. Heimspiele finden in der Nordhain-Halle statt, Auswärtsspiele bei den zehn anderen Vereinen der Staffel.',
    'Der Kader wurde zur Saison 26/27 mit zwei Neuzugängen aus der Regionalliga verstärkt. Die Mini-Mannschaften trainieren dienstags und donnerstags, die Senioren montags und mittwochs.',
    'Zu jedem Heimspiel gibt es einen Kuchenverkauf der Eltern; der Erlös fließt in die Jugendarbeit. Wer helfen möchte, meldet sich beim Abteilungsleiter.',
  ];

  // Zustands-Matrix: erzwingt den Zustand auf dem Kopf (die Klassen kommen aus .storybook/pseudo-states.ts)
  function mark(node: HTMLElement, cls: string) {
    const trigger = node.querySelector<HTMLElement>('.dss-acc-trigger');
    if (cls && trigger) trigger.classList.add(...cls.split(' '));
  }
  const cols = ['Standard', 'Hover', 'Fokus', 'Aktiv', 'Offen', 'Gesperrt'] as const;
  const stateClass: Record<(typeof cols)[number], string> = {
    Standard: '', Hover: 'pseudo-hover', Fokus: 'pseudo-focus-visible', Aktiv: 'pseudo-hover pseudo-active', Offen: '', Gesperrt: '',
  };
  const variants = [{ id: 'card', name: 'Karte' }, { id: 'flat', name: 'Flach' }] as const;

  // Überschriftenebenen: liest, welche Überschriften das Beispiel tatsächlich ausgibt
  let outline = $state<Record<string, string>>({});
  function read(node: HTMLElement, key: string) {
    outline[key] = [...node.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')].map((h) => h.tagName.toLowerCase()).join(' · ');
  }

  // Vanilla-Beispiele: dasselbe Markup wie im Code-Beispiel; das Skript macht den Button-Weg bedienbar
  function vanillaButton(node: HTMLElement) {
    node.replaceChildren(document.createRange().createContextualFragment(buttonMarkup));
    const root = node.querySelector<HTMLElement>('.dss-acc');
    const destroy = root ? initAccordion(root, { syncHash: false, expandAll: true }) : () => {};
    return { destroy };
  }
  function vanillaDetails(node: HTMLElement) {
    node.replaceChildren(document.createRange().createContextualFragment(detailsMarkup));
  }

</script>

{#snippet chipOffen()}<span class="dss-chip dss-chip--amber dss-chip--mono">Offen</span>{/snippet}
{#snippet chipFehler()}<span class="dss-chip dss-chip--err dss-chip--mono">2 Fehler</span>{/snippet}
{#snippet liveTag()}<span class="dss-live"><span class="dss-live-dot" aria-hidden="true"></span>Live</span>{/snippet}

{#if example === 'aufbau'}
  <Accordion syncHash={false}>
    <AccordionItem id="ex-tabelle" title="Tabelle" open>{TABELLE}</AccordionItem>
    <AccordionItem id="ex-spielplan" title="Spielplan">{SPIELPLAN}</AccordionItem>
    <AccordionItem id="ex-kader" title="Kader">{KADER}</AccordionItem>
  </Accordion>
{:else if example === 'varianten'}
  <div class="stack">
    <div>
      <div class="cap">variant="card" (Standard)</div>
      <Accordion syncHash={false} variant="card">
        <AccordionItem id="va-c1" title="Tabelle" open>{TABELLE}</AccordionItem>
        <AccordionItem id="va-c2" title="Spielplan">{SPIELPLAN}</AccordionItem>
        <AccordionItem id="va-c3" title="Kader">{KADER}</AccordionItem>
      </Accordion>
    </div>
    <div>
      <div class="cap">variant="flat"</div>
      <Accordion syncHash={false} variant="flat">
        <AccordionItem id="va-f1" title="Tabelle" open>{TABELLE}</AccordionItem>
        <AccordionItem id="va-f2" title="Spielplan">{SPIELPLAN}</AccordionItem>
        <AccordionItem id="va-f3" title="Kader">{KADER}</AccordionItem>
      </Accordion>
    </div>
  </div>
{:else if example === 'meta'}
  <Accordion syncHash={false}>
    <AccordionItem id="me-zaehler" title="Kader" open>
      {#snippet meta()}14 Spieler{/snippet}
      {KADER}
    </AccordionItem>
    <AccordionItem id="me-chip" title="Spielbericht">
      {#snippet meta()}{@render chipOffen()}{/snippet}
      Der Bericht ist noch nicht freigegeben.
    </AccordionItem>
    <AccordionItem id="me-fehler" title="Prüfung">
      {#snippet meta()}{@render chipFehler()}{/snippet}
      Zwei Spielernummern fehlen im Aufgebot.
    </AccordionItem>
    <AccordionItem id="me-live" title="Spielstand">
      {#snippet meta()}{@render liveTag()}{/snippet}
      TSV Nordhain 87 : 64 Lindenberg Hawks, 4. Viertel.
    </AccordionItem>
  </Accordion>
{:else if example === 'verschachtelt'}
  <Accordion syncHash={false}>
    <AccordionItem id="ve-liga" title="Bayernliga Süd" open>
      <Accordion syncHash={false}>
        <AccordionItem id="ve-herren" title="Herren" open>Erste Mannschaft, 12 Teams.</AccordionItem>
        <AccordionItem id="ve-damen" title="Damen">Zweite Mannschaft, 10 Teams.</AccordionItem>
      </Accordion>
    </AccordionItem>
    <AccordionItem id="ve-jugend" title="Jugend">
      <Accordion syncHash={false}>
        <AccordionItem id="ve-u16" title="U16">Trainingszeiten: Dienstag und Donnerstag.</AccordionItem>
        <AccordionItem id="ve-u14" title="U14">Trainingszeiten: Montag und Mittwoch.</AccordionItem>
      </Accordion>
    </AccordionItem>
  </Accordion>
{:else if example === 'alle'}
  <Accordion syncHash={false} expandAll>
    <AccordionItem id="al-tabelle" title="Tabelle">{TABELLE}</AccordionItem>
    <AccordionItem id="al-spielplan" title="Spielplan">{SPIELPLAN}</AccordionItem>
    <AccordionItem id="al-kader" title="Kader">{KADER}</AccordionItem>
    <AccordionItem id="al-gesperrt" title="Statistik (ab Spieltag 3)" disabled>{STATISTIK}</AccordionItem>
  </Accordion>
{:else if example === 'exklusiv'}
  <Accordion syncHash={false} exclusive variant="flat">
    <AccordionItem id="ex2-1" title="Wie melde ich ein Spiel nach?" open>Über „Spiele“ den Spieltag wählen und „Nachmelden“ drücken.</AccordionItem>
    <AccordionItem id="ex2-2" title="Wer darf den Bericht freigeben?">Der Anschreiber und der Schiedsrichter gemeinsam.</AccordionItem>
    <AccordionItem id="ex2-3" title="Wie lange bleibt ein Bericht änderbar?">Bis zur Freigabe; danach nur durch die Staffelleitung.</AccordionItem>
  </Accordion>
{:else if example === 'deeplink'}
  <div class="stack">
    <p class="links">
      Direkt springen:
      <a class="dss-link" href="#dl-spielplan">Spielplan</a> ·
      <a class="dss-link" href="#dl-kader">Kader</a> ·
      <a class="dss-link" href="#dl-torhueter">Torhüter (im Kader)</a>
    </p>
    <Accordion>
      <AccordionItem id="dl-tabelle" title="Tabelle">{TABELLE}</AccordionItem>
      <AccordionItem id="dl-spielplan" title="Spielplan">{SPIELPLAN}</AccordionItem>
      <AccordionItem id="dl-kader" title="Kader">
        {KADER}
        <Accordion>
          <AccordionItem id="dl-torhueter" title="Torhüter">Zwei Torhüter im Aufgebot.</AccordionItem>
          <AccordionItem id="dl-guards" title="Guards">Vier Guards im Aufgebot.</AccordionItem>
        </Accordion>
      </AccordionItem>
    </Accordion>
  </div>
{:else if example === 'nav'}
  <Accordion syncHash={false} nav expandAll>
    <AccordionItem id="na-tabelle" title="Tabelle">{TABELLE}</AccordionItem>
    <AccordionItem id="na-spielplan" title="Spielplan">{SPIELPLAN}</AccordionItem>
    <AccordionItem id="na-kader" title="Kader">{KADER}</AccordionItem>
    <AccordionItem id="na-statistik" title="Statistik">{STATISTIK}</AccordionItem>
  </Accordion>
{:else if example === 'sticky'}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -- Fokussierbar mit Absicht: Tastaturnutzer müssen den Scrollbereich erreichen -->
  <div class="scroller" tabindex="0" role="region" aria-label="Scrollbereich: Accordion mit klebendem Kopf" style="--dss-acc-sticky-top: 0px;">
    <Accordion syncHash={false} sticky>
      <AccordionItem id="st-tabelle" title="Tabelle" open>
        {#each LANG as p}<p>{p}</p>{/each}
        {#each LANG as p}<p>{p}</p>{/each}
      </AccordionItem>
      <AccordionItem id="st-spielplan" title="Spielplan" open>
        {#each LANG as p}<p>{p}</p>{/each}
      </AccordionItem>
      <AccordionItem id="st-kader" title="Kader">{KADER}</AccordionItem>
    </Accordion>
  </div>
{:else if example === 'vanilla'}
  <div use:vanillaButton></div>
{:else if example === 'details'}
  <div use:vanillaDetails></div>
{:else if example === 'ebenen'}
  <div class="stack">
    <div use:read={'standard'}>
      <div class="cap">Standard: Bereiche h3, Inhalt h4 · Ebenen: <code>{outline.standard}</code></div>
      <Accordion syncHash={false}>
        <AccordionItem id="eb-1" title="Kader" open>
          <Accordion syncHash={false}>
            <AccordionItem id="eb-1a" title="Heim" open>Nordhain-Halle</AccordionItem>
          </Accordion>
        </AccordionItem>
      </Accordion>
    </div>
    <div use:read={'level'}>
      <div class="cap">In HeadingLevel level=2: Bereiche h2, Inhalt h3 · Ebenen: <code>{outline.level}</code></div>
      <HeadingLevel level={2}>
        <Accordion syncHash={false}>
          <AccordionItem id="eb-2" title="Kader" open>
            <Accordion syncHash={false}>
              <AccordionItem id="eb-2a" title="Heim" open>Nordhain-Halle</AccordionItem>
            </Accordion>
          </AccordionItem>
        </Accordion>
      </HeadingLevel>
    </div>
    <div use:read={'titleas'}>
      <div class="cap">titleAs: Gruppe h4, ein Bereich h6 · Ebenen: <code>{outline.titleas}</code></div>
      <Accordion syncHash={false} titleAs="h4">
        <AccordionItem id="eb-3" title="Kader" open>Zehn Spieler.</AccordionItem>
        <AccordionItem id="eb-3b" title="Trainerstab" titleAs="h6" open>Vier Trainer und Betreuer.</AccordionItem>
      </Accordion>
    </div>
  </div>
{:else if example === 'zustaende'}
  <!-- data-fixed-states: die Werkzeugleiste "Zustand" lässt diese Matrix in Ruhe -->
  <div class="matrix" data-fixed-states>
    <div class="surface">
      <div class="states">
        <div class="head"></div>
        {#each cols as c}<div class="head">{c}</div>{/each}
        {#each variants as v}
          <div class="rowlabel">{v.name}</div>
          {#each cols as c}
            <div class="cell" use:mark={stateClass[c]}>
              <Accordion syncHash={false} variant={v.id}>
                <AccordionItem id={`zu-${v.id}-${c}`} title="Spielplan" open={c === 'Offen'} disabled={c === 'Gesperrt'}>Bericht</AccordionItem>
              </Accordion>
            </div>
          {/each}
        {/each}
      </div>
    </div>
  </div>
{:else if example === 'liga'}
  <Accordion syncHash={false} nav expandAll>
    <AccordionItem id="li-tabelle" title="Tabelle">
      {#snippet meta()}12 Teams{/snippet}
      <Table caption="Tabellenstand Bayernliga Süd" density="compact" columns={[
        { key: 'pl', label: '#', width: '52px' }, { key: 'team', label: 'Team' }, { key: 's', label: 'S', align: 'right' }, { key: 'n', label: 'N', align: 'right' }, { key: 'p', label: 'Pkt', align: 'right' },
      ]}>
        {#snippet rows()}
          <tr><td>1</td><td>BG Seeberg</td><td class="num">13</td><td class="num">2</td><td class="num lead">26</td></tr>
          <tr><td>2</td><td>Lindenberg Hawks</td><td class="num">12</td><td class="num">3</td><td class="num lead">24</td></tr>
          <tr class="is-own"><td>3</td><td>TSV Nordhain</td><td class="num">12</td><td class="num">3</td><td class="num lead">24</td></tr>
        {/snippet}
      </Table>
    </AccordionItem>
    <AccordionItem id="li-spielplan" title="Spielplan">
      {#snippet meta()}{@render liveTag()}{/snippet}
      <Table caption="Spiele des Spieltags" density="compact" columns={[
        { key: 'wann', label: 'Wann' }, { key: 'heim', label: 'Heim' }, { key: 'gast', label: 'Gast' }, { key: 'erg', label: 'Stand', align: 'right' },
      ]}>
        {#snippet rows()}
          <tr><td>Sa 19:30</td><td>TSV Nordhain</td><td>Lindenberg Hawks</td><td class="num">87 : 64</td></tr>
          <tr><td>So 15:00</td><td>BG Seeberg</td><td>SV Kiefernau</td><td class="num">–</td></tr>
        {/snippet}
      </Table>
    </AccordionItem>
    <AccordionItem id="li-kader" title="Kader">
      {#snippet meta()}14 Spieler{/snippet}
      <Table caption="Kader von TSV Nordhain" density="compact" columns={[
        { key: 'num', label: '#', width: '52px' }, { key: 'name', label: 'Spieler' }, { key: 'pos', label: 'Pos.' },
      ]}>
        {#snippet rows()}
          <tr><td>4</td><td>J. Tanner</td><td>PG</td></tr>
          <tr><td>7</td><td>M. Okafor</td><td>SG</td></tr>
          <tr><td>11</td><td>L. Brandt</td><td>SF</td></tr>
        {/snippet}
      </Table>
    </AccordionItem>
    <AccordionItem id="li-statistik" title="Statistik">
      {STATISTIK}
    </AccordionItem>
  </Accordion>
{:else if example === 'handy'}
  <div class="page">
    <Accordion syncHash={false} nav expandAll>
      <AccordionItem id="ha-tabelle" title="Tabelle" open>
        {#snippet meta()}12 Teams{/snippet}
        {TABELLE}
      </AccordionItem>
      <AccordionItem id="ha-spielplan" title="Spielplan">
        {#snippet meta()}{@render liveTag()}{/snippet}
        {SPIELPLAN}
      </AccordionItem>
      <AccordionItem id="ha-kader" title="Kader">
        {#snippet meta()}14 Spieler{/snippet}
        {KADER}
      </AccordionItem>
      <AccordionItem id="ha-statistik" title="Statistik">{STATISTIK}</AccordionItem>
    </Accordion>
  </div>

<!-- Dos und Don'ts -->
{:else if example === 'do-kurz'}
  <Accordion syncHash={false} variant="flat">
    <AccordionItem id="dk-1" title="Kader" open>{KADER}</AccordionItem>
    <AccordionItem id="dk-2" title="Spielplan">{SPIELPLAN}</AccordionItem>
    <AccordionItem id="dk-3" title="Statistik">{STATISTIK}</AccordionItem>
  </Accordion>
{:else if example === 'dont-kurz'}
  <Accordion syncHash={false} variant="flat">
    <AccordionItem id="dk-4" title="Hier findest du alle Spieler, Trainer und Betreuer der ersten Mannschaft" open>{KADER}</AccordionItem>
    <AccordionItem id="dk-5" title="Alle Spiele der laufenden Saison mit Datum, Halle und Gegner">{SPIELPLAN}</AccordionItem>
  </Accordion>
{:else if example === 'do-tiefe'}
  <Accordion syncHash={false}>
    <AccordionItem id="dt-1" title="Jugend" open>
      <Accordion syncHash={false}>
        <AccordionItem id="dt-1a" title="U16" open>Dienstag und Donnerstag.</AccordionItem>
        <AccordionItem id="dt-1b" title="U14">Montag und Mittwoch.</AccordionItem>
      </Accordion>
    </AccordionItem>
  </Accordion>
{:else if example === 'dont-tiefe'}
  <Accordion syncHash={false}>
    <AccordionItem id="dt-2" title="Verein" open>
      <Accordion syncHash={false}>
        <AccordionItem id="dt-2a" title="Abteilung" open>
          <Accordion syncHash={false}>
            <AccordionItem id="dt-2b" title="Jugend" open>
              <Accordion syncHash={false}>
                <AccordionItem id="dt-2c" title="U16" open>Dienstag und Donnerstag.</AccordionItem>
              </Accordion>
            </AccordionItem>
          </Accordion>
        </AccordionItem>
      </Accordion>
    </AccordionItem>
  </Accordion>
{:else if example === 'do-wichtig'}
  <div class="stack">
    <Banner severity="danger" title="Aufgebot unvollständig" role="status">Zwei Spielernummern fehlen im Aufgebot.</Banner>
    <Accordion syncHash={false} variant="flat">
      <AccordionItem id="dw-1" title="Aufgebot">
        {#snippet meta()}{@render chipFehler()}{/snippet}
        Nummern 7 und 13 fehlen.
      </AccordionItem>
    </Accordion>
  </div>
{:else if example === 'dont-wichtig'}
  <Accordion syncHash={false} variant="flat">
    <AccordionItem id="dw-2" title="Aufgebot">Achtung: Zwei Spielernummern fehlen, der Bericht kann nicht freigegeben werden.</AccordionItem>
  </Accordion>
{:else if example === 'do-id'}
  <div class="stack">
    <p class="links">Link in der E-Mail: <code>…/liga#kader</code></p>
    <Accordion syncHash={false} variant="flat">
      <AccordionItem id="di-spielplan" title="Spielplan">{SPIELPLAN}</AccordionItem>
      <AccordionItem id="kader" title="Kader" open>{KADER}</AccordionItem>
    </Accordion>
  </div>
{:else if example === 'dont-id'}
  <div class="stack">
    <p class="links">Link in der E-Mail: <code>…/liga#bereich-2</code> (heute der Kader, nach dem Umsortieren der Spielplan)</p>
    <Accordion syncHash={false} variant="flat">
      <AccordionItem id="bereich-1" title="Spielplan">{SPIELPLAN}</AccordionItem>
      <AccordionItem id="bereich-2" title="Kader" open>{KADER}</AccordionItem>
    </Accordion>
  </div>
{/if}

<style>
  .stack { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
  .cap, .head, .rowlabel { font-family: var(--font-mono); font-size: var(--fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--page-mute); }
  .cap { margin-bottom: 8px; }
  .cap code { text-transform: none; letter-spacing: 0; }
  .links { margin: 0; font-size: var(--fs-body-sm); color: var(--page-fg); }
  .scroller { height: 340px; overflow-y: auto; border: 1px solid var(--page-line); border-radius: var(--radius-lg); padding: 12px; background: var(--page-bg); }
  .scroller :global(p) { margin: 0 0 12px; }
  .scroller :global(p:last-child) { margin-bottom: 0; }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  .surface { background: var(--page-bg); border: 1px solid var(--page-line); border-radius: var(--radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: 70px repeat(6, minmax(170px, 1fr)); gap: 10px 12px; align-items: start; }
  .cell { min-width: 0; }
  .page { max-width: 390px; padding: 16px; box-sizing: border-box; }
</style>
