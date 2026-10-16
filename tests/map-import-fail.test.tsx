// @vitest-environment jsdom
// Karte ohne Leaflet: schlägt `import('leaflet')` fehl (Paket nicht installiert, Bundler ohne Chunk, Netz weg), bleibt die Textalternative
// und der Fehlerhinweis erscheint; kein harter Fehler, kein leeres Rechteck.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanupAll, drivers } from './helpers/map-drivers';

vi.mock('leaflet', () => {
  throw new Error('Cannot find module leaflet');
});

const props = { markers: [{ id: 'a', lat: 49.4875, lng: 8.466, label: 'Sporthalle Nordhain' }], label: 'Karte der Sporthalle' };

afterEach(() => {
  cleanupAll();
  vi.restoreAllMocks();
});

describe.each(drivers)('Karte ohne Leaflet · $name', (driver) => {
  it('Klick auf „Karte laden“: Fehlerhinweis mit role=status, Liste bleibt, Konsolenwarnung, onerror meldet „import“', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const spy = vi.fn();
    const m = driver.mount({ ...props, ...(driver.name === 'Svelte' ? { onerror: spy } : { onError: spy }) });
    (m.root.querySelector('.hoops-map-load') as HTMLElement).click();
    await vi.waitFor(() => expect(spy).toHaveBeenCalledWith('import'));
    await m.settle();
    const root = m.root.querySelector('.hoops-map')!;
    expect(root.getAttribute('data-state')).toBe('error');
    expect(m.root.querySelector('[role="status"]')?.textContent).toBe('Die Karte konnte nicht geladen werden. Adresse und Route siehe unten.');
    expect(m.root.querySelector('.hoops-map-canvas')).toBeNull();
    expect(m.root.querySelector('.hoops-map-load')).toBeNull();
    expect(m.root.querySelectorAll('.hoops-map-item')).toHaveLength(1);
    expect(m.root.querySelector('.hoops-map-coords')?.textContent).toBe('49,4875° N, 8,4660° O');
    expect(m.root.querySelector('.hoops-map-attr a')).not.toBeNull();
    expect(warn.mock.calls.flat().join(' ')).toContain('import');
    await m.unmount();
  });
  it('load="auto": derselbe Fehlerzustand ohne Klick', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = driver.mount({ ...props, load: 'auto' });
    await vi.waitFor(() => expect(m.root.querySelector('.hoops-map')?.getAttribute('data-state')).toBe('error'));
    await m.unmount();
  });
});
