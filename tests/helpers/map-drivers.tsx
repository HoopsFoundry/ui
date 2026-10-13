// Gemeinsamer Prüfstand für die Svelte- und die React-Karte: dieselben Szenarien laufen gegen beide Fassungen.
import { StrictMode, createElement } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { flushSync, mount, tick, unmount } from 'svelte';
import MapHost from './MapHost.svelte';
import { MapView } from '../../react/Map';
import { mountMap } from '../../js/map-vanilla.js';

export interface Driver {
  name: string;
  /** Mountet die Karte; `root` ist der Elternknoten im Dokument. */
  mount(props: Record<string, unknown>): Mounted;
}
export interface Mounted {
  root: HTMLElement;
  set(patch: Record<string, unknown>): Promise<void>;
  unmount(): Promise<void>;
  /** Wartet, bis Mikrotasks (Import, Effekte) durch sind. */
  settle(): Promise<void>;
  /** Führt Code aus, der Zustand ändert (React: act). */
  act(fn: () => void): Promise<void>;
}

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

export const svelteDriver: Driver = {
  name: 'Svelte',
  mount(initial) {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const instance = mount(MapHost, { target, props: { initial } }) as unknown as { set: (patch: Record<string, unknown>) => void };
    flushSync();
    let gone = false;
    const settle = async () => { await nextTick(); await tick(); flushSync(); await nextTick(); await tick(); flushSync(); };
    return {
      root: target,
      async set(patch) { instance.set(patch); await settle(); },
      async unmount() { if (!gone) { gone = true; void unmount(instance as never); } target.remove(); await settle(); },
      settle,
      async act(fn) { fn(); await settle(); },
    };
  },
};

const reactDriverOf = (name: string, strict: boolean): Driver => ({
  name,
  mount(initial) {
    const el = (props: Record<string, unknown>) => {
      const node = createElement(MapView, props as never);
      return strict ? createElement(StrictMode, null, node) : node;
    };
    const result = render(el(initial));
    const settle = async () => { await act(async () => { await nextTick(); }); await act(async () => { await nextTick(); }); };
    let current = initial;
    return {
      root: result.container,
      async set(patch) { current = { ...current, ...patch }; result.rerender(el(current)); await settle(); },
      async unmount() { result.unmount(); await settle(); },
      settle,
      async act(fn) { await act(async () => { fn(); }); await settle(); },
    };
  },
});

export const reactDriver = reactDriverOf('React', false);
export const reactStrictDriver = reactDriverOf('React (StrictMode)', true);
// Vanilla: mountMap in einen Behälter; `set` aktualisiert mit allen bisherigen Eigenschaften (wie die Fassungen mit Zustand)
export const vanillaDriver: Driver = {
  name: 'Vanilla',
  mount(initial) {
    const target = document.createElement('div');
    document.body.appendChild(target);
    let current = { ...initial };
    const handle = mountMap(target, current as never);
    let gone = false;
    const settle = async () => { await nextTick(); await nextTick(); };
    return {
      root: target,
      // ein ausdrücklich auf undefined gesetzter Wert heißt hier „zurücknehmen“: die Karte kennt dafür null (undefined wird ignoriert)
      async set(patch) { current = { ...current, ...patch }; handle.update(Object.fromEntries(Object.entries(current).map(([k, v]) => [k, v === undefined ? null : v])) as never); await settle(); },
      async unmount() { if (!gone) { gone = true; handle.destroy(); } target.remove(); await settle(); },
      settle,
      async act(fn) { fn(); await settle(); },
    };
  },
};

export const drivers: Driver[] = [svelteDriver, reactDriver, vanillaDriver];
export const cleanupAll = () => { cleanup(); document.body.replaceChildren(); };
