// Svelte (Entwicklungsmodus): doppelte und fehlende `id` an den Spielen werfen keinen each_key_duplicate, die Karte bleibt sichtbar.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import VenueCard from '../svelte/VenueCard.svelte';

const game = (id: unknown) => ({ id, state: 'scheduled', heim: { name: 'A' }, gast: { name: 'B' } });
let instance: ReturnType<typeof mount> | undefined;
afterEach(() => {
  if (instance) void unmount(instance);
  instance = undefined;
  document.body.innerHTML = '';
});

describe('VenueCard (Svelte, dev): Listenschlüssel', () => {
  it('doppelte, leere und fehlende id: alle Zeilen erscheinen', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const target = document.body.appendChild(document.createElement('div'));
    instance = mount(VenueCard, { target, props: { name: 'H', limit: 5, games: [game('x'), game('x'), game(''), game(undefined), game(7)] } as never });
    flushSync();
    expect(target.querySelectorAll('.hoops-venue-game')).toHaveLength(5);
    expect(target.querySelector('.hoops-venue-title')?.textContent).toBe('H');
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
  it('Name leer: keine Überschrift', () => {
    const target = document.body.appendChild(document.createElement('div'));
    instance = mount(VenueCard, { target, props: { name: ' ', href: '/h' } as never });
    flushSync();
    expect(target.querySelector('.hoops-venue-title')).toBeNull();
    expect(target.querySelector('.hoops-venue-more')).not.toBeNull();
  });
});
