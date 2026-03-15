import fs from "fs";
import path from "path";
import { it } from "vitest";
import { parseJahisRx } from "../../src/index.js";

function loadSamples(): string[] {
  const p = path.join(process.cwd(), "test", "spec-samples.test.ts");
  const src = fs.readFileSync(p, "utf8");
  const m = src.match(/const SAMPLES\s*=\s*\[([\s\S]*?)\];/m);
  if (!m) throw new Error("SAMPLES not found");
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

function isCodeLike(s: string) {
  return /^\d{6,}$/.test(s) || /^[A-Z0-9]{7,}$/.test(s);
}

function isNonEmpty(s: string | undefined) {
  return s !== undefined && s !== null && String(s).trim() !== "";
}

it("auto-prioritize likely bugs in drug-related samples", () => {
  const samples = loadSamples();
  const targets = new Set(["201", "211", "221", "241"]);
  const filtered = samples.filter((s) => (s.split(",")[0] ?? "") && targets.has(s.split(",")[0]));

  const hits: Array<{ sample: string; reasons: string[]; normalized: any }> = [];

  for (const sample of filtered) {
    const input = makeAnchoredPayload(sample);
    const res = parseJahisRx(input, { strict: false });
    if (!res.ok || !res.data) continue;
    const n = res.data.normalized;
    const drug = n.rps?.[0]?.drugs?.[0] ?? null;
    const fields = sample.split(",");
    const recNo = fields[0];
    const reasons: string[] = [];

    // Rule: if a code-like token exists in sample but normalized.code is missing or different -> likely bug
    const codeField = fields.find((f) => isCodeLike(f));
    if (recNo === "201" && codeField) {
      const normCode = drug?.code ?? "";
      if (!isNonEmpty(normCode) || normCode !== codeField) {
        reasons.push(`code mismatch: sample has code='${codeField}' but normalized.code='${normCode}'`);
      }
    }

    // Rule: 211 convertedAmount must equal sample field[3]
    if (recNo === "211") {
      const expected = fields[3] ?? "";
      const conv = drug?.unitConversions?.[0]?.convertedAmount ?? null;
      if (isNonEmpty(expected) && String(conv) !== expected) {
        reasons.push(`211 convertedAmount mismatch: sample='${expected}' normalized='${conv}'`);
      }
    }

    // Rule: 241 singleDoseAmounts
    if (recNo === "241") {
      const expAmt = fields[3] ?? "";
      const expTimes = fields[4] ?? "";
      const sda = drug?.singleDoseAmounts?.[0];
      const gotAmt = sda?.singleDoseAmount ?? null;
      const gotTimes = sda?.timesPerDay ?? null;
      if (isNonEmpty(expAmt) && String(gotAmt) !== expAmt) {
        reasons.push(`241 singleDoseAmount mismatch: sample='${expAmt}' normalized='${gotAmt}'`);
      }
      if (isNonEmpty(expTimes) && String(gotTimes) !== expTimes) {
        reasons.push(`241 timesPerDay mismatch: sample='${expTimes}' normalized='${gotTimes}'`);
      }
    }

    // Rule: 221 uneven dosing amounts mapping
    if (recNo === "221") {
      // gather numeric fields after field[2]
      const numericFields = fields.slice(3).filter((f) => f && /[0-9]/.test(f));
      const ud = drug?.unevenDosings?.[0] ?? null;
      if (numericFields.length > 0 && ud) {
        // compare first two amounts if present
        const nf1 = numericFields[0] ?? null;
        const nf2 = numericFields[1] ?? null;
        if (nf1 && String(ud.unevenDosingAmount1) !== nf1) {
          reasons.push(`221 amount1 mismatch: sample='${nf1}' normalized='${ud.unevenDosingAmount1}'`);
        }
        if (nf2 && String(ud.unevenDosingAmount2) !== nf2) {
          reasons.push(`221 amount2 mismatch: sample='${nf2}' normalized='${ud.unevenDosingAmount2}'`);
        }
      }
    }

    if (reasons.length > 0) hits.push({ sample, reasons, normalized: drug });
  }

  // Print concise prioritized list
  console.log("\n=== High-confidence issue candidates ===\n");
  if (hits.length === 0) console.log("No high-confidence issues found.");
  hits.forEach((h) => {
    console.log(`SAMPLE: ${h.sample}`);
    h.reasons.forEach((r) => console.log(`  - ${r}`));
    console.log(`  normalized.drug: ${JSON.stringify(h.normalized)}`);
    console.log("");
  });
  console.log(`Found ${hits.length} high-confidence candidate(s).`);
});
