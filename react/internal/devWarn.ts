declare const process: { env: { NODE_ENV?: string } };

const seen = new Set<string>();

/** Warnung nur in der Entwicklung (Bundler ersetzen `process.env.NODE_ENV`; ohne Ersetzung bleibt sie still), jede Meldung einmal. */
export function devWarn(message: string): void {
  let dev = false;
  try {
    dev = process.env.NODE_ENV !== 'production';
  } catch {
    // kein `process` im Browser ohne Bundler-Ersetzung: keine Warnung
  }
  if (!dev || seen.has(message)) return;
  seen.add(message);
  console.warn(message);
}
