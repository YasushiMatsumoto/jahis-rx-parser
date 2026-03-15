import { describe, expect, it } from "vitest";

import { parseJahisRx } from "../src/index.js";

describe("parseJahisRx valid samples", () => {
  it("accepts record 2 postal-only sample", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "2,105-0004,",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
    ].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.code === "REQUIRED_ONE_OF_MISSING")).toBe(false);
  });

  it("accepts record 2 address-only sample", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "2,,東京都港区新橋 1 丁目 11 番 ○×ビル 5 階",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
    ].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.code === "REQUIRED_ONE_OF_MISSING")).toBe(false);
  });

  it("accepts record 11 kana-only sample for alternative required fields", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
    ].join("\n");

    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.code === "REQUIRED_ONE_OF_MISSING")).toBe(false);
  });

  it("accepts contiguous record 81 sequence sample", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "81,1,1,一包化",
      "81,2,2,粉砕",
    ].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.code === "INVALID_NOTE_SEQUENCE")).toBe(false);
  });

  it("accepts spec-aligned 101/102/111/201/211 samples", () => {
    const input = [
      "JAHIS10",
      "1,1,1234567,13,テスト医院",
      "5,DR001,ﾔﾏﾀﾞ ｲﾁﾛｳ,山田 一郎",
      "11,PT001,日薬 太郎,ﾆﾁﾔｸ ﾀﾛｳ",
      "12,1",
      "13,19600606",
      "51,20260311",
      "63,3,2",
      "101,1,1,,42",
      "102,1,14,42",
      "111,1,1,,毎食後,",
      "201,1,1,1,2,620000001,DrugA,3,1,錠",
      "211,1,1,0.5",
    ].join("\n");
    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.code === "REQUIRED_FIELD_MISSING")).toBe(false);
    expect(result.issues.some((issue) => issue.code === "INVALID_RECORD_CARDINALITY")).toBe(false);
  });

  it("accepts spec-aligned drug supplement records without duplicate cardinality warnings", () => {
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
      "201,1,1,1,2,620000001,DrugA,3,1,錠",
      "221,1,1,1,2,1,,",
      "231,1,1,B1,公費対象",
      "241,1,1,1,錠",
      "281,1,1,A1,粉砕可",
      "281,1,1,A2,一包化可",
    ].join("\n");

    const result = parseJahisRx(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.code === "INVALID_RECORD_CARDINALITY")).toBe(false);
  });
});
