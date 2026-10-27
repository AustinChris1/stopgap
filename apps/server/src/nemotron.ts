const SYSTEM =
  "You write one sentence for a hospital pharmacist reading a drug supply packet. You must not name, suggest, rank, or hint at a substitute drug, product, or presentation. State only that the packet reports supply status from public sources and that the clinical decision and signature belong to the pharmacist. One sentence, under 40 words.";

const DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";

export type NemotronResult =
  | { ok: true; model: string; text: string }
  | { ok: false; model: string; error: string }
  | null;

// Hosted Nemotron on build.nvidia.com, for the refusal sentence only.
// Capped under the 30s serverless limit so a slow call reports rather than being killed.
// The 3.5 models reason by default and spend the whole budget on reasoning_content,
// leaving content empty, so thinking is turned off for this one-sentence task.
export async function refusalSentence(context: string): Promise<NemotronResult> {
  const key = process.env.NVIDIA_API_KEY;
  const model = process.env.NVIDIA_MODEL ?? DEFAULT_MODEL;
  if (!key) return null;
  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        max_tokens: 220,
        temperature: 0.2,
        chat_template_kwargs: { thinking: false },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: context },
        ],
      }),
      signal: AbortSignal.timeout(22_000),
    });
    if (!res.ok) return { ok: false, model, error: `HTTP ${res.status} ${(await res.text()).slice(0, 140)}` };
    const d = (await res.json()) as {
      choices?: { finish_reason?: string; message?: { content?: string } }[];
    };
    const choice = d.choices?.[0];
    const text = choice?.message?.content?.trim();
    if (text) return { ok: true, model, text };
    return { ok: false, model, error: `no sentence returned (finish_reason ${choice?.finish_reason ?? "unknown"})` };
  } catch (e) {
    return { ok: false, model, error: String((e as Error).message) };
  }
}
