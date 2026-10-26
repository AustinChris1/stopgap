import { buildPacket, type SupplyLine } from "./packet.ts";
import { listDecisions, recordDecision } from "./memory.ts";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const pinNdc = flag("ndc") ?? process.env.STOPGAP_PIN_NDC ?? "0143-9254-25";
const genericQuery = flag("generic") ?? process.env.STOPGAP_GENERIC ?? "dopamine";
const facility = flag("facility") ?? "default";

if (args.includes("--remember")) {
  const content = flag("remember")!;
  const d = recordDecision({ content, excludeKeyword: flag("exclude"), facility, signedBy: flag("by") ?? "cli" });
  console.log(`stored decision ${d.id}: ${d.content}${d.excludeKeyword ? ` [exclude:${d.excludeKeyword}]` : ""}`);
  process.exit(0);
}

const packet = await buildPacket({ pinNdc, genericQuery, facility, enrich: !args.includes("--fast") });

const line = (l: SupplyLine) =>
  `  ${pad(l.availability, 20)} ${pad(l.labeler, 26)} ${pad(l.ndc, 14)} ${l.presentation.slice(0, 54)}` +
  `${l.resupplyNote ? `\n${" ".repeat(24)}resupply: ${l.resupplyNote.slice(0, 90)}` : ""}` +
  `${l.conceptName ? `\n${" ".repeat(24)}RxNorm ${l.rxcuiExact}: ${l.conceptName}` : ""}` +
  `${l.label?.labelUrl ? `\n${" ".repeat(24)}label: ${l.label.labelUrl}` : ""}`;

function pad(s: string, n: number) {
  return (s ?? "").padEnd(n).slice(0, n);
}

console.log(`\nSTOPGAP SUPPLY PACKET  ${new Date().toISOString()}`);
console.log(`openFDA file last updated ${packet.provenance.openFdaLastUpdated}, ${packet.provenance.openFdaRowsReturned} rows returned`);
console.log(`\nIN SHORTAGE AT THIS FACILITY`);
console.log(line(packet.pin));
console.log(`  reason: ${packet.pin.shortageReason ?? "not stated"}`);

console.log(`\nSAME CONCENTRATION, OTHER LABELER (${packet.sameConcentration.length})`);
packet.sameConcentration.forEach((l) => console.log(line(l)));

console.log(`\nOTHER PRESENTATIONS, NOT INTERCHANGEABLE WITHOUT REVIEW (${packet.otherPresentations.length})`);
packet.otherPresentations.forEach((l) => console.log(line(l)));

if (packet.excluded.length) {
  console.log(`\nEXCLUDED BY A STORED DECISION (${packet.excluded.length})`);
  packet.excluded.forEach((l) => console.log(`${line(l)}\n${" ".repeat(24)}excluded by ${l.excludedBy!.decisionId}: ${l.excludedBy!.content}`));
}

const decisions = listDecisions(facility);
if (decisions.length) {
  console.log(`\nSTORED DECISIONS IN MEMORY (${decisions.length})`);
  decisions.forEach((d) => console.log(`  ${d.id}  ${d.content}  [${d.source}]`));
}

console.log(`\nCLINICAL CONCLUSION: ${packet.clinicalConclusion === null ? "(left blank for the pharmacist)" : ""}`);
console.log(`SIGNED BY: ____________________________   DATE: ______________`);
console.log(`\n${packet.disclaimers.scope}`);
console.log(`\n${packet.disclaimers.openFda}`);
console.log(`\n${packet.disclaimers.nlm}`);
console.log(`\nSource: ${packet.provenance.openFdaUrl}`);
