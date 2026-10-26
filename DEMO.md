# Demo script

The submission video is 1 to 4 minutes and must show how Zetaris and Meterless are integrated.
Record in this order. Everything below is live, so re-query immediately before recording.

## Before recording

1. `rm -rf .stopgap` so the memory store starts empty and run one shows all seven other presentations.
2. Restart the API, since the engine keeps state in process.
3. Open the packet route and press **Re-query live**. Read the openFDA file date out loud.
4. If the pinned package is no longer Unavailable, stop and re-pin to a package that is. The script
   below assumes Hikma 0143-9254-25 stays Unavailable with a November 2026 resupply line.

## Beat 1, the problem, 20 seconds

Land on the hero. One sentence: a drug goes into shortage and a pharmacist starts assembling a supply
picture by hand. Hold on the three figures. Do not read all three. Say the Vizient one: twenty million
hours in 2023.

## Beat 2, the live packet, 50 seconds

Click into the packet route.

- Point at the provenance bar: the FDA file date, the row count, the time of the re-query.
- The pinned row: Hikma dopamine 40 mg/mL, Unavailable, demand increase, resupply November 2026.
- Screen one, same concentration other labeler: two Hospira packages reporting Available, each with its
  RxNorm concept and a link to the FDA label on DailyMed.
- Screen two, other presentations: the premixed dextrose bags, labeled as a different product form.

Say the grouping rule out loud: split by the concentration printed on each row, so the vial and the bag
never merge.

## Beat 3, Zetaris, 40 seconds

Open the Zetaris panel. Press **Register source**, then **Run the join**. Show the row count returned.

Say: the FDA endpoint is registered as a Lightning REST table and queried in place. Nothing is copied.
Show `zetaris/sql/01_create_sources.sql` on screen for three seconds so the judge sees the statement.

## Beat 4, Meterless, 45 seconds

Open the memory panel. Type the decision, enter a name, press **Store and rebuild the packet**.

The packet rebuilds. Seven rows leave the other presentations section and appear under excluded by a
stored decision, each citing the decision id. Say: the exclusion is a pharmacy decision, not a supply
fact, and the packet says which decision removed each row.

## Beat 5, the refusal, 25 seconds

Scroll to the clinical conclusion. Press the Nemotron button if a key is set. Read the scope line.
Hold on the blank signature and date rules for three full seconds. End there.

If Nemotron has no key or errors, the panel says so on screen. Leave it visible and say the packet
stands without it. Do not cut around it.

## What not to claim

- Do not call this the first recall or shortage tool. A class-sibling MCP server exists, and RxFinder
  already joins the shortage file to NADAC.
- Do not say the agent recommends anything.
- Do not read the ASHP 227 figure. It was not verifiable from the source page during the build.
