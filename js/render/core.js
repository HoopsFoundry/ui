/**
 * HoopsFoundry UI Render · gemeinsame Bausteine
 * --------------------------------------------------------------
 * Teamname mit Kurzform, Logo bzw. Initialen, Form, Live-Hinweise, Überschrift mit Ebene und der einklappbare Rahmen. Die Funktionen geben
 * Markup als Zeichenkette zurück und setzen Daten nur über `esc`/`attr` (js/render/escape.js) und Links nur über `safeHref` (js/url.js) ein.
 * Die Logik (Fenster, Kurznamen, Zustände, Formen) kommt aus den gemeinsamen Modulen (js/schedule.js, js/league.js, js/heading.js …),
 * dieselben, die Svelte und React nutzen. Typen: js/render/core.d.ts.
 */
import { langFor } from '../i18n/lang.js';
import { t as tr } from '../i18n/index.js';
import { formEntries, formLabel, outcomeLetter } from '../league.js';
import { resolveHeading } from '../heading.js';
import { initials, shortName } from '../schedule.js';
import { safeHref } from '../url.js';
import { attr, esc } from './escape.js';

// ── Eingaben prüfen ──────────────────────────────────────────

/** Ein Objekt (keine Liste, kein `null`), sonst `{}`: Eingaben sind unvertraut. */
export const obj = (value) => (value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {});
/** Eine Liste, sonst `[]`. */
export const list = (value) => (Array.isArray(value) ? value : []);
/** Text: Zeichenkette oder endliche Zahl als Zeichenkette, sonst `''`. */
export const str = (value) => (typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : '');
/** Endliche Zahl, sonst `undefined`. */
export const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);
/** Ein Wert aus einer festen Liste, sonst der Ersatz. */
export const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
/** Ein sicheres Ziel (siehe `safeHref`) oder `undefined`; Nicht-Text ergibt `undefined`. */
export const url = (value) => (typeof value === 'string' ? safeHref(value) : undefined);
/** Klassenliste: nur gesetzte Teile, durch Leerzeichen getrennt. */
export const cls = (...parts) => parts.filter(Boolean).join(' ');
/** Wert für `class="…"`: die Klassenliste, maskiert. */
export const klass = (...parts) => attr(cls(...parts));

// ── Sprache ──────────────────────────────────────────────────

/**
 * Setzt `lang="…"` an das Wurzelelement des Markups, wenn die Sprache des Bausteins von der Sprache der Seite abweicht (siehe js/i18n/lang.js).
 * In Node setzt nur `options.documentLang` den Vergleichswert; ohne Abweichung bleibt das Markup unverändert.
 */
export function withLang(html, options) {
  const lang = langFor(options);
  return lang ? html.replace(/^<([A-Za-z][A-Za-z0-9-]*)/, (_, name) => `<${name} lang="${attr(lang)}"`) : html;
}

/**
 * Satz aus dem Katalog, in dessen Platzhalter `{name}` fertiges Markup gehört (zum Beispiel „{team} hat Freilos“ mit Logo und Kurzname):
 * der Text um den Platzhalter wird maskiert, an die Stelle des Platzhalters tritt `markup`. So bleibt die Wortstellung Sache der Sprache.
 */
export function sentenceWith(key, name, markup, options) {
  const marker = '\u0001';
  return tr(key, { [name]: marker }, options).split(marker).map(esc).join(markup);
}

// ── Kennung ──────────────────────────────────────────────────

/**
 * Basis für erzeugte ids (Rahmenkopf, Karte): `options.uid` (nur Buchstaben, Ziffern, `_` und `-` bleiben, alles andere entfällt), sonst ein Hash über
 * die gesamte Eingabe (`seed`, die Eigenschaften der Komponente). Dieselben Eingaben ergeben dieselben ids (das Markup ist für Crawler und
 * Vergleiche stabil), verschiedene Eingaben verschiedene; zwei Bausteine mit genau gleichen Eigenschaften auf einer Seite brauchen verschiedene
 * `id`-Werte oder `options.uid`.
 */
export function uidFor(seed, options) {
  const given = typeof options?.uid === 'string' ? options.uid.replace(/[^A-Za-z0-9_-]/g, '') : '';
  if (given) return given;
  let text = '';
  try {
    text = JSON.stringify(seed) ?? '';
  } catch {
    text = '';
  }
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
  return hash.toString(36);
}

// ── Überschrift ──────────────────────────────────────────────

/** Elementname der Überschrift: `titleAs` (h2 bis h6) vor dem Standard h3; ohne `HeadingLevel`-Kontext in Vanilla. */
export const headingOf = (titleAs) => resolveHeading(titleAs);

// ── Teams ────────────────────────────────────────────────────

