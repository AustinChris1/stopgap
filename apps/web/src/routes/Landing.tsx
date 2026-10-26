import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FileSignature, Database, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { Mark, Wordmark } from "../components/Logo.tsx";

const FIGURES = [
  { value: "1,141", label: "current shortage records in the FDA file", source: "openFDA, 23 Oct 2026" },
  { value: "20M", label: "hours US hospitals spent managing shortages in 2023", source: "Vizient, Jun 2025" },
  { value: "69.7%", label: "of hospital pharmacists still track shortages on spreadsheets", source: "Bluesight, Jun 2026" },
];

const STEPS = [
  { icon: Database, title: "One live source, read in place", body: "Zetaris registers the FDA shortage endpoint as a table. Nothing is copied, and an uncached query refetches it." },
  { icon: Brain, title: "One decision, remembered", body: "Meterless H-MEM stores what the pharmacy already ruled on. The next packet drops those rows and says which decision removed them." },
  { icon: FileSignature, title: "The clinical line stays blank", body: "Stopgap groups supply by the presentation printed on each row. It never names a substitute. A pharmacist signs." },
];

export function Landing() {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <Wordmark />
        <Link
          to="/packet"
          className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:gap-3"
        >
          Open a packet
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:pt-16">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-mono text-xs uppercase tracking-[0.2em] text-quiet"
        >
          Drug shortage, hospital pharmacy
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
        >
          A drug goes short. The paperwork starts.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="mt-6 max-w-xl text-lg leading-relaxed text-quiet"
        >
          Stopgap assembles the sourced supply packet a pharmacist needs, cites every row, and refuses to name a
          substitute.
        </motion.p>

        <GapDiagram reduce={Boolean(reduce)} />
      </section>

      <section className="border-y hairline bg-white/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-3">
          {FIGURES.map((f, i) => (
            <motion.div
              key={f.value}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <div className="font-display text-4xl font-semibold tabular">{f.value}</div>
              <p className="mt-2 text-sm leading-snug text-ink/80">{f.label}</p>
              <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wider text-quiet">{f.source}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">How one packet is built</h2>
        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="border-t-2 border-ink pt-5"
            >
              <s.icon className="h-5 w-5 text-short" strokeWidth={1.75} />
              <h3 className="mt-4 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-quiet">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="border hairline bg-white p-8 sm:p-12"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-quiet">What Stopgap will not do</p>
          <p className="mt-5 max-w-2xl font-display text-2xl leading-snug sm:text-3xl">
            It will not tell you what to give the patient.
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-quiet">
            Same class is not interchangeable. Route, indication, dosing and contraindications are not checked. The
            packet reports supply and leaves the conclusion where it belongs.
          </p>
          <div className="mt-10 flex items-end gap-6">
            <div className="flex-1">
              <div className="h-px w-full bg-ink/70" />
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-quiet">Pharmacist signature</p>
            </div>
            <div className="w-32">
              <div className="h-px w-full bg-ink/70" />
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-quiet">Date</p>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t hairline">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-10 text-xs leading-relaxed text-quiet">
          <div className="flex items-center gap-2 text-ink">
            <Mark className="h-5 w-5" />
            <span className="font-display font-semibold">Stopgap</span>
          </div>
          <p>
            Do not rely on openFDA to make decisions regarding medical care. All results should be assumed unvalidated.
          </p>
          <p>
            This product uses publicly available data from the U.S. National Library of Medicine. NLM is not responsible
            for the product and does not endorse or recommend this or any other product.
          </p>
        </div>
      </footer>
    </div>
  );
}

// The mark's own mechanic: two supply blocks close in, and stop short of the gap.
function GapDiagram({ reduce }: { reduce: boolean }) {
  const bar = (origin: "left" | "right") => ({
    initial: reduce ? false : { scaleX: 0.35, opacity: 0 },
    animate: { scaleX: 1, opacity: 1 },
    transition: { duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] as const },
    style: { transformOrigin: origin },
    className: "h-14 flex-1 rounded-sm bg-ink",
  });

  return (
    <div className="mt-16 border hairline bg-white p-6 sm:p-10">
      <div className="flex items-center gap-3">
        <motion.div {...bar("left")} />
        <div className="w-24 shrink-0 text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.45, delay: 0.8 }}
            className="h-px w-full bg-short"
          />
          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.95 }}
            className="mt-2 font-mono text-[10px] uppercase tracking-wider text-short"
          >
            signature
          </motion.p>
        </div>
        <motion.div {...bar("right")} />
      </div>
      <div className="mt-5 flex justify-between font-mono text-[11px] uppercase tracking-wider text-quiet">
        <span>Reported supply</span>
        <span>Reported supply</span>
      </div>
    </div>
  );
}
