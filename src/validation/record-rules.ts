import { RECORD_NO } from "../constants/index.js";
import type { ParseIssue, ParseIssueLevel, RawRecord } from "../types/parse.js";
import type { ValidationIndex } from "./index-builder.js";

export type ValidationHelpers = {
  records: RawRecord[];
  index: ValidationIndex;
  level: ParseIssueLevel;
  hasRecord: (recordNo: string) => boolean;
  pushIssue: (issue: ParseIssue, sourceRecord?: RawRecord) => void;
  pushSpecIssue: (
    sourceRecord: RawRecord,
    code: string,
    message: string,
    recordNoOverride?: string,
  ) => void;
  requireAllFields: (
    sourceRecord: RawRecord,
    requiredIndexes: number[],
    itemNames: string[],
  ) => void;
  requireOneOfFields: (
    sourceRecord: RawRecord,
    candidateIndexes: number[],
    itemNames: string[],
  ) => void;
  countByKey: (
    keySelector: (record: RawRecord) => string | undefined,
  ) => Map<string, { count: number; source: RawRecord }>;
  toInt: (value: string | undefined) => number | undefined;
  isJahisDateLike: (value: string | undefined) => boolean;
  isDrugCodeType: (value: string | undefined) => boolean;
  isDrugInfoClass: (value: string | undefined) => boolean;
  isPotencyFlag: (value: string | undefined) => boolean;
};

export const validateSplitDispensingDependency = ({
  records,
  level,
  hasRecord,
  pushIssue,
}: ValidationHelpers): void => {
  const hasRecord63 = hasRecord(RECORD_NO.splitDispensing);
  for (const record of records) {
    if (record.recordNo !== RECORD_NO.rpSplitDispensingQuantity) {
      continue;
    }

    if (hasRecord63) {
      continue;
    }

    pushIssue(
      {
        level,
        code: "MISSING_SPLIT_DISPENSING_RECORD",
        message:
          "RP split dispensing quantity record (102) exists but split dispensing record (63) is missing.",
        line: record.line,
        recordNo: RECORD_NO.splitDispensing,
      },
      record,
    );
    break;
  }
};

export const validatePatientInsuranceAnchors = ({
  level,
  hasRecord,
  pushIssue,
}: ValidationHelpers): void => {
  if (hasRecord(RECORD_NO.patientName) && !hasRecord(RECORD_NO.patientSex)) {
    pushIssue({
      level,
      code: "MISSING_PATIENT_SEX_RECORD",
      message: "Patient name record (11) exists but patient sex record (12) is missing.",
      recordNo: RECORD_NO.patientSex,
    });
  }

  if (hasRecord(RECORD_NO.patientName) && !hasRecord(RECORD_NO.patientBirthDate)) {
    pushIssue({
      level,
      code: "MISSING_PATIENT_BIRTHDATE_RECORD",
      message: "Patient name record (11) exists but patient birth date record (13) is missing.",
      recordNo: RECORD_NO.patientBirthDate,
    });
  }

  const insuranceRecordNos = new Set<string>([
    RECORD_NO.insuranceType,
    RECORD_NO.insurerNumber,
    RECORD_NO.insuranceCard,
    RECORD_NO.insuranceRate,
    RECORD_NO.occupationalAccident,
    RECORD_NO.publicExpense1,
    RECORD_NO.publicExpense2,
    RECORD_NO.publicExpense3,
    RECORD_NO.specialPublicExpense,
    RECORD_NO.receiptType,
  ]);

  const hasAnyInsurance = [...insuranceRecordNos].some((recordNo) => hasRecord(recordNo));

  if (hasAnyInsurance && !hasRecord(RECORD_NO.insurerNumber)) {
    pushIssue({
      level,
      code: "MISSING_INSURER_NUMBER_RECORD",
      message: "Insurance records exist but insurer number record (22) is missing.",
      recordNo: RECORD_NO.insurerNumber,
    });
  }

  if (hasAnyInsurance && !hasRecord(RECORD_NO.insuranceCard)) {
    pushIssue({
      level,
      code: "MISSING_INSURANCE_CARD_RECORD",
      message: "Insurance records exist but insurance card record (23) is missing.",
      recordNo: RECORD_NO.insuranceCard,
    });
  }
};

