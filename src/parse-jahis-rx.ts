import { buildPrescription } from "./build/build-prescription.js";
import { RECORD_NO } from "./constants/index.js";
import { decodeRecord } from "./records/decode-record.js";
import { parseRecord } from "./records/parse-record.js";
import { splitLines } from "./tokenizer/split-lines.js";
import type {
  ParsedPrescriptionData,
  ParseIssue,
  ParseIssueLevel,
  ParseOptions,
  ParseResult,
  RawRecord,
} from "./types/parse.js";
import { buildValidationIndex, toDrugAnchorKey } from "./validation/index-builder.js";
import type { ValidationHelpers } from "./validation/record-rules.js";
import {
  validatePatientInsuranceAnchors,
  validateRecordFieldConsistency,
  validateSpecCardinality,
  validateSpecRequiredFields,
  validateSplitDispensingDependency,
} from "./validation/record-rules.js";

/**
 * Parses a base-10 integer value and returns `undefined` on invalid input.
 *
 * @param value Candidate numeric string.
 * @returns Parsed integer or `undefined` when conversion fails.
 */
const toInt = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

/**
 * Checks whether a value looks like a JAHIS date token.
 *
 * @param value Candidate date string.
 * @returns `true` when the value is 7 or 8 numeric digits.
 */
const isJahisDateLike = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }

  if (value.length !== 7 && value.length !== 8) {
    return false;
  }

  return /^\d+$/.test(value);
};

const isDrugCodeType = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }

  return ["1", "2", "3", "4", "5", "6", "7", "8"].includes(value);
};

const isDrugInfoClass = (value: string | undefined): boolean => {
  return value === "" || value === "1" || value === "2" || value === "3";
};

const isPotencyFlag = (value: string | undefined): boolean => {
  return value === "1" || value === "2";
};

const toDrugPriceUnitByCodeMap = (value: unknown): Record<string, string> | undefined => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return {};
  }

  for (const [, entryValue] of entries) {
    if (typeof entryValue !== "string") {
      return undefined;
    }
  }

  return value as Record<string, string>;
};

const KNOWN_RECORD_NO_SET = new Set<string>(Object.values(RECORD_NO));

type PrescriptionContext = {
  requireDepartment?: boolean;
  requirePatientCopayClass?: boolean;
  requireOccupationalAccident?: boolean;
  requirePublicExpense1?: boolean;
  requirePublicExpense2?: boolean;
  requirePublicExpense3?: boolean;
  requireSpecialPublicExpense?: boolean;
  requireDispensingDueDate?: boolean;
  requireNarcotics?: boolean;
};

const toPrescriptionContext = (value: unknown): PrescriptionContext | undefined => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const context: PrescriptionContext = {};

  const assignBoolean = (key: keyof PrescriptionContext): void => {
    const v = candidate[key];
    if (typeof v === "boolean") {
      context[key] = v;
    }
  };

  assignBoolean("requireDepartment");
  assignBoolean("requirePatientCopayClass");
  assignBoolean("requireOccupationalAccident");
  assignBoolean("requirePublicExpense1");
  assignBoolean("requirePublicExpense2");
  assignBoolean("requirePublicExpense3");
  assignBoolean("requireSpecialPublicExpense");
  assignBoolean("requireDispensingDueDate");
  assignBoolean("requireNarcotics");

  return context;
};

/**
 * Runs structural validation on tokenized raw records.
 *
 * @param records Tokenized records in input order.
 * @param options Parser options controlling strictness.
 * @returns List of validation issues.
 */
