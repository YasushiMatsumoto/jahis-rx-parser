import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseJahisTc } from "../src/index.js";

const fixture = (name: string): string => {
  return readFileSync(join(process.cwd(), "test", "fixtures", name), "utf8");
};

describe("parseJahisTc", () => {
  it("parses minimal valid TC data", () => {
    const input = fixture("tc-minimal-valid.txt");
    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.data?.normalized.version).toBe("JAHISTC01");
    expect(result.data?.normalized.outputCategory).toBe("1");
    expect(result.data?.normalized.dispensings).toHaveLength(1);
    expect(result.data?.normalized.dispensings[0]?.prescriptions).toHaveLength(1);
    expect(result.data?.normalized.dispensings[0]?.prescriptions[0]?.rps).toHaveLength(1);
    expect(result.data?.normalized.dispensings[0]?.prescriptions[0]?.rps[0]?.drugs).toHaveLength(1);
  });

  it("reports conditional required field for record 201 in strict mode", () => {
    const input = fixture("tc-invalid-missing-drug-code.txt");
    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.issues.some((issue) => issue.code === "CONDITIONAL_REQUIRED_MISSING")).toBe(true);
  });

  it("reports invalid header when output category is missing", () => {
    const input = ["JAHISTC06", "1,山田 太郎,1,19800101", "5,20260310,1"].join("\n");
    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "REQUIRED_FIELD_MISSING")).toBe(true);
  });

  it("reports RP link issues when record 301 has no record 201", () => {
    const input = [
      "JAHISTC06,1",
      "1,山田 太郎,1,19800101",
      "5,20260310,1",
      "11,株式会社 工業会薬局 駅前店,13,4,1234567,,,03-3506-8010,1",
      "51,医療法人 工業会病院,13,1,1234567,1",
      "301,1,毎食後服用,3,日分,1,1,,1",
    ].join("\n");

    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_RP_RECORD")).toBe(true);
  });

  it("parses split control record 911 into normalized output", () => {
    const input = [
      "JAHISTC06,1",
      "1,山田 太郎,1,19800101",
      "5,20260310,1",
      "11,株式会社 工業会薬局 駅前店,13,4,1234567,,,03-3506-8010,1",
      "51,医療法人 工業会病院,13,1,1234567,1",
      "201,1,ノルバスク錠２．５ｍｇ,1,錠,2,612170709,1",
      "301,1,毎食後服用,3,日分,1,1,,1",
      "911,12345678901234,2,1",
    ].join("\n");

    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.data?.normalized.splitControl?.dataId).toBe("12345678901234");
    expect(result.data?.normalized.splitControl?.totalParts).toBe("2");
    expect(result.data?.normalized.splitControl?.partNumber).toBe("1");
  });
});
