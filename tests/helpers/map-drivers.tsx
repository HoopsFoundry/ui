// Gemeinsamer Prüfstand für die Svelte- und die React-Karte: dieselben Szenarien laufen gegen beide Fassungen.
import { StrictMode, createElement } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { flushSync, mount, tick, unmount } from 'svelte';
import MapHost from './MapHost.svelte';
import { MapView } from '../../react/Map';

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
export const drivers: Driver[] = [svelteDriver, reactDriver];
export const cleanupAll = () => { cleanup(); document.body.replaceChildren(); };
