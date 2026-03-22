/**
 * Severity level of a parse issue.
 */
export type ParseIssueLevel = "error" | "warning";

/**
 * Validation or parse issue reported by the parser.
 */
export interface ParseIssue {
  /** Issue severity. */
  level: ParseIssueLevel;
  /** Stable machine-readable issue code (for example `MISSING_RP_RECORD`). */
  code: string;
  /** Human-readable issue description. */
  message: string;
  /** Source line number (1-based), when available. */
  line?: number;
  /** Related record number, when available. */
  recordNo?: string;
  /** Original raw record line text, when available. */
  rawRecord?: string;
}

/**
 * Optional parser behavior flags.
 */
export interface ParseOptions {
  /**
   * Enables strict mode.
   *
   * In strict mode, structural validation issues can block parsed output.
   */
  strict?: boolean;
  /** Includes tokenized raw records in parse results. */
  includeRawRecords?: boolean;
  /**
   * Preserves unsupported records in normalized output.
   *
   * When false, unknown records are dropped from normalized output.
   */
  preserveUnknownRecords?: boolean;
  /**
   * Optional drug master mapping used to evaluate record 211 requirement.
   *
   * Key: drug code (for example receipt code/YJ/HOT/etc from record 201)
   * Value: official listed unit for the code (for example `mL`, `錠`)
   */
  drugPriceUnitByCode?: Record<string, string>;
  /**
   * Optional context flags to enforce spec conditional-required records.
   */
  prescriptionContext?: {
    /** Require record 4 (department). */
    requireDepartment?: boolean;
    /** Require record 14 (patient copay class). */
    requirePatientCopayClass?: boolean;
    /** Require record 25 (occupational accident reason). */
    requireOccupationalAccident?: boolean;
    /** Require record 27 (first public expense). */
    requirePublicExpense1?: boolean;
    /** Require record 28 (second public expense). */
    requirePublicExpense2?: boolean;
    /** Require record 29 (third public expense). */
    requirePublicExpense3?: boolean;
    /** Require record 30 (special public expense). */
    requireSpecialPublicExpense?: boolean;
    /** Require record 52 (dispensing due date). */
    requireDispensingDueDate?: boolean;
    /** Require record 61 (narcotics). */
    requireNarcotics?: boolean;
  };
}

/**
 * Raw tokenized record produced from one input line.
 */
export interface RawRecord {
  /** Source line number (1-based). */
  line: number;
  /** Record number token from the first field (for example `101`). */
  recordNo: string;
  /** Comma-split fields including `recordNo` at index 0. */
  fields: string[];
  /** Original line text before parsing. */
  raw: string;
}