export const validateRecordFieldConsistency = ({
  records,
  index,
  level,
  pushIssue,
  toInt,
  isJahisDateLike,
}: ValidationHelpers): void => {
  for (const record of records) {
    if (record.recordNo !== RECORD_NO.prescriptionNumber) {
      continue;
    }

    const numberType = record.fields[1];
    const number = record.fields[2];
    const hasNumberType = Boolean(numberType && numberType.length > 0);
    const hasNumber = Boolean(number && number.length > 0);

    if (hasNumberType !== hasNumber) {
      pushIssue(
        {
          level,
          code: "INVALID_PRESCRIPTION_NUMBER_RECORD",
          message:
            "Prescription number record (82) must include both numberType and number when either is present.",
          line: record.line,
          recordNo: RECORD_NO.prescriptionNumber,
        },
        record,
      );
    }
  }

  for (const record of records) {
    if (
      record.recordNo !== RECORD_NO.prescriptionDate &&
      record.recordNo !== RECORD_NO.dispensingDueDate
    ) {
      continue;
    }

    const date = record.fields[1];
    if (isJahisDateLike(date)) {
      continue;
    }

    pushIssue(
      {
        level,
        code: "INVALID_DATE_FORMAT",
        message: `Record ${record.recordNo} date must be 7 or 8 digit numeric JAHIS date format.`,
        line: record.line,
        recordNo: record.recordNo,
      },
      record,
    );
  }

  for (const record of records) {
    if (record.recordNo !== RECORD_NO.splitDispensing) {
      continue;
    }

    const totalCount = toInt(record.fields[1]);
    const currentCount = toInt(record.fields[2]);

    if (totalCount === undefined || currentCount === undefined || currentCount <= totalCount) {
      continue;
    }

    pushIssue(
      {
        level,
        code: "INVALID_SPLIT_COUNT_RECORD",
        message:
          "Split dispensing record (63) currentCount must be less than or equal to totalCount.",
        line: record.line,
        recordNo: RECORD_NO.splitDispensing,
      },
      record,
    );
  }

  const noteRecords = index.recordNoToRecords.get(RECORD_NO.note) ?? [];
  if (noteRecords.length > 0) {
    let expectedSequence = 1;

    for (const record of noteRecords) {
      const sequence = toInt(record.fields[1]);
      if (sequence === expectedSequence) {
        expectedSequence += 1;
        continue;
      }

      pushIssue(
        {
          level,
          code: "INVALID_NOTE_SEQUENCE",
          message: "Note record (81) sequence must start at 1 and increment by 1 for each note.",
          line: record.line,
          recordNo: RECORD_NO.note,
        },
        record,
      );
      break;
    }
  }
};

export const validateSpecRequiredFields = ({
  records,
  requireAllFields,
  requireOneOfFields,
  isDrugInfoClass,
  isDrugCodeType,
  isPotencyFlag,
}: ValidationHelpers): void => {
  for (const record of records) {
    if (record.raw.startsWith("JAHIS")) {
      continue;
    }

    switch (record.recordNo) {
      case RECORD_NO.patientSex:
      case RECORD_NO.patientBirthDate:
      case RECORD_NO.insurerNumber:
      case RECORD_NO.prescriptionDate:
        requireAllFields(record, [1], ["1"]);
        break;

      case RECORD_NO.insuranceCard:
        requireAllFields(record, [3], ["3"]);
        break;

      case RECORD_NO.institutionAddress:
        requireOneOfFields(record, [1, 2], ["1", "2"]);
        break;

      case RECORD_NO.patientName:
        requireOneOfFields(record, [2, 3], ["2", "3"]);
        break;

      case RECORD_NO.splitDispensing:
        requireAllFields(record, [1, 2], ["1", "2"]);
        break;

      case RECORD_NO.note:
        requireAllFields(record, [1, 3], ["1", "3"]);
        break;

      case RECORD_NO.prescriptionNumber:
        requireAllFields(record, [1, 2], ["1", "2"]);
        break;

      case RECORD_NO.rp:
        if (record.fields.length >= 5) {
          requireAllFields(record, [1, 2, 4], ["1", "2", "4"]);
        }
        break;

      case RECORD_NO.rpSplitDispensingQuantity:
        requireAllFields(record, [1, 2, 3], ["1", "2", "3"]);
        break;

      case RECORD_NO.usage:
        if (record.fields.length >= 5) {
          requireAllFields(record, [1, 2, 4], ["1", "2", "4"]);
        }
        break;

      case RECORD_NO.drug: {
        const hasSpecLikeLayout =
          record.fields.length >= 10 &&
          isDrugInfoClass(record.fields[3]) &&
          isDrugCodeType(record.fields[4]) &&
          isPotencyFlag(record.fields[8]);

        if (hasSpecLikeLayout) {
          requireAllFields(record, [1, 2, 4, 7, 8, 9], ["1", "2", "4", "7", "8", "9"]);
        }
        break;
      }

      case RECORD_NO.drugUnitConversion:
        requireAllFields(record, [1, 2, 3], ["1", "2", "3"]);
        break;

      default:
        break;
    }
  }
};

