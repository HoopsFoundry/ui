/** Text für Markup: Zeichenketten und endliche Zahlen, alles andere ergibt `''`; `& < > " '` werden maskiert, Steuerzeichen entfallen. */
export function esc(value: unknown): string;
/** Wert für ein Attribut in doppelten Anführungszeichen; dieselben Regeln wie `esc`. */
export function attr(value: unknown): string;
