import { useState } from "react";
import type { SupplyLine } from "../lib/api.ts";

// Status colors, validated for CVD separation and chroma against a white surface.
// They always ship beside a shape and a label, never as color alone.
const SUPPLY = "#0f7a5a";
const SHORT = "#9a5b16";

const W = 820;
const PAD_L = 150;
const PAD_R = 54;
const TOP = 36;
const DOT = 7;
const STEP = 20;

type Row = { key: string; label: string; lines: SupplyLine[] };

type State = "available" | "limited" | "out";

function stateOf(l: SupplyLine): State {
  if (/limited/i.test(l.availability)) return "limited";
  if (/^available$/i.test(l.availability)) return "available";
  return "out";
}

// Three marks, so the state is carried by shape as well as colour.
function Mark({ state, r }: { state: State; r: number }) {
  if (state === "available") return <circle r={r} fill={SUPPLY} />;
  if (state === "limited")
    return (
      <>
        <circle r={r} fill="none" stroke={SHORT} strokeWidth={2.5} />
        <circle r={r / 2.6} fill={SHORT} />
      </>
    );
  return <circle r={r} fill="#ffffff" stroke={SHORT} strokeWidth={2.5} />;
}

function groupByConcentration(lines: SupplyLine[]) {
  const m = new Map<number, SupplyLine[]>();
  for (const l of lines) {
    const c = l.concentrationMgPerMl as number;
    m.set(c, [...(m.get(c) ?? []), l]);
  }
  return m;
}

export function SupplyLadder({ lines, pinNdc }: { lines: SupplyLine[]; pinNdc: string }) {
  const [hover, setHover] = useState<SupplyLine | null>(null);

  const plotted = lines.filter((l) => l.concentrationMgPerMl !== null);
  if (plotted.length === 0) return null;

  const rows: Row[] = [
    { key: "vial", label: "Concentrate vials", lines: plotted.filter((l) => !l.isPremix) },
    { key: "premix", label: "Premixed bags", lines: plotted.filter((l) => l.isPremix) },
  ].filter((r) => r.lines.length > 0);

  const values = plotted.map((l) => l.concentrationMgPerMl as number);
  const lo = Math.log10(Math.min(...values));
  const hi = Math.log10(Math.max(...values));
  const span = hi - lo || 1;
  const x = (c: number) => PAD_L + ((Math.log10(c) - lo) / span) * (W - PAD_L - PAD_R);

  const ticks = Array.from(new Set(values)).sort((a, b) => a - b);

  // Each band is tall enough for its deepest stack, so dots never escape their row.
  const bands = rows.map((row) => {
    const groups = groupByConcentration(row.lines);
    const deepest = Math.max(...[...groups.values()].map((g) => g.length));
    return { row, groups, height: 40 + deepest * STEP };
  });

  let cursor = TOP;
  const placed = bands.map((b) => {
    const top = cursor;
    cursor += b.height;
    return { ...b, top };
  });
  const plotBottom = cursor;
  const height = plotBottom + 46;

  return (
    <figure className="m-0">
      <figcaption className="sr-only">
        Every reported package plotted by concentration in milligrams per millilitre, split into concentrate vials and
        premixed bags, with reported availability.
      </figcaption>

      <div className="border hairline bg-white">
        <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full" role="img">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} y1={TOP - 14} x2={x(t)} y2={plotBottom - 8} stroke="#e7e1d3" strokeWidth={1} />
              <text
                x={x(t)}
                y={TOP - 20}
                textAnchor="middle"
                fontSize={11}
                fill="#6d6a62"
                fontFamily="'IBM Plex Mono', monospace"
              >
                {t}
              </text>
            </g>
          ))}
          <text x={PAD_L} y={height - 16} fontSize={11} fill="#6d6a62">
            concentration, mg per mL
          </text>

          {placed.map(({ row, groups, top }) => (
            <g key={row.key}>
              <line x1={16} y1={top} x2={W - PAD_R} y2={top} stroke="#efeadd" strokeWidth={1} />
              <text x={16} y={top + 20} fontSize={12} fill="#15191c" fontWeight={500}>
                {row.label}
              </text>
              <text x={16} y={top + 38} fontSize={11} fill="#6d6a62" fontFamily="'IBM Plex Mono', monospace">
                {row.lines.length}
              </text>

              {[...groups.entries()].map(([conc, group]) =>
                group.map((l, gi) => {
                  const cx = x(conc);
                  const cy = top + 24 + gi * STEP;
                  const state = stateOf(l);
                  const pinned = l.ndc === pinNdc;
                  return (
                    <g key={l.ndc} onMouseEnter={() => setHover(l)} onMouseLeave={() => setHover(null)}>
                      <circle cx={cx} cy={cy} r={DOT + 8} fill="transparent" />
                      <circle cx={cx} cy={cy} r={DOT + 2.5} fill="#ffffff" />
                      <g transform={`translate(${cx} ${cy})`}>
                        <Mark state={state} r={DOT} />
                      </g>
                      {pinned && (
                        <>
                          <circle cx={cx} cy={cy} r={DOT + 6} fill="none" stroke={SHORT} strokeWidth={1} opacity={0.55} />
                          <text x={cx - DOT - 12} y={cy + 4} textAnchor="end" fontSize={11} fill={SHORT} fontWeight={500}>
                            in shortage here
                          </text>
                        </>
                      )}
                      <title>{`${l.labeler} · ${l.ndc} · ${l.availability}`}</title>
                    </g>
                  );
                }),
              )}
            </g>
          ))}
        </svg>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t hairline px-4 py-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-2">
              <svg width="14" height="14" aria-hidden="true">
                <circle cx="7" cy="7" r="5" fill={SUPPLY} />
              </svg>
              <span className="text-quiet">Reported available</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <svg width="14" height="14" aria-hidden="true">
                <circle cx="7" cy="7" r="4.5" fill="none" stroke={SHORT} strokeWidth="2" />
                <circle cx="7" cy="7" r="1.8" fill={SHORT} />
              </svg>
              <span className="text-quiet">Limited</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <svg width="14" height="14" aria-hidden="true">
                <circle cx="7" cy="7" r="4.5" fill="#fff" stroke={SHORT} strokeWidth="2" />
              </svg>
              <span className="text-quiet">Unavailable</span>
            </span>
          </div>
          <p className="min-h-[1rem] text-quiet">
            {hover ? (
              <span>
                <span className="font-medium text-ink">{hover.labeler}</span>{" "}
                <span className="font-mono tabular">{hover.ndc}</span> · {hover.availability}
              </span>
            ) : (
              "Hover a package for its labeler and NDC"
            )}
          </p>
        </div>
      </div>
    </figure>
  );
}
