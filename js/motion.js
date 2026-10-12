/**
 * DSS Motion · eine Frage, eine Antwort: Soll Bewegung entfallen?
 * --------------------------------------------------------------
 * Gemeinsam für Karte, Seitennavigation, Nach-oben-Knopf und weitere Bausteine. Ohne Abhängigkeiten, SSR-sicher (beim Import wird
 * weder `window` noch `document` gelesen). Typen: js/motion.d.ts.
 */

/** „Bewegung reduzieren“ (Systemeinstellung) oder `data-motion="reduce"` auf <html> (Pause-Schalter der App, WCAG 2.2.2). */
export function reducedMotion() {
  if (typeof window === 'undefined') return false;
  const system = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = typeof document !== 'undefined' ? document.documentElement : null;
  return system || root?.dataset?.motion === 'reduce';
}
