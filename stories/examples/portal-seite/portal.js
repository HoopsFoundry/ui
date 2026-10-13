// Beispiel-Portalseite ohne Build: Vereinsseite (index.html) und Teamseite (team.html) aus einem JSON-Datensatz.
// Das Seitenlayout steht im HTML, alle Bausteine kommen aus den Funktionen des Pakets (mountX, initAll). Tabs und Dialog haben keine
// Render-Funktion im Paket; die kleinen Hilfen dafür unten setzen ihre Texte über esc/attr aus den Daten zusammen.
import { initAll, checkVersion, VERSION as CORE_VERSION } from '/dss/dss.min.js';
import { esc, attr, mountLeagueCard, mountTeamCard, mountScheduleTable, mountTable, mountVenueCard, VERSION as RENDER_VERSION } from '/dss/dss-render.min.js';
import { initMap, VERSION as MAP_VERSION } from '/dss/dss-map.min.js';

const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? '';
const tileUrl = meta('dss-tile-url');
const page = meta('dss-page');
// Leaflet kommt aus einer lokalen Datei und wird erst nach dem Klick auf „Karte laden“ geladen (vorher kein Netzverkehr)
const loadLeaflet = () => import('/vendor/leaflet/leaflet-src.esm.js');

/** Setzt geprüftes Markup ein (als Fragment geparst); alle Werte darin laufen durch esc oder attr. */
const setMarkup = (el, markup) => el.replaceChildren(document.createRange().createContextualFragment(markup));

const CLOSE_ICON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8"/></svg>';

/** Ein Abschnitt der Seite: Behälter mit eigener id, eine Überschrift der Ebene 2 gibt der Baustein selbst oder `heading` vor. */
function block(parent, id, heading) {
  const el = document.createElement('section');
  el.id = id;
  el.className = 'portal-block';
  if (heading) {
    const h = document.createElement('h2');
    h.textContent = heading;
    el.append(h);
  }
  const body = document.createElement('div');
  el.append(body);
  parent.append(el);
  return body;
}

/** Tabs mit Panels aus Daten: `[{ id, label, count }]`; liefert die Panels nach id. */
function tabs(parent, { id, label, items, style = 'segmented' }) {
  const bar = items.map((item, i) => `<button type="button" class="dss-tab${i === 0 ? ' is-active' : ''}" role="tab" id="${attr(id)}-${attr(item.id)}" aria-selected="${i === 0}" aria-controls="${attr(id)}-${attr(item.id)}-panel" tabindex="${i === 0 ? 0 : -1}"><span class="dss-tab-label">${esc(item.label)}</span>${item.count === undefined ? '' : `<span class="dss-tab-count">${esc(item.count)}</span>`}</button>`).join('');
  const panels = items.map((item, i) => `<div id="${attr(id)}-${attr(item.id)}-panel" role="tabpanel" aria-labelledby="${attr(id)}-${attr(item.id)}" tabindex="0"${i === 0 ? '' : ' hidden inert'}></div>`).join('');
  const holder = document.createElement('div');
  parent.append(holder);
  setMarkup(holder, `<div class="dss-tabs dss-tabs--${attr(style)} dss-tabs--md" role="tablist" aria-label="${attr(label)}" data-dss="tabs">${bar}</div>${panels}`);
  return Object.fromEntries(items.map((item) => [item.id, holder.querySelector(`#${CSS.escape(`${id}-${item.id}-panel`)}`)]));
}

/** Dialog „Fehler melden“ (natives <dialog>); initAll startet ihn über data-dss="modal". */
function reportDialog(parent) {
  const holder = document.createElement('div');
  parent.append(holder);
  setMarkup(holder, `<dialog class="dss-modal-dialog" id="fehler-melden" data-dss="modal" aria-labelledby="fehler-titel"><div class="dss-modal">
  <div class="dss-m-head"><div class="dss-m-head-text"><h2 class="dss-m-title" id="fehler-titel">Fehler melden</h2><div class="dss-m-subtitle">Falsche Angabe auf dieser Seite?</div></div>
  <button type="button" class="dss-m-close" aria-label="Schließen">${CLOSE_ICON}</button></div>
  <div class="dss-m-body"><div class="portal-form"><label for="fehler-text">Was stimmt nicht?</label><textarea id="fehler-text" name="text" rows="4"></textarea></div></div>
  <div class="dss-m-footer"><button type="button" class="dss-btn dss-btn--secondary dss-btn--md" data-dss-modal-close>Abbrechen</button><button type="button" class="dss-btn dss-btn--primary dss-btn--md" data-dss-modal-close>Senden</button></div>
</div></dialog>`);
}

