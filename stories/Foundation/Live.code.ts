// Pause-Schalter für die Live-Animation: setzt data-motion="reduce" auf <html> und merkt sich die Wahl.
export const pauseVanilla = `<!-- Das Attribut genügt: alle Live-Stellen stehen still -->
<html data-motion="reduce">

<button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--sm" id="motion-toggle" aria-pressed="false">
  Live-Animation pausieren
</button>

<script>
  const KEY = 'hoops-motion';
  const button = document.getElementById('motion-toggle');
  function apply(paused) {
    const root = document.documentElement;
    if (paused) root.dataset.motion = 'reduce';
    else delete root.dataset.motion;
    button.setAttribute('aria-pressed', String(paused));
    try { localStorage.setItem(KEY, paused ? 'reduce' : 'normal'); } catch {}
  }
  let saved = false;
  try { saved = localStorage.getItem(KEY) === 'reduce'; } catch {}
  apply(saved);
  button.addEventListener('click', () => apply(button.getAttribute('aria-pressed') !== 'true'));
</script>`;

export const pauseSvelte = `<script lang="ts">
  const KEY = 'hoops-motion';

  function readSaved(): boolean {
    try { return localStorage.getItem(KEY) === 'reduce'; } catch { return false; }
  }

  let paused = $state(readSaved());

  $effect(() => {
    const root = document.documentElement;
    if (paused) root.dataset.motion = 'reduce';
    else delete root.dataset.motion;
    try { localStorage.setItem(KEY, paused ? 'reduce' : 'normal'); } catch {}
  });
</script>

<button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--sm" aria-pressed={paused} onclick={() => (paused = !paused)}>
  Live-Animation pausieren
</button>`;

export const pauseReact = `import { useEffect, useState } from 'react';

const KEY = 'hoops-motion';

function readSaved(): boolean {
  try { return localStorage.getItem(KEY) === 'reduce'; } catch { return false; }
}

export function MotionToggle() {
  const [paused, setPaused] = useState(readSaved);

  useEffect(() => {
    const root = document.documentElement;
    if (paused) root.dataset.motion = 'reduce';
    else delete root.dataset.motion;
    try { localStorage.setItem(KEY, paused ? 'reduce' : 'normal'); } catch {}
  }, [paused]);

  return (
    <button type="button" className="hoops-btn hoops-btn--secondary hoops-btn--sm" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
      Live-Animation pausieren
    </button>
  );
}`;
