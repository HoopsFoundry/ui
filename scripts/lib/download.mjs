// Download für portal-sync.mjs: streamt die Antwort mit Zählung (Abbruch bei Übergröße), Gesamt- und Leerlauf-Zeitgrenze, nur sichere Adressen
// und Weiterleitungen. Kein vollständiges Puffern einer unbegrenzten Antwort.

export const MAX_DOWNLOAD_BYTES = 32 * 1024 * 1024;
export const DEFAULT_TIMEOUT_MS = 30_000;
export const DEFAULT_IDLE_MS = 10_000;
const MAX_REDIRECTS = 5;

/** Loopback-Adressen: dort ist unverschlüsseltes http für Tests und lokale Spiegel erlaubt. */
export const isLoopback = (host) => host === 'localhost' || host === '[::1]' || host === '::1' || /^127(\.\d{1,3}){3}$/.test(host);

/** Prüft die Adresse der Anfrage: https immer, http nur an Loopback oder mit ausdrücklicher Freigabe. */
export function checkUrl(value, { allowInsecureHttp = false } = {}) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`portal-sync: ungültige Adresse ${JSON.stringify(String(value).slice(0, 120))}.`);
  }
  if (url.protocol === 'https:') return url;
  if (url.protocol === 'http:' && (isLoopback(url.hostname) || allowInsecureHttp)) return url;
  if (url.protocol === 'http:') {
    throw new Error(`portal-sync: ${url.origin} ist unverschlüsselt (http). Verwende https oder gib mit --allow-insecure-http ausdrücklich frei.`);
  }
  throw new Error(`portal-sync: Adressen mit ${url.protocol} sind nicht erlaubt.`);
}

/**
 * Darf eine Weiterleitung von `from` nach `to` gefolgt werden? Nur https auf demselben Host (Host und Port), bei Loopback derselbe Ursprung,
 * für GitHub zusätzlich *.githubusercontent.com (dorthin leitet github.com die Release-Anhänge um), sonst nur für freigegebene Hosts (`hosts`).
 * Nie von https nach http.
 */
export function redirectAllowed(from, to, hosts = []) {
  if (from.protocol === 'https:' && to.protocol !== 'https:') return false;
  if (isLoopback(from.hostname)) return to.origin === from.origin;
  if (to.protocol !== 'https:') return false;
  if (to.host === from.host) return true;
  if (from.hostname === 'github.com' && (to.hostname === 'github.com' || to.hostname.endsWith('.githubusercontent.com'))) return true;
  return hosts.includes(to.host) || hosts.includes(to.hostname);
}

/**
 * Lädt `url` vollständig, höchstens `maxBytes`. Optionen: `fetchFn`, `allowInsecureHttp`, `redirectHosts`, `maxBytes`, `timeoutMs` (gesamt),
 * `idleMs` (ohne neue Daten). Wirft deutsche Fehler bei Übergröße, Zeitüberschreitung, HTTP-Fehler, unvollständiger Antwort und unzulässiger Weiterleitung.
 */
export async function download(url, {
  fetchFn = globalThis.fetch, allowInsecureHttp = false, redirectHosts = [], maxBytes = MAX_DOWNLOAD_BYTES, timeoutMs = DEFAULT_TIMEOUT_MS, idleMs = DEFAULT_IDLE_MS,
} = {}) {
  const controller = new AbortController();
  let reason = null;
  const abort = (why) => {
    reason = why;
    controller.abort();
  };
  const fmt = (ms) => (ms < 1000 ? `${ms} ms` : `${Math.round(ms / 1000)} s`);
  const total = setTimeout(() => abort(`Zeitüberschreitung: der Download dauert länger als ${fmt(timeoutMs)}`), timeoutMs);
  let idle = null;
  const touch = () => {
    clearTimeout(idle);
    idle = setTimeout(() => abort(`Zeitüberschreitung: seit ${fmt(idleMs)} kommen keine Daten`), idleMs);
  };
  try {
    touch();
    let current = checkUrl(url, { allowInsecureHttp });
    let response;
    for (let hops = 0; ; hops++) {
      response = await fetchFn(current.href, { redirect: 'manual', signal: controller.signal });
      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        if (hops >= MAX_REDIRECTS) throw new Error(`portal-sync: zu viele Weiterleitungen (${url}).`);
        const next = new URL(response.headers.get('location'), current);
        if (!redirectAllowed(current, next, redirectHosts)) {
          throw new Error(`portal-sync: Weiterleitung von ${current.origin} nach ${next.origin} wird nicht befolgt (nur https auf demselben Host; weitere Hosts mit --allow-redirect-host).`);
        }
        await response.body?.cancel().catch(() => {});
        current = next;
        continue;
      }
      break;
    }
    if (!response.ok) throw new Error(`portal-sync: Download fehlgeschlagen (${url}): HTTP ${response.status}`);
    const declared = Number(response.headers.get('content-length') ?? 0);
    if (declared > maxBytes) throw new Error(`portal-sync: ${url} ist größer als ${maxBytes} Byte.`);
    const chunks = [];
    let received = 0;
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      touch();
      received += value.length;
      if (received > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new Error(`portal-sync: ${url} ist größer als ${maxBytes} Byte; der Download wurde abgebrochen.`);
      }
      chunks.push(value);
    }
    if (declared && received !== declared) throw new Error(`portal-sync: Download unvollständig (${url}): ${received} von ${declared} Byte.`);
    return Buffer.concat(chunks);
  } catch (error) {
    if (reason) throw new Error(`portal-sync: ${reason} (${url}).`);
    if (/^portal-sync: /.test(error.message)) throw error;
    throw new Error(`portal-sync: Download abgebrochen oder fehlgeschlagen (${url}): ${error.cause?.message ?? error.message}`);
  } finally {
    clearTimeout(total);
    clearTimeout(idle);
  }
}
