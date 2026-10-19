// Reine Regeln des Doku-Bausteins `Preview` (stories/docs/blocks/Preview.tsx): Adresse der eingebetteten Story, Maße des Iframes und
// ob die feststehende Vorschau automatisch wechselt. Ohne React und ohne DOM, damit Tests sie ausführen und verfälschen können.
import { BREITEN, breiteFromGlobals, type Breite } from '../../../.storybook/breite';

/** Globals, die eine eingebettete Story von der Doku-Seite übernimmt (Marke, Theme, Sprache, Bewegung, Fassung, Zustand). */
export const PASSED_GLOBALS = ['brand', 'theme', 'locale', 'motion', 'framework', 'state'] as const;

// Werte landen in der Adresse (`globals=a:b;c:d`); nur einfache Wörter, damit kein Trennzeichen eingeschleust wird.
const SAFE = /^[A-Za-z0-9_-]+$/;

/** Teil `globals=` der Adresse: übernommene Globals der Seite, überschrieben von `overrides` (etwa `theme: 'Dark'` auf der Seite Dark Mode). */
export function previewGlobals(globals: Record<string, unknown> | undefined, overrides: Record<string, string> = {}): string {
  const merged: Record<string, unknown> = { ...globals, ...overrides };
  return PASSED_GLOBALS.filter((k) => typeof merged[k] === 'string' && SAFE.test(merged[k] as string))
    .map((k) => `${k}:${merged[k]}`)
    .join(';');
}

/** Adresse des Iframes: Story-Ansicht ohne Storybook-Rahmen, mit den übernommenen Globals. */
export function previewSrc(storyId: string, globals: Record<string, unknown> | undefined, overrides: Record<string, string> = {}): string {
  const g = previewGlobals(globals, overrides);
  return `iframe.html?viewMode=story&id=${encodeURIComponent(storyId)}${g ? `&globals=${g}` : ''}`;
}

export type PreviewLayoutInput = {
  breite: Breite;
  /** verfügbare Breite der Vorschau-Spalte in px */
  available: number;
  /** gemessene Höhe des Story-Inhalts in px (0, solange unbekannt) */
  contentHeight: number;
  /** größte sichtbare Höhe in px (feststehende Vorschau: Fensterhöhe abzüglich Abstand bzw. 50 vh) */
  cap: number;
  /** kleinste Höhe in px (z. B. für Modale mit position: fixed, deren Inhalt keine Höhe meldet) */
  minHeight?: number;
  /** feste Höhe in px statt der Inhaltshöhe (z. B. eine lange Seite, in der der Iframe selbst scrollt) */
  fixedHeight?: number;
};

export type PreviewLayout = {
  /** Breite des Iframes in CSS-Pixeln (die Breite, die Media-Queries in der Story sehen) */
  width: number;
  /** Höhe des Iframes in CSS-Pixeln (vor der Skalierung) */
  height: number;
  /** Skalierung (1 = nicht verkleinert) */
  scale: number;
  /** sichtbare Maße nach der Skalierung */
  visualWidth: number;
  visualHeight: number;
  /** Beschriftung für Menschen, z. B. „Tablet · 768 px, verkleinert auf 78 %“ */
  label: string;
};

/**
 * Maße des Iframes: Die gewählte Gerätebreite gilt unverändert; ist sie breiter als die Spalte, wird der Iframe verkleinert (transform),
 * damit die Story trotzdem diese Breite sieht. Vollbreite nimmt die Spalte. Die Höhe folgt dem Inhalt, begrenzt auf `cap` (sichtbar) und
 * mindestens `minHeight`; ist der Inhalt höher, scrollt er im Iframe.
 */
export function previewLayout({ breite, available, contentHeight, cap, minHeight = 0, fixedHeight }: PreviewLayoutInput): PreviewLayout {
  const avail = Math.max(1, Math.floor(available));
  const device = BREITEN[breite].width;
  const width = device ?? avail;
  const scale = width > avail ? avail / width : 1;
  const visualCap = Math.max(1, cap);
  // Höhe im Iframe so wählen, dass die sichtbare Höhe (height * scale) die Grenze nicht überschreitet
  const wanted = fixedHeight ?? Math.max(minHeight, contentHeight || minHeight || 320);
  const height = Math.max(1, Math.round(Math.min(wanted, visualCap / scale)));
  const pct = Math.round(scale * 100);
  const name = device === null ? `Vollbreite · ${width} px` : BREITEN[breite].title;
  return {
    width,
    height,
    scale,
    visualWidth: Math.round(width * scale),
    visualHeight: Math.round(height * scale),
    label: scale < 1 ? `${name}, verkleinert auf ${pct} %` : name,
  };
}

