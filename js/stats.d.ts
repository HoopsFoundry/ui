/** Eine Kennzahl: Beschriftung und Wert. */
export interface StatInput {
  label: string;
  /** Zahl (Dezimalkomma) oder Text; `null` oder leer ergibt den Gedankenstrich mit verstecktem Text „keine Angabe“. */
  value?: number | string | null;
}

export interface StatItem {
  label: string;
  /** Anzeigetext; bei `empty` der Gedankenstrich. */
  value: string;
  empty: boolean;
}

export const statEmptyText: string;
export function statItems(items: unknown): StatItem[];
