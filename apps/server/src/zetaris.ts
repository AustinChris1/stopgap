import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SQL_DIR = resolve(here, "../../../zetaris/sql");

// Mirrors the RestChannel in zetaris/getting-started scripts/zetaris_sql.py.
export class ZetarisClient {
  readonly base: string;
  readonly org: string;
  private key: string;

  constructor() {
    this.base = (process.env.ZETARIS_REST_URL ?? "http://localhost:8888/api/v1.0").replace(/\/$/, "");
    this.org = process.env.ZETARIS_ORG_ID ?? "1";
    this.key = process.env.ZETARIS_API_KEY ?? "";
  }

  get configured(): boolean {
    return this.key.length > 0;
  }

  private async call<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(this.base + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        authorization: `Bearer ${this.key}`,
        "x-org-id": this.org,
        "x-request-id": randomUUID(),
        "content-type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Zetaris HTTP ${res.status}: ${text.slice(0, 300)}`);
    return (text ? JSON.parse(text) : null) as T;
  }

  async reachable(): Promise<boolean> {
    if (!this.configured) return false;
    try {
      await this.call("/datasource/datasources");
      return true;
    } catch {
      return false;
    }
  }

  async run(sql: string, limit = 500): Promise<{ columns: string[]; rows: unknown[][] }> {
    const out = await this.call<{
      data?: unknown[][];
      columns?: { name: string }[];
      schema?: { name: string }[];
    }>("/sql-editor/sqls/run", { queryId: randomUUID(), sql, source: "SqlEditor", limit });
    const columns = (out?.columns ?? out?.schema ?? []).map((c) => c.name);
    return { columns, rows: out?.data ?? [] };
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

  async query(name: string, limit = 500): Promise<{ columns: string[]; rows: unknown[][]; sql: string }> {
    const sql = readFileSync(resolve(SQL_DIR, name), "utf8");
    const statements = splitSql(sql);
    const last = statements[statements.length - 1];
    const out = await this.run(last, limit);
    return { ...out, sql: last };
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
