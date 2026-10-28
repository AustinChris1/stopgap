# Stopgap

When a drug goes into shortage, a hospital pharmacist assembles a supply picture by hand from the FDA
shortage file, manufacturer notices and the formulary. Stopgap assembles that packet, cites every row,
and stops where the clinical judgement starts.

Open Agent Hackathon 2026, Track 02: The Agent That Can Explain Why.

**Live:** https://stopgap-rx.vercel.app

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

**Zetaris** registers the FDA shortage endpoint as a single Lightning REST table, and a view explodes
`results` so each package becomes a row, split by presentation. The query runs in place and nothing is
copied into a warehouse. The SQL is in [zetaris/sql](zetaris/sql).

The registration runs `CACHE TABLE`, which pins the response for the session so a demo is reproducible.
The packet itself makes its own independent live call to the same endpoint, so the two are separate paths
to the same file. A real run is committed at [zetaris/last-run.json](zetaris/last-run.json): 11 rows,
captured 27 October 2026.

**Meterless** supplies the memory. The H-MEM reference engine stores one pharmacist decision with its
source and an append-only trust ledger entry. The next packet applies it: rows the decision excludes move
to their own section and cite the decision id that removed them.

**NVIDIA Nemotron** drafts the one refusal sentence, on the hosted endpoint at build.nvidia.com using
`nvidia/nemotron-3.5-lightning-30b-a3b`. The call sets `chat_template_kwargs: {thinking: false}`, because
the 3.5 family otherwise spends its whole budget on `reasoning_content` and returns an empty message. With
no key, or on any error, the sentence is omitted and the omission is shown. It is never fabricated.

## Pre-existing components

Everything in this repository was written during the build window, 22 to 27 October 2026, except the
following, which are declared here as pre-existing:

| Component | What it is | Origin |
|---|---|---|
| [vendor/hmem](vendor/hmem) | the Meterless H-MEM reference engine, Apache 2.0 | vendored unmodified from `meterless/meterless` with `degit`; our code imports it, none of it is ours |
| [zetaris/sql/01_create_sources.sql](zetaris/sql/01_create_sources.sql) | the Lightning REST registration | adapted from the verified PokeAPI example in `zetaris/getting-started`; the endpoint, the view and the split by presentation are ours |
| `deck/img/*` | two product screenshots in the deck | captured from this project during the window |

No other prior project, template or starter was used. The agent, the packet engine, the UI, the Zetaris
view, the memory wiring and the Nemotron call were all written inside the window.

## Run it

Node 20 or newer and pnpm 9. From a clean clone:

```bash
pnpm install
cp .env.example .env
pnpm dev:server     # API on http://localhost:8787
pnpm dev:web        # UI on http://localhost:5173
```

Open http://localhost:5173. **The packet works with no keys and no Zetaris**, reading openFDA, RxNorm and
DailyMed directly, so a reviewer can run it in two commands. Zetaris and Nemotron each light up a panel
once configured; [SETUP.md](SETUP.md) covers both.

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

## Hosting

The site is a static build plus one serverless function. `api/index.ts` mounts the same Hono
app the local server uses, through the node-server adapter that Vercel's Node runtime expects.

Two things behave differently when hosted, and the app says so on screen rather than pretending
otherwise:

- **Zetaris** runs on the operator's own machine, so a deployment cannot reach it. The panel
  reports that and the packet still builds. Run locally to demonstrate the federation.
- **Memory** falls back to `/tmp`, which is per-instance and not shared, so a stored decision
  lasts for the session rather than for the facility. Run locally for durable memory.

## Submission

| File | What it is |
|---|---|
| [SUBMISSION.md](SUBMISSION.md) | the written explanation, including how each sponsor technology was used |
| [deck/Stopgap-deck.pdf](deck/Stopgap-deck.pdf) | twelve slides; `deck/index.html` is the same deck in a browser |
| [DEMO.md](DEMO.md) | the recording script, with the rows as the file reports them |
| [zetaris/last-run.json](zetaris/last-run.json) | a real Zetaris run, 11 rows, captured 27 October 2026 |

## Layout

```
apps/server   packet engine, H-MEM memory, Zetaris client, Nemotron hook, HTTP API
apps/web      landing route and the packet route
zetaris/sql   Lightning REST table registration and the grouped supply query
deck/         the submission deck, its slide sources and a build script
vendor/hmem   Meterless H-MEM reference engine, vendored via degit
```
