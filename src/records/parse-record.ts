import { splitFields } from "../tokenizer/split-fields.js";
import type { RawRecord } from "../types/parse.js";

/**
 * Parses one input line into a tokenized raw record.
 *
 * @param line One source line from the input payload.
 * @param lineNumber Source line number (1-based).
 * @returns Parsed raw record, or `null` for empty lines.
 */
export const parseRecord = (line: string, lineNumber: number): RawRecord | null => {
  const trimmed = line.trim();

  // Empty lines are ignored but line numbers are preserved for diagnostics.
  if (trimmed.length === 0) {
    return null;
  }

  const fields = splitFields(trimmed);
  const recordNo = fields[0];

  if (!recordNo) {
    // Surface malformed lines as recordNo "" so validation can report them later.
    return {
      line: lineNumber,
      recordNo: "",
      fields,
      raw: line,
    };
  }

  return {
    line: lineNumber,
    recordNo,
    fields,
    raw: line,
  };
};
