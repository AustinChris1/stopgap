import { DISCLAIMER, fetchShortageRows, type ShortageRow } from "./sources/openfda.ts";
import { ATTRIBUTION, ndcStatusSafe } from "./sources/rxnorm.ts";
import { labelForNdcSafe, type LabelRef } from "./sources/dailymed.ts";
import { listDecisions, type Decision } from "./memory.ts";

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
  rxcuiCandidates: string[];
  rxcuiExact: string | null;
  conceptName: string | null;
  label: LabelRef | null;
  excludedBy: { decisionId: string; content: string } | null;
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
  mode: "rest";
  base: string;
  sqlFile: string;
  rowCount: number;
  columns: string[];
  rows: unknown[][];
  ranAt: string;
}

export const SCOPE_NOTE =
  "This packet lists reported supply for one ingredient. It does not name, rank, or recommend a substitute product or presentation. The clinical decision and the signature belong to the pharmacist.";

// mg per mL from the row's own presentation text, so a vial and a premixed bag never merge.
export function concentrationOf(presentation: string | undefined): number | null {
  if (!presentation) return null;
  const matches = [...presentation.matchAll(/([\d.]+)\s*mg\s*\/\s*([\d.]+)?\s*mL/gi)];
  for (const m of matches) {
    const mg = Number(m[1]);
    const ml = m[2] === undefined ? 1 : Number(m[2]);
    if (Number.isFinite(mg) && Number.isFinite(ml) && ml > 0) return round(mg / ml);
  }
  return null;
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

export function isPremix(row: ShortageRow): boolean {
  const text = `${row.generic_name} ${row.presentation ?? ""}`;
  return /in dextrose|in sodium chloride|plastic container/i.test(text);
}

function toLine(row: ShortageRow): SupplyLine {
  return {
    ndc: row.package_ndc,
    labeler: row.company_name ?? row.openfda?.manufacturer_name?.[0] ?? "unknown",
    availability: row.availability,
    updateDate: row.update_date ?? null,
    presentation: row.presentation ?? row.generic_name,
    resupplyNote: row.related_info?.trim() || null,
    shortageReason: row.shortage_reason ?? null,
    concentrationMgPerMl: concentrationOf(row.presentation ?? row.generic_name),
    isPremix: isPremix(row),
    rxcuiCandidates: row.openfda?.rxcui ?? [],
    rxcuiExact: null,
    conceptName: null,
    label: null,
    excludedBy: null,
  };
}

function matchesDecision(line: SupplyLine, d: Decision): boolean {
  if (!d.excludeKeyword) return false;
  const kw = d.excludeKeyword;
  if (kw === "premix") return line.isPremix;
  return `${line.presentation} ${line.labeler}`.toLowerCase().includes(kw);
}

export interface BuildOptions {
  pinNdc: string;
  genericQuery: string;
  facility?: string;
  enrich?: boolean;
  zetaris?: ZetarisProvenance | null;
}

export async function buildPacket(opts: BuildOptions): Promise<Packet> {
  const fetched = await fetchShortageRows(opts.genericQuery);
  const lines = fetched.rows.map(toLine);
  const pin = lines.find((l) => l.ndc === opts.pinNdc);
  if (!pin) {
    throw new Error(`pinned NDC ${opts.pinNdc} is not in the openFDA response for "${opts.genericQuery}" (${lines.length} rows)`);
  }

  const decisions = listDecisions(opts.facility ?? "default");
  const others = lines.filter((l) => l.ndc !== pin.ndc);

  for (const line of others) {
    const hit = decisions.find((d) => matchesDecision(line, d));
    if (hit) line.excludedBy = { decisionId: hit.id, content: hit.content };
  }

  const kept = others.filter((l) => !l.excludedBy);
  const excluded = others.filter((l) => l.excludedBy);

  const sameConcentration = kept.filter(
    (l) => l.concentrationMgPerMl !== null && l.concentrationMgPerMl === pin.concentrationMgPerMl && l.isPremix === pin.isPremix,
  );
  const sameSet = new Set(sameConcentration.map((l) => l.ndc));
  const otherPresentations = kept.filter((l) => !sameSet.has(l.ndc));

  if (opts.enrich !== false) {
    await enrich([pin, ...sameConcentration, ...otherPresentations, ...excluded]);
  }

  return {
    pin,
    sameConcentration: sort(sameConcentration),
    otherPresentations: sort(otherPresentations),
    excluded: sort(excluded),
    decisions,
    clinicalConclusion: null,
    provenance: {
      openFdaUrl: fetched.url,
      openFdaLastUpdated: fetched.lastUpdated,
      openFdaRowsReturned: fetched.rows.length,
      fetchedAt: fetched.fetchedAt,
      zetaris: opts.zetaris ?? null,
    },
    disclaimers: { openFda: DISCLAIMER, nlm: ATTRIBUTION, scope: SCOPE_NOTE },
    signature: { preparedFor: opts.facility ?? "default", signedBy: null, signedAt: null },
  };
}

function sort(lines: SupplyLine[]): SupplyLine[] {
  const rank = (a: string) => (/^available$/i.test(a) ? 0 : /limited/i.test(a) ? 1 : 2);
  return [...lines].sort((a, b) => rank(a.availability) - rank(b.availability) || a.labeler.localeCompare(b.labeler));
}

// RxNorm pins one concept per NDC, DailyMed gives the citable label. Both keyed on the NDC, never on the drug name.
async function enrich(lines: SupplyLine[]): Promise<void> {
  const results = await Promise.all(
    lines.map(async (line) => {
      const [status, label] = await Promise.all([ndcStatusSafe(line.ndc), labelForNdcSafe(line.ndc)]);
      return { line, status, label };
    }),
  );
  for (const { line, status, label } of results) {
    if ("rxcui" in status) {
      line.rxcuiExact = status.rxcui;
      line.conceptName = status.conceptName;
    }
    line.label = label;
  }
}
