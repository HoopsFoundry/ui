// Größenbudgets der Vanilla-Bündel (minifizierte Datei und gzip, in Byte). Einzige Quelle: die Bündel-Tests (tests/vanilla-*bundle.test.ts)
// und das Release-Skript (scripts/release-vanilla.mjs, schreibt sie ins Manifest) lesen sie von hier.
// Begründung der Werte steht in den jeweiligen Tests (gemessener Stand und Reserve).
const KiB = 1024;

// Seit I2 (Internationalisierung) enthält der Kern den Sprachkern und den englischen Katalog (gemessen: hoops.min.js 48 155 B, gzip 16 768 B, vorher 37 164 B und
// 13 241 B), die Bündel render und map haben die Texte über t() und die Optionen locale/texts verdrahtet (render 57 396 B, vorher 51 312 B; map 25 496 B, vorher
// 22 053 B), das deutsche Sprachbündel ist neu (6 633 B). Die Grenzen sind die kleinste volle KiB-Stufe über der Messung.
export const BUDGETS = {
  hoops: { file: 'hoops.min.js', minBytes: 48 * KiB, gzipBytes: 17 * KiB },
  'hoops-render': { file: 'hoops-render.min.js', minBytes: 57 * KiB, gzipBytes: 19 * KiB },
  'hoops-map': { file: 'hoops-map.min.js', minBytes: 25 * KiB, gzipBytes: 10 * KiB },
  'hoops-i18n-de': { file: 'hoops-i18n-de.min.js', minBytes: 7 * KiB, gzipBytes: 3 * KiB },
};
