/** Ein Kopf für die Tastaturnavigation: `disabled` überspringt ihn (oder `true`). */
export type AccordionHeader = { disabled?: boolean } | boolean;
/** Knoten des Bereichsbaums: `parent` fehlt oder ist `null` bei einem Bereich der obersten Ebene. */
export interface AccordionTreeNode {
  id: string;
  parent?: string | null;
}
export interface AccordionOptions {
  /** Nur ein Bereich gleichzeitig offen (Standard `false`). */
  exclusive?: boolean;
  /** Deep-Link: `#id` öffnet den Bereich samt Eltern (Standard `true`). */
  syncHash?: boolean;
  /** „Alle öffnen“ / „Alle schließen“ mit Ansage (nicht bei `exclusive`). */
  expandAll?: boolean;
  /** Sprungleiste mit Links auf die Bereiche. */
  nav?: boolean;
  /** Kopf des offenen Bereichs klebt oben (`--hoops-acc-sticky-top`). */
  sticky?: boolean;
  /** Name der Sprungleiste (`aria-label` und Text des Handy-Schalters), Standard „Bereiche“. */
  navLabel?: string;
}

/**
 * Index des Kopfes, auf den der Fokus bei einer Taste springt (Pfeil ab/auf, Home, End). Deaktivierte Köpfe werden übersprungen,
 * an den Enden gibt es keinen Umlauf; andere Tasten, ungültige Eingaben oder kein Ziel ergeben den aktuellen Index.
 */
export function nextHeader(index: number, key: string, headers: AccordionHeader[]): number;
/** Die id aus `ids`, die der URL-Anker meint (mit oder ohne `#`, URL-kodiert), sonst `null`. */
export function hashTarget(hash: string, ids: string[]): string | null;
/** Eltern-Bereiche von `id` (Wurzel zuerst), die zum Sichtbarmachen geöffnet werden müssen; unbekannte id ergibt `[]`. */
export function ancestorsOf(id: string, tree: AccordionTreeNode[]): string[];
/** Zugänglicher Name mit Zusatzinfo: `'Kader, 14 Spieler'`, ohne Doppelung. */
export function labelWithMeta(title: unknown, meta?: unknown): string;
/** Ansage nach „Alle öffnen/schließen“: „Alle Bereiche geöffnet“, „3 von 5 Bereichen geöffnet“ … */
export function summaryText(open: number, total: number): string;
/** Aktueller URL-Anker ohne `#` (dekodiert); ohne Browser leer. */
export function currentHash(): string;
/** Setzt beim Öffnen `#id` per `history.replaceState`; beim Schließen wird der Anker nur entfernt, wenn er zu `id` gehört. */
export function writeHash(id: string, open: boolean): void;
/** Höhe des klebenden Kopfes eines umgebenden Bereichs, der ein verschachteltes Ziel verdecken würde (sonst 0). */
export function stickyOffset(el: Element | null | undefined): number;
/** Scrollt das Element nach dem nächsten Frame in Sicht; der Abstand nach oben enthält `--hoops-acc-sticky-top` und den klebenden Kopf der Eltern (ohne Browser ohne Wirkung). */
export function scrollToElement(el: Element | null | undefined, options?: { behavior?: 'auto' | 'smooth' }): void;
/** Öffnet alle Bereiche und `<details>`, die `target` umgeben (Klick auf den Kopf, von außen nach innen); gesperrte bleiben zu. `true`, wenn etwas geöffnet wurde. */
export function revealAround(target: Element | null | undefined): boolean;
/** Ist das Element ein Bereich der Gruppe (Karte oder einklappbarer Rahmen)? */
export function isAccordionItem(el: Element | null | undefined): boolean;
/** Tastatur einer Gruppe (Pfeil ab/auf, Home, End zwischen den Köpfen; deaktivierte übersprungen). `true`, wenn die Taste behandelt wurde (dann `preventDefault`). */
export function moveFocus(root: Element, trigger: Element, key: string, modifiers?: { altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }): boolean;
/** Rückgabe der Init-Funktionen: Funktion zum Aufräumen (wie bisher) und zugleich `.destroy()` (Muster `{ destroy() }`). */
export type AccordionHandle = (() => void) & { destroy(): void };

/** Macht ein Accordion im Vanilla-Markup bedienbar (Button-Weg und natives `details`); gibt eine Aufräum-Funktion mit `.destroy()` zurück. */
export function initAccordion(root: Element, options?: AccordionOptions): AccordionHandle;
/** Startet alle `[data-dss-acc]`-Gruppen unterhalb von `scope` (Standard: das Dokument). */
export function initAccordions(scope?: ParentNode, options?: AccordionOptions): AccordionHandle;

/** Ein angemeldeter Bereich (Werte als Getter, damit sie aktuell bleiben). `anchor: false`: kein öffentlicher Anker (keine Sprungleiste, kein Hash). */
export interface CollapsibleEntry {
  readonly id: string;
  readonly title: string;
  readonly open: boolean;
  readonly disabled: boolean;
  readonly anchor: boolean;
  readonly el: HTMLElement | null | undefined;
  readonly trigger: HTMLElement | null | undefined;
  reveal(): void;
  setOpen(open: boolean): void;
}
/** Was `createCollapsible` von der Gruppe braucht. */
export interface CollapsibleGroup {
  exclusive: boolean;
  syncHash: boolean;
  closeOthers(id: string): void;
}
/** Die Oberfläche (Svelte oder React) liefert den Stand über Funktionen. */
export interface CollapsibleHost {
  id(): string;
  title(): string;
  open(): boolean;
  disabled(): boolean;
  anchor(): boolean;
  group(): CollapsibleGroup | undefined;
  parent(): { reveal(): void } | undefined;
  el(): HTMLElement | null | undefined;
  trigger(): HTMLElement | null | undefined;
  panel(): HTMLElement | null | undefined;
  commit(next: boolean): void;
}
/** Verhalten eines einklappbaren Bereichs ohne Oberfläche (gemeinsam für `AccordionItem` und die einklappbaren Tabellenrahmen). */
export function createCollapsible(host: CollapsibleHost): {
  setOpen(next: boolean, user?: boolean): void;
  reveal(): void;
  checkHash(): void;
  entry: CollapsibleEntry;
};
