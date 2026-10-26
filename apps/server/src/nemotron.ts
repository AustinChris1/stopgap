const SYSTEM =
  "You write one sentence for a hospital pharmacist reading a drug supply packet. You must not name, suggest, rank, or hint at a substitute drug, product, or presentation. State only that the packet reports supply status from public sources and that the clinical decision and signature belong to the pharmacist. One sentence, under 40 words.";

export type NemotronResult =
  | { ok: true; model: string; text: string }
  | { ok: false; model: string; error: string }
  | null;

// Hosted Nemotron on build.nvidia.com, used for the refusal sentence only.
// No key or a failed call means the sentence is omitted, never fabricated.
export async function refusalSentence(context: string): Promise<NemotronResult> {
  const key = process.env.NVIDIA_API_KEY;
  const model = process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3-nano-30b-a3b";
  if (!key) return null;
  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        max_tokens: 160,
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: context },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return { ok: false, model, error: `HTTP ${res.status} ${(await res.text()).slice(0, 140)}` };
    const d = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = d.choices?.[0]?.message?.content?.trim();
    return text ? { ok: true, model, text } : { ok: false, model, error: "empty response" };
  } catch (e) {
    return { ok: false, model, error: String((e as Error).message) };
  }
}