const validateRecords = (records: RawRecord[], options: ParseOptions | undefined): ParseIssue[] => {
  const issues: ParseIssue[] = [];
  const index = buildValidationIndex(records);

  const hasText = (value: string | undefined): boolean => {
    return Boolean(value && value.trim().length > 0);
  };

  const pushIssue = (issue: ParseIssue, sourceRecord?: RawRecord): void => {
    if (!sourceRecord) {
      issues.push(issue);
      return;
    }

    const enrichedIssue: ParseIssue = { ...issue };
    if (enrichedIssue.line === undefined) {
      enrichedIssue.line = sourceRecord.line;
    }
    if (enrichedIssue.recordNo === undefined) {
      enrichedIssue.recordNo = sourceRecord.recordNo;
    }
    if (enrichedIssue.rawRecord === undefined) {
      enrichedIssue.rawRecord = sourceRecord.raw;
    }

    issues.push(enrichedIssue);
  };
  const pushSpecIssue = (
    sourceRecord: RawRecord,
    code: string,
    message: string,
    recordNoOverride?: string,
  ): void => {
    const specIssueLevel: ParseIssueLevel = options?.strict ? "error" : "warning";
    const issue: ParseIssue = {
      level: specIssueLevel,
      code,
      message,
    };
    if (recordNoOverride !== undefined) {
      issue.recordNo = recordNoOverride;
    }

    pushIssue(issue, sourceRecord);
  };

  const requireAllFields = (
    sourceRecord: RawRecord,
    requiredIndexes: number[],
    itemNames: string[],
  ): void => {
    for (let i = 0; i < requiredIndexes.length; i += 1) {
      const fieldIndex = requiredIndexes[i] as number;
      const itemName = itemNames[i] as string;
      if (hasText(sourceRecord.fields[fieldIndex])) {
        continue;
      }

      pushSpecIssue(
        sourceRecord,
        "REQUIRED_FIELD_MISSING",
        `Record ${sourceRecord.recordNo} required item ${itemName} is missing.`,
      );
    }
  };

  const requireOneOfFields = (
    sourceRecord: RawRecord,
    candidateIndexes: number[],
    itemNames: string[],
  ): void => {
    const hasAny = candidateIndexes.some((fieldIndex) => hasText(sourceRecord.fields[fieldIndex]));
    if (hasAny) {
      return;
    }

    pushSpecIssue(
      sourceRecord,
      "REQUIRED_ONE_OF_MISSING",
      `Record ${sourceRecord.recordNo} requires at least one of: ${itemNames.join(" / ")}.`,
    );
  };

  const countByKey = (
    keySelector: (record: RawRecord) => string | undefined,
  ): Map<string, { count: number; source: RawRecord }> => {
    const counts = new Map<string, { count: number; source: RawRecord }>();

    for (const record of records) {
      const key = keySelector(record);
      if (!key) {
        continue;
      }

      const current = counts.get(key);
      if (!current) {
        counts.set(key, { count: 1, source: record });
        continue;
      }

      current.count += 1;
    }

    return counts;
  };
  const level = options?.strict ? "error" : "warning";
  const layoutIssueLevel = options?.strict ? "error" : "warning";
  const hasRecord = (recordNo: string): boolean => {
    return (index.recordNoToRecords.get(recordNo)?.length ?? 0) > 0;
  };

  if (records.length === 0) {
    pushIssue({
      level: "error",
      code: "EMPTY_INPUT",
      message: "Input text is empty.",
    });

    return issues;
  }

  const firstRecord = records[0];
  const firstLine = firstRecord?.raw ?? "";

  if (!firstLine.startsWith("JAHIS")) {
    const issue: ParseIssue = {
      level,
      code: "INVALID_HEADER",
      message: "First line does not start with JAHIS version header.",
    };

    if (firstRecord) {
      issue.line = firstRecord.line;
    }

    pushIssue(issue, firstRecord);
  }

  for (const record of records) {
    if (record.raw.startsWith("JAHIS")) {
      continue;
    }

    if (KNOWN_RECORD_NO_SET.has(record.recordNo)) {
      continue;
    }

    pushIssue(
      {
        level,
        code: "UNKNOWN_RECORD_NUMBER",
        message: `Record ${record.recordNo} is out of JAHIS Ver.1.10 specification.`,
        line: record.line,
        recordNo: record.recordNo,
      },
      record,
    );
  }

  if (!hasRecord(RECORD_NO.institution)) {
    issues.push({
      level,
      code: "MISSING_INSTITUTION_RECORD",
      message: "Institution record (1) is required by JAHIS Ver.1.10.",
      recordNo: RECORD_NO.institution,
    });
  }

  if (!hasRecord(RECORD_NO.doctor)) {
    issues.push({
      level,
      code: "MISSING_DOCTOR_RECORD",
      message: "Doctor record (5) is required by JAHIS Ver.1.10.",
      recordNo: RECORD_NO.doctor,
    });
  }

  if (!hasRecord(RECORD_NO.patientName)) {
    issues.push({
      level,
      code: "MISSING_PATIENT_NAME_RECORD",
      message: "Patient name record (11) is required by JAHIS Ver.1.10.",
      recordNo: RECORD_NO.patientName,
    });
  }

  if (!hasRecord(RECORD_NO.prescriptionDate)) {
    issues.push({
      level,
      code: "MISSING_PRESCRIPTION_DATE_RECORD",
      message: "Prescription date record (51) is required by JAHIS Ver.1.10.",
      recordNo: RECORD_NO.prescriptionDate,
    });
  }

  const prescriptionContext = toPrescriptionContext(options?.prescriptionContext);
  if (prescriptionContext) {
    const requireRecord = (
      enabled: boolean | undefined,
      recordNo: string,
      code: string,
      message: string,
    ): void => {
      if (!enabled || hasRecord(recordNo)) {
        return;
      }

      issues.push({
        level,
        code,
        message,
        recordNo,
      });
    };

    requireRecord(
      prescriptionContext.requireDepartment,
      RECORD_NO.department,
      "MISSING_CONDITIONAL_DEPARTMENT_RECORD",
      "Department record (4) is required by the provided prescription context.",
    );
    requireRecord(
      prescriptionContext.requirePatientCopayClass,
      RECORD_NO.patientCopayClass,
      "MISSING_CONDITIONAL_PATIENT_COPAY_CLASS_RECORD",
      "Patient copay class record (14) is required by the provided prescription context.",
    );
    requireRecord(
      prescriptionContext.requireOccupationalAccident,
      RECORD_NO.occupationalAccident,
      "MISSING_CONDITIONAL_OCCUPATIONAL_ACCIDENT_RECORD",
      "Occupational accident reason record (25) is required by the provided prescription context.",
    );
    requireRecord(
      prescriptionContext.requirePublicExpense1,
      RECORD_NO.publicExpense1,
      "MISSING_CONDITIONAL_PUBLIC_EXPENSE1_RECORD",
      "First public expense record (27) is required by the provided prescription context.",
    );
    requireRecord(
      prescriptionContext.requirePublicExpense2,
      RECORD_NO.publicExpense2,
      "MISSING_CONDITIONAL_PUBLIC_EXPENSE2_RECORD",
      "Second public expense record (28) is required by the provided prescription context.",
    );
    requireRecord(
      prescriptionContext.requirePublicExpense3,
      RECORD_NO.publicExpense3,
      "MISSING_CONDITIONAL_PUBLIC_EXPENSE3_RECORD",
      "Third public expense record (29) is required by the provided prescription context.",
    );
    requireRecord(
      prescriptionContext.requireSpecialPublicExpense,
      RECORD_NO.specialPublicExpense,
      "MISSING_CONDITIONAL_SPECIAL_PUBLIC_EXPENSE_RECORD",
      "Special public expense record (30) is required by the provided prescription context.",
    );
    requireRecord(
      prescriptionContext.requireDispensingDueDate,
      RECORD_NO.dispensingDueDate,
      "MISSING_CONDITIONAL_DISPENSING_DUE_DATE_RECORD",
      "Dispensing due date record (52) is required by the provided prescription context.",
    );
    requireRecord(
      prescriptionContext.requireNarcotics,
      RECORD_NO.narcotics,
      "MISSING_CONDITIONAL_NARCOTICS_RECORD",
      "Narcotics record (61) is required by the provided prescription context.",
    );
  }

  let topLevelOrderAnchor: number | undefined;
  let rpGroupStarted = false;
  for (const record of records) {
    if (record.raw.startsWith("JAHIS")) {
      continue;
    }

    const recordNo = toInt(record.recordNo);
    if (recordNo === undefined) {
      continue;
    }

    if (recordNo >= 101) {
      rpGroupStarted = true;
      continue;
    }

    if (recordNo >= 1 && recordNo <= 82) {
      if (rpGroupStarted) {
        pushIssue(
          {
            level,
            code: "INVALID_RECORD_ORDER",
            message: "Top-level records (1-82) must not appear after RP/drug group records.",
            line: record.line,
            recordNo: record.recordNo,
          },
          record,
        );
      }

      if (topLevelOrderAnchor !== undefined && recordNo < topLevelOrderAnchor) {
        pushIssue(
          {
            level,
            code: "INVALID_RECORD_ORDER",
            message: "Top-level records (1-82) must be output in ascending record number order.",
            line: record.line,
            recordNo: record.recordNo,
          },
          record,
        );
        break;
      }

      topLevelOrderAnchor = recordNo;
    }
  }

  // Warn when accepted record layouts deviate from canonical JAHIS column structures.
  for (const record of records) {
    if (record.recordNo === RECORD_NO.rp) {
      // Canonical/extended 101 layouts include the quantity-like column.
      // Shorter 4-column form is parsed for compatibility and treated as non-standard.
      if (record.fields.length < 5) {
        pushIssue(
          {
            level: layoutIssueLevel,
            code: "NON_STANDARD_RECORD_LAYOUT",
            message: "Record 101 uses a non-standard layout. Parsed with compatibility mapping.",
            line: record.line,
            recordNo: record.recordNo,
          },
          record,
        );
      }
      continue;
    }

    if (record.recordNo === RECORD_NO.usage) {
      // Canonical/extended 111 layouts include sequence/type and optional trailing slot.
      // Shorter 4-column form is parsed for compatibility and treated as non-standard.
      if (record.fields.length < 5) {
        pushIssue(
          {
            level: layoutIssueLevel,
            code: "NON_STANDARD_RECORD_LAYOUT",
            message: "Record 111 uses a non-standard layout. Parsed with compatibility mapping.",
            line: record.line,
            recordNo: record.recordNo,
          },
          record,
        );
      }
      continue;
    }

    if (record.recordNo === RECORD_NO.usageSupplement) {
      // Canonical/extended 181 layouts include sequence/type and optional trailing slots.
      // Shorter 4-column form is parsed for compatibility and treated as non-standard.
      if (record.fields.length < 5) {
        pushIssue(
          {
            level: layoutIssueLevel,
            code: "NON_STANDARD_RECORD_LAYOUT",
            message: "Record 181 uses a non-standard layout. Parsed with compatibility mapping.",
            line: record.line,
            recordNo: record.recordNo,
          },
          record,
        );
      }
      continue;
    }

    if (record.recordNo === RECORD_NO.drug) {
      // Canonical 201 layout: 201,rp,drug,infoClass,codeType,code,name,amount,potencyFlag,unit
      const hasSpecLikeLayout =
        record.fields.length >= 10 &&
        isDrugInfoClass(record.fields[3]) &&
        isDrugCodeType(record.fields[4]) &&
        isPotencyFlag(record.fields[8]);

      if (!hasSpecLikeLayout) {
        pushIssue(
          {
            level: layoutIssueLevel,
            code: "NON_STANDARD_RECORD_LAYOUT",
            message: "Record 201 uses a non-standard layout. Parsed with compatibility mapping.",
            line: record.line,
            recordNo: record.recordNo,
          },
          record,
        );
      }
    }
  }

  for (const rpNumber of index.rpNumbers) {
    const rpLine = index.firstRpLines.get(rpNumber);
    const usageLine = index.firstUsageLines.get(rpNumber);
    const drugLine = index.firstDrugLines.get(rpNumber);

    if (rpLine === undefined) {
      continue;
    }

    if (usageLine !== undefined && usageLine < rpLine) {
      issues.push({
        level,
        code: "INVALID_RECORD_ORDER",
        message: `RP ${rpNumber} record order must be 101 before 111.`,
        recordNo: RECORD_NO.usage,
      });
    }

    if (drugLine !== undefined && drugLine < rpLine) {
      issues.push({
        level,
        code: "INVALID_RECORD_ORDER",
        message: `RP ${rpNumber} record order must be 101 before 201.`,
        recordNo: RECORD_NO.drug,
      });
    }

    if (usageLine !== undefined && drugLine !== undefined && drugLine < usageLine) {
      issues.push({
        level,
        code: "INVALID_RECORD_ORDER",
        message: `RP ${rpNumber} record order must be 111 before 201.`,
        recordNo: RECORD_NO.drug,
      });
    }
  }

  for (const record of records) {
    if (
      record.recordNo !== RECORD_NO.rpSplitDispensingQuantity &&
      record.recordNo !== RECORD_NO.usage &&
      record.recordNo !== RECORD_NO.usageSupplement &&
      record.recordNo !== RECORD_NO.drug &&
      record.recordNo !== RECORD_NO.drugUnitConversion &&
      record.recordNo !== RECORD_NO.drugUnevenDosing &&
      record.recordNo !== RECORD_NO.drugBurdenCategory &&
      record.recordNo !== RECORD_NO.drugSingleDoseAmount &&
      record.recordNo !== RECORD_NO.drugSupplement
    ) {
      continue;
    }

    const rpNumber = toInt(record.fields[1]);
    if (rpNumber === undefined || index.rpNumbers.has(rpNumber)) {
      continue;
    }

    pushIssue(
      {
        level,
        code: "MISSING_RP_RECORD",
        message: `Record ${record.recordNo} references RP ${rpNumber} without a preceding 101 record.`,
        line: record.line,
        recordNo: record.recordNo,
      },
      record,
    );
  }

  for (const record of records) {
    if (record.recordNo !== RECORD_NO.usageSupplement) {
      continue;
    }

    const rpNumber = toInt(record.fields[1]);
    if (rpNumber === undefined || index.usageAnchorRps.has(rpNumber)) {
      continue;
    }

    pushIssue(
      {
        level,
        code: "MISSING_USAGE_RECORD",
        message: `Record ${record.recordNo} references RP ${rpNumber} without a corresponding 111 record.`,
        line: record.line,
        recordNo: RECORD_NO.usage,
      },
      record,
    );
  }

  for (const record of records) {
    if (
      record.recordNo !== RECORD_NO.drugUnitConversion &&
      record.recordNo !== RECORD_NO.drugUnevenDosing &&
      record.recordNo !== RECORD_NO.drugBurdenCategory &&
      record.recordNo !== RECORD_NO.drugSingleDoseAmount &&
      record.recordNo !== RECORD_NO.drugSupplement
    ) {
      continue;
    }

    const rpNumber = toInt(record.fields[1]);
    const drugNumber = toInt(record.fields[2]);

    if (
      rpNumber === undefined ||
      drugNumber === undefined ||
      index.drugAnchorKeys.has(toDrugAnchorKey(rpNumber, drugNumber))
    ) {
      continue;
    }

    pushIssue(
      {
        level,
        code: "MISSING_DRUG_RECORD",
        message: `Record ${record.recordNo} references RP ${rpNumber} / drug ${drugNumber} without a corresponding 201 record.`,
        line: record.line,
        recordNo: RECORD_NO.drug,
      },
      record,
    );
  }

  const rpGroupRecordNos = new Set<string>([
    RECORD_NO.rp,
    RECORD_NO.rpSplitDispensingQuantity,
    RECORD_NO.usage,
    RECORD_NO.usageSupplement,
    RECORD_NO.drug,
    RECORD_NO.drugUnitConversion,
    RECORD_NO.drugUnevenDosing,
    RECORD_NO.drugBurdenCategory,
    RECORD_NO.drugSingleDoseAmount,
    RECORD_NO.drugSupplement,
  ]);

  const hasRpGroupRecords = [...rpGroupRecordNos].some((recordNo) => hasRecord(recordNo));

  if (hasRpGroupRecords && !hasRecord(RECORD_NO.rp)) {
    issues.push({
      level,
      code: "MISSING_RP_RECORD",
      message: "RP record (101) is required when RP/drug records are present.",
      recordNo: RECORD_NO.rp,
    });
  }

  for (const rpNumber of index.rpNumbers) {
    if (!index.usageAnchorRps.has(rpNumber)) {
      issues.push({
        level,
        code: "MISSING_USAGE_RECORD",
        message: `RP ${rpNumber} has record 101 but no corresponding 111 usage record.`,
        recordNo: RECORD_NO.usage,
      });
    }

    if (!index.drugAnchorRps.has(rpNumber)) {
      issues.push({
        level,
        code: "MISSING_DRUG_RECORD",
        message: `RP ${rpNumber} has record 101 but no corresponding 201 drug record.`,
        recordNo: RECORD_NO.drug,
      });
    }
  }

  if (index.drugAnchorKeys.size > 0) {
    const burdenKeys = new Set<string>();

    for (const record of records) {
      if (record.recordNo !== RECORD_NO.drugBurdenCategory) {
        continue;
      }

      const rpNumber = toInt(record.fields[1]);
      const drugNumber = toInt(record.fields[2]);
      if (rpNumber === undefined || drugNumber === undefined) {
        continue;
      }

      burdenKeys.add(toDrugAnchorKey(rpNumber, drugNumber));
    }

    if (burdenKeys.size > 0 && burdenKeys.size < index.drugAnchorKeys.size) {
      issues.push({
        level,
        code: "MIXED_BURDEN_CATEGORY_RECORD",
        message:
          "Record 231 must be output for all drugs in the prescription, or omitted for all drugs.",
        recordNo: RECORD_NO.drugBurdenCategory,
      });
    }
  }

  const drugPriceUnitByCode = toDrugPriceUnitByCodeMap(options?.drugPriceUnitByCode);
  if (drugPriceUnitByCode) {
    for (const source of index.drugUnitValidationSources) {
      const code = source.code?.trim();
      const unit = source.unit?.trim();
      if (!code || !unit) {
        continue;
      }

      const listedUnitRaw = drugPriceUnitByCode[code];
      if (typeof listedUnitRaw !== "string") {
        continue;
      }

      const listedUnit = listedUnitRaw.trim();
      if (!listedUnit) {
        continue;
      }

      if (listedUnit === unit) {
        continue;
      }

      const anchorKey = toDrugAnchorKey(source.rpNumber, source.drugNumber);
      if (index.unitConversionKeys.has(anchorKey)) {
        continue;
      }

      issues.push({
        level,
        code: "MISSING_UNIT_CONVERSION_RECORD",
        message: `Record 201 (RP ${source.rpNumber}/drug ${source.drugNumber}, code ${code}) uses unit ${unit} while listed unit is ${listedUnit}. Record 211 is required.`,
        recordNo: RECORD_NO.drugUnitConversion,
      });
    }
  }

  const helpers: ValidationHelpers = {
    records,
    index,
    level,
    hasRecord,
    pushIssue,
    pushSpecIssue,
    requireAllFields,
    requireOneOfFields,
    countByKey,
    toInt,
    isJahisDateLike,
    isDrugCodeType,
    isDrugInfoClass,
    isPotencyFlag,
  };

  validateSplitDispensingDependency(helpers);
  validatePatientInsuranceAnchors(helpers);
  validateRecordFieldConsistency(helpers);
  validateSpecRequiredFields(helpers);
  validateSpecCardinality(helpers);

  return issues;
};

