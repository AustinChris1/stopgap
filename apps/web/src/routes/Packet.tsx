import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertCircle, Brain, Check, Database, ExternalLink, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { api, type Decision, type Health, type Packet, type SupplyLine, type ZetarisProvenance, type ZetarisStatus } from "../lib/api.ts";
import { Wordmark } from "../components/Logo.tsx";
import { SupplyLadder } from "../components/SupplyLadder.tsx";

export function PacketView() {
  const [facility, setFacility] = useState("default");
  const [packet, setPacket] = useState<Packet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth(null));
  }, []);

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
      <header className="sticky top-0 z-10 border-b hairline bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <Link to="/" className="rounded-sm">
            <Wordmark compact />
          </Link>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-2">
            <label htmlFor="facility" className="text-xs text-quiet">
              Facility
            </label>
            <input
              id="facility"
              value={facility}
              onChange={(e) => setFacility(e.target.value.trim() || "default")}
              className="w-24 border hairline bg-white px-2.5 py-1.5 font-mono text-xs outline-none focus:border-ink sm:w-36"
            />
            <button
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Re-query live
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 overflow-x-clip px-4 py-10">
        {error && (
          <div className="flex items-start gap-3 border hairline bg-white p-5 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-short" />
            <div>
              <p className="font-medium">The packet was not built.</p>
              <p className="mt-1 font-mono text-xs text-quiet">{error}</p>
              <p className="mt-2 text-xs text-quiet">Start the API with pnpm dev:server, then re-query.</p>
            </div>
          </div>
        )}

        {!packet && !error && (
          <div className="flex items-center gap-3 border hairline bg-white p-5 text-sm text-quiet">
            <Loader2 className="h-4 w-4 animate-spin" />
            Reading the FDA shortage file.
          </div>
        )}

        {packet && (
          <>
            <Provenance packet={packet} />
            <section>
              <SectionLabel>Where the shortage sits</SectionLabel>
              <p className="mt-1.5 max-w-[70ch] text-sm text-quiet">
                Every reported package, placed by the concentration printed on its own row.
              </p>
              <div className="mt-4">
                <SupplyLadder
                  lines={[packet.pin, ...packet.sameConcentration, ...packet.otherPresentations, ...packet.excluded]}
                  pinNdc={packet.pin.ndc}
                />
              </div>
            </section>
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
              <MemoryPanel
                facility={facility}
                decisions={packet.decisions}
                ephemeral={health?.ephemeralMemory ?? false}
                onChange={() => void load()}
              />
              <ZetarisPanel initial={packet.provenance.zetaris} />
            </div>
            <Disclaimers packet={packet} />
          </>
        )}
      </main>
    </div>
  );
}

function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-sm font-semibold tracking-wide">{children}</h2>
      {count !== undefined && <span className="font-mono text-xs tabular text-quiet">{count}</span>}
    </div>
  );
}

function Provenance({ packet }: { packet: Packet }) {
  const p = packet.provenance;
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border hairline bg-white px-5 py-4 text-xs text-quiet">
      <span>
        FDA file updated <strong className="font-mono tabular font-medium text-ink">{p.openFdaLastUpdated}</strong>
      </span>
      <span>
        Rows returned <strong className="font-mono tabular font-medium text-ink">{p.openFdaRowsReturned}</strong>
      </span>
      <span>
        Re-queried{" "}
        <strong className="font-mono tabular font-medium text-ink">{new Date(p.fetchedAt).toLocaleTimeString()}</strong>
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
      <SectionLabel>In shortage at this facility</SectionLabel>
      <div className="mt-4 border hairline border-l-short bg-white p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h3 className="min-w-0 break-words font-display text-2xl font-semibold tracking-[-0.02em]">
            {line.presentation.split("(")[0].trim()}
          </h3>
          <Availability value={line.availability} />
        </div>
        <dl className="mt-5 grid gap-x-10 gap-y-3 text-sm sm:grid-cols-2">
          <Field label="Labeler" value={line.labeler} />
          <Field label="Package NDC" value={line.ndc} mono />
          <Field label="Reason given" value={line.shortageReason ?? "not stated"} />
          <Field label="FDA row updated" value={line.updateDate ?? "unknown"} mono />
        </dl>
        {line.resupplyNote && (
          <p className="mt-5 border-t hairline pt-4 text-sm leading-relaxed">
            <span className="text-quiet">Manufacturer note. </span>
            {line.resupplyNote}
          </p>
        )}
      </div>
    </section>
  );
}

