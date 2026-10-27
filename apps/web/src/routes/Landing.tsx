import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api, type Packet } from "../lib/api.ts";
import { Mark, Wordmark } from "../components/Logo.tsx";
import { Pipeline } from "../components/Pipeline.tsx";
import { SupplyLadder } from "../components/SupplyLadder.tsx";

const SOURCES = [
  { name: "openFDA", role: "shortage status, reason, resupply notes" },
  { name: "RxNorm", role: "one exact clinical drug concept per package" },
  { name: "DailyMed", role: "the citable FDA label for each row" },
];

const STACK = [
  { name: "Zetaris", role: "the FDA endpoint as a table, queried in place" },
  { name: "Meterless", role: "what the pharmacy already decided, remembered" },
  { name: "NVIDIA Nemotron", role: "drafts the one line that refuses to advise" },
];

export function Landing() {
  const [preview, setPreview] = useState<Packet | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.preview().then(setPreview).catch(() => setFailed(true));
  }, []);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <Wordmark />
        <Link
          to="/packet"
          className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-[gap] hover:gap-3"
        >
          Open a packet
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:pt-16">
        <h1 className="max-w-3xl font-display text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-7xl">
          A drug goes short. The paperwork starts.
        </h1>
        <p className="mt-7 max-w-[34ch] text-lg leading-relaxed text-quiet sm:text-xl">
          Stopgap assembles the sourced supply packet a pharmacist needs, cites every row, and refuses to name a
          substitute.
        </p>

        <div className="mt-14">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-sm font-semibold">Dopamine, read from the FDA file just now</h2>
            {preview && (
              <p className="text-xs text-quiet">
                file dated <span className="font-mono tabular">{preview.provenance.openFdaLastUpdated}</span> ·{" "}
                <span className="font-mono tabular">{preview.provenance.openFdaRowsReturned}</span> packages
              </p>
            )}
          </div>

          {preview ? (
            <SupplyLadder
              lines={[preview.pin, ...preview.sameConcentration, ...preview.otherPresentations, ...preview.excluded]}
              pinNdc={preview.pin.ndc}
            />
          ) : (
            <div className="flex items-center gap-3 border hairline bg-white px-5 py-10 text-sm text-quiet">
              {failed ? (
                "The live packet could not be read. The app itself still runs; open a packet to see the error."
              ) : (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Reading the FDA shortage file
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="border-y hairline bg-white/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="max-w-[38ch] font-display text-3xl leading-[1.15] tracking-[-0.02em] sm:text-5xl">
            US hospitals spent <span className="tabular">20 million</span> hours managing drug shortages in a single
            year.
          </p>
          <p className="mt-4 text-sm text-quiet">Vizient survey of 132 health systems, published June 2025</p>

          <dl className="mt-12 grid gap-x-16 gap-y-6 border-t hairline pt-6 sm:grid-cols-2">
            <div className="flex items-baseline gap-3">
              <dt className="shrink-0 font-display text-xl font-semibold tabular">1,141</dt>
              <dd className="max-w-[36ch] text-sm leading-relaxed text-quiet">
                shortage records in the FDA file, the one this page just read
              </dd>
            </div>
            <div className="flex items-baseline gap-3">
              <dt className="shrink-0 font-display text-xl font-semibold tabular">69.7%</dt>
              <dd className="max-w-[36ch] text-sm leading-relaxed text-quiet">
                of hospital pharmacists still track shortages on spreadsheets
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="mb-10 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          How one packet is built
        </h2>
        <Pipeline />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="border hairline bg-white p-8 sm:p-14">
          <p className="max-w-[26ch] font-display text-3xl leading-[1.1] tracking-[-0.02em] sm:text-5xl">
            It will not tell you what to give the patient.
          </p>
          <p className="mt-6 max-w-[58ch] text-sm leading-relaxed text-quiet">
            Same ingredient is not the same product. Route, indication, dosing and contraindications are not checked.
            The packet reports supply and leaves the conclusion where it belongs.
          </p>
          <div className="mt-14 flex flex-wrap items-end gap-x-8 gap-y-10">
            <div className="min-w-[14rem] flex-1">
              <div className="h-px w-full bg-ink/70" />
              <p className="mt-2.5 text-xs text-quiet">Pharmacist signature</p>
            </div>
            <div className="w-36">
              <div className="h-px w-full bg-ink/70" />
              <p className="mt-2.5 text-xs text-quiet">Date</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-x-16 gap-y-12 sm:grid-cols-2">
          <Column title="Every row comes from" items={SOURCES} />
          <Column title="Built on" items={STACK} />
        </div>
      </section>

      <footer className="border-t hairline">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-10 text-xs leading-relaxed text-quiet">
          <div className="flex items-center gap-2 text-ink">
            <Mark className="h-5 w-5" />
            <span className="font-display font-semibold">Stopgap</span>
          </div>
          <p className="max-w-[80ch]">
            Do not rely on openFDA to make decisions regarding medical care. All results should be assumed unvalidated.
          </p>
          <p className="max-w-[80ch]">
            This product uses publicly available data from the U.S. National Library of Medicine. NLM is not responsible
            for the product and does not endorse or recommend this or any other product.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Column({ title, items }: { title: string; items: { name: string; role: string }[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <dl className="mt-5 border-t hairline">
        {items.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="grid grid-cols-[9rem_1fr] gap-4 border-b hairline py-4"
          >
            <dt className="font-display text-base font-semibold">{s.name}</dt>
            <dd className="text-xs leading-relaxed text-quiet">{s.role}</dd>
          </motion.div>
        ))}
      </dl>
    </div>
  );
}