export const validateSpecCardinality = ({
  index,
  hasRecord,
  pushSpecIssue,
  countByKey,
  toInt,
}: ValidationHelpers): void => {
  const usageCountsByRp = countByKey((record) => {
    if (record.recordNo !== RECORD_NO.usage) {
      return undefined;
    }

    const rpNumber = toInt(record.fields[1]);
    return rpNumber === undefined ? undefined : String(rpNumber);
  });

  for (const [rpNumber, stats] of usageCountsByRp) {
    if (stats.count <= 1) {
      continue;
    }

    pushSpecIssue(
      stats.source,
      "INVALID_RECORD_CARDINALITY",
      `Record 111 must be output exactly once per RP. RP ${rpNumber} has ${stats.count} records.`,
      RECORD_NO.usage,
    );
  }

  const rpSplitCountsByRp = countByKey((record) => {
    if (record.recordNo !== RECORD_NO.rpSplitDispensingQuantity) {
      return undefined;
    }

    const rpNumber = toInt(record.fields[1]);
    return rpNumber === undefined ? undefined : String(rpNumber);
  });

  for (const [rpNumber, stats] of rpSplitCountsByRp) {
    if (stats.count <= 1) {
      continue;
    }

    pushSpecIssue(
      stats.source,
      "INVALID_RECORD_CARDINALITY",
      `Record 102 must be output at most once per RP. RP ${rpNumber} has ${stats.count} records.`,
      RECORD_NO.rpSplitDispensingQuantity,
    );
  }

  if (hasRecord(RECORD_NO.splitDispensing)) {
    for (const rpNumber of index.rpNumbers) {
      if ((rpSplitCountsByRp.get(String(rpNumber))?.count ?? 0) > 0) {
        continue;
      }

      const source = (index.recordNoToRecords.get(RECORD_NO.rp) ?? []).find((record) => {
        return toInt(record.fields[1]) === rpNumber;
      });
      if (!source) {
        continue;
      }

      pushSpecIssue(
        source,
        "INVALID_RECORD_CARDINALITY",
        `Record 63 exists, but RP ${rpNumber} has no corresponding record 102.`,
        RECORD_NO.rpSplitDispensingQuantity,
      );
    }
  }

  const validateSinglePerDrug = (targetRecordNo: string): void => {
    const countsByDrug = countByKey((record) => {
      if (record.recordNo !== targetRecordNo) {
        return undefined;
      }

      const rpNumber = toInt(record.fields[1]);
      const drugNumber = toInt(record.fields[2]);
      if (rpNumber === undefined || drugNumber === undefined) {
        return undefined;
      }

      return `${rpNumber}:${drugNumber}`;
    });

    for (const [drugKey, stats] of countsByDrug) {
      if (stats.count <= 1) {
        continue;
      }

      pushSpecIssue(
        stats.source,
        "INVALID_RECORD_CARDINALITY",
        `Record ${targetRecordNo} must be output at most once per drug. Drug ${drugKey} has ${stats.count} records.`,
        targetRecordNo,
      );
    }
  };

  validateSinglePerDrug(RECORD_NO.drugUnitConversion);
  validateSinglePerDrug(RECORD_NO.drugUnevenDosing);
  validateSinglePerDrug(RECORD_NO.drugBurdenCategory);
  validateSinglePerDrug(RECORD_NO.drugSingleDoseAmount);
};