/** Eine Mannschaft aus unvertrauten Daten: Texte als Text, `logo` und `href` nur als sichere Ziele, Zahlen nur endlich. */
export function teamOf(raw) {
  const team = obj(raw);
  const short = str(team.short);
  return {
    name: str(team.name),
    short: short || undefined,
    logo: url(team.logo),
    href: url(team.href),
    placeholder: team.placeholder === true,
    own: team.own === true,
    score: num(team.score),
  };
}

/** Name mit Kurzform: beide Texte im Markup, der Kurzname ist für Hilfstechnik versteckt (der volle Name gilt). `extra`: weitere Klasse. */
export function nameText(team, names, extra) {
  const short = shortName(team);
  if (!short) return esc(team.name);
  return `<span class="${klass(extra, 'hoops-team-name', names === 'short' && 'hoops-team-name--short')}"><span class="hoops-name-full">${esc(team.name)}</span><span class="hoops-name-short" aria-hidden="true" title="${attr(team.name)}">${esc(short)}</span></span>`;
}

/** Dekoratives Logo (der Name steht daneben): Bild mit leerem Alternativtext, sonst die Initialen im Kreis. `extra`: Größenklasse. */
export function logoBadge(team, extra) {
  const inner = team.logo ? `<img src="${attr(team.logo)}" alt="" loading="lazy">` : esc(initials(team.name, 2));
  return `<span class="${klass('hoops-team-logo', extra, !team.logo && 'hoops-team-logo--initials')}" aria-hidden="true">${inner}</span>`;
}

// ── Form und Live ────────────────────────────────────────────

/** Form (letzte Spiele): Zeichen sind `aria-hidden`, der Text kommt aus `formLabel`; ohne gültigen Eintrag leer. */
export function formChips(form, variant, className, options) {
  const entries = formEntries(form);
  if (!entries.length) return '';
  // Die Buchstaben der Variante `letters` stehen im Attribut `data-letter` (das CSS zeigt sie mit `attr()`), damit sie aus dem Katalog kommen
  const items = entries.map((entry) => `<span class="hoops-form-item hoops-form-item--${entry.toLowerCase()}"${variant === 'letters' ? ` data-letter="${attr(outcomeLetter(entry, options))}"` : ''}></span>`).join('');
  return `<span class="${klass('hoops-form', variant === 'letters' && 'hoops-form--letters', className)}"><span class="hoops-form-list" aria-hidden="true">${items}</span><span class="hoops-sr-only">${esc(formLabel(form, options))}</span></span>`;
}

/** Grüner Live-Hinweis des Spielplans (wie MatchCard), steht hinter der Uhrzeit. */
export const liveTag = (options) => `<span class="hoops-match-live hoops-sch-live"><span class="hoops-match-pulse" aria-hidden="true"></span> ${esc(tr('common.live', undefined, options))}</span>`;

// ── Einklappbarer Rahmen ─────────────────────────────────────

const CHEVRON = '<svg class="hoops-acc-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 7.5l5 5 5-5"></path></svg>';

/**
 * Der einklappbare Rahmen von Tabelle, Spielplan und Ligencard: Kopf als Überschrift mit Button, Inhalt als Bereich. Das Markup entspricht
 * dem von `CollapsibleFrame` (Svelte und React); das Verhalten startet `initAccordion` (js/accordion.js), `mountX` verbindet beides.
 * `kind`: `frame` (hoops-frame) oder `league` (hoops-league). `meta` und `content` sind fertiges Markup der Render-Funktion (nie Rohtext von außen).
 */
export function collapsibleFrame({ kind, rootClass, id, title, sub, titleAs, open, meta, content, uid }) {
  const base = kind === 'league' ? 'hoops-league' : 'hoops-frame';
  const key = id || `hoops-cf-${uid}`;
  const tag = headingOf(titleAs);
  const sep = '<span class="hoops-acc-sep">,</span>';
  let label = esc(title);
  if (sub) label += `${sep}<span class="hoops-acc-sub">${esc(sub)}${meta ? sep : ''}</span>`;
  else if (meta) label += sep;
  return (
    `<div class="${klass(rootClass, 'is-collapsible', open && 'is-open')}"${id ? ` id="${attr(id)}"` : ''}>` +
    `<div class="${base}-head ${base}-head--acc"><${tag} class="${base}-title">` +
    `<button type="button" class="hoops-acc-trigger" id="${attr(key)}-trigger" aria-expanded="${open ? 'true' : 'false'}" aria-controls="${attr(key)}-panel">` +
    `<span class="hoops-acc-label">${label}</span>${meta ?? ''}${CHEVRON}</button></${tag}></div>` +
    `<div class="hoops-acc-panel" id="${attr(key)}-panel"${open ? '' : ' hidden inert'}><div class="hoops-acc-panel-inner">${content}</div></div>` +
    '</div>'
  );
}
