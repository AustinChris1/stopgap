# Demo script

One to four minutes, and it must show how Zetaris and Meterless are integrated.

**Record locally.** The deployment cannot reach a Zetaris instance on your machine, and hosted
memory lives in `/tmp` on one serverless instance. The live site is for judges to click after
the video, not for the recording.

## Before you roll

1. Zetaris up: `cd ~/zetaris/zetaris-platform && docker compose up -d && ./verify.sh`.
   That `verify.sh` is Zetaris's, in their bundle, not in this repo.
2. `rm -rf .stopgap` so memory starts empty and run one shows all seven premix rows.
3. Restart the API, since it holds the memory engine in process.
4. `pnpm dev:server` and `pnpm dev:web`, then open http://localhost:5173.
5. Close other heavy apps. Zetaris takes 12 GB and the REST create fails under memory pressure
   with an error that blames the URL.
6. Press **Re-query live** and read the file date aloud.

## The rows as the file reports them

Re-check before recording. These were true on the 2026-10-27 file.

| NDC | Labeler | Status |
|---|---|---|
| 0143-9254-25 | Hikma | Unavailable, resupply November 2026. This is the pin. |
| 0143-9252-25 | Hikma, same labeler | Unavailable, backorder into February 2027 |
| 0409-9104-20 | Hospira | Limited Availability, recovery estimated March 2027 |
| 0409-5820-01 | Hospira | Available, updated 10/21/2026 |

The other seven are premixed dextrose bags: four Baxter available, two Hospira available, and
Hospira 0409-7809-24 unavailable through December 2027.

## Beat 1, the problem, 20 seconds

The hero reads the FDA file on load and plots all eleven packages. Say: a drug goes short and a
pharmacist starts assembling a supply picture by hand. Vizient put that at roughly twenty
million hours across US hospitals in 2023.

## Beat 2, the live packet, 50 seconds

Point at the provenance bar: file date, row count, time of the re-query.

Then the chart. The pinned Hikma package sits at 40 mg per mL. Three other packages share that
concentration: one is Hikma's own second package and also unavailable, one Hospira package is
limited, one Hospira package is available. The seven premixed bags sit at entirely different
concentrations, which is why they are listed as other presentations rather than alternatives.

Say the grouping rule: split by the concentration printed on each row, so a vial never merges
with a bag.

## Beat 3, Zetaris, 40 seconds

Open the Zetaris panel. Press **Register source**, then **Run the query**, and show the row
count. Put `zetaris/sql/01_create_sources.sql` on screen for three seconds.

Say precisely this: Zetaris registers the FDA endpoint as one Lightning REST table, and the view
explodes `results` so each package becomes a row, queried in place with nothing copied into a
warehouse. The registration caches the response for the session so the demo is stable. Do not
call it a join; it is one view over one table.

## Beat 4, Meterless, 45 seconds

In the memory panel, type the decision, enter a name, press **Store and rebuild the packet**.

Seven rows leave **Other presentations** and appear under **Excluded by a stored decision**,
each naming the decision id that removed it. Say: that exclusion is a pharmacy decision, not a
supply fact, and the packet says which decision removed each row.

## Beat 5, the refusal, 25 seconds

Scroll to the clinical conclusion. Press the Nemotron button. Read the scope line. Hold on the
blank signature and date for three full seconds and end there.

If Nemotron errors, leave the error on screen and say the packet stands without it.

## Do not say

- Do not call the second group "another maker of 40 mg per mL". One of them is Hikma's own
  package, and one is only limited.
- Do not say "in shortage at this facility". These are national shortage rows, not your inventory.
- Do not call this the first shortage tool. rx-shortage-mcp, RxFinder, Bluesight and Vizient
  already exist. The wedge is a cited draft that refuses to name a substitute.
- Do not quote a total shortage count on camera. The page reads the dopamine search, which
  returns eleven rows, not the whole file.
