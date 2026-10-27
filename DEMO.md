# Demo script

The submission video is 1 to 4 minutes and must show how Zetaris and Meterless are integrated.

**Record locally, not from the deployed site.** A deployment cannot reach a Zetaris instance
running on your own machine, and hosted memory lives on a serverless instance rather than on
disk. Both panels say so on screen when hosted, which is honest but is not the demo. The live
site at https://genai-eta-snowy.vercel.app is for judges to click around after the video.

## Before recording

1. Bring Zetaris up and confirm `./verify.sh` passes.
2. `rm -rf .stopgap` so memory starts empty and run one shows all seven other presentations.
3. Restart the API, since the engine holds state in process.
4. `pnpm dev:server` and `pnpm dev:web`, then open http://localhost:5173.
5. Press **Re-query live** and read the FDA file date out loud.
6. If the pinned package is no longer Unavailable, re-pin to one that is. The script below
   assumes Hikma 0143-9254-25 stays Unavailable with a November 2026 resupply line.

## Beat 1, the problem, 20 seconds

Land on the hero. A drug goes into shortage and a pharmacist starts assembling a supply picture
by hand. Say the Vizient figure: twenty million hours in a single year.

## Beat 2, the live packet, 50 seconds

Click into the packet route.

- The provenance bar: FDA file date, row count, the time of the re-query.
- The pinned row: Hikma dopamine 40 mg/mL, Unavailable, demand increase, resupply November 2026.
- **Same concentration, other labeler**: two Hospira packages reporting Available, each with its
  RxNorm concept and a link to its FDA label on DailyMed.
- **Other presentations**: the premixed dextrose bags, labeled as a different product form.

Say the grouping rule out loud: split by the concentration printed on each row, so the vial and
the bag never merge.

## Beat 3, Zetaris, 40 seconds

Open the Zetaris panel. It should read reachable. Press **Register source**, then **Run the
join**, and show the row count returned.

Say: the FDA endpoint is registered as a Lightning REST table and queried in place, nothing is
copied. Show `zetaris/sql/01_create_sources.sql` on screen for three seconds.

## Beat 4, Meterless, 45 seconds

In the memory panel, type the decision, enter a name, press **Store and rebuild the packet**.

Seven rows leave **Other presentations** and appear under **Excluded by a stored decision**, each
citing the decision id. Say: the exclusion is a pharmacy decision, not a supply fact, and the
packet names the decision that removed each row.

## Beat 5, the refusal, 25 seconds

Scroll to the clinical conclusion. Press the Nemotron button if a key is set. Read the scope
line. Hold on the blank signature and date rules for three full seconds. End there.

If Nemotron has no key or errors, the panel says so on screen. Leave it visible and say the
packet stands without it. Do not cut around it.

## What not to claim

- Not the first shortage tool. A class-sibling MCP server exists, and RxFinder already joins the
  shortage file to NADAC.
- The agent does not recommend anything.
- Do not read the ASHP 227 figure. It was not verifiable from the source page during the build.
