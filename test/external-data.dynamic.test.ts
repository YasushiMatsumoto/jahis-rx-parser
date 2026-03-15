import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { parseJahisRx } from "../src/index.js";

interface ExternalCaseConfig {
  expectOk?: boolean;
  expectOkStrict?: boolean;
  expectOkNonStrict?: boolean;
  maxIssues?: number;
  maxIssuesStrict?: number;
  maxIssuesNonStrict?: number;
  requiredIssueCodes?: string[];
  requiredIssueCodesStrict?: string[];
  requiredIssueCodesNonStrict?: string[];
}

const externalDataRoot = join(process.cwd(), "test", "external-data");

const collectTextFiles = (rootDir: string): string[] => {
  const collected: string[] = [];

  const walk = (dirPath: string): void => {
    for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
      const entryPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        walk(entryPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".txt")) {
        collected.push(entryPath);
      }
    }
  };

  if (!existsSync(rootDir)) {
    return collected;
  }

  walk(rootDir);
  return collected.sort((a, b) => a.localeCompare(b));
};

const readCaseConfig = (textFilePath: string): ExternalCaseConfig => {
  const configFilePath = textFilePath.replace(/\.txt$/u, ".json");
  if (!existsSync(configFilePath)) {
    return {};
  }

  const raw = readFileSync(configFilePath, "utf8");
  return JSON.parse(raw) as ExternalCaseConfig;
};

const printCaseSummary = (
  caseLabel: string,
  result: ReturnType<typeof parseJahisRx>,
  strict: boolean,
): void => {
  const normalized = result.data?.normalized ?? null;
  const issueDetails = result.issues.map((issue) => {
    return {
      level: issue.level,
      code: issue.code,
      line: issue.line,
      recordNo: issue.recordNo,
      message: issue.message,
    };
  });
  const rawCount = result.data?.raw.length ?? 0;
  const rawRecordCount = result.rawRecords?.length ?? 0;

  console.info(`[external] ${caseLabel}`);
  console.info(
    JSON.stringify(
      {
        ok: result.ok,
        strict,
        issueCount: result.issues.length,
        rawCount,
        rawRecordCount,
        issues: issueDetails,
        normalized,
      },
      null,
      2,
    ),
  );
};

const resolveExpectOk = (config: ExternalCaseConfig, strict: boolean): boolean | undefined => {
  if (strict && config.expectOkStrict !== undefined) {
    return config.expectOkStrict;
  }

  if (!strict && config.expectOkNonStrict !== undefined) {
    return config.expectOkNonStrict;
  }

  if (!strict && config.expectOk === undefined) {
    // Keep previous default behavior for non-strict mode.
    return true;
  }

  return config.expectOk;
};

const resolveMaxIssues = (config: ExternalCaseConfig, strict: boolean): number | undefined => {
  if (strict && config.maxIssuesStrict !== undefined) {
    return config.maxIssuesStrict;
  }

  if (!strict && config.maxIssuesNonStrict !== undefined) {
    return config.maxIssuesNonStrict;
  }

  return config.maxIssues;
};

const resolveRequiredIssueCodes = (config: ExternalCaseConfig, strict: boolean): string[] => {
  if (strict && config.requiredIssueCodesStrict !== undefined) {
    return config.requiredIssueCodesStrict;
  }

  if (!strict && config.requiredIssueCodesNonStrict !== undefined) {
    return config.requiredIssueCodesNonStrict;
  }

  return config.requiredIssueCodes ?? [];
};

describe("external data ingestion", () => {
  const caseFiles = collectTextFiles(externalDataRoot);

  it("runs even when no external data files are present", () => {
    if (caseFiles.length === 0) {
      expect(caseFiles).toHaveLength(0);
      return;
    }

    expect(caseFiles.length).toBeGreaterThan(0);
  });

  for (const caseFilePath of caseFiles) {
    const caseLabel = relative(process.cwd(), caseFilePath).replace(/\\/gu, "/");

    for (const strict of [false, true]) {
      it(`parses external case: ${caseLabel} (strict=${String(strict)})`, () => {
        const input = readFileSync(caseFilePath, "utf8");
        const config = readCaseConfig(caseFilePath);
        const result = parseJahisRx(input, {
          strict,
          includeRawRecords: true,
        });

        printCaseSummary(caseLabel, result, strict);

        expect(input.trim().length).toBeGreaterThan(0);
        expect(result.issues).toBeDefined();

        const expectOk = resolveExpectOk(config, strict);
        if (expectOk !== undefined) {
          expect(result.ok).toBe(expectOk);
        }

        const maxIssues = resolveMaxIssues(config, strict);
        if (maxIssues !== undefined) {
          expect(result.issues.length).toBeLessThanOrEqual(maxIssues);
        }

        for (const requiredIssueCode of resolveRequiredIssueCodes(config, strict)) {
          expect(result.issues.some((issue) => issue.code === requiredIssueCode)).toBe(true);
        }
      });
    }
  }
});
