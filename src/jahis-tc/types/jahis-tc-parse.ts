import type { ParseIssue, ParseOptions, RawRecord } from "../../shared/types/parse.js";
import type { JahisTcMedicationNotebook } from "./jahis-tc-normalized.js";

export interface JahisTcParsedData {
  raw: RawRecord[];
  normalized: JahisTcMedicationNotebook;
}

export interface JahisTcParseResult {
  ok: boolean;
  data: JahisTcParsedData | null;
  issues: ParseIssue[];
  rawRecords?: RawRecord[];
}

export type { ParseIssue, ParseOptions, RawRecord };
