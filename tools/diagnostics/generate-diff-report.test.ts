import fs from "fs";
import path from "path";
import { it } from "vitest";
import { parseJahisRx } from "../../src/index.js";

// This test is a diagnostic runner that prints a diff-like report for
// drug-related sample records (201, 211, 221, 241). It's intended to be
// run manually to inspect how the parser's normalized output maps to the
// raw sample fields.

function loadSamples(): string[] {
  const p = path.join(process.cwd(), "test", "spec-samples.test.ts");
  const src = fs.readFileSync(p, "utf8");
  const m = src.match(/const SAMPLES\s*=\s*\[([\s\S]*?)\];/m);
  if (!m) throw new Error("SAMPLES not found in spec-samples.test.ts");
  const body = m[1];
  const re = /"((?:\\.|[^"\\])*)"/g;
  const samples: string[] = [];
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(body))) {
    if (mm[1]) samples.push(mm[1]);
  }
  return samples;
}

const DUMMY_HEADER = "JAHIS10";
const DUMMY_INSTITUTION = "1,,9700012,13,例示院病院";
const DUMMY_DOCTOR = "5,,,山田 太郎";
const DUMMY_PATIENT = "11,,ダミー 太郎,";
const DUMMY_PRESC_DATE = "51,20260130";

function makeAnchoredPayload(sample: string) {
  const recNo = sample.split(",")[0];
  const extras: string[] = [];
  if (recNo !== "1") extras.push(DUMMY_INSTITUTION);
  if (recNo !== "5") extras.push(DUMMY_DOCTOR);
  if (recNo !== "11") extras.push(DUMMY_PATIENT);
  if (recNo !== "51") extras.push(DUMMY_PRESC_DATE);
  extras.push(sample);
  extras.sort((a, b) => {
    const na = Number(a.split(",")[0] ?? 0);
    const nb = Number(b.split(",")[0] ?? 0);
    return na - nb;
  });
  return [DUMMY_HEADER, ...extras].join("\n") + "\n";
}

function isEmpty(s: string | undefined) {
  return s === undefined || s === null || s.trim() === "";
}

it("generate diff report for drug-related samples (diagnostic)", () => {
  const samples = loadSamples();
  const targets = new Set(["201", "211", "221", "241"]);
  const filtered = samples.filter((s) => {
    const k = s.split(",")[0] ?? "";
    return targets.has(k);
  });

  for (const sample of filtered) {
    const input = makeAnchoredPayload(sample);
    const res = parseJahisRx(input, { strict: false });
    console.log("\n---- SAMPLE ----");
    console.log(sample);
    const fields = sample.split(",");
    console.log("fields:");
    fields.forEach((f, i) => console.log(`  [${i}] ${f}`));

    if (!res.ok || !res.data) {
      console.log("parse failed or returned no data", res);
      continue;
    }
    const n = res.data.normalized;
    console.log("\nnormalized.rps[0].drugs[0]:");
    const drug = n.rps?.[0]?.drugs?.[0] ?? null;
    console.log(JSON.stringify(drug, null, 2));

    // heuristics: check whether any sample field value appears in common normalized props
    const checkProps = [
      { key: "code", path: drug?.code },
      { key: "name", path: drug?.name },
      { key: "amount", path: drug?.amount },
      { key: "unit", path: drug?.unit },
      { key: "infoClass", path: drug?.infoClass },
      { key: "potencyFlag", path: drug?.potencyFlag },
    ];

    function findMatch(val: string) {
      for (const p of checkProps) {
        if (val === (p.path ?? "")) return p.key;
      }
      return null;
    }

    console.log("\nfield matches summary:");
    fields.forEach((f, i) => {
      if (isEmpty(f)) return;
      const matched = findMatch(f);
      if (matched) {
        console.log(`  field[${i}]='${f}' => matches normalized.${matched}`);
      } else {
        // also try loose numeric compare
        const num = f.replace(/，/g, ",");
        const numericMatch = checkProps.find((p) => p.path == num);
        if (numericMatch)
          console.log(
            `  field[${i}]='${f}' => matches normalized.${numericMatch.key} (after looser compare)`,
          );
        else console.log(`  field[${i}]='${f}' => NO MATCH in common drug props`);
      }
    });

    // unit-conversion and uneven dosing inspection for 211/221/241
    if (sample.startsWith("211") || sample.startsWith("241") || sample.startsWith("221")) {
      console.log("\nadditional normalized drug details:");
      console.log(
        JSON.stringify(
          {
            unitConversions: drug?.unitConversions ?? null,
            unevenDosings: drug?.unevenDosings ?? null,
            singleDoseAmounts: drug?.singleDoseAmounts ?? null,
          },
          null,
          2,
        ),
      );
    }
  }

  console.log("\nDone: diagnostic diffs for drug-related samples printed above.");
});
