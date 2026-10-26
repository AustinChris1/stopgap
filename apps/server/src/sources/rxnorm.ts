import { getJson } from "./http.ts";

const BASE = "https://rxnav.nlm.nih.gov/REST";

export const ATTRIBUTION =
  "This product uses publicly available data from the U.S. National Library of Medicine (NLM), National Institutes of Health, Department of Health and Human Services; NLM is not responsible for the product and does not endorse or recommend this or any other product.";

export interface NdcStatus {
  ndc: string;
  status: string;
  rxcui: string | null;
  conceptName: string | null;
  url: string;
}

// Enrichment only, keyed on the NDC. Gives the one exact clinical-drug concept
// that openFDA's product-level rxcui array cannot pin down.
export async function ndcStatus(ndc: string): Promise<NdcStatus> {
  const url = `${BASE}/ndcstatus.json?ndc=${ndc}`;
  const d = await getJson<{ ndcStatus?: { status?: string; rxcui?: string; conceptName?: string } }>("RxNorm", url);
  const s = d.ndcStatus ?? {};
  return {
    ndc,
    status: s.status ?? "UNKNOWN",
    rxcui: s.rxcui || null,
    conceptName: s.conceptName || null,
    url,
  };
}

export async function ndcStatusSafe(ndc: string): Promise<NdcStatus | { ndc: string; error: string; url: string }> {
  const url = `${BASE}/ndcstatus.json?ndc=${ndc}`;
  try {
    return await ndcStatus(ndc);
  } catch (e) {
    return { ndc, error: String((e as Error).message), url };
  }
}
