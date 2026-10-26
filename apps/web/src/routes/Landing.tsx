import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Mark, Wordmark } from "../components/Logo.tsx";

const STEPS = [
  {
    title: "One live source, read in place",
    body: "Zetaris registers the FDA shortage endpoint as a table and queries it where it sits. Nothing is copied, and an uncached query refetches it, so a judge can re-run the same call.",
  },
  {
    title: "One decision, remembered",
    body: "Meterless stores what the pharmacy already ruled on, with the name of whoever entered it. The next packet drops those rows into their own section and names the decision that removed them.",
  },
  {
    title: "The clinical line stays blank",
    body: "Rows are grouped by the concentration printed on each one, so a concentrate vial never merges with a premixed bag. No substitute is named. A pharmacist signs.",
  },
];

export function Landing() {
  const reduce = useReducedMotion();

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

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-12 sm:pt-20">
        <h1 className="max-w-3xl font-display text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-7xl">
          A drug goes short. The paperwork starts.
        </h1>
        <p className="mt-7 max-w-[34ch] text-lg leading-relaxed text-quiet sm:text-xl">
          Stopgap assembles the sourced supply packet a pharmacist needs, cites every row, and refuses to name a
          substitute.
        </p>

        <GapDiagram reduce={Boolean(reduce)} />
      </section>

      <section className="border-y hairline bg-white/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="max-w-[38ch] font-display text-3xl leading-[1.15] tracking-[-0.02em] sm:text-5xl">
            US hospitals spent{" "}
            <span className="tabular">20 million</span> hours managing drug shortages in a single year.
          </p>
          <p className="mt-4 text-sm text-quiet">Vizient survey of 132 health systems, published June 2025</p>

          <dl className="mt-12 grid gap-x-16 gap-y-6 border-t hairline pt-6 sm:grid-cols-2">
            <div className="flex items-baseline gap-3">
              <dt className="shrink-0 font-display text-xl font-semibold tabular">1,141</dt>
              <dd className="max-w-[36ch] text-sm leading-relaxed text-quiet">
                shortage records currently in the FDA file, read live by this app
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
        <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">How one packet is built</h2>
        <dl className="mt-10 border-t hairline">
          {STEPS.map((s) => (
            <div key={s.title} className="grid gap-x-12 gap-y-2 border-b hairline py-7 sm:grid-cols-[22rem_1fr]">
              <dt className="font-display text-xl font-semibold leading-snug">{s.title}</dt>
              <dd className="max-w-[62ch] text-sm leading-relaxed text-quiet">{s.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
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

// The one authored moment: supply closes in from both sides and stops, leaving the signature rule.
function GapDiagram({ reduce }: { reduce: boolean }) {
  const ease = [0.16, 1, 0.3, 1] as const;
  const bar = (origin: "left" | "right") => ({
    initial: reduce ? false : { scaleX: 0.28, opacity: 0 },
    animate: { scaleX: 1, opacity: 1 },
    transition: { duration: 1.1, delay: 0.25, ease },
    style: { transformOrigin: origin },
    className: "h-16 flex-1 rounded-sm bg-ink",
  });

  return (
    <div className="mt-20 border hairline bg-white p-6 sm:p-10">
      <div className="flex items-center gap-4 sm:gap-6">
        <motion.div {...bar("left")} />
        <div className="w-20 shrink-0 text-center sm:w-28">
          <motion.div
            initial={reduce ? false : { opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.95, ease }}
            className="h-px w-full bg-short"
          />
          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.15 }}
            className="mt-2.5 text-xs text-short"
          >
            signature
          </motion.p>
        </div>
        <motion.div {...bar("right")} />
      </div>
      <div className="mt-6 flex justify-between text-xs text-quiet">
        <span>Reported supply</span>
        <span>Reported supply</span>
      </div>
    </div>
  );
}