/** Abstand der feststehenden Vorschau zum oberen und unteren Rand (px); dieselben Werte stehen in blocks.css. */
export const STICKY_GAP = 16;
/** Anteil der Fensterhöhe, den die feststehende Vorschau untereinander höchstens einnimmt (Spalte samt Liste und Beschriftung). */
export const NARROW_SHARE = 0.5;
/** Harte Obergrenze untereinander auch für feste Höhen (Modale, lange Seiten): sonst verdeckt die Vorschau bei Zoom 200 % oder Handy quer den Text (WCAG 1.4.10). */
export const NARROW_FIXED_SHARE = 0.6;
/** Anteil der Fensterhöhe für eine Vorschau außerhalb der feststehenden Spalte. */
export const FREE_SHARE = 0.8;
/** Kleinste sichtbare Höhe des Iframes in px: darunter ist ein Beispiel kaum zu bedienen. */
export const MIN_CAP = 160;

export type PreviewCapInput = {
  /** steht die Vorschau in der feststehenden Spalte (`.hoops-sp-aside`)? */
  inAside: boolean;
  /** Text und Vorschau nebeneinander (ab 1100 px) */
  wide: boolean;
  /** Fensterhöhe in px */
  viewportHeight: number;
  /** Höhe von allem in der Spalte außer dem Iframe-Kasten (Liste, Beschriftung, Innenabstand) in px */
  overhead: number;
  /** feste Höhe der Vorschau in px, falls gesetzt */
  fixedHeight?: number;
};

/**
 * Größte sichtbare Höhe des Iframes in px. Nebeneinander (feststehend) die Fensterhöhe abzüglich Abstand und Spalten-Überbau, auch eine
 * feste Höhe darf bis zur Fensterhöhe wachsen (die Vorschau steht neben dem Text). Untereinander steht die Vorschau über dem Text: die
 * ganze Spalte höchstens 50 vh, mit fester Höhe höchstens 60 vh; der Iframe scrollt dann selbst. Außerhalb der Spalte 80 % der Fensterhöhe
 * (feste Höhe bis zur Fensterhöhe). Nie unter `MIN_CAP`.
 */
export function previewCap({ inAside, wide, viewportHeight: vh, overhead, fixedHeight }: PreviewCapInput): number {
  let next: number;
  if (!inAside) {
    next = Math.floor(vh * FREE_SHARE);
    if (fixedHeight) next = Math.max(next, Math.min(fixedHeight, vh - 2 * STICKY_GAP));
  } else if (wide) {
    next = Math.floor(vh - 2 * STICKY_GAP - overhead);
    if (fixedHeight) next = Math.max(next, Math.min(fixedHeight, vh - 2 * STICKY_GAP));
  } else {
    next = Math.floor(vh * NARROW_SHARE - overhead);
    if (fixedHeight) next = Math.max(next, Math.min(fixedHeight, Math.floor(vh * NARROW_FIXED_SHARE - overhead)));
  }
  return Math.max(MIN_CAP, next);
}

/** Breite aus den Globals der Seite (Umschalter „Breite“). */
export const breiteOf = breiteFromGlobals;

/**
 * Lesezeile als Anteil der Fensterhöhe: nebeneinander im oberen Drittel, untereinander unterhalb der Vorschau, die oben höchstens die
 * Hälfte einnimmt.
 */
export const READ_LINE_WIDE = 0.3;
export const READ_LINE_NARROW = 0.62;

/**
 * Aktiver Abschnitt: der letzte, dessen Anfang (`tops`, Abstand zum oberen Fensterrand) die Lesezeile erreicht hat; liegt noch keiner
 * darüber, der erste.
 */
export function activeStep(tops: number[], line: number): number {
  let active = 0;
  tops.forEach((top, i) => {
    if (top <= line) active = i;
  });
  return active;
}

/**
 * Automatischer Wechsel des Beispiels beim Scrollen: nur ohne reduzierte Bewegung (Systemeinstellung `prefers-reduced-motion` oder Umschalter
 * „Bewegung“, `data-motion="reduce"` auf <html>). Sonst bleibt das gewählte Beispiel stehen und die Liste wählt.
 */
export function autoSwitchAllowed(prefersReducedMotion: boolean, dataMotion: string | undefined): boolean {
  return !prefersReducedMotion && dataMotion !== 'reduce';
}
