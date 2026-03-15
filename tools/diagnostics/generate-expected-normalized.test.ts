import fs from "fs";
import path from "path";
import { it } from "vitest";
import { parseJahisRx } from "../../src/index.js";

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
  extras.sort((a, b) => Number(a.split(",")[0] ?? 0) - Number(b.split(",")[0] ?? 0));
  return [DUMMY_HEADER, ...extras].join("\n") + "\n";
}

function canonicalize(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) return obj.map((v) => canonicalize(v));
  if (typeof obj === "object") {
    const out: any = {};
    const keys = Object.keys(obj).sort();
    for (const k of keys) out[k] = canonicalize(obj[k]);
    return out;
  }
  return obj;
}

it("generate expected-normalized.json for all SAMPLES (diagnostic)", () => {
  const samples = loadSamples();
  const results: Array<{ sample: string; normalized: any | null; ok: boolean; issues: any[] }> = [];

  for (const sample of samples) {
    const input = makeAnchoredPayload(sample);
    const res = parseJahisRx(input, { strict: false });
    if (!res.ok || !res.data) {
      results.push({ sample, normalized: null, ok: res.ok, issues: res.issues });
      continue;
    }
    const normalized = canonicalize(res.data.normalized);
    results.push({ sample, normalized, ok: res.ok, issues: res.issues });
  }

  const outPath = path.join(process.cwd(), "expected-normalized.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`Wrote ${results.length} entries to ${outPath}`);
});
