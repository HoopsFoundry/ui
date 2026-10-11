// Markup beider Fassungen vergleichbar machen (Hallenkarte).
// Ids der Karte sind pro Fassung verschieden (Svelte `c1`, React `:r0:`): in Reihenfolge des Auftretens durch i1, i2 … ersetzen
export const normalize = (html: string) => {
  const ids = new Map<string, string>();
  const key = (value: string) => {
    if (!ids.has(value)) ids.set(value, `i${ids.size + 1}`);
    return ids.get(value)!;
  };
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/ onerror="this\.__e=event"/g, '')
    .replace(/(dss-map-(?:canvas|text)-)([^"#]+)/g, (_m, prefix: string, id: string) => `${prefix}${key(id)}`)
    .replace(/ (hidden|inert)=""/g, ' $1')
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/style="([^"]*)"/g, (_m, value: string) => `style="${value.replace(/\s*:\s*/g, ':').replace(/;\s*$/, '').replace(/\s*;\s*/g, ';')}"`)
    .replace(/\s+/g, ' ')
    .replace(/ ?> ?/g, '>')
    .replace(/ ?</g, '<')
    .replace(/class="([^"]*)"/g, (_m, value: string) => `class="${value.trim().split(/\s+/).sort().join(' ')}"`)
    .replace(/<(img|br)([^>]*?)\/?>/g, '<$1$2>')
    .trim();
};

