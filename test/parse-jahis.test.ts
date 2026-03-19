import { describe, expect, it } from "vitest";

import { isJahisRx, isJahisTc, parseJahisRx, parseJahisTc } from "../src/index.js";

describe("JAHIS format detection and entry points", () => {
  it("identifies JAHIS Rx input", () => {
    const input = ["JAHIS10", "1,1234567,Test Clinic"].join("\n");

    expect(isJahisRx(input)).toBe(true);
    expect(isJahisTc(input)).toBe(false);
  });

  it("identifies JAHISTC input", () => {
    const input = [
      "JAHISTC01",
      "1,山田 太郎,1,19800101",
      "5,20260310,1",
      "201,1,薬品,1,錠,1,,1",
      "301,1,毎食後,3,日分,1,1,,1",
    ].join("\n");

    expect(isJahisRx(input)).toBe(false);
    expect(isJahisTc(input)).toBe(true);
  });

  it("does not detect JAHISTC when first char after prefix is not digit", () => {
    const input = ["JAHISTCA1", "1,山田 太郎,1,19800101"].join("\n");

    expect(isJahisTc(input)).toBe(false);
  });

  it("does not detect JAHIS Rx when first char after prefix is not digit", () => {
    const input = ["JAHISX0", "1,1234567,Test Clinic"].join("\n");

    expect(isJahisRx(input)).toBe(false);
  });

  it("parses JAHIS Rx input with parseJahisRx", () => {
    const input = ["JAHIS10", "1,1234567,Test Clinic"].join("\n");
    const result = parseJahisRx(input, { strict: false });

    expect(result.data).not.toBeNull();
    expect(result.data?.normalized.version).toBe("JAHIS10");
  });

  it("parses JAHISTC input with parseJahisTc", () => {
    const input = [
      "JAHISTC01",
      "1,山田 太郎,1,19800101",
      "5,20260310,1",
      "201,1,薬品,1,錠,1,,1",
      "301,1,毎食後,3,日分,1,1,,1",
    ].join("\n");
    const result = parseJahisTc(input, { strict: false });

    expect(result.data).not.toBeNull();
    expect(result.data?.normalized.version).toBe("JAHISTC01");
  });
});
