// Doku-Hilfe: Die Vanilla-Code-Beispiele sind deutsch geschrieben (die Doku ist deutsch) und enthalten an einigen Stellen eingebaute Texte von Hand
// (aria-label="Schließen", „Menü“, „Karte laden“, „keine Angabe“, die Formleiste …). Die Vorschauen setzen dieses Markup ein; damit sie dem Umschalter
// „Sprache“ folgen, ersetzt diese Funktion genau diese Katalogtexte durch die Texte der aktuellen Sprache. Alles andere (Demodaten, Namen, Titel)
// bleibt, wie es im Code-Beispiel steht. Nur für Storybook; Anwendungen schreiben solches Markup mit `t()` oder lassen den Baustein den Text setzen.
import de from '../../js/i18n/de.js';
import { t } from '../../js/i18n/index.js';
import { formLabel, outcomeLetter } from '../../js/league.js';

/** Schlüssel, deren deutscher Text in handgeschriebenem Markup der Code-Beispiele vorkommt. */
export const LOCALIZED_KEYS = ['modal.close', 'appnav.menu', 'map.load', 'map.attribution', 'map.zoom-in', 'map.zoom-out', 'stats.empty', 'pagenav.label', 'theme.toggle', 'player.captain', 'backtop.label'] as const;

const LETTER: Record<string, string> = { S: 'S', N: 'N', U: 'U' };
const WORD: Record<string, string> = { Sieg: 'S', Niederlage: 'N', Unentschieden: 'U' };

/** Ersetzt die eingebauten deutschen Texte im Markup durch die der aktuellen Sprache (in Text, als ganzer Attributwert oder JSON-Wert). */
export function localizeMarkup(markup: string): string {
  let out = markup;
  for (const key of LOCALIZED_KEYS) {
    const from = (de as Record<string, string>)[key];
    const to = t(key);
    if (from === to) continue;
    out = out.split(`>${from}<`).join(`>${to}<`).split(`"${from}"`).join(`"${to}"`);
  }
  // Formleiste: Buchstaben (data-letter) und der versteckte Satz „Form: Sieg, Niederlage …“ kommen aus dem Katalog
  out = out.replace(/data-letter="([SNU])"/g, (_m, l: string) => `data-letter="${outcomeLetter(LETTER[l])}"`);
  out = out.replace(/>Form: ([A-Za-zäöü, ]+)</g, (whole, words: string) => {
    const entries = words.split(', ').map((w) => WORD[w]);
    return entries.every(Boolean) ? `>${formLabel(entries)}<` : whole;
  });
  return out;
}
