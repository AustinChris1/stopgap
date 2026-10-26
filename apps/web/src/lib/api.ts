export interface SupplyLine {
  ndc: string;
  labeler: string;
  availability: string;
  updateDate: string | null;
  presentation: string;
  resupplyNote: string | null;
  shortageReason: string | null;
  concentrationMgPerMl: number | null;
  isPremix: boolean;
  rxcuiExact: string | null;
  conceptName: string | null;
  label: { setid: string | null; title: string | null; published: string | null; labelUrl: string | null } | null;
  excludedBy: { decisionId: string; content: string } | null;
}

export interface Decision {
  id: string;
  content: string;
  excludeKeyword: string | null;
  facility: string;
  createdAt: number;
  confidence: number;
  source: string;
}

export interface Packet {
  pin: SupplyLine;
  sameConcentration: SupplyLine[];
  otherPresentations: SupplyLine[];
  excluded: SupplyLine[];
  decisions: Decision[];
  clinicalConclusion: null;
  provenance: {
    openFdaUrl: string;
    openFdaLastUpdated: string;
    openFdaRowsReturned: number;
    fetchedAt: string;
    zetaris: ZetarisProvenance | null;
  };
  disclaimers: { openFda: string; nlm: string; scope: string };
  signature: { preparedFor: string; signedBy: null; signedAt: null };
}

export interface ZetarisProvenance {
  mode: string;
  base: string;
  sqlFile: string;
  rowCount: number;
  columns: string[];
  rows: unknown[][];
  ranAt: string;
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { "content-type": "application/json" }, ...init });
  const body = await res.json();
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  return body as T;
}

export const api = {
  packet: (facility: string) => json<Packet>(`/api/packet?facility=${encodeURIComponent(facility)}`),
  decisions: (facility: string) => json<Decision[]>(`/api/decisions?facility=${encodeURIComponent(facility)}`),
  addDecision: (body: { content: string; excludeKeyword?: string; facility: string; signedBy: string }) =>
    json<Decision>("/api/decisions", { method: "POST", body: JSON.stringify(body) }),
  retireDecision: (id: string) => json<{ ok: boolean }>(`/api/decisions/${id}`, { method: "DELETE" }),
  recall: (q: string) =>
    json<{ memories: { id: string; content: string; relevance: number }[]; trace: { retrievalReason: string; strategy: string } }>(
      `/api/recall?q=${encodeURIComponent(q)}`,
    ),
  zetarisStatus: () => json<{ configured: boolean; base: string; reachable: boolean; lastRun: ZetarisProvenance | null }>("/api/zetaris/status"),
  zetarisSetup: () => json<{ log: string[] }>("/api/zetaris/setup", { method: "POST" }),
  zetarisQuery: () => json<{ columns: string[]; rows: unknown[][]; provenance: ZetarisProvenance }>("/api/zetaris/query"),
  refusal: () => json<{ ok: boolean; model: string | null; text?: string; error?: string }>("/api/refusal"),
};
