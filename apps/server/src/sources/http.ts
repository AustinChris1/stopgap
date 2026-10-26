const UA = process.env.STOPGAP_USER_AGENT ?? "Stopgap hackathon demo";

export class SourceError extends Error {
  source: string;
  url: string;

  constructor(source: string, url: string, detail: string) {
    super(`${source}: ${detail}`);
    this.source = source;
    this.url = url;
  }
}

// One retry on 429 or 5xx: openFDA and RxNav both cold-start occasionally.
export async function getJson<T>(source: string, url: string): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "user-agent": UA, accept: "application/json" },
        signal: AbortSignal.timeout(30_000),
      });
    } catch (e) {
      if (attempt === 0) { await sleep(1500); continue; }
      throw new SourceError(source, url, String((e as Error).message));
    }
    if (res.ok) return (await res.json()) as T;
    if (res.status === 404) throw new SourceError(source, url, "404 no matches");
    if (attempt === 0 && (res.status === 429 || res.status >= 500)) { await sleep(1500); continue; }
    throw new SourceError(source, url, `HTTP ${res.status}`);
  }
  throw new SourceError(source, url, "unreachable");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
