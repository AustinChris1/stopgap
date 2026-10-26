import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SQL_DIR = resolve(here, "../../../zetaris/sql");

export type Route = "api-token" | "ui-proxy" | "none";

export interface QueryResult {
  columns: string[];
  rows: unknown[][];
}

// Two routes, both taken from zetaris/getting-started scripts.
// An API token goes straight to the platform API on 8888. Otherwise the
// administrator account signs in to the UI proxy on 3000 and uses its JWT.
export class ZetarisClient {
  readonly apiBase: string;
  readonly uiBase: string;
  readonly org: string;
  private apiKey: string;
  private username: string;
  private password: string;
  private jwt: string | null = null;

  constructor() {
    this.apiBase = (process.env.ZETARIS_REST_URL ?? "http://localhost:8888/api/v1.0").replace(/\/$/, "");
    this.uiBase = (process.env.ZETARIS_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
    this.org = process.env.ZETARIS_ORG_ID ?? "1";
    this.apiKey = process.env.ZETARIS_API_KEY ?? "";
    this.username = process.env.ZETARIS_USERNAME ?? "";
    this.password = process.env.ZETARIS_PASSWORD ?? "";
  }

  get route(): Route {
    if (this.apiKey) return "api-token";
    if (this.username && this.password) return "ui-proxy";
    return "none";
  }

  get configured(): boolean {
    return this.route !== "none";
  }

  get base(): string {
    return this.route === "ui-proxy" ? this.uiBase : this.apiBase;
  }

  private async login(): Promise<string> {
    if (this.jwt) return this.jwt;
    const res = await fetch(`${this.uiBase}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-request-id": randomUUID() },
      body: JSON.stringify({ username: this.username, password: this.password }),
      signal: AbortSignal.timeout(30_000),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Zetaris login HTTP ${res.status}: ${text.slice(0, 200)}`);
    const body = JSON.parse(text || "{}") as Record<string, unknown>;
    const direct = body.idToken ?? body.token ?? body.accessToken;
    const token = typeof direct === "string" ? direct : /[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}/.exec(text)?.[0];
    if (!token) throw new Error("Zetaris login did not return an access token");
    this.jwt = token;
    return token;
  }

  private async call<T>(path: string, body?: unknown): Promise<T> {
    const useProxy = this.route === "ui-proxy";
    const token = useProxy ? await this.login() : this.apiKey;
    const res = await fetch((useProxy ? this.uiBase : this.apiBase) + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "x-org-id": this.org,
        "x-request-id": randomUUID(),
        "content-type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    });
    const text = await res.text();
    if (res.status === 401 || res.status === 403) this.jwt = null;
    if (!res.ok) throw new Error(`Zetaris HTTP ${res.status}: ${text.slice(0, 300)}`);
    return (text ? JSON.parse(text) : null) as T;
  }

  async reachable(): Promise<boolean> {
    if (!this.configured) return false;
    try {
      await this.run("SELECT 1 AS one", 1);
      return true;
    } catch {
      return false;
    }
  }

  async run(sql: string, limit = 500): Promise<QueryResult> {
    const out =
      this.route === "ui-proxy"
        ? await this.call<unknown>("/api/proxy/sql-editor/sqls/run-query", { sql, limit })
        : await this.call<unknown>("/sql-editor/sqls/run", {
            queryId: randomUUID(),
            sql,
            source: "SqlEditor",
            limit,
          });
    return normalise(out);
  }

  // Runs every statement in a file under zetaris/sql, tolerating re-runs.
  async runFile(name: string, limit = 10): Promise<string[]> {
    const text = readFileSync(resolve(SQL_DIR, name), "utf8");
    const log: string[] = [];
    for (const stmt of splitSql(text)) {
      const head = stmt.split("\n")[0].slice(0, 90);
      try {
        await this.run(stmt, limit);
        log.push(`ok      ${head}`);
      } catch (e) {
        const msg = String((e as Error).message);
        if (/already exists/i.test(msg)) log.push(`exists  ${head}`);
        else throw new Error(`${head} -> ${msg}`);
      }
    }
    return log;
  }

  async query(name: string, limit = 500): Promise<QueryResult & { sql: string }> {
    const statements = splitSql(readFileSync(resolve(SQL_DIR, name), "utf8"));
    const last = statements[statements.length - 1];
    return { ...(await this.run(last, limit)), sql: last };
  }
}

export function splitSql(text: string): string[] {
  return text
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

// The two routes wrap their results differently, so accept either and
// fall back to reading keys off the first row object.
export function normalise(out: unknown): QueryResult {
  const o = (out ?? {}) as Record<string, unknown>;
  const payload = (o.data ?? o.result ?? o.rows ?? o.records ?? out) as unknown;
  const nested = payload && typeof payload === "object" && !Array.isArray(payload)
    ? ((payload as Record<string, unknown>).data ?? (payload as Record<string, unknown>).rows ?? payload)
    : payload;

  const declared = (o.columns ?? o.schema ?? o.fields) as { name?: string }[] | undefined;
  let columns = Array.isArray(declared) ? declared.map((c) => c?.name ?? String(c)) : [];

  if (!Array.isArray(nested)) return { columns, rows: [] };
  if (nested.length === 0) return { columns, rows: [] };

  if (Array.isArray(nested[0])) return { columns, rows: nested as unknown[][] };

  if (typeof nested[0] === "object" && nested[0] !== null) {
    const keys = Object.keys(nested[0] as Record<string, unknown>);
    if (columns.length === 0) columns = keys;
    return { columns, rows: (nested as Record<string, unknown>[]).map((r) => keys.map((k) => r[k])) };
  }

  return { columns, rows: nested.map((v) => [v]) };
}
