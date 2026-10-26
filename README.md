# Stopgap

When a drug goes into shortage, a hospital pharmacist assembles a supply picture by hand from the FDA
shortage file, manufacturer notices and the formulary. Stopgap assembles that packet, cites every row,
and stops where the clinical judgement starts.

Open Agent Hackathon 2026, Track 02: The Agent That Can Explain Why.

**The mark:** two supply bars stopping short of each other, leaving the signature rule open in the gap.

## What it refuses to do

Stopgap never names, ranks or recommends a substitute. Same ingredient is not the same product, and
route, indication, dosing and contraindications are not checked. The packet reports supply, prints the
openFDA and NLM disclaimers on its face, and leaves the clinical conclusion and the signature blank.

## What is real

Every row comes from a live public endpoint, queried at request time. Nothing is mocked or seeded.

| Source | Role | Keyed on |
|---|---|---|
| openFDA drug shortages | availability, reason, manufacturer resupply note | package NDC |
| RxNorm (NLM RxNav) | one exact clinical drug concept per package | package NDC |
| DailyMed (NLM) | the citable FDA label for each row | package NDC |

The grouping rule is the thing that makes the packet safe: rows are split by the concentration printed
on each openFDA row, so a 40 mg/mL concentrate vial never merges with a premixed dextrose bag. An
ingredient-level join would merge them, which is why there is no ingredient-level join anywhere in the code.

## Sponsor technology

**Zetaris** registers the FDA shortage endpoint as a Lightning REST table and queries it in place. The
SQL is in [zetaris/sql](zetaris/sql). Nothing is copied into a warehouse, and an uncached query refetches
the endpoint, so a judge can re-run it live.

**Meterless** supplies the memory. The H-MEM reference engine stores one pharmacist decision with its
source and an append-only trust ledger entry. The next packet applies it: rows the decision excludes move
to their own section and cite the decision id that removed them.

**NVIDIA Nemotron** drafts the one refusal sentence, through the hosted endpoint at build.nvidia.com. With
no key, or on any error, the sentence is omitted and the packet stands without it. It is never fabricated.

## Run it

```bash
pnpm install
cp .env.example .env
pnpm dev:server     # API on http://localhost:8787
pnpm dev:web        # UI on http://localhost:5173
```

The packet works with no keys at all. Zetaris and Nemotron each add a panel when configured.

```bash
pnpm packet                                   # print the packet in the terminal
pnpm packet --remember "This hospital does not stock premixed dextrose bags." --exclude premix --by "name"
pnpm packet                                   # the same packet, with that decision applied
```

## Configuration

| Variable | Effect when unset |
|---|---|
| `ZETARIS_API_KEY`, `ZETARIS_REST_URL`, `ZETARIS_ORG_ID` | the Zetaris panel reports unreachable; the packet still builds |
| `NVIDIA_API_KEY` | the refusal sentence is skipped and the omission is shown |
| `STOPGAP_PIN_NDC` | defaults to the Hikma dopamine 40 mg/mL package currently unavailable |

## Layout

```
apps/server   packet engine, H-MEM memory, Zetaris client, Nemotron hook, HTTP API
apps/web      landing route and the packet route
zetaris/sql   Lightning REST table registration and the grouped supply query
vendor/hmem   Meterless H-MEM reference engine, vendored via degit
```
