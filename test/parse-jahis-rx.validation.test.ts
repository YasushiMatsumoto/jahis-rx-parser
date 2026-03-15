import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseJahisRx } from "../src/index.js";

const fixture = (name: string): string => {
  return readFileSync(join(process.cwd(), "test", "fixtures", name), "utf8");
};

const dropRecordByPrefix = (input: string, prefix: string): string => {
  return input
    .split("\n")
    .filter((line) => !line.startsWith(prefix))
    .join("\n");
};

const replaceRecord = (input: string, from: string, to: string): string => {
  return input.replace(from, to);
};

describe("parseJahisRx validation", () => {
  // Unknown record numbers should fail in strict mode as out-of-spec input.
  it("fails in strict mode when out-of-spec record number exists", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "999,unexpected",
    ].join("\n");

    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "UNKNOWN_RECORD_NUMBER")).toBe(true);
    expect(result.issues.some((issue) => issue.level === "error")).toBe(true);
  });

  // Unknown record numbers should be warnings in non-strict mode.
  it("warns in non-strict mode when out-of-spec record number exists", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "999,unexpected",
    ].join("\n");

    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.code === "UNKNOWN_RECORD_NUMBER")).toBe(true);
    expect(result.issues.some((issue) => issue.level === "warning")).toBe(true);
  });

  // Core top-level records are mandatory in JAHIS v1.10.
  it("fails in strict mode when mandatory top-level records are missing", () => {
    const input = ["JAHIS10", "1,1,1234567,13,テスト医院"].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_DOCTOR_RECORD")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "MISSING_PATIENT_NAME_RECORD")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "MISSING_PRESCRIPTION_DATE_RECORD")).toBe(
      true,
    );
  });

  // Record 231 must be all-drugs or no-drugs in a prescription.
  it("fails in strict mode when 231 is mixed across drugs", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "101,1,1,内服",
      "111,1,1,毎食後",
      "201,1,1,1,2,620000001,DrugA,3,1,錠",
      "201,1,2,1,2,620000002,DrugB,2,1,錠",
      "231,1,1,B1,公費対象",
    ].join("\n");

    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MIXED_BURDEN_CATEGORY_RECORD")).toBe(true);
  });

  // Top-level records must not appear after RP/drug group records.
  it("fails in strict mode when top-level record appears after RP group", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "101,1,1,内服",
      "111,1,1,毎食後",
      "201,1,1,1,2,620000001,DrugA,3,1,錠",
      "22,12345678",
    ].join("\n");

    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "INVALID_RECORD_ORDER")).toBe(true);
  });

  // RP group order should follow 101 -> 111 -> 201 for the same RP.
  it("fails in strict mode when RP group order is invalid", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "101,1,1,内服",
      "201,1,1,1,2,620000001,DrugA,3,1,錠",
      "111,1,1,毎食後",
    ].join("\n");

    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "INVALID_RECORD_ORDER")).toBe(true);
  });

  // Same order violation should downgrade to warning in non-strict mode.
  it("warns in non-strict mode when RP group order is invalid", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "101,1,1,内服",
      "201,1,1,1,2,620000001,DrugA,3,1,錠",
      "111,1,1,毎食後",
    ].join("\n");

    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.code === "INVALID_RECORD_ORDER")).toBe(true);
    expect(result.issues.some((issue) => issue.level === "warning")).toBe(true);
  });

  // Patient core validation requires 11/12/13 as a consistent set.
  it("fails in strict mode when patient core records are incomplete", () => {
    const input = ["JAHIS10", "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ", "13,19600606"].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_PATIENT_SEX_RECORD")).toBe(true);
  });

  // Patient core validation also requires record 13 when patient name exists.
  it("fails in strict mode when patient birth date record is missing", () => {
    const input = ["JAHIS10", "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ", "12,1"].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_PATIENT_BIRTHDATE_RECORD")).toBe(
      true,
    );
  });

  // Insurance validation in non-strict mode should emit warnings without blocking data.
  it("returns warning in non-strict mode when insurance core records are incomplete", () => {
    const input = ["JAHIS10", "21,1", "22,12345678"].join("\n");
    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.code === "MISSING_INSURANCE_CARD_RECORD")).toBe(
      true,
    );
  });

  // Conditional required records can be enforced via parse options context.
  it("fails in strict mode when context-required records are missing", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "101,1,1,内服",
      "111,1,1,毎食後",
      "201,1,1,1,2,620000001,DrugA,3,1,錠",
    ].join("\n");

    const result = parseJahisRx(input, {
      strict: true,
      prescriptionContext: {
        requireDepartment: true,
        requireDispensingDueDate: true,
        requireNarcotics: true,
      },
    });

    expect(result.ok).toBe(false);
    expect(
      result.issues.some((issue) => issue.code === "MISSING_CONDITIONAL_DEPARTMENT_RECORD"),
    ).toBe(true);
    expect(
      result.issues.some(
        (issue) => issue.code === "MISSING_CONDITIONAL_DISPENSING_DUE_DATE_RECORD",
      ),
    ).toBe(true);
    expect(
      result.issues.some((issue) => issue.code === "MISSING_CONDITIONAL_NARCOTICS_RECORD"),
    ).toBe(true);
  });

  // The same contextual requirement should downgrade to warning in non-strict mode.
  it("warns in non-strict mode when context-required records are missing", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "101,1,1,内服",
      "111,1,1,毎食後",
      "201,1,1,1,2,620000001,DrugA,3,1,錠",
    ].join("\n");

    const result = parseJahisRx(input, {
      strict: false,
      prescriptionContext: {
        requireDepartment: true,
        requireDispensingDueDate: true,
      },
    });

    expect(result.ok).toBe(true);
    expect(
      result.issues.some((issue) => issue.code === "MISSING_CONDITIONAL_DEPARTMENT_RECORD"),
    ).toBe(true);
    expect(
      result.issues.some(
        (issue) => issue.code === "MISSING_CONDITIONAL_DISPENSING_DUE_DATE_RECORD",
      ),
    ).toBe(true);
    expect(result.issues.some((issue) => issue.level === "warning")).toBe(true);
  });

  // Insurance validation also requires record 22 when insurance records exist.
  it("fails in strict mode when insurer number record is missing", () => {
    const input = ["JAHIS10", "21,1", "23,AB,12345,1,01"].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_INSURER_NUMBER_RECORD")).toBe(
      true,
    );
  });

  // Record 82 requires both numberType and number when either field is present.
  it("fails in strict mode when prescription number record is incomplete", () => {
    const input = ["JAHIS10", "82,1,"].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "INVALID_PRESCRIPTION_NUMBER_RECORD")).toBe(
      true,
    );
  });

  // Date records must use JAHIS numeric date tokens.
  it("fails in strict mode when date format is invalid", () => {
    const input = ["JAHIS10", "51,2026-03-10"].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "INVALID_DATE_FORMAT")).toBe(true);
  });

  // Current split count must not exceed total split count.
  it("fails in strict mode when split dispensing count is inconsistent", () => {
    const input = ["JAHIS10", "63,2,3"].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "INVALID_SPLIT_COUNT_RECORD")).toBe(true);
  });

  // Note sequence must start at 1 and increment continuously.
  it("fails in strict mode when note sequence is not contiguous", () => {
    const input = ["JAHIS10", "81,1,,一包化", "81,3,,分割"].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "INVALID_NOTE_SEQUENCE")).toBe(true);
  });

  // Record 102 depends on split dispensing record 63.
  it("fails in strict mode when 102 exists without 63", () => {
    const input = ["JAHIS10", "101,1,1,内服", "102,1,14"].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_SPLIT_DISPENSING_RECORD")).toBe(
      true,
    );
  });

  // Record 211 is required when unit differs from listed unit (if mapping is provided).
  it("fails in strict mode when 201 unit mismatches listed unit and 211 is missing", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "101,1,1,内服",
      "111,1,1,毎食後",
      "201,1,1,1,2,620000001,DrugA,3,1,缶",
    ].join("\n");

    const result = parseJahisRx(input, {
      strict: true,
      drugPriceUnitByCode: {
        "620000001": "mL",
      },
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_UNIT_CONVERSION_RECORD")).toBe(
      true,
    );
  });

  // Same 211 condition should be warning in non-strict mode.
  it("warns in non-strict mode when 201 unit mismatches listed unit and 211 is missing", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "101,1,1,内服",
      "111,1,1,毎食後",
      "201,1,1,1,2,620000001,DrugA,3,1,缶",
    ].join("\n");

    const result = parseJahisRx(input, {
      strict: false,
      drugPriceUnitByCode: {
        "620000001": "mL",
      },
    });

    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.code === "MISSING_UNIT_CONVERSION_RECORD")).toBe(
      true,
    );
    expect(result.issues.some((issue) => issue.level === "warning")).toBe(true);
  });

  // 211 requirement is satisfied when matching conversion record exists.
  it("passes strict mode when 201 unit mismatches listed unit and 211 exists", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "101,1,1,内服",
      "111,1,1,毎食後",
      "201,1,1,1,2,620000001,DrugA,3,1,缶",
      "211,1,1,250",
    ].join("\n");

    const result = parseJahisRx(input, {
      strict: true,
      drugPriceUnitByCode: {
        "620000001": "mL",
      },
    });

    expect(result.issues.some((issue) => issue.code === "MISSING_UNIT_CONVERSION_RECORD")).toBe(
      false,
    );
  });

  // Record 281 depends on a matching 201 record for the same RP/drug number.
  it("fails in strict mode when 281 exists without matching 201", () => {
    const input = ["JAHIS10", "101,1,1,内服", "281,1,1,A1,粉砕可"].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_DRUG_RECORD")).toBe(true);
  });

  // Record 181 depends on a matching 111 record for the same RP.
  it("fails in strict mode when 181 exists without matching 111", () => {
    const input = ["JAHIS10", "101,1,1,内服", "181,1,U1,就寝前"].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_USAGE_RECORD")).toBe(true);
  });

  // Record 211 depends on a matching 201 record for the same RP/drug number.
  it("fails in strict mode when 211 exists without matching 201", () => {
    const input = ["JAHIS10", "101,1,1,内服", "211,1,1,500,mg"].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_DRUG_RECORD")).toBe(true);
  });

  // Record 221 depends on a matching 201 record for the same RP/drug number.
  it("fails in strict mode when 221 exists without matching 201", () => {
    const input = ["JAHIS10", "101,1,1,内服", "221,1,1,E1,朝多め"].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_DRUG_RECORD")).toBe(true);
  });

  // Record 231 depends on a matching 201 record for the same RP/drug number.
  it("fails in strict mode when 231 exists without matching 201", () => {
    const input = ["JAHIS10", "101,1,1,内服", "231,1,1,B1,公費対象"].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_DRUG_RECORD")).toBe(true);
  });

  // Record 241 depends on a matching 201 record for the same RP/drug number.
  it("fails in strict mode when 241 exists without matching 201", () => {
    const input = ["JAHIS10", "101,1,1,内服", "241,1,1,1,錠"].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_DRUG_RECORD")).toBe(true);
  });

  // Uses a realistic anonymized fixture and drops 12 to validate patient core dependency.
  it("fails in strict mode when anonymized fixture is missing patient sex record", () => {
    const base = fixture("qr-decoded-anonymized.txt");
    const input = dropRecordByPrefix(base, "12,");

    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_PATIENT_SEX_RECORD")).toBe(true);
  });

  // Uses a realistic anonymized fixture and breaks 52 date format intentionally.
  it("fails in strict mode when anonymized fixture has invalid dispensing due date", () => {
    const base = fixture("qr-decoded-anonymized.txt");
    const input = replaceRecord(base, "52,20260202", "52,2026-02-02");

    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "INVALID_DATE_FORMAT")).toBe(true);
  });

  // Spec-aligned 101/111/181 layouts should pass in strict mode.
  it("passes in strict mode for spec-aligned 101/111/181 layouts", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "101,1,9,,1",
      "111,1,1,,１日１回注射,",
      "181,1,1,5,2/ 3 から毎週 火曜日,,",
      "201,1,1,1,2,620000001,DrugA,3,1,錠",
    ].join("\n");

    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.code === "NON_STANDARD_RECORD_LAYOUT")).toBe(false);
  });

  // Compact 101/111/181 layouts remain compatibility-only and should error in strict mode.
  it("fails in strict mode for compact 101/111/181 layouts", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "101,1,9,内服",
      "111,1,1,１日１回注射",
      "181,1,1,2/ 3 から毎週 火曜日",
      "201,1,1,1,2,620000001,DrugA,3,1,錠",
    ].join("\n");

    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "NON_STANDARD_RECORD_LAYOUT")).toBe(true);
    expect(result.issues.some((issue) => issue.level === "error")).toBe(true);
  });

  // The same compact layouts should be warning-only in non-strict mode.
  it("warns in non-strict mode for compact 101/111/181 layouts", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "101,1,9,内服",
      "111,1,1,１日１回注射",
      "181,1,1,2/ 3 から毎週 火曜日",
      "201,1,1,1,2,620000001,DrugA,3,1,錠",
    ].join("\n");

    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.code === "NON_STANDARD_RECORD_LAYOUT")).toBe(true);
    expect(result.issues.some((issue) => issue.level === "warning")).toBe(true);
    expect(result.data?.normalized.rps[0]?.usageText).toBe("１日１回注射");
  });

  // Non-standard compact 201 layout should fail in strict mode.
  it("fails in strict mode for non-standard compact 201 layout", () => {
    const input = ["JAHIS10", "101,1,1,内服", "201,1,1,2,620000001,Acetaminophen,3,錠"].join("\n");

    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "NON_STANDARD_RECORD_LAYOUT")).toBe(true);
    expect(result.issues.some((issue) => issue.level === "error")).toBe(true);
  });

  // The same compact 201 layout should be warning-only in non-strict mode.
  it("warns in non-strict mode for non-standard compact 201 layout", () => {
    const input = ["JAHIS10", "101,1,1,内服", "201,1,1,2,620000001,Acetaminophen,3,錠"].join("\n");

    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.code === "NON_STANDARD_RECORD_LAYOUT")).toBe(true);
    expect(result.issues.some((issue) => issue.level === "warning")).toBe(true);
    expect(result.data?.normalized.rps[0]?.drugs[0]?.code).toBe("620000001");
    expect(result.data?.normalized.rps[0]?.drugs[0]?.unit).toBe("錠");
  });

  // Derived validation inputs must stay synchronized with the normalization base fixture.
  it("derives anonymized validation variants from the same base fixture", () => {
    const base = fixture("qr-decoded-anonymized.txt");
    const missingSex = dropRecordByPrefix(base, "12,");
    const invalid52 = replaceRecord(base, "52,20260202", "52,2026-02-02");

    expect(base.includes("12,2")).toBe(true);
    expect(base.includes("52,20260202")).toBe(true);
    expect(missingSex.includes("12,2")).toBe(false);
    expect(missingSex.includes("52,20260202")).toBe(true);
    expect(invalid52.includes("12,2")).toBe(true);
    expect(invalid52.includes("52,20260202")).toBe(false);
    expect(invalid52.includes("52,2026-02-02")).toBe(true);
  });

  it("fails in strict mode when record 2 misses both alternative required fields", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "2,,",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
    ].join("\n");

    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "REQUIRED_ONE_OF_MISSING")).toBe(true);
    expect(result.issues.some((issue) => issue.level === "error")).toBe(true);
  });

  it("fails in strict mode when record 111 appears multiple times in the same RP", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "101,1,1,,14",
      "111,1,1,,毎食後,",
      "111,1,1,,朝食後,",
      "201,1,1,1,2,620000001,DrugA,3,1,錠",
    ].join("\n");

    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "INVALID_RECORD_CARDINALITY")).toBe(true);
    expect(result.issues.some((issue) => issue.level === "error")).toBe(true);
  });

  it("fails in strict mode when record 102 misses a required field", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "63,3,1",
      "101,1,1,,14",
      "102,1,14",
      "111,1,1,,毎食後,",
      "201,1,1,1,2,620000001,DrugA,3,1,錠",
    ].join("\n");

    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "REQUIRED_FIELD_MISSING")).toBe(true);
    expect(result.issues.some((issue) => issue.level === "error")).toBe(true);
  });
});
