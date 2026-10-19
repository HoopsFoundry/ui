// Breite der eingebetteten Vorschauen (Umschalter „Breite“, Global `breite`). Das Viewport-Werkzeug von Storybook 10 wirkt nur in der
// Story-Ansicht: In der Docs-Ansicht meldet es fest „Responsive“ und blendet sein Werkzeug aus, und in der Story-Ansicht ändert es den ganzen
// Vorschau-Rahmen, nie einzelne eingebettete Stories. Deshalb setzt ein eigenes Global die Breite der Vorschau-Iframes (`Preview` in
// stories/docs/blocks/Preview.tsx). Media-Queries greifen dort echt, weil der Iframe wirklich so breit ist.

export type Breite = 'voll' | 'handy' | 'tablet' | 'desktop';

export const BREITEN: Record<Breite, { title: string; width: number | null; height: number }> = {
  voll: { title: 'Vollbreite', width: null, height: 900 },
  handy: { title: 'Handy · 390 px', width: 390, height: 844 },
  tablet: { title: 'Tablet · 768 px', width: 768, height: 1024 },
  desktop: { title: 'Desktop · 1280 px', width: 1280, height: 800 },
};

/** Breite aus den Globals; Unbekanntes und Fehlendes ergeben `voll` (Start: volle verfügbare Breite). */
export function breiteFromGlobals(globals: Record<string, unknown> | undefined): Breite {
  const v = globals?.breite;
  return typeof v === 'string' && Object.hasOwn(BREITEN, v) ? (v as Breite) : 'voll';
}

/** Gerätegrößen für das Viewport-Werkzeug der Story-Ansicht (dieselben Breiten wie der Umschalter „Breite“ der Doku). */
export const VIEWPORT_OPTIONS = Object.fromEntries(
  (Object.entries(BREITEN) as [Breite, (typeof BREITEN)[Breite]][])
    .filter(([, b]) => b.width !== null)
    .map(([key, b]) => [key, { name: b.title, styles: { width: `${b.width}px`, height: `${b.height}px` }, type: key === 'handy' ? 'mobile' : key }]),
);
