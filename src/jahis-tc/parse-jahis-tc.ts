import { parseRecord } from "../shared/records/parse-record.js";
import { splitLines } from "../shared/tokenizer/split-lines.js";
import type { ParseIssue, ParseOptions, RawRecord } from "../shared/types/parse.js";
import { buildJahisTcNotebook } from "./build/build-jahis-tc-notebook.js";
import { decodeJahisTcRecord } from "./records/decode-jahis-tc-record.js";
import type { JahisTcParseResult } from "./types/jahis-tc-parse.js";
import { validateJahisTcRecords } from "./validation/validate-jahis-tc-records.js";

const hasError = (issues: ParseIssue[]): boolean => {
  return issues.some((issue) => issue.level === "error");
};

export const parseJahisTc = (input: string, options?: ParseOptions): JahisTcParseResult => {
  const lines = splitLines(input);
  const rawRecords: RawRecord[] = [];

  lines.forEach((line, index) => {
    const record = parseRecord(line, index + 1);
    if (record) {
      rawRecords.push(record);
    }
  });

  const issues = validateJahisTcRecords(rawRecords, options);
  const decoded = rawRecords.map((record) => decodeJahisTcRecord(record));
  const normalized = buildJahisTcNotebook(decoded, options?.preserveUnknownRecords !== false);

  if (options?.strict && hasError(issues)) {
    const strictResult: JahisTcParseResult = {
      ok: false,
      data: null,
      issues,
    };

    if (options.includeRawRecords) {
      strictResult.rawRecords = rawRecords;
    }

    return strictResult;
  }

  const result: JahisTcParseResult = {
    ok: !hasError(issues),
    data: {
      raw: rawRecords,
      normalized,
    },
    issues,
  };

  if (options?.includeRawRecords) {
    result.rawRecords = rawRecords;
  }

  return result;
};
