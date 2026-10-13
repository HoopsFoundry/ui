// Markup dreier Fassungen vergleichbar machen (Svelte-SSR, React-SSR, Vanilla-`renderX`): Kommentare, Whitespace-Knoten, Entitäten, Reihenfolge
// der Attribute und Klassen, erzeugte ids (Svelte `c1`, React `:r0:`, Vanilla Hash) werden angeglichen.
const TAG = /<([A-Za-z][\w-]*)((?:\s+[\w:.-]+(?:="[^"]*")?)*)\s*\/?>/g;
const ATTR = /([\w:.-]+)(?:="([^"]*)")?/g;

export const normalize = (html: string) => {
  const ids = new Map<string, string>();
  const key = (prefix: string, value: string) => {
    const full = `${prefix}${value}`;
    if (!ids.has(full)) ids.set(full, `${prefix}i${ids.size + 1}`);
    return ids.get(full)!;
  };
  let text = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/ onerror="this\.__e=event"/g, '')
    .replace(/ (hidden|inert)=""/g, ' $1')
    // erzeugte ids angleichen: Rahmenkopf (dss-cf-<id>-trigger|panel) und Karte (dss-map-canvas-<id>, dss-map-text-<id>)
    .replace(/dss-cf-([^"#]+?)-(trigger|panel)(?=")/g, (_m, id: string, part: string) => `${key('dss-cf-', id)}-${part}`)
    .replace(/(dss-map-(?:canvas|text)-)([^"#]+)/g, (_m, prefix: string, id: string) => key(prefix, id));
  // Attribute je Tag nach Name sortieren (Reihenfolge ist in HTML bedeutungslos), Klassen sortieren, Stil glätten
  text = text.replace(TAG, (_m, name: string, attrs: string) => {
    const list: [string, string | undefined][] = [];
    // Attributnamen sind in HTML ohne Groß-/Kleinschreibung (React schreibt `colSpan`, Svelte und Vanilla `colspan`)
    for (const m of attrs.matchAll(ATTR)) list.push([m[1].toLowerCase(), m[2]]);
    list.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    const out = list
      .filter(([k, v]) => !(k === 'class' && (v ?? '').trim() === ''))
      .map(([k, v]) => {
        if (v === undefined) return k;
        if (k === 'class') return `${k}="${v.trim().split(/\s+/).sort().join(' ')}"`;
        if (k === 'style') return `${k}="${v.replace(/\s*:\s*/g, ':').replace(/;\s*$/, '').replace(/\s*;\s*/g, ';')}"`;
        return `${k}="${v}"`;
      });
    return `<${name}${out.length ? ` ${out.join(' ')}` : ''}>`;
  });
  return text
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&#(?:x27|39);/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/ ?> ?/g, '>')
    .replace(/ ?</g, '<')
    .trim();
};
