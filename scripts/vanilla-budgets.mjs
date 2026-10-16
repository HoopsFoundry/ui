// Größenbudgets der Vanilla-Bündel (minifizierte Datei und gzip, in Byte). Einzige Quelle: die Bündel-Tests (tests/vanilla-*bundle.test.ts)
// und das Release-Skript (scripts/release-vanilla.mjs, schreibt sie ins Manifest) lesen sie von hier.
// Begründung der Werte steht in den jeweiligen Tests (gemessener Stand und Reserve).
const KiB = 1024;

export const BUDGETS = {
  dss: { file: 'dss.min.js', minBytes: 40 * KiB, gzipBytes: 15 * KiB },
  'dss-render': { file: 'dss-render.min.js', minBytes: 52 * KiB, gzipBytes: 18 * KiB },
  'dss-map': { file: 'dss-map.min.js', minBytes: 24 * KiB, gzipBytes: 10 * KiB },
};
