import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { HMEM, type MemoryRecord } from "../../../vendor/hmem/src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));

// Only /tmp is writable on a serverless host, and it is not shared between
// instances, so memory there lasts for the instance rather than for the facility.
function dataDir(): string {
  if (process.env.STOPGAP_DATA_DIR) return resolve(process.env.STOPGAP_DATA_DIR);
  if (process.env.VERCEL) return "/tmp/stopgap-hmem";
  return resolve(here, "../../../.stopgap/hmem");
}

const dir = dataDir();
mkdirSync(dir, { recursive: true });

export const memoryIsEphemeral = Boolean(process.env.VERCEL) && !process.env.STOPGAP_DATA_DIR;

// Meterless H-MEM reference engine, with its append-only trust ledger.
export const hmem = new HMEM({ persistDir: dir, actor: "stopgap" });

export interface Decision {
  id: string;
  content: string;
  excludeKeyword: string | null;
  facility: string;
  createdAt: number;
  confidence: number;
  source: string;
}

const EXCLUDE_TAG = /^exclude:(.+)$/;

export function toDecision(m: MemoryRecord): Decision {
  const kw = m.tags.map((t) => t.match(EXCLUDE_TAG)?.[1]).find((x): x is string => Boolean(x)) ?? null;
  const facility = m.tags.find((t) => t.startsWith("facility:"))?.slice("facility:".length) ?? "default";
  return {
    id: m.id,
    content: m.content,
    excludeKeyword: kw,
    facility,
    createdAt: m.timestamp,
    confidence: m.confidence,
    source: m.source,
  };
}

export interface RecordDecisionInput {
  content: string;
  excludeKeyword?: string;
  facility?: string;
  signedBy: string;
}

export function recordDecision(input: RecordDecisionInput): Decision {
  const tags = ["decision", `facility:${input.facility ?? "default"}`];
  if (input.excludeKeyword) tags.push(`exclude:${input.excludeKeyword.toLowerCase()}`);
  const rec = hmem.add({
    content: input.content,
    type: "preference",
    layer: "long_term",
    tags,
    confidence: 0.95,
    source: `pharmacist:${input.signedBy}`,
    provenance: {
      origin: "user_correction",
      learnedAt: Date.now(),
      label: "formulary decision entered by a pharmacist",
    },
  });
  hmem.store.persist();
  return toDecision(rec);
}

export function listDecisions(facility = "default"): Decision[] {
  return hmem.store
    .all()
    .filter((m) => m.tags.includes("decision") && !m.supersededBy)
    .map(toDecision)
    .filter((d) => d.facility === facility)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function retireDecision(id: string): void {
  hmem.store.delete(id, "retired by pharmacist");
  hmem.store.persist();
}

// The retrieval trace is surfaced so the packet can show why a memory applied.
export function recall(query: string) {
  const r = hmem.query(query, { topN: 5 });
  return {
    memories: r.memories.map((x) => ({
      id: x.memory.id,
      content: x.memory.content,
      relevance: x.relevance,
      tags: x.memory.tags,
      source: x.memory.source,
    })),
    context: r.context,
    trace: r.trace,
  };
}

export function ledgerFor(id: string) {
  return hmem.ledger.history(id);
}
