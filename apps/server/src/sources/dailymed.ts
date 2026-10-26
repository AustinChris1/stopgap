import { getJson } from "./http.ts";

const BASE = "https://dailymed.nlm.nih.gov/dailymed/services/v2";

export interface LabelRef {
  ndc: string;
  setid: string | null;
  title: string | null;
  published: string | null;
  apiUrl: string;
  labelUrl: string | null;
}

// The citation target for a row: the FDA label on DailyMed for that package NDC.
export async function labelForNdc(ndc: string): Promise<LabelRef> {
  const apiUrl = `${BASE}/spls.json?ndc=${ndc}&pagesize=1`;
  const d = await getJson<{ data?: { setid: string; title: string; published_date: string }[] }>("DailyMed", apiUrl);
  const r = d.data?.[0];
  return {
    ndc,
    setid: r?.setid ?? null,
    title: r?.title ?? null,
    published: r?.published_date ?? null,
    apiUrl,
    labelUrl: r ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${r.setid}` : null,
  };
}

export async function labelForNdcSafe(ndc: string): Promise<LabelRef> {
  try {
    return await labelForNdc(ndc);
  } catch {
    return { ndc, setid: null, title: null, published: null, apiUrl: `${BASE}/spls.json?ndc=${ndc}&pagesize=1`, labelUrl: null };
  }
}
