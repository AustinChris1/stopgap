import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ZetarisClient } from "./zetaris.ts";

// Runs the registration and the query against a real Zetaris instance and records
// the result, so a deployment that cannot reach that instance can still show the
// rows it returned, labelled as a recorded run rather than a live one.
const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../../../zetaris/last-run.json");

const z = new ZetarisClient();
if (!z.configured) {
  console.error("No Zetaris credentials. Set ZETARIS_API_KEY, or ZETARIS_USERNAME and ZETARIS_PASSWORD.");
  process.exit(1);
}

console.log(`route ${z.route} via ${z.base}`);
console.log("registering source...");
for (const line of await z.runFile("01_create_sources.sql")) console.log("  " + line);

console.log("running the query...");
const file = "02_supply_by_presentation.sql";
const result = await z.query(file);

const record = {
  recordedAt: new Date().toISOString(),
  base: z.base,
  route: z.route,
  sqlFile: file,
  sql: result.sql,
  columns: result.columns,
  rows: result.rows,
  rowCount: result.rows.length,
};

writeFileSync(out, JSON.stringify(record, null, 2) + "\n", "utf8");
console.log(`recorded ${record.rowCount} rows to ${out}`);
