# Stopgap — written explanation

**Track 02, The Agent That Can Explain Why.**
Repository: https://github.com/AustinChris1/stopgap
Live: https://stopgap-rx.vercel.app

## The problem

When a drug goes into shortage, a hospital pharmacist assembles the supply picture by hand: the
FDA shortage file, each manufacturer's resupply note, and the formulary. Vizient's survey of 132
health systems, released 17 June 2025, put that work at roughly 20 million hours across US
hospitals in 2023, close to $900 million in labour. Bluesight surveyed 437 hospital pharmacy
professionals in January and February 2026 and found 69.7% still tracking shortages on
spreadsheets.

Stopgap assembles that packet, cites every row, and stops where clinical judgement starts.

## What it does, and what it refuses to do

Given one package NDC in shortage, Stopgap returns a sourced supply packet: the pinned row, other
packages at the same concentration, other presentations, and anything excluded by a decision the
pharmacy has already made. Every row carries its labeler, package NDC, availability, the date the
FDA row was updated, the manufacturer's resupply note, its RxNorm concept and a link to its FDA
label on DailyMed.

It never names, ranks or recommends a substitute. The clinical conclusion field is empty by
construction, and the signature and date lines are blank. The openFDA "do not rely on this for
medical care" sentence and the NLM attribution are printed on the packet itself.

The rule that makes this safe is the grouping. Rows are split by the concentration printed on
each individual openFDA row, so a 40 mg/mL concentrate vial never merges with a premixed dextrose
bag. There is no ingredient-level join anywhere in the code, because an ingredient join merges
exactly those two things.

## How Zetaris was used

Zetaris registers the FDA shortage endpoint as a single Lightning REST table, and a SchemaStore
view explodes `results` so each package becomes a row, split by presentation into concentrate
vials and premixed bags. The query runs in place. Nothing is copied into a warehouse. The SQL is
in [`zetaris/sql`](zetaris/sql).

The specific thing worth reporting: the whole federation is two statements plus a view, and the
join key never had to exist. We expected to need a second source keyed on RxCUI to separate the
vial from the bag. The presentation string already on each row did it, and `explode(results)` over
one REST table was the entire data layer.

One honest note. The registration runs `CACHE TABLE`, which pins the response for the session so
the demo is reproducible. The packet itself makes its own live call to the same endpoint, so the
two are independent paths to the same file.

A real run against a local instance is committed at [`zetaris/last-run.json`](zetaris/last-run.json):
11 rows, recorded 2026-10-27. The hosted deployment cannot reach a Zetaris instance running on a
laptop, so it serves that captured run labelled as recorded, never as live.

## How Meterless was used

The Meterless H-MEM reference engine is vendored and carries the pharmacy's own decisions. A
pharmacist enters one, for example "this hospital does not stock premixed dextrose bags", with
their name recorded as the source and an append-only trust ledger entry behind it.

The next packet applies it. The seven premixed rows move out of the supply list into their own
section, and each one names the decision id that removed it. The point is the distinction: a row
excluded by a pharmacy decision is not the same as a row that is out of stock, and the packet
never lets those two look alike.

## How NVIDIA Nemotron was used

Nemotron drafts exactly one sentence: the refusal line that tells the reader the packet reports
supply and the clinical decision belongs to the pharmacist. It runs on the hosted endpoint at
build.nvidia.com using `nvidia/nemotron-3.5-lightning-30b-a3b`.

Two things we had to learn. The model ids in circulation are wrong; the only reliable list is the
live `/v1/models` catalogue. And the 3.5 family reasons by default, spending the entire token
budget on `reasoning_content` and returning an empty message, so the call sets
`chat_template_kwargs: {thinking: false}`.

With no key, or on any error, the sentence is omitted and the omission is shown on screen. It is
never fabricated.

## Architecture

```
openFDA drug shortages ─┐
RxNorm (NLM RxNav)      ├─ keyed on package NDC ─→ packet engine ─→ packet UI
DailyMed (NLM)          ┘                              │
                                                       ├─ Meterless H-MEM: stored decisions
                                                       └─ Nemotron: one refusal sentence
Zetaris Lightning REST table ─→ same FDA endpoint, queried in place
```

A pnpm workspace. The server is Hono and runs both as a local node server and as one Vercel
serverless function, so the deployed site and the local one serve identical routes.

## What is not claimed

This is not the first drug shortage tool. rx-shortage-mcp does class-sibling lookups, RxFinder
joins the shortage file to NADAC, and Bluesight and Vizient sell into this market. The wedge is
narrower: a cited draft packet that deliberately refuses to name a substitute.

It covers one ingredient and one endpoint today. Pricing was dropped because the 2026 NADAC file
404s and RxFinder already joins it. Same class is not the same drug, and route, indication,
dosing and contraindications are not checked by anything here.

## What we would add next

Any ingredient rather than a pinned one; the pharmacy's real formulary as a second Zetaris
source so "other presentations" can be filtered against what the hospital actually stocks; and
the P&T committee's decision history as a shared Meterless world model rather than a
single-facility store.
