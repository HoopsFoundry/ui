export function setHoehe(el, px) {
  el.style.setProperty('--dss-map-h', `${px}px`);
  el.style.setProperty("--dss-title-size", '1rem');
  return getComputedStyle(el).getPropertyValue('--dss-title-size');
}
export const stufe = (id) => `var(--fs-${id})`;
export const familie = (name) => `--ink-${name}`;
export const eigen = { '--meine-farbe': 'red', '--dss-scroll-offset': '64px' };
