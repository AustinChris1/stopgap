import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertCircle, Brain, Check, Database, ExternalLink, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { api, type Decision, type Packet, type SupplyLine, type ZetarisProvenance } from "../lib/api.ts";
import { Wordmark } from "../components/Logo.tsx";

export function PacketView() {
  const [facility, setFacility] = useState("default");
  const [packet, setPacket] = useState<Packet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPacket(await api.packet(facility));
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setLoading(false);
    }
  }, [facility]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b hairline bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <Link to="/">
            <Wordmark compact />
          </Link>
          <div className="flex items-center gap-3">
            <label className="font-mono text-[11px] uppercase tracking-wider text-quiet">Facility</label>
            <input
              value={facility}
              onChange={(e) => setFacility(e.target.value.trim() || "default")}
              className="w-36 border hairline bg-white px-2.5 py-1.5 font-mono text-xs outline-none focus:border-ink"
            />
            <button
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-medium text-paper disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Re-query live
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        {error && (
          <div className="flex items-start gap-3 border hairline bg-white p-4 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-short" />
            <div>
              <p className="font-medium">The packet was not built.</p>
              <p className="mt-1 font-mono text-xs text-quiet">{error}</p>
              <p className="mt-2 text-xs text-quiet">Start the API with pnpm dev:server, then re-query.</p>
            </div>
          </div>
        )}

        {packet && (
          <>
            <Provenance packet={packet} />
            <PinRow line={packet.pin} />
            <Group
              title="Same concentration, other labeler"
              note="Matched on the concentration printed on each openFDA row."
              lines={packet.sameConcentration}
            />
            <Group
              title="Other presentations"
              note="A different product form. Not interchangeable without pharmacist review."
              lines={packet.otherPresentations}
            />
            {packet.excluded.length > 0 && (
              <Group
                title="Excluded by a stored decision"
                note="Removed because the pharmacy already ruled on this, not because of supply."
                lines={packet.excluded}
                muted
              />
            )}
            <Conclusion packet={packet} />
            <div className="grid gap-6 lg:grid-cols-2">
              <MemoryPanel facility={facility} decisions={packet.decisions} onChange={() => void load()} />
              <ZetarisPanel initial={packet.provenance.zetaris} />
            </div>
            <Disclaimers packet={packet} />
          </>
        )}
      </main>
    </div>
  );
}

