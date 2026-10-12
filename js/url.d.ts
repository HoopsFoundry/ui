/**
 * Prüft ein Link-Ziel: nur `http:`, `https:`, `mailto:`, `tel:`, Pfade (`/…`, `./…`, `../…`, `ort/seite`, `?…`) und `#`-Ziele;
 * alles andere (`javascript:`, `data:`, `vbscript:`, Steuerzeichen am Anfang) ergibt `undefined`.
 */
export function safeHref(href: unknown): string | undefined;
