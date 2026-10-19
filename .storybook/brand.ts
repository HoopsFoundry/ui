// Marke der Storybook-Vorschau (Umschalter „Marke“, Global `brand`). Die Marke bringt ihre Schrift mit: BBV nutzt die Standardschrift
// (Sora, Manrope), DBB die Schrift von basketball-bund.de (Rubik, Sucrose mit Rückfall Barlow Condensed). Ein eigener Umschalter „Schrift“
// (früher Global `type`) entfällt; `data-type` folgt der Marke. Die Seite Foundation/Typography zeigt beide Schriften fest nebeneinander.

export type DocBrand = 'bbv' | 'dbb';

/** Marke aus den Globals: `dbb` nur bei ausdrücklicher Wahl, sonst `bbv` (Start). Ein altes Global `type` wird nicht ausgewertet. */
export function brandFromGlobals(globals: Record<string, unknown> | undefined): DocBrand {
  return globals?.brand === 'dbb' ? 'dbb' : 'bbv';
}

/** Setzt `data-brand` und `data-type` auf das Wurzelelement: beide `dbb` bei der Marke DBB, beide entfernt bei BBV. */
export function applyBrand(globals: Record<string, unknown> | undefined, root: HTMLElement = document.documentElement): DocBrand {
  const brand = brandFromGlobals(globals);
  if (brand === 'dbb') {
    root.setAttribute('data-brand', 'dbb');
    root.setAttribute('data-type', 'dbb');
  } else {
    root.removeAttribute('data-brand');
    root.removeAttribute('data-type');
  }
  return brand;
}
