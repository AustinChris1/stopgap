import { getJson } from "./http.ts";

export interface ShortageRow {
  package_ndc: string;
  generic_name: string;
  company_name?: string;
  availability: string;
  status: string;
  update_date?: string;
  update_type?: string;
  initial_posting_date?: string;
  presentation?: string;
  related_info?: string;
  shortage_reason?: string;
  therapeutic_category?: string[];
  dosage_form?: string;
  contact_info?: string;
  openfda?: {
    manufacturer_name?: string[];
    rxcui?: string[];
    spl_set_id?: string[];
    route?: string[];
  };
}

interface Envelope {
  meta: { last_updated: string; results: { total: number } };
  results: ShortageRow[];
}

const BASE = "https://api.fda.gov/drug/shortages.json";

export function shortageUrl(genericQuery: string): string {
  return `${BASE}?search=generic_name:${encodeURIComponent(genericQuery)}&limit=100`;
}

export interface ShortageFetch {
  rows: ShortageRow[];
  lastUpdated: string;
  total: number;
  url: string;
  fetchedAt: string;
}

// One call returns every labeler's row for the ingredient. No second source is needed here.
export async function fetchShortageRows(genericQuery: string): Promise<ShortageFetch> {
  const url = shortageUrl(genericQuery);
  const d = await getJson<Envelope>("openFDA", url);
  return {
    rows: d.results,
    lastUpdated: d.meta.last_updated,
    total: d.meta.results.total,
    url,
    fetchedAt: new Date().toISOString(),
  };
}

export const DISCLAIMER =
  "Do not rely on openFDA to make decisions regarding medical care. While we make every effort to ensure that data is accurate, you should assume all results are unvalidated.";
