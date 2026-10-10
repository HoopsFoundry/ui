// Erfundene Demo-Liga für die Doku der Ligencard (nur Storybook): „Oberliga Nordhain Männer“ mit zwölf Teams.
import type { LeagueTeam } from '../../js/league.js';
import nordhainLogo from '../assets/logos/nordhain.svg';
import hawksLogo from '../assets/logos/hawks.svg';
import seebergLogo from '../assets/logos/seeberg.svg';
import elbachLogo from '../assets/logos/elbach.svg';

export const LIGA = 'Oberliga Nordhain Männer';
export const LOGO: Record<string, string> = {
  'TSV Nordhain 1920': nordhainLogo,
  'Lindenberg Hawks': hawksLogo,
  'BG Seeberg': seebergLogo,
  'TSV Elbach': elbachLogo,
};

// Name und Kurzname je Mannschaft (SV Kiefernau und weitere ohne Logo zeigen die Initialen)
const CLUBS: [string, string | undefined][] = [
  ['Lindenberg Hawks', 'Hawks'], ['BG Seeberg', 'Seeberg'], ['TSV Elbach', 'Elbach'], ['SV Kiefernau', 'Kiefernau'], ['TuS Waldmark', 'Waldmark'],
  ['BC Sonnental', 'Sonnental'], ['Hafenstadt Giants', 'Giants'], ['SG Moorberg', 'Moorberg'], ['Basket Auenland', 'Auenland'], ['TV Felsenau', 'Felsenau'], ['BG Rotbach', 'Rotbach'],
];
const OWN: [string, string] = ['TSV Nordhain 1920', 'Nordhain'];
const WON = [10, 9, 8, 7, 7, 6, 5, 4, 3, 3, 2, 1];
const FORMS: ('S' | 'N' | 'U')[][] = [
  ['S', 'S', 'S', 'N', 'S'], ['S', 'S', 'N', 'S', 'S'], ['S', 'N', 'S', 'S', 'N'], ['N', 'S', 'S', 'S', 'N'], ['S', 'N', 'N', 'S', 'S'], ['N', 'S', 'N', 'S', 'N'],
  ['S', 'N', 'N', 'N', 'S'], ['N', 'N', 'S', 'N', 'N'], ['N', 'S', 'N', 'N', 'S'], ['N', 'N', 'N', 'S', 'N'], ['N', 'N', 'S', 'N', 'N'], ['N', 'N', 'N', 'N', 'N'],
];
// Aufstieg: Platz 1, Relegation: Platz 10, Abstieg: Plätze 11 und 12
const ZONE: Record<number, LeagueTeam['zone']> = { 1: 'up', 10: 'playoff', 11: 'down', 12: 'down' };

/**
 * Tabelle der Demo-Liga. `ownRank`: Platz von TSV Nordhain 1920 (die Mannschaft rückt dorthin, die anderen rutschen nach);
 * ohne Angabe oder 0 gibt es keine eigene Mannschaft und Nordhain steht auf Platz 4. `zones` setzt Aufstieg, Relegation und Abstieg.
 * `logos`: ob die Teams mit Demo-Logo ein `logo` tragen (die Initialen-Teams haben nie eines).
 */
export function demoTable(ownRank = 0, options: { zones?: boolean; logos?: boolean; links?: boolean } = {}): LeagueTeam[] {
  const { zones = false, logos = true, links = false } = options;
  const order = [...CLUBS];
  const ownIndex = ownRank >= 1 ? Math.min(ownRank, 12) - 1 : 3;
  order.splice(ownIndex, 0, OWN);
  return order.map(([name, short], i) => {
    const won = WON[i];
    const lost = 11 - won;
    const team: LeagueTeam = {
      rank: i + 1, name, short, played: 11, points: won * 2, won, lost, diff: (won - lost) * 7 + (i % 3), form: FORMS[i],
    };
    if (logos && LOGO[name]) team.logo = LOGO[name];
    if (links) team.href = `#team-${i + 1}`;
    if (ownRank >= 1 && name === OWN[0]) team.own = true;
    if (zones && ZONE[i + 1]) team.zone = ZONE[i + 1];
    return team;
  });
}
