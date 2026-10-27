import { motion, useReducedMotion } from "framer-motion";

const INK = "#15191c";
const RULE = "#d8d2c4";
const SHORT = "#9a5b16";
const SUPPLY = "#0f7a5a";

const STAGES = [
  { t: "Read in place", d: "The FDA endpoint is a Zetaris table, queried where it sits." },
  { t: "Split by concentration", d: "A vial never merges with a premixed bag." },
  { t: "Apply what was decided", d: "Meterless drops rows the pharmacy already ruled out." },
  { t: "Leave the line blank", d: "No substitute is named. A pharmacist signs." },
];

// The mechanic drawn rather than described: rows arrive, separate, thin out, and stop at a rule.
export function Pipeline() {
  const reduce = useReducedMotion();
  const draw = (delay: number) => ({
    initial: reduce ? false : { pathLength: 0 },
    whileInView: { pathLength: 1 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div>
      <svg viewBox="0 0 900 150" className="h-auto w-full" role="img" aria-label="How a packet is assembled">
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={16 + i * 225} y1={118} x2={16 + i * 225 + 196} y2={118} stroke={RULE} strokeWidth={1} />
        ))}

        {/* 1. one source feeding many rows */}
        <g>
          <rect x={16} y={26} width={60} height={34} rx={3} fill="none" stroke={INK} strokeWidth={1.5} />
          <text x={46} y={48} textAnchor="middle" fontSize={11} fill={INK} fontFamily="'IBM Plex Mono', monospace">
            FDA
          </text>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.path
              key={i}
              d={`M76 43 C 120 43, 130 ${30 + i * 12}, 176 ${30 + i * 12}`}
              fill="none"
              stroke={RULE}
              strokeWidth={1.5}
              {...draw(0.1 + i * 0.06)}
            />
          ))}
        </g>

        {/* 2. the split into two bands */}
        <g>
          {[0, 1, 2].map((i) => (
            <motion.rect
              key={`v${i}`}
              x={252}
              y={24 + i * 11}
              width={54}
              height={7}
              rx={2}
              fill={INK}
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.45 + i * 0.06 }}
              style={{ transformOrigin: "252px 0px" }}
            />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <motion.rect
              key={`p${i}`}
              x={252}
              y={72 + i * 11}
              width={54}
              height={7}
              rx={2}
              fill={RULE}
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.06 }}
              style={{ transformOrigin: "252px 0px" }}
            />
          ))}
          <text x={312} y={34} fontSize={10} fill={INK}>
            vials
          </text>
          <text x={312} y={82} fontSize={10} fill="#6d6a62">
            bags
          </text>
        </g>

        {/* 3. rows removed by a stored decision */}
        <g>
          {[0, 1, 2].map((i) => (
            <rect key={`k${i}`} x={477} y={24 + i * 11} width={54} height={7} rx={2} fill={INK} />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <motion.g
              key={`x${i}`}
              initial={reduce ? false : { opacity: 1, x: 0 }}
              whileInView={{ opacity: 0.25, x: 14 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.9 + i * 0.07 }}
            >
              <rect x={477} y={72 + i * 11} width={54} height={7} rx={2} fill={RULE} />
            </motion.g>
          ))}
          <motion.path
            d="M470 70 L 545 92"
            stroke={SHORT}
            strokeWidth={1.5}
            fill="none"
            {...draw(1.05)}
          />
        </g>

        {/* 4. the signature rule, left open */}
        <g>
          <motion.line x1={702} y1={62} x2={846} y2={62} stroke={INK} strokeWidth={1.5} {...draw(1.3)} />
          <circle cx={846} cy={62} r={3} fill={SUPPLY} />
          <text x={702} y={80} fontSize={10} fill="#6d6a62">
            signature
          </text>
        </g>
      </svg>

      <dl className="mt-6 grid gap-x-6 gap-y-6 sm:grid-cols-4">
        {STAGES.map((s) => (
          <div key={s.t}>
            <dt className="text-sm font-semibold">{s.t}</dt>
            <dd className="mt-1.5 text-xs leading-relaxed text-quiet">{s.d}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
