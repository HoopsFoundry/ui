// Lokaler http-Server für die portal-sync-Tests mit --from-release: liefert Dateien aus einer Tabelle, kein Netz nach außen.
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

export type Route = { status?: number; body?: Buffer | string; declared?: number; abort?: boolean };

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
