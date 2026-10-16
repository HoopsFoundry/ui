// Lokaler http-Server für die portal-sync-Tests mit --from-release: liefert Dateien aus einer Tabelle, kein Netz nach außen.
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

export type Route = {
  status?: number;
  body?: Buffer | string;
  declared?: number;
  abort?: boolean;
  /** Weiterleitung (Status 302) an diese Adresse. */
  redirect?: string;
  /** Antwortet nie (hängt) bzw. sendet Kopf und dann nichts mehr. */
  hang?: 'before-headers' | 'after-headers';
  /** Sendet ohne Content-Length (chunked) so viele Byte in 1-MiB-Stücken, solange der Client liest. */
  stream?: number;
  /** Sendet je `trickle` ms ein Byte (ohne Ende), für die Gesamtzeit-Grenze. */
  trickle?: number;
};

export async function startServer(routes: Map<string, Route>) {
  const requests: string[] = [];
  const server: Server = createServer((req, res) => {
    const path = new URL(req.url ?? '/', 'http://x').pathname;
    requests.push(path);
    const route = routes.get(path);
    if (!route) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('nicht da');
      return;
    }
    if (route.redirect) {
      res.writeHead(302, { location: route.redirect, 'content-length': '0' });
      res.end();
      return;
    }
    if (route.hang === 'before-headers') return;
    if (route.hang === 'after-headers') {
      res.writeHead(200, { 'content-type': 'application/octet-stream' });
      res.write('x');
      return;
    }
    if (route.trickle) {
      res.writeHead(200, { 'content-type': 'application/octet-stream' });
      const timer = setInterval(() => res.write('x'), route.trickle);
      res.on('close', () => clearInterval(timer));
      return;
    }
    if (route.stream) {
      res.writeHead(200, { 'content-type': 'application/octet-stream' });
      const chunk = Buffer.alloc(1024 * 1024, 0x61);
      let sent = 0;
      const pump = () => {
        while (sent < (route.stream ?? 0) && !res.destroyed) {
          sent += chunk.length;
          if (!res.write(chunk)) return void res.once('drain', pump);
        }
        res.end();
      };
      res.on('error', () => {});
      pump();
      return;
    }
    const body = Buffer.from(route.body ?? '');
    res.writeHead(route.status ?? 200, { 'content-length': String(route.declared ?? body.length), 'content-type': 'application/octet-stream' });
    if (route.abort) {
      // Teil-Download: weniger Bytes senden als angekündigt, dann die Verbindung kappen
      res.write(body, () => req.socket.destroy());
      return;
    }
    res.end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    baseUrl,
    requests,
    close: () => new Promise<void>((resolve) => { server.closeAllConnections?.(); server.close(() => resolve()); }),
  };
}
