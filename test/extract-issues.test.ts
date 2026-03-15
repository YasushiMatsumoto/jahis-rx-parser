import fs from "fs";
import path from "path";
import { it } from "vitest";
import { parseJahisRx } from "../src/index.js";

function loadSamples(): string[] {
  const p = path.join(__dirname, "spec-samples.test.ts");
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
  extras.sort((a, b) => Number(a.split(",")[0] ?? 0) - Number(b.split(",")[0] ?? 0));
  return [DUMMY_HEADER, ...extras].join("\n") + "\n";
}

function isEmpty(s: string | undefined) {
  return s === undefined || s === null || s.trim() === "";
}

function flattenNormalizedDrugProps(drug: any) {
  const vals: string[] = [];
  if (!drug) return vals;
  const push = (v: any) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((x) => push(x));
    else vals.push(String(v));
  };
  push(drug.code);
  push(drug.name);
  push(drug.amount);
  push(drug.unit);
  push(drug.infoClass);
  push(drug.potencyFlag);
  if (drug.unitConversions) push(drug.unitConversions.map((u: any) => u.convertedAmount));
  if (drug.unevenDosings) {
    push(drug.unevenDosings.map((ud: any) => [
      ud.unevenDosingAmount1,
      ud.unevenDosingAmount2,
      ud.unevenDosingAmount3,
      ud.unevenDosingAmount4,
      ud.unevenDosingAmount5,
      ud.unevenDosingCode1,
      ud.unevenDosingCode2,
      ud.unevenDosingCode3,
      ud.unevenDosingCode4,
      ud.unevenDosingCode5,
    ]));
  }
  if (drug.singleDoseAmounts) push(drug.singleDoseAmounts.map((s: any) => [s.singleDoseAmount, s.timesPerDay]));
  return vals.map((v) => v ?? "");
}

it("extract possible issues from drug-related samples (diagnostic)", () => {
  const samples = loadSamples();
  const targets = new Set(["201", "211", "221", "241"]);
  const filtered = samples.filter((s) => {
    const k = s.split(",")[0] ?? "";
    return targets.has(k);
  });

  const issues: Array<{ sample: string; problems: string[] }> = [];

  for (const sample of filtered) {
    const input = makeAnchoredPayload(sample);
    const res = parseJahisRx(input, { strict: false });
    if (!res.ok || !res.data) {
      issues.push({ sample, problems: ["parse failed or no data"] });
      continue;
    }
    const drug = res.data.normalized.rps?.[0]?.drugs?.[0] ?? null;
    const normalizedVals = flattenNormalizedDrugProps(drug);

    const fields = sample.split(",");
    const problems: string[] = [];

    // For each non-empty sample field beyond the record number, check whether
    // its value appears somewhere in the normalized drug props we care about.
    for (let i = 1; i < fields.length; i++) {
      const f = fields[i];
      if (isEmpty(f)) continue;
      const found = normalizedVals.includes(f);
      if (!found) {
        problems.push(`field[${i}]='${f}' not found in normalized drug props`);
      }
    }

    // Additional targeted checks
    const recNo = sample.split(",")[0];
    if (recNo === "211") {
      const expected = fields[3] ?? "";
      const conv = drug?.unitConversions?.[0]?.convertedAmount ?? null;
      if (!isEmpty(expected) && String(conv) !== expected) {
        problems.push(`211 convertedAmount mismatch: expected='${expected}' actual='${conv}'`);
      }
    }
    if (recNo === "241") {
      const expectedAmount = fields[3] ?? "";
      const expectedTimes = fields[4] ?? "";
      const sda = drug?.singleDoseAmounts?.[0]?.singleDoseAmount ?? null;
      const times = drug?.singleDoseAmounts?.[0]?.timesPerDay ?? null;
      if (!isEmpty(expectedAmount) && String(sda) !== expectedAmount) {
        problems.push(`241 singleDoseAmount mismatch: expected='${expectedAmount}' actual='${sda}'`);
      }
      if (!isEmpty(expectedTimes) && String(times) !== expectedTimes) {
        problems.push(`241 timesPerDay mismatch: expected='${expectedTimes}' actual='${times}'`);
      }
    }

    if (problems.length > 0) issues.push({ sample, problems });
  }

  // Print summary
  console.log("\n=== Drug-related sample issues summary ===");
  if (issues.length === 0) console.log("No issues detected by heuristics.");
  for (const it of issues) {
    console.log(`\nSAMPLE: ${it.sample}`);
    for (const p of it.problems) console.log(`  - ${p}`);
  }

  console.log(`\nFound ${issues.length} samples with potential issues (heuristic).`);
});
