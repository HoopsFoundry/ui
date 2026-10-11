// Erzeugt das Demo-Kachelbild der Karten-Doku (256 × 256, neutrales Gitter, ohne Abhängigkeit): node scripts/make-demo-tile.mjs stories/assets/tiles/demo.png
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
const W = 256, H = 256;
const px = new Uint8Array(W * H * 3);
const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) { const i = (y * W + x) * 3; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; } };
const land = [0xec, 0xea, 0xe4], grid = [0xd8, 0xd5, 0xcb], major = [0xc9, 0xc5, 0xb8], road = [0xff, 0xff, 0xff], park = [0xd6, 0xe4, 0xcf], water = [0xc3, 0xd9, 0xe0];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(x, y, land);
// ruhige Flächen: ein Park, ein Gewässer
for (let y = 150; y < 226; y++) for (let x = 24; x < 112; x++) set(x, y, park);
for (let y = 30; y < 90; y++) for (let x = 150; x < 236; x++) set(x, y, water);
// Gitter alle 32 px, kräftiger alle 128 px
for (let i = 0; i < W; i += 32) for (let j = 0; j < H; j++) { set(i, j, i % 128 === 0 ? major : grid); set(j, i, i % 128 === 0 ? major : grid); }
// zwei Straßen
for (let t = 0; t < 256; t++) { for (let w = -3; w <= 3; w++) { set(t, 120 + w + Math.round(Math.sin(t / 40) * 6), road); set(100 + w + Math.round(Math.cos(t / 50) * 8), t, road); } }
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1); }
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const body = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(body)); return Buffer.concat([len, body, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
writeFileSync(process.argv[2], png);
console.log('geschrieben', png.length, 'Bytes');
process.exit(0);