function Group({ title, note, lines, muted = false }: { title: string; note: string; lines: SupplyLine[]; muted?: boolean }) {
  return (
    <section>
      <SectionLabel count={lines.length}>{title}</SectionLabel>
      <p className="mt-1.5 max-w-[70ch] break-words text-sm text-quiet">{note}</p>
      {lines.length === 0 ? (
        <p className="mt-4 border hairline bg-white px-5 py-4 text-sm text-quiet">No rows in this group.</p>
      ) : (
        <ul className="mt-4 divide-y divide-rule border hairline bg-white">
          <AnimatePresence initial={false}>
            {lines.map((l) => (
              <motion.li
                key={l.ndc}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: muted ? 0.7 : 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium">{l.labeler}</p>
                    <p className="mt-0.5 max-w-[70ch] break-words text-sm text-quiet">{l.presentation}</p>
                  </div>
                  <Availability value={l.availability} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 font-mono text-xs tabular text-quiet">
                  <span>NDC {l.ndc}</span>
                  {l.updateDate && <span>updated {l.updateDate}</span>}
                  {l.rxcuiExact && <span>RxCUI {l.rxcuiExact}</span>}
                  {l.label?.labelUrl && (
                    <a
                      href={l.label.labelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-sans text-short hover:underline"
                    >
                      FDA label <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {l.conceptName && <p className="mt-2 break-words text-xs text-quiet">RxNorm concept: {l.conceptName}</p>}
                {l.resupplyNote && <p className="mt-2 max-w-[70ch] text-xs leading-relaxed text-ink/75">{l.resupplyNote}</p>}
                {l.excludedBy && (
                  <p className="mt-3 border-l hairline pl-3 text-xs leading-relaxed">
                    <span className="text-quiet">Excluded by {l.excludedBy.decisionId}. </span>
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
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${available ? "text-supply" : "text-short"}`}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-quiet">{label}</dt>
      <dd className={mono ? "mt-0.5 break-words font-mono text-sm tabular" : "mt-0.5 break-words text-sm"}>{value}</dd>
    </div>
  );
}

function Conclusion({ packet }: { packet: Packet }) {
  const [refusal, setRefusal] = useState<{ text?: string; error?: string; model: string | null } | null>(null);
  const [busy, setBusy] = useState(false);

  async function draft() {
    setBusy(true);
    try {
      setRefusal(await api.refusal());
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border-2 border-ink bg-white p-7 sm:p-10">
      <SectionLabel>Clinical conclusion</SectionLabel>
      <p className="mt-5 max-w-[46ch] font-display text-2xl leading-snug tracking-[-0.02em]">
        {packet.disclaimers.scope}
      </p>

      <div className="mt-7">
        <button
          onClick={() => void draft()}
          disabled={busy}
          className="inline-flex items-center gap-2 border hairline px-4 py-2.5 text-xs font-medium transition-colors hover:bg-paper disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
          Draft the refusal line with Nemotron
        </button>
        {refusal?.text && (
          <p className="mt-4 max-w-[62ch] border-l hairline pl-4 text-sm leading-relaxed">
            {refusal.text}
            <span className="mt-1.5 block font-mono text-xs text-quiet">{refusal.model}</span>
          </p>
        )}
        {refusal?.error && (
          <p className="mt-4 max-w-[62ch] text-xs text-short">
            Nemotron unavailable: {refusal.error}. The packet stands without it.
          </p>
        )}
      </div>

      <div className="mt-16 flex flex-wrap items-end gap-x-8 gap-y-10">
        <div className="min-w-[14rem] flex-1">
          <div className="h-px w-full bg-ink/70" />
          <p className="mt-2.5 text-xs text-quiet">Pharmacist signature</p>
        </div>
        <div className="w-36">
          <div className="h-px w-full bg-ink/70" />
          <p className="mt-2.5 text-xs text-quiet">Date</p>
        </div>
      </div>
    </section>
  );
}

function MemoryPanel({
  facility,
  decisions,
  ephemeral,
  onChange,
}: {
  facility: string;
  decisions: Decision[];
  ephemeral: boolean;
  onChange: () => void;
}) {
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
    <section className="border hairline bg-white p-6">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-short" />
        <h2 className="text-sm font-semibold tracking-wide">Meterless memory</h2>
      </div>
      <p className="mt-2.5 max-w-[60ch] text-sm text-quiet">
        One decision from a pharmacist, stored with its source and applied to every later packet.
      </p>
      {ephemeral && (
        <p className="mt-2 max-w-[60ch] text-xs leading-relaxed text-short">
          This deployment keeps memory on a serverless instance, so a decision lasts for this session rather than for
          the facility. Run it locally for durable memory.
        </p>
      )}

      <div className="mt-5 space-y-2.5">
        <label htmlFor="decision" className="sr-only">
          Decision
        </label>
        <textarea
          id="decision"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="w-full border hairline px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <div className="flex flex-wrap gap-2.5">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="exclude keyword"
            aria-label="Exclude keyword"
            className="w-36 border hairline px-3 py-2 font-mono text-xs outline-none focus:border-ink"
          />
          <input
            value={signedBy}
            onChange={(e) => setSignedBy(e.target.value)}
            placeholder="entered by (required)"
            aria-label="Entered by"
            className="min-w-[12rem] flex-1 border hairline px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </div>
        <button
          onClick={() => void add()}
          disabled={busy || !signedBy.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Store and rebuild the packet
        </button>
        {trace && <p className="text-xs text-quiet">Retrieval trace: {trace}</p>}
      </div>

      {decisions.length > 0 && (
        <ul className="mt-6 divide-y divide-rule border-t hairline">
          {decisions.map((d) => (
            <li key={d.id} className="flex items-start justify-between gap-3 py-3.5">
              <div>
                <p className="text-sm">{d.content}</p>
                <p className="mt-1 font-mono text-xs text-quiet">
                  {d.id} · {d.source}
                  {d.excludeKeyword ? ` · exclude:${d.excludeKeyword}` : ""}
                </p>
              </div>
              <button
                onClick={async () => {
                  await api.retireDecision(d.id);
                  onChange();
                }}
                className="shrink-0 rounded-sm text-quiet transition-colors hover:text-short"
                aria-label={`Retire decision ${d.id}`}
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
  const [status, setStatus] = useState<ZetarisStatus | null>(null);
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
    <section className="border hairline bg-white p-6">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-short" />
        <h2 className="text-sm font-semibold tracking-wide">Zetaris federation</h2>
      </div>
      <p className="mt-2.5 max-w-[60ch] text-sm text-quiet">
        The FDA endpoint registered as a Lightning REST table and queried in place. Nothing is copied into a warehouse.
      </p>

      <p className="mt-3 font-mono text-xs text-quiet">
        {status ? (
          <>
            {status.base} · {status.configured ? "credentials set" : "no credentials"} ·{" "}
            <span className={status.reachable ? "text-supply" : "text-short"}>
              {status.reachable ? "reachable" : "unreachable"}
            </span>
          </>
        ) : (
          "status unknown"
        )}
      </p>

      {status?.note && <p className="mt-2 max-w-[60ch] text-xs leading-relaxed text-short">{status.note}</p>}

      <div className="mt-5 flex flex-wrap gap-2.5">
        <button
          onClick={() => act(async () => setLog((await api.zetarisSetup()).log))}
          disabled={busy}
          className="border hairline px-4 py-2.5 text-xs font-medium transition-colors hover:bg-paper disabled:opacity-50"
        >
          Register source
        </button>
        <button
          onClick={() => act(async () => setRun((await api.zetarisQuery()).provenance))}
          disabled={busy}
          className="border hairline px-4 py-2.5 text-xs font-medium transition-colors hover:bg-paper disabled:opacity-50"
        >
          Run the join
        </button>
      </div>

      {err && <p className="mt-3 max-w-[60ch] font-mono text-xs leading-relaxed text-short">{err}</p>}
      {log.length > 0 && (
        <pre className="mt-3 max-h-36 overflow-auto bg-paper p-3 font-mono text-xs leading-relaxed">{log.join("\n")}</pre>
      )}
      {run && (
        <p className="mt-3 text-xs text-quiet">
          Live run of {run.sqlFile} returned{" "}
          <strong className="font-mono tabular font-medium text-ink">{run.rowCount}</strong> rows at{" "}
          <span className="font-mono tabular">{new Date(run.ranAt).toLocaleTimeString()}</span>
        </p>
      )}

      {!run && status?.recordedRun && (
        <div className="mt-4 border-t hairline pt-4">
          <p className="text-xs text-quiet">
            Recorded run, not live.{" "}
            <span className="font-mono tabular">{status.recordedRun.sqlFile}</span> returned{" "}
            <strong className="font-mono tabular font-medium text-ink">{status.recordedRun.rowCount}</strong> rows on{" "}
            <span className="font-mono tabular">{new Date(status.recordedRun.recordedAt).toLocaleString()}</span> from a
            Zetaris instance at <span className="font-mono">{status.recordedRun.base}</span>.
          </p>
          <RecordedTable run={status.recordedRun} />
        </div>
      )}
    </section>
  );
}

function RecordedTable({ run }: { run: NonNullable<ZetarisStatus["recordedRun"]> }) {
  const head = run.columns.length ? run.columns : run.rows[0]?.map((_, i) => `col ${i + 1}`) ?? [];
  return (
    <div className="mt-3 max-h-56 overflow-auto border hairline">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-paper">
          <tr>
            {head.map((h) => (
              <th key={String(h)} className="whitespace-nowrap border-b hairline px-2.5 py-2 font-medium text-quiet">
                {String(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {run.rows.slice(0, 40).map((r, i) => (
            <tr key={i} className="border-b hairline last:border-0">
              {(r as unknown[]).map((cell, j) => (
                <td key={j} className="max-w-[16rem] truncate px-2.5 py-1.5 font-mono tabular" title={String(cell ?? "")}>
                  {String(cell ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Disclaimers({ packet }: { packet: Packet }) {
  return (
    <footer className="space-y-3 border-t hairline pt-6 text-xs leading-relaxed text-quiet">
      <p className="max-w-[80ch]">{packet.disclaimers.openFda}</p>
      <p className="max-w-[80ch]">{packet.disclaimers.nlm}</p>
    </footer>
  );
}