function venue(parent, data, id) {
  return mountVenueCard(parent, { ...data, titleAs: 'h2', tileUrl, id }, { initMap, loadLeaflet });
}

async function main() {
  const data = await (await fetch('data.json')).json();
  document.getElementById('intro').textContent = page === 'verein' ? data.verein.intro : `${data.team.league}, Saison ${data.team.season}. Alle Spiele, Kader und Statistik der ersten Herren.`;
  const root = document.getElementById('inhalt-dynamisch');

  if (page === 'verein') {
    const ligen = block(root, 'ligen');
    const grid = document.createElement('div');
    grid.className = 'portal-grid';
    ligen.append(grid);
    for (const liga of data.ligen) {
      const cell = document.createElement('div');
      grid.append(cell);
      mountLeagueCard(cell, { ...liga, titleAs: 'h2', names: 'short', id: liga.id });
    }
    const teams = block(root, 'mannschaften');
    const teamGrid = document.createElement('div');
    teamGrid.className = 'portal-grid';
    teams.append(teamGrid);
    for (const team of data.mannschaften) {
      const cell = document.createElement('div');
      teamGrid.append(cell);
      mountTeamCard(cell, { ...team, titleAs: 'h2' });
    }
    venue(block(root, 'halle'), data.halle, 'halle-karte');
  } else {
    mountTeamCard(block(root, 'team'), { ...data.team, titleAs: 'h2' });
    const spiele = data.spiele;
    const body = block(root, 'spielplan', 'Spielplan');
    const panels = tabs(body, {
      id: 'ort', label: 'Spiele nach Spielort',
      items: [
        { id: 'alle', label: 'Alle', count: spiele.length },
        { id: 'heim', label: 'Heim', count: spiele.filter((g) => g.at === 'heim').length },
        { id: 'auswaerts', label: 'Auswärts', count: spiele.filter((g) => g.at === 'gast').length },
      ],
    });
    const filtered = { alle: spiele, heim: spiele.filter((g) => g.at === 'heim'), auswaerts: spiele.filter((g) => g.at === 'gast') };
    for (const [key, panel] of Object.entries(panels)) {
      mountScheduleTable(panel, { games: filtered[key], layout: 'opponent', caption: `Spielplan ${key === 'alle' ? 'aller Spiele' : key === 'heim' ? 'der Heimspiele' : 'der Auswärtsspiele'}`, id: `plan-${key}` });
    }
    const tabellen = block(root, 'zahlen', 'Zahlen');
    for (const t of [data.kader, data.statistik]) {
      const cell = document.createElement('div');
      tabellen.append(cell);
      mountTable(cell, { ...t, titleAs: 'h3', collapsible: true, id: `tab-${t.title.toLowerCase()}` });
    }
    venue(block(root, 'halle'), data.halle, 'halle-karte');
  }
  reportDialog(document.getElementById('dialoge'));

  // Danach das Verhalten: Seitennavigation, Tabs, Dialog, Theme-Umschalter, Nach oben, Accordion der einklappbaren Karten
  const dss = initAll(document);
  const versions = { core: CORE_VERSION, render: RENDER_VERSION, map: MAP_VERSION, css: checkVersion().css };
  const same = new Set(Object.values(versions)).size === 1;
  document.documentElement.setAttribute('data-dss-versions', same ? versions.core : `abweichend: ${JSON.stringify(versions)}`);
  if (!same) console.warn('DSS: Versionen passen nicht zusammen', versions);
  window.__portal = { dss, versions };
  document.documentElement.setAttribute('data-portal', 'ready');
}

main().catch((error) => {
  console.error(error);
  document.documentElement.setAttribute('data-portal', 'error');
});
