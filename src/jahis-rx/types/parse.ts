import type {
  ParseIssue,
  ParseIssueLevel,
  ParseOptions,
  RawRecord,
} from "../../shared/types/parse.js";
import type { JahisRxPrescription } from "./normalized.js";

export type {
  ParseIssue,
  ParseIssueLevel,
  ParseOptions,
  RawRecord,
} from "../../shared/types/parse.js";

/**
 * Top-level parser result.
 */
export interface ParseResult {
  /** True when no blocking error exists. */
  ok: boolean;
  /** Parsed payload, or `null` when strict validation fails. */
  data: ParsedPrescriptionData | null;
  /** Collected validation and parse issues. */
  issues: ParseIssue[];
  /** Optional direct access to tokenized raw records. */
  rawRecords?: RawRecord[];
}

/**
 * Parsed payload containing both raw and normalized views.
 */
export interface ParsedPrescriptionData {
  /** Tokenized records in input order. */
  raw: RawRecord[];
  /** Application-friendly normalized prescription object. */
  normalized: JahisRxPrescription;
}

export type JahisRxParseIssueLevel = ParseIssueLevel;
export type JahisRxParseIssue = ParseIssue;
export type JahisRxParseOptions = ParseOptions;
export type JahisRxRawRecord = RawRecord;
export type JahisRxParseResult = ParseResult;
export type JahisRxParsedData = ParsedPrescriptionData;
