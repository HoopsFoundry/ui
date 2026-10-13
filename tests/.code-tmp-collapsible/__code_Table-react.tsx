import { useState } from 'react';
import { Accordion, Table } from '/Users/oliver-marcuseder/01-vibe-coding/00-Basektball/dss-design-system/.worktrees/vanilla-v1b/react/index.ts';
export function Spielseite() {
  const [open, setOpen] = useState(true);
  return (
    <>
      {/* Einzeln: open + onOpenChange (oder defaultOpen), id für den Deep-Link (…#boxscore) */}
      <Table
        collapsible
        id="boxscore"
        title="Spieler-Statistiken"
        meta="Stand · 4. Viertel"
        open={open}
        onOpenChange={setOpen}
        density="compact"
        columns={[
          { key: 'name', label: 'Spieler' },
          { key: 'pts', label: 'PTS', align: 'right' },
        ]}
      >
        <tr><td>J. Tanner</td><td className="num lead">22</td></tr>
        <tr><td>M. Okafor</td><td className="num lead">19</td></tr>
      </Table>

      {/* In einer Gruppe: Sprungleiste und „Alle öffnen/schließen“ */}
      <Accordion nav navLabel="Tabellen der Spielseite" expandAll>
        <Table collapsible id="heim" title="Boxscore Heim" density="compact" columns={[{ key: 'name', label: 'Spieler' }]}>
          <tr><td>J. Tanner</td></tr>
        </Table>
        <Table collapsible id="gast" title="Boxscore Gast" density="compact" columns={[{ key: 'name', label: 'Spieler' }]}>
          <tr><td>P. Kessel</td></tr>
        </Table>
      </Accordion>
    </>
  );
}