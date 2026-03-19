import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseJahisRx } from "../src/index.js";

const fixture = (name: string): string => {
  return readFileSync(join(process.cwd(), "test", "fixtures", name), "utf8");
};

describe("parseJahisRx", () => {
  // Verifies that empty input is treated as a blocking parse failure.
  it("returns an error for empty input", () => {
    const input = fixture("empty-input.txt");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.code).toBe("EMPTY_INPUT");
  });

  // Covers the smallest practical input with header and institution records.
  it("accepts a minimal JAHIS header in non-strict mode", () => {
    const input = fixture("minimal-valid.txt");
    const result = parseJahisRx(input);

    expect(result.ok).toBe(true);
    if (result.data) {
      const data = result.data;
      expect(data.normalized.version).toBe("JAHIS10");
      expect(data.raw).toHaveLength(2);
    }
  });

  // Ensures invalid top-line headers are reported in strict mode.
  it("reports invalid header", () => {
    const input = fixture("invalid-header.txt");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "INVALID_HEADER")).toBe(true);
  });

  // Confirms optional raw-record exposure does not affect normalized output.
  it("includes raw records when requested", () => {
    const input = fixture("minimal-valid.txt");
    const result = parseJahisRx(input, { includeRawRecords: true });

    expect(result.rawRecords).toBeDefined();
    expect(result.rawRecords).toHaveLength(2);
    expect(result.rawRecords?.[1]?.recordNo).toBe("1");
    if (result.data) {
      const data = result.data;
      expect(data.raw).toHaveLength(2);
    }
  });

  // Strict mode should fail when usage/drug references an unknown RP anchor.
  it("reports missing RP record in strict mode", () => {
    const input = fixture("invalid-missing-101.txt");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.issues.some((issue) => issue.code === "MISSING_RP_RECORD")).toBe(true);
  });

  // Non-strict mode should keep data while surfacing the same structural issue.
  it("returns warning for missing RP record in non-strict mode", () => {
    const input = fixture("invalid-missing-101.txt");
    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    if (result.data) {
      const data = result.data;
      expect(data.normalized.rps).toHaveLength(1);
    }
    expect(result.issues.some((issue) => issue.code === "MISSING_RP_RECORD")).toBe(true);
  });

  // Strictness should only change issue severity/ok-state for the same input.
  it("changes issue level between strict and non-strict modes", () => {
    const input = fixture("invalid-missing-101.txt");
    const strictResult = parseJahisRx(input, { strict: true });
    const nonStrictResult = parseJahisRx(input, { strict: false });

    expect(strictResult.ok).toBe(false);
    expect(nonStrictResult.ok).toBe(true);
    expect(strictResult.issues.some((issue) => issue.code === "MISSING_RP_RECORD")).toBe(true);
    expect(nonStrictResult.issues.some((issue) => issue.code === "MISSING_RP_RECORD")).toBe(true);
    expect(strictResult.issues.some((issue) => issue.level === "error")).toBe(true);
    expect(nonStrictResult.issues.some((issue) => issue.level === "warning")).toBe(true);
  });

  // Validates a real-world-like QR payload after anonymization of PII fields.
  it("parses anonymized QR decoded fixture in non-strict mode", () => {
    const input = fixture("qr-decoded-anonymized.txt");
    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.issues.some((issue) => issue.code === "NON_STANDARD_RECORD_LAYOUT")).toBe(true);
    if (result.data) {
      const data = result.data;
      expect(data.normalized.version).toBe("JAHIS10");
      expect(data.normalized.institution?.name).toBe("テスト医療センター");
      expect(data.normalized.institution?.address).toBe("京都府テスト市テスト区テスト町1-2-3");
      expect(data.normalized.patient?.kanjiName).toBe("テスト 花子");
      expect(data.normalized.patient?.kanaName).toBe("ﾃｽﾄ ﾊﾅｺ");
      expect(data.normalized.prescriptionDate).toBe("20260130");
      expect(data.normalized.dispensingDueDate).toBe("20260202");
      expect(data.normalized.rps).toHaveLength(1);
      expect(data.normalized.rps[0]?.usageText).toBe("１日１回注射");
      expect(data.normalized.rps[0]?.drugs[0]?.code).toBe("2412403G3022");
      expect(data.normalized.rps[0]?.drugs[0]?.name).toBe("ソグルーヤ皮下注１５ｍｇ　１．５ｍＬ");
    }
  });
});
