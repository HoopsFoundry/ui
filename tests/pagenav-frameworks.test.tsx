// Seitennavigation in Svelte und React: eine umbenannte Überschrift (der Framework ändert nur den Text) erscheint in der Navigation.
import { flushSync, mount, unmount } from 'svelte';
import { render, cleanup } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initPageNav } from '../js/pagenav.js';
import Host from './helpers/PageNavHost.svelte';

function ReactPage({ names }: { names: string[] }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const h = initPageNav(ref.current!);
    return () => h.destroy();
  }, []);
  return <main ref={ref}>{names.map((n, i) => <h2 key={i}>{n}</h2>)}</main>;
}
const links = () => [...document.querySelectorAll('.dss-pagenav-link')].map((a) => a.textContent);

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('umbenannte Überschriften', () => {
  it('React: der neue Text erscheint nach der Entprellung', async () => {
    vi.useFakeTimers();
    const { rerender } = render(<ReactPage names={['A', 'B', 'C']} />);
    expect(links()).toEqual(['A', 'B', 'C']);
    rerender(<ReactPage names={['A', 'Neu', 'C']} />);
    await vi.advanceTimersByTimeAsync(300);
    expect(links()).toEqual(['A', 'Neu', 'C']);
  });
  it('Svelte: der neue Text erscheint nach der Entprellung', async () => {
    vi.useFakeTimers();
    const target = document.createElement('div');
    document.body.append(target);
    const app = mount(Host, { target }) as unknown as { setNames: (n: string[]) => void };
    flushSync();
    expect(links()).toEqual(['A', 'B', 'C']);
    app.setNames(['A', 'Neu', 'C']);
    flushSync();
    await vi.advanceTimersByTimeAsync(300);
    expect(links()).toEqual(['A', 'Neu', 'C']);
    unmount(app as never);
  });
});