function Provenance({ packet }: { packet: Packet }) {
  const p = packet.provenance;
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border hairline bg-white px-5 py-4 font-mono text-[11px] uppercase tracking-wider text-quiet">
      <span>
        FDA file updated <strong className="text-ink">{p.openFdaLastUpdated}</strong>
      </span>
      <span>
        Rows returned <strong className="text-ink tabular">{p.openFdaRowsReturned}</strong>
      </span>
      <span>
        Re-queried <strong className="text-ink">{new Date(p.fetchedAt).toLocaleTimeString()}</strong>
      </span>
      <a href={p.openFdaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-short hover:underline">
        Source call <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function PinRow({ line }: { line: SupplyLine }) {
  return (
    <section>
      <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-quiet">In shortage at this facility</h2>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 border-l-2 border-short bg-white p-5"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="font-display text-2xl font-semibold">{line.presentation.split("(")[0].trim()}</h3>
          <Availability value={line.availability} />
        </div>
        <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <Field label="Labeler" value={line.labeler} />
          <Field label="Package NDC" value={line.ndc} mono />
          <Field label="Reason given" value={line.shortageReason ?? "not stated"} />
          <Field label="FDA row updated" value={line.updateDate ?? "unknown"} mono />
        </dl>
        {line.resupplyNote && (
          <p className="mt-4 border-t hairline pt-3 text-sm leading-relaxed">
            <span className="font-mono text-[11px] uppercase tracking-wider text-quiet">Manufacturer note </span>
            {line.resupplyNote}
          </p>
        )}
      </motion.div>
    </section>
  );
}

function Group({ title, note, lines, muted = false }: { title: string; note: string; lines: SupplyLine[]; muted?: boolean }) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-quiet">{title}</h2>
        <span className="font-mono text-xs tabular text-quiet">{lines.length}</span>
      </div>
      <p className="mt-1.5 text-sm text-quiet">{note}</p>
      {lines.length === 0 ? (
        <p className="mt-4 border hairline bg-white px-5 py-4 text-sm text-quiet">No rows in this group.</p>
      ) : (
        <ul className="mt-4 divide-y divide-rule border hairline bg-white">
          <AnimatePresence initial={false}>
            {lines.map((l, i) => (
              <motion.li
                key={l.ndc}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: muted ? 0.65 : 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <p className="font-medium">{l.labeler}</p>
                    <p className="mt-0.5 text-sm text-quiet">{l.presentation}</p>
                  </div>
                  <Availability value={l.availability} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 font-mono text-[11px] uppercase tracking-wider text-quiet">
                  <span>NDC {l.ndc}</span>
                  {l.updateDate && <span>updated {l.updateDate}</span>}
                  {l.rxcuiExact && <span>RxCUI {l.rxcuiExact}</span>}
                  {l.label?.labelUrl && (
                    <a href={l.label.labelUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-short hover:underline">
                      FDA label <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {l.conceptName && <p className="mt-2 text-xs text-quiet">RxNorm concept: {l.conceptName}</p>}
                {l.resupplyNote && <p className="mt-2 text-xs leading-relaxed text-ink/75">{l.resupplyNote}</p>}
                {l.excludedBy && (
                  <p className="mt-3 border-l-2 border-rule pl-3 text-xs leading-relaxed">
                    <span className="font-mono uppercase tracking-wider text-quiet">Excluded by {l.excludedBy.decisionId} </span>
                    {l.excludedBy.content}
                  </p>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}

function Availability({ value }: { value: string }) {
  const available = /^available$/i.test(value);
  const limited = /limited/i.test(value);
  const tone = available ? "text-supply" : limited ? "text-short" : "text-short";
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider ${tone}`}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-wider text-quiet">{label}</dt>
      <dd className={mono ? "mt-0.5 font-mono text-sm" : "mt-0.5 text-sm"}>{value}</dd>
    </div>
  );
}

function Conclusion({ packet }: { packet: Packet }) {
  const [refusal, setRefusal] = useState<{ text?: string; error?: string; model: string | null } | null>(null);

  return (
    <section className="border-2 border-ink bg-white p-6 sm:p-8">
      <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-quiet">Clinical conclusion</h2>
      <p className="mt-4 max-w-2xl font-display text-xl leading-snug">{packet.disclaimers.scope}</p>

      <div className="mt-6">
        <button
          onClick={async () => setRefusal(await api.refusal())}
          className="inline-flex items-center gap-2 border hairline px-3.5 py-2 font-mono text-[11px] uppercase tracking-wider hover:bg-paper"
        >
          <Brain className="h-3.5 w-3.5" /> Draft the refusal line with Nemotron
        </button>
        {refusal?.text && (
          <p className="mt-3 max-w-2xl border-l-2 border-supply pl-3 text-sm leading-relaxed">
            {refusal.text}
            <span className="mt-1 block font-mono text-[11px] uppercase tracking-wider text-quiet">{refusal.model}</span>
          </p>
        )}
        {refusal?.error && (
          <p className="mt-3 font-mono text-xs text-short">Nemotron unavailable: {refusal.error}. The packet stands without it.</p>
        )}
      </div>

      <div className="mt-10 flex flex-wrap items-end gap-6">
        <div className="min-w-[220px] flex-1">
          <div className="h-10" />
          <div className="h-px w-full bg-ink/70" />
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-quiet">Pharmacist signature</p>
        </div>
        <div className="w-36">
          <div className="h-10" />
          <div className="h-px w-full bg-ink/70" />
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-quiet">Date</p>
        </div>
      </div>
    </section>
  );
}

function MemoryPanel({ facility, decisions, onChange }: { facility: string; decisions: Decision[]; onChange: () => void }) {
  const [content, setContent] = useState("This hospital does not stock premixed dextrose bags.");
  const [keyword, setKeyword] = useState("premix");
  const [signedBy, setSignedBy] = useState("");
  const [busy, setBusy] = useState(false);
  const [trace, setTrace] = useState<string | null>(null);

  async function add() {
    if (!signedBy.trim()) return;
    setBusy(true);
    try {
      await api.addDecision({ content, excludeKeyword: keyword || undefined, facility, signedBy: signedBy.trim() });
      const r = await api.recall(content);
      setTrace(`${r.trace.strategy}: ${r.trace.retrievalReason}`);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border hairline bg-white p-5">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-short" />
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-quiet">Meterless memory</h2>
      </div>
      <p className="mt-2.5 text-sm text-quiet">
        One decision from a pharmacist. Stored in H-MEM with its source, and applied to every later packet.
      </p>

      <div className="mt-4 space-y-2.5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="w-full border hairline px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <div className="flex gap-2.5">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="exclude keyword"
            className="w-36 border hairline px-3 py-2 font-mono text-xs outline-none focus:border-ink"
          />
          <input
            value={signedBy}
            onChange={(e) => setSignedBy(e.target.value)}
            placeholder="entered by (required)"
            className="flex-1 border hairline px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </div>
        <button
          onClick={() => void add()}
          disabled={busy || !signedBy.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-medium text-paper disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Store and rebuild the packet
        </button>
        {trace && <p className="font-mono text-[11px] text-quiet">retrieval trace: {trace}</p>}
      </div>

      {decisions.length > 0 && (
        <ul className="mt-5 divide-y divide-rule border-t hairline">
          {decisions.map((d) => (
            <li key={d.id} className="flex items-start justify-between gap-3 py-3">
              <div>
                <p className="text-sm">{d.content}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-quiet">
                  {d.id} · {d.source}
                  {d.excludeKeyword ? ` · exclude:${d.excludeKeyword}` : ""}
                </p>
              </div>
              <button
                onClick={async () => {
                  await api.retireDecision(d.id);
                  onChange();
                }}
                className="shrink-0 text-quiet hover:text-short"
                aria-label="Retire this decision"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ZetarisPanel({ initial }: { initial: ZetarisProvenance | null }) {
  const [status, setStatus] = useState<{ configured: boolean; base: string; reachable: boolean } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [run, setRun] = useState<ZetarisProvenance | null>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.zetarisStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border hairline bg-white p-5">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-short" />
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-quiet">Zetaris federation</h2>
      </div>
      <p className="mt-2.5 text-sm text-quiet">
        The FDA endpoint registered as a Lightning REST table, queried in place. Nothing is copied into a warehouse.
      </p>

      <div className="mt-3 font-mono text-[11px] uppercase tracking-wider text-quiet">
        {status ? (
          <>
            {status.base} · {status.configured ? "key set" : "no key"} · {status.reachable ? "reachable" : "unreachable"}
          </>
        ) : (
          "status unknown"
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          onClick={() => act(async () => setLog((await api.zetarisSetup()).log))}
          disabled={busy}
          className="border hairline px-3.5 py-2 font-mono text-[11px] uppercase tracking-wider hover:bg-paper disabled:opacity-40"
        >
          Register source
        </button>
        <button
          onClick={() => act(async () => setRun((await api.zetarisQuery()).provenance))}
          disabled={busy}
          className="border hairline px-3.5 py-2 font-mono text-[11px] uppercase tracking-wider hover:bg-paper disabled:opacity-40"
        >
          Run the join
        </button>
      </div>

      {err && <p className="mt-3 font-mono text-xs text-short">{err}</p>}
      {log.length > 0 && (
        <pre className="mt-3 max-h-32 overflow-auto bg-paper p-3 font-mono text-[11px] leading-relaxed">{log.join("\n")}</pre>
      )}
      {run && (
        <div className="mt-3 font-mono text-[11px] uppercase tracking-wider text-quiet">
          {run.sqlFile} returned <strong className="text-ink tabular">{run.rowCount}</strong> rows at{" "}
          {new Date(run.ranAt).toLocaleTimeString()}
        </div>
      )}
    </section>
  );
}

function Disclaimers({ packet }: { packet: Packet }) {
  return (
    <footer className="space-y-3 border-t hairline pt-6 text-xs leading-relaxed text-quiet">
      <p>{packet.disclaimers.openFda}</p>
      <p>{packet.disclaimers.nlm}</p>
    </footer>
  );
}