/**
 * Parses JAHIS prescription text into raw and normalized data.
 *
 * Behavior summary:
 * - `strict: true` returns `ok = false` and `data = null` when any error-level issue exists.
 * - `strict: false` keeps parsed data and reports issues as warnings where applicable.
 * - `includeRawRecords: true` also exposes `rawRecords` at the top level.
 *
 * @param text Input JAHIS text payload.
 * @param options Optional parser behavior flags.
 * @returns Parse result with `issues` and optional `data` (`raw` + `normalized`).
 */
export const parseJahisRx = (text: string, options?: ParseOptions): ParseResult => {
  // Keep raw tokenized records and decoded records separate for easier debugging.
  const lines = splitLines(text);

  const rawRecords = lines
    .map((line, index) => parseRecord(line, index + 1))
    .filter((record): record is RawRecord => record !== null);

  const issues = validateRecords(rawRecords, options);
  const hasError = issues.some((issue) => issue.level === "error");

  const parsedRecords = rawRecords.map((record) => decodeRecord(record));
  const data: ParsedPrescriptionData | null = hasError
    ? null
    : {
        raw: rawRecords,
        normalized: buildPrescription(parsedRecords, options),
      };

  const result: ParseResult = {
    ok: !hasError,
    data,
    issues,
  };

  if (options?.includeRawRecords) {
    result.rawRecords = rawRecords;
  }

  return result;
};
