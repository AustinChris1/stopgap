import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { buildPacket, SCOPE_NOTE, type ZetarisProvenance } from "./packet.ts";
import { listDecisions, recordDecision, retireDecision, recall, ledgerFor } from "./memory.ts";
import { ZetarisClient } from "./zetaris.ts";
import { refusalSentence } from "./nemotron.ts";

export const PIN = process.env.STOPGAP_PIN_NDC ?? "0143-9254-25";
export const GENERIC = process.env.STOPGAP_GENERIC ?? "dopamine";

const app = new Hono();
app.use("/api/*", cors());

const zetaris = new ZetarisClient();

// Only meaningful on a long-lived server; a serverless instance may not keep it.
let lastZetarisRun: ZetarisProvenance | null = null;

// A run captured against a real instance, so a deployment that cannot reach one
// still shows the rows it returned. Always labelled as recorded, never as live.
interface RecordedRun {
  recordedAt: string;
  base: string;
  route: string;
  sqlFile: string;
  sql: string;
  columns: string[];
  rows: unknown[][];
  rowCount: number;
}

const recordedRun: RecordedRun | null = (() => {
  try {
    const p = resolve(dirname(fileURLToPath(import.meta.url)), "../../../zetaris/last-run.json");
    return existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as RecordedRun) : null;
  } catch {
    return null;
  }
})();

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    pin: PIN,
    generic: GENERIC,
    zetarisConfigured: zetaris.configured,
    nvidiaKey: Boolean(process.env.NVIDIA_API_KEY),
    ephemeralMemory: Boolean(process.env.VERCEL),
  }),
);

app.get("/api/packet", async (c) => {
  const pinNdc = c.req.query("ndc") ?? PIN;
  const genericQuery = c.req.query("generic") ?? GENERIC;
  const facility = c.req.query("facility") ?? "default";
  const enrich = c.req.query("enrich") !== "0";
  try {
    const packet = await buildPacket({ pinNdc, genericQuery, facility, enrich, zetaris: lastZetarisRun });
    return c.json(packet);
  } catch (e) {
    return c.json({ error: String((e as Error).message) }, 502);
  }
});

app.get("/api/decisions", (c) => c.json(listDecisions(c.req.query("facility") ?? "default")));

app.post("/api/decisions", async (c) => {
  const body = await c.req.json<{ content?: string; excludeKeyword?: string; facility?: string; signedBy?: string }>();
  if (!body.content || !body.signedBy) return c.json({ error: "content and signedBy are required" }, 400);
  return c.json(
    recordDecision({
      content: body.content,
      excludeKeyword: body.excludeKeyword,
      facility: body.facility,
      signedBy: body.signedBy,
    }),
  );
});

app.delete("/api/decisions/:id", (c) => {
  try {
    retireDecision(c.req.param("id"));
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: String((e as Error).message) }, 404);
  }
});

app.get("/api/recall", (c) => {
  const q = c.req.query("q");
  if (!q) return c.json({ error: "q is required" }, 400);
  return c.json(recall(q));
});

app.get("/api/ledger/:id", (c) => c.json(ledgerFor(c.req.param("id"))));

app.get("/api/zetaris/status", async (c) =>
  c.json({
    configured: zetaris.configured,
    base: zetaris.base,
    reachable: await zetaris.reachable(),
    lastRun: lastZetarisRun,
    recordedRun,
    note: process.env.VERCEL
      ? "Zetaris runs on the operator's own machine, so a hosted deployment cannot reach it. Run the app locally to use this panel."
      : null,
  }),
);

app.post("/api/zetaris/setup", async (c) => {
  if (!zetaris.configured) return c.json({ error: "no Zetaris credentials are set" }, 400);
  try {
    return c.json({ log: await zetaris.runFile("01_create_sources.sql") });
  } catch (e) {
    return c.json({ error: String((e as Error).message) }, 502);
  }
});

app.get("/api/zetaris/query", async (c) => {
  if (!zetaris.configured) return c.json({ error: "no Zetaris credentials are set" }, 400);
  const file = c.req.query("file") ?? "02_supply_by_presentation.sql";
  try {
    const out = await zetaris.query(file);
    lastZetarisRun = {
      mode: "rest",
      base: zetaris.base,
      sqlFile: file,
      rowCount: out.rows.length,
      columns: out.columns,
      rows: out.rows,
      ranAt: new Date().toISOString(),
    };
    return c.json({ ...out, provenance: lastZetarisRun });
  } catch (e) {
    return c.json({ error: String((e as Error).message) }, 502);
  }
});

app.get("/api/refusal", async (c) => {
  const result = await refusalSentence(
    `${SCOPE_NOTE} The packet covers ${GENERIC} and was prepared for a pharmacist reviewing package NDC ${PIN}.`,
  );
  return c.json(result ?? { ok: false, model: null, error: "NVIDIA_API_KEY is not set" });
});

export { app };
export default app;
