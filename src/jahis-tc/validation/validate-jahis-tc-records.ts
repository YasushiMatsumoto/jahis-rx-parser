import type {
  ParseIssue,
  ParseIssueLevel,
  ParseOptions,
  RawRecord,
} from "../../shared/types/parse.js";
import { JAHIS_TC_RECORD_NO } from "../constants/index.js";

const RECORD_CREATOR_SET = new Set(["1", "2", "8", "9"]);
const DRUG_CODE_TYPE_SET = new Set(["1", "2", "3", "4", "6"]);
const GENERAL_NAME_CODE_TYPE_SET = new Set(["1", "2"]);
const OTC_INGREDIENT_CODE_TYPE_SET = new Set(["1", "2"]);
const PROVIDED_INFO_TYPE_SET = new Set(["30", "31", "99"]);
const DISPENSING_SCORE_TABLE_CODE_SET = new Set(["1", "3", "4"]);
const PRESCRIBING_SCORE_TABLE_CODE_SET = new Set(["1", "3"]);
const OUTPUT_CATEGORY_SET = new Set(["1", "2"]);
const PATIENT_REMARK_TYPE_SET = new Set(["1", "2", "3", "9"]);
const DOSAGE_FORM_CODE_SET = new Set(["1", "2", "3", "4", "5", "6", "7", "9", "10"]);
const ERA_CODE_SET = new Set(["M", "T", "S", "H", "R"]);

const hasText = (value: string | undefined): boolean => {
  return Boolean(value && value.trim().length > 0);
};

const hasNonEmptyText = (value: string | undefined): value is string => {
  return hasText(value);
};

const toIssueLevel = (options: ParseOptions | undefined): ParseIssueLevel => {
  return options?.strict ? "error" : "warning";
};

const isJahisDateLike = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }

  if (/^\d{8}$/.test(value)) {
    return true;
  }

  if (!/^[A-Z]\d{6}$/.test(value)) {
    return false;
  }

  return ERA_CODE_SET.has(value.charAt(0));
};

const isAmountLike = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }

  return /^\d{1,6}(\.\d{1,5})?$/.test(value);
};

const isWeightLike = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }

  return /^(?:0|[1-9]\d{0,2})(?:\.\d{1,3})?$/.test(value);
};

const isDigits = (value: string | undefined, minLength: number, maxLength: number): boolean => {
  if (!value) {
    return false;
  }

  const pattern = new RegExp(`^\\d{${minLength},${maxLength}}$`);
  return pattern.test(value);
};

const isRpNumberLike = (value: string | undefined): boolean => {
  if (!isDigits(value, 1, 3)) {
    return false;
  }

  const parsed = Number.parseInt(value ?? "", 10);
  return parsed >= 1;
};

const isPostalCodeLike = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }

  return /^\d{7}$/.test(value) || /^\d{3}-\d{4}$/.test(value);
};

const isPhoneLike = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }

  return /^[0-9-]{1,13}$/.test(value);
};

const isUsageCodeTypeLike = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }

  return /^\d$/.test(value);
};

const isXTypeLike = (value: string | undefined, maxLength: number): boolean => {
  if (!value) {
    return false;
  }

  const pattern = new RegExp(`^[A-Za-z0-9.-]{1,${maxLength}}$`);
  return pattern.test(value);
};

const isPrefectureCodeLike = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }

  if (!/^\d{2}$/.test(value)) {
    return false;
  }

  const code = Number.parseInt(value, 10);
  return code >= 1 && code <= 47;
};

const pushIssue = (
  issues: ParseIssue[],
  level: ParseIssueLevel,
  code: string,
  message: string,
  source?: RawRecord,
): void => {
  const issue: ParseIssue = {
    level,
    code,
    message,
  };

  if (source?.line !== undefined) {
    issue.line = source.line;
  }
  if (source?.recordNo !== undefined) {
    issue.recordNo = source.recordNo;
  }
  if (source?.raw !== undefined) {
    issue.rawRecord = source.raw;
  }

  issues.push(issue);
};

const requireField = (
  issues: ParseIssue[],
  level: ParseIssueLevel,
  record: RawRecord,
  index: number,
  fieldName: string,
): void => {
  if (hasText(record.fields[index])) {
    return;
  }

  pushIssue(
    issues,
    level,
    "REQUIRED_FIELD_MISSING",
    `Record ${record.recordNo} required item ${fieldName} is missing.`,
    record,
  );
};

const validateRecordCreator = (
  issues: ParseIssue[],
  level: ParseIssueLevel,
  record: RawRecord,
  index: number,
): void => {
  const value = record.fields[index];
  if (!hasNonEmptyText(value) || RECORD_CREATOR_SET.has(value)) {
    return;
  }

  pushIssue(
    issues,
    level,
    "INVALID_ENUM_VALUE",
    `Record ${record.recordNo} has invalid record creator: ${value}.`,
    record,
  );
};

const validateDateField = (
  issues: ParseIssue[],
  level: ParseIssueLevel,
  record: RawRecord,
  index: number,
  fieldName: string,
): void => {
  if (!hasText(record.fields[index])) {
    return;
  }

  if (isJahisDateLike(record.fields[index])) {
    return;
  }

  pushIssue(
    issues,
    level,
    "INVALID_DATE_FORMAT",
    `Record ${record.recordNo} ${fieldName} must be YYYYMMDD or GYYMMDD format.`,
    record,
  );
};

type DispensingState = {
  hasRecord5: boolean;
  hasRecord11: boolean;
  hasRecord51: boolean;
  hasMedicationContent: boolean;
  rpWithDrug: Set<number>;
  rpWithUsage: Set<number>;
};

export const validateJahisTcRecords = (
  records: RawRecord[],
  options: ParseOptions | undefined,
): ParseIssue[] => {
  const issues: ParseIssue[] = [];

  if (records.length === 0) {
    pushIssue(issues, "error", "EMPTY_INPUT", "Input text is empty.");
    return issues;
  }

  const header = records[0];
  if (!header || !header.recordNo.startsWith("JAHISTC")) {
    pushIssue(
      issues,
      "error",
      "INVALID_HEADER",
      "First line must be JAHISTC header token.",
      header,
    );
  }

  const level = toIssueLevel(options);
  const outputCategory = header?.fields[1];

  if (header && !/^JAHISTC\d{2}$/.test(header.recordNo)) {
    pushIssue(
      issues,
      level,
      "INVALID_HEADER_VERSION",
      "Header must be JAHISTC followed by 2 digits (e.g. JAHISTC06).",
      header,
    );
  }

  if (header && !hasText(outputCategory)) {
    pushIssue(
      issues,
      level,
      "REQUIRED_FIELD_MISSING",
      "Header output category is required (1:医療機関等⇒患者等, 2:患者等⇒医療機関等).",
      header,
    );
  } else if (
    header &&
    hasNonEmptyText(outputCategory) &&
    !OUTPUT_CATEGORY_SET.has(outputCategory)
  ) {
    pushIssue(
      issues,
      level,
      "INVALID_ENUM_VALUE",
      `Header output category must be 1 or 2 but was ${outputCategory}.`,
      header,
    );
  }

  const dispensingStates: DispensingState[] = [];
  let currentDispensing: DispensingState | undefined;
  const otcMedicationSequences = new Set<string>();

  const ensureDispensingForRecord = (record: RawRecord): DispensingState => {
    if (currentDispensing) {
      return currentDispensing;
    }

    pushIssue(
      issues,
      level,
      "INVALID_RECORD_ORDER",
      `Record ${record.recordNo} must appear after record 5 in a dispensing block.`,
      record,
    );

    currentDispensing = {
      hasRecord5: false,
      hasRecord11: false,
      hasRecord51: false,
      hasMedicationContent: false,
      rpWithDrug: new Set<number>(),
      rpWithUsage: new Set<number>(),
    };
    dispensingStates.push(currentDispensing);
    return currentDispensing;
  };

  let hasPatientRecord = false;

  for (const record of records) {
    switch (record.recordNo) {
      case "":
        break;

      case JAHIS_TC_RECORD_NO.patient:
        hasPatientRecord = true;
        requireField(issues, level, record, 1, "name");
        requireField(issues, level, record, 2, "sexCode");
        requireField(issues, level, record, 3, "birthDate");
        if (hasText(record.fields[2]) && !["1", "2"].includes(record.fields[2] ?? "")) {
          pushIssue(
            issues,
            level,
            "INVALID_ENUM_VALUE",
            `Record 1 sexCode must be 1 or 2 but was ${record.fields[2]}.`,
            record,
          );
        }
        validateDateField(issues, level, record, 3, "birthDate");
        if (hasText(record.fields[4]) && !isPostalCodeLike(record.fields[4])) {
          pushIssue(
            issues,
            level,
            "INVALID_FORMAT",
            "Record 1 postalCode must be NNNNNNN or NNN-NNNN.",
            record,
          );
        }
        if (hasText(record.fields[6]) && !isPhoneLike(record.fields[6])) {
          pushIssue(issues, level, "INVALID_FORMAT", "Record 1 phone format is invalid.", record);
        }
        if (hasText(record.fields[9]) && !isWeightLike(record.fields[9])) {
          pushIssue(
            issues,
            level,
            "INVALID_AMOUNT_FORMAT",
            "Record 1 weight format is invalid. Expected up to 3 integer and 3 fractional digits.",
            record,
          );
        }
        break;

      case JAHIS_TC_RECORD_NO.patientRemark:
        requireField(issues, level, record, 1, "patientRemarkType");
        requireField(issues, level, record, 2, "patientRemarkContent");
        requireField(issues, level, record, 3, "recordCreator");
        validateRecordCreator(issues, level, record, 3);
        if (hasText(record.fields[1]) && !PATIENT_REMARK_TYPE_SET.has(record.fields[1] ?? "")) {
          pushIssue(
            issues,
            level,
            "INVALID_ENUM_VALUE",
            `Record 2 patientRemarkType must be one of 1,2,3,9 but was ${record.fields[1]}.`,
            record,
          );
        }
        break;

      case JAHIS_TC_RECORD_NO.otcMedication:
        requireField(issues, level, record, 1, "otcMedicationName");
        requireField(issues, level, record, 4, "recordCreator");
        validateRecordCreator(issues, level, record, 4);
        validateDateField(issues, level, record, 2, "startDate");
        validateDateField(issues, level, record, 3, "endDate");
        if (hasText(record.fields[5])) {
          if (!isDigits(record.fields[5], 1, 3)) {
            pushIssue(
              issues,
              level,
              "INVALID_FORMAT",
              "Record 3 otcMedicationSequence must be 1-3 digit number.",
              record,
            );
          } else {
            otcMedicationSequences.add(record.fields[5] ?? "");
          }
        }
        if (hasText(record.fields[6]) && !isDigits(record.fields[6], 13, 13)) {
          pushIssue(issues, level, "INVALID_FORMAT", "Record 3 janCode must be 13 digits.", record);
        }
        break;

      case JAHIS_TC_RECORD_NO.otcMedicationIngredient:
        requireField(issues, level, record, 1, "otcMedicationSequence");
        requireField(issues, level, record, 2, "ingredientName");
        requireField(issues, level, record, 3, "ingredientCodeType");
        requireField(issues, level, record, 5, "recordCreator");
        validateRecordCreator(issues, level, record, 5);
        if (hasText(record.fields[1]) && !isDigits(record.fields[1], 1, 3)) {
          pushIssue(
            issues,
            level,
            "INVALID_FORMAT",
            "Record 31 otcMedicationSequence must be 1-3 digit number.",
            record,
          );
        }
        if (
          hasNonEmptyText(record.fields[3]) &&
          !OTC_INGREDIENT_CODE_TYPE_SET.has(record.fields[3])
        ) {
          pushIssue(
            issues,
            level,
            "INVALID_ENUM_VALUE",
            `Record 31 ingredientCodeType must be one of 1,2 but was ${record.fields[3]}.`,
            record,
          );
        }
        if (hasText(record.fields[3]) && record.fields[3] !== "1" && !hasText(record.fields[4])) {
          pushIssue(
            issues,
            level,
            "CONDITIONAL_REQUIRED_MISSING",
            "Record 31 ingredientCode is required when ingredientCodeType is not 1.",
            record,
          );
        }
        if (hasNonEmptyText(record.fields[1]) && !otcMedicationSequences.has(record.fields[1])) {
          pushIssue(
            issues,
            level,
            "MISSING_REFERENCED_RECORD",
            `Record 31 references OTC sequence ${record.fields[1]} without corresponding record 3.`,
            record,
          );
        }
        break;

      case JAHIS_TC_RECORD_NO.notebookMemo:
        requireField(issues, level, record, 1, "notebookMemoText");
        requireField(issues, level, record, 3, "recordCreator");
        validateRecordCreator(issues, level, record, 3);
        validateDateField(issues, level, record, 2, "memoInputDate");
        break;

      case JAHIS_TC_RECORD_NO.dispensingDate:
        currentDispensing = {
          hasRecord5: true,
          hasRecord11: false,
          hasRecord51: false,
          hasMedicationContent: false,
          rpWithDrug: new Set<number>(),
          rpWithUsage: new Set<number>(),
        };
        dispensingStates.push(currentDispensing);
        requireField(issues, level, record, 1, "dispensingOrPrescribingDate");
        requireField(issues, level, record, 2, "recordCreator");
        validateRecordCreator(issues, level, record, 2);
        validateDateField(issues, level, record, 1, "date");
        break;

      case JAHIS_TC_RECORD_NO.dispensingInstitution:
        currentDispensing = ensureDispensingForRecord(record);
        currentDispensing.hasRecord11 = true;
        requireField(issues, level, record, 1, "institutionName");
        requireField(issues, level, record, 8, "recordCreator");
        validateRecordCreator(issues, level, record, 8);
        if (outputCategory === "1") {
          requireField(issues, level, record, 2, "prefectureCode");
          requireField(issues, level, record, 3, "scoreTableCode");
          requireField(issues, level, record, 4, "institutionCode");
        }
        if (hasText(record.fields[2]) && !isPrefectureCodeLike(record.fields[2])) {
          pushIssue(
            issues,
            level,
            "INVALID_ENUM_VALUE",
            `Record 11 prefectureCode must be between 01 and 47 but was ${record.fields[2]}.`,
            record,
          );
        }
        if (
          hasNonEmptyText(record.fields[3]) &&
          !DISPENSING_SCORE_TABLE_CODE_SET.has(record.fields[3])
        ) {
          pushIssue(
            issues,
            level,
            "INVALID_ENUM_VALUE",
            `Record 11 scoreTableCode must be one of 1,3,4 but was ${record.fields[3]}.`,
            record,
          );
        }
        if (hasText(record.fields[4]) && !isDigits(record.fields[4], 7, 7)) {
          pushIssue(
            issues,
            level,
            "INVALID_FORMAT",
            "Record 11 institutionCode must be 7 digits.",
            record,
          );
        }
        if (hasText(record.fields[5]) && !isPostalCodeLike(record.fields[5])) {
          pushIssue(
            issues,
            level,
            "INVALID_FORMAT",
            "Record 11 postalCode must be NNNNNNN or NNN-NNNN.",
            record,
          );
        }
        if (hasText(record.fields[7]) && !isPhoneLike(record.fields[7])) {
          pushIssue(issues, level, "INVALID_FORMAT", "Record 11 phone format is invalid.", record);
        }
        break;

      case JAHIS_TC_RECORD_NO.dispensingStaff:
        ensureDispensingForRecord(record);
        requireField(issues, level, record, 1, "staffName");
        requireField(issues, level, record, 3, "recordCreator");
        validateRecordCreator(issues, level, record, 3);
        break;

      case JAHIS_TC_RECORD_NO.prescribingInstitution:
        currentDispensing = ensureDispensingForRecord(record);
        currentDispensing.hasRecord51 = true;
        requireField(issues, level, record, 1, "prescribingInstitutionName");
        requireField(issues, level, record, 5, "recordCreator");
        validateRecordCreator(issues, level, record, 5);
        if (outputCategory === "1") {
          requireField(issues, level, record, 2, "prefectureCode");
          requireField(issues, level, record, 3, "scoreTableCode");
          requireField(issues, level, record, 4, "institutionCode");
        }
        if (hasText(record.fields[2]) && !isPrefectureCodeLike(record.fields[2])) {
          pushIssue(
            issues,
            level,
            "INVALID_ENUM_VALUE",
            `Record 51 prefectureCode must be between 01 and 47 but was ${record.fields[2]}.`,
            record,
          );
        }
        if (
          hasNonEmptyText(record.fields[3]) &&
          !PRESCRIBING_SCORE_TABLE_CODE_SET.has(record.fields[3])
        ) {
          pushIssue(
            issues,
            level,
            "INVALID_ENUM_VALUE",
            `Record 51 scoreTableCode must be one of 1,3 but was ${record.fields[3]}.`,
            record,
          );
        }
        if (hasText(record.fields[4]) && !isDigits(record.fields[4], 7, 7)) {
          pushIssue(
            issues,
            level,
            "INVALID_FORMAT",
            "Record 51 institutionCode must be 7 digits.",
            record,
          );
        }
        break;

      case JAHIS_TC_RECORD_NO.prescribingDoctor:
        ensureDispensingForRecord(record);
        requireField(issues, level, record, 1, "doctorName");
        requireField(issues, level, record, 3, "recordCreator");
        validateRecordCreator(issues, level, record, 3);
        break;

      case JAHIS_TC_RECORD_NO.drug: {
        currentDispensing = ensureDispensingForRecord(record);
        currentDispensing.hasMedicationContent = true;
        requireField(issues, level, record, 1, "rpNumber");
        requireField(issues, level, record, 2, "drugName");
        requireField(issues, level, record, 3, "amount");
        requireField(issues, level, record, 4, "unitName");
        requireField(issues, level, record, 5, "drugCodeType");
        requireField(issues, level, record, 7, "recordCreator");
        validateRecordCreator(issues, level, record, 7);

        if (hasText(record.fields[1]) && !isRpNumberLike(record.fields[1])) {
          pushIssue(
            issues,
            level,
            "INVALID_FORMAT",
            `Record 201 rpNumber must be 1-999 but was ${record.fields[1]}.`,
            record,
          );
        }

        const rpNumber = Number.parseInt(record.fields[1] ?? "", 10);
        if (!Number.isNaN(rpNumber) && rpNumber > 0) {
          currentDispensing.rpWithDrug.add(rpNumber);
        }

        const codeType = record.fields[5];
        if (hasNonEmptyText(codeType) && !DRUG_CODE_TYPE_SET.has(codeType)) {
          pushIssue(
            issues,
            level,
            "INVALID_ENUM_VALUE",
            `Record 201 drugCodeType must be one of 1,2,3,4,6 but was ${codeType}.`,
            record,
          );
        }

        if (hasText(codeType) && codeType !== "1" && !hasText(record.fields[6])) {
          pushIssue(
            issues,
            level,
            "CONDITIONAL_REQUIRED_MISSING",
            "Record 201 drugCode is required when drugCodeType is not 1.",
            record,
          );
        }

        if (hasText(record.fields[3]) && !isAmountLike(record.fields[3])) {
          pushIssue(
            issues,
            level,
            "INVALID_AMOUNT_FORMAT",
            "Record 201 amount format is invalid. Expected up to 6 integer and 5 fractional digits.",
            record,
          );
        }

        const hasGeneralName = hasText(record.fields[8]);
        const hasGeneralNameCodeType = hasText(record.fields[9]);
        const hasGeneralNameCode = hasText(record.fields[10]);

        if (hasGeneralNameCode && !hasGeneralNameCodeType) {
          pushIssue(
            issues,
            level,
            "CONDITIONAL_REQUIRED_MISSING",
            "Record 201 generalNameCodeType is required when generalNameCode is present.",
            record,
          );
        }

        if (hasGeneralNameCodeType && !isUsageCodeTypeLike(record.fields[9])) {
          pushIssue(
            issues,
            level,
            "INVALID_FORMAT",
            `Record 201 generalNameCodeType must be a single digit but was ${record.fields[9]}.`,
            record,
          );
        }

        if (hasGeneralNameCodeType && !GENERAL_NAME_CODE_TYPE_SET.has(record.fields[9] ?? "")) {
          pushIssue(
            issues,
            level,
            "INVALID_ENUM_VALUE",
            `Record 201 generalNameCodeType must be one of 1,2 but was ${record.fields[9]}.`,
            record,
          );
        }

        if (record.fields[9] === "2" && !hasGeneralNameCode) {
          pushIssue(
            issues,
            level,
            "CONDITIONAL_REQUIRED_MISSING",
            "Record 201 generalNameCode is required when generalNameCodeType is 2.",
            record,
          );
        }

        if (record.fields[9] === "1" && hasGeneralNameCode) {
          pushIssue(
            issues,
            level,
            "INVALID_FORMAT",
            "Record 201 generalNameCode must be omitted when generalNameCodeType is 1.",
            record,
          );
        }

        if (record.fields[9] === "2" && hasGeneralNameCode && !isXTypeLike(record.fields[10], 12)) {
          pushIssue(
            issues,
            level,
            "INVALID_FORMAT",
            "Record 201 generalNameCode must be 1-12 ASCII alphanumeric characters, periods, or hyphens.",
            record,
          );
        }

        break;
      }

      case JAHIS_TC_RECORD_NO.drugSupplement:
      case JAHIS_TC_RECORD_NO.drugCaution: {
        currentDispensing = ensureDispensingForRecord(record);
        currentDispensing.hasMedicationContent = true;
        requireField(issues, level, record, 1, "rpNumber");
        requireField(issues, level, record, 2, "text");
        requireField(issues, level, record, 3, "recordCreator");
        validateRecordCreator(issues, level, record, 3);
        if (hasText(record.fields[1]) && !isRpNumberLike(record.fields[1])) {
          pushIssue(
            issues,
            level,
            "INVALID_FORMAT",
            `Record ${record.recordNo} rpNumber must be 1-999 but was ${record.fields[1]}.`,
            record,
          );
          break;
        }

        const rpNumber = Number.parseInt(record.fields[1] ?? "", 10);
        if (
          !Number.isNaN(rpNumber) &&
          rpNumber > 0 &&
          !currentDispensing.rpWithDrug.has(rpNumber)
        ) {
          pushIssue(
            issues,
            level,
            "MISSING_RP_RECORD",
            `Record ${record.recordNo} references RP ${rpNumber} without corresponding 201 record.`,
            record,
          );
        }
        break;
      }

      case JAHIS_TC_RECORD_NO.usage: {
        currentDispensing = ensureDispensingForRecord(record);
        currentDispensing.hasMedicationContent = true;
        requireField(issues, level, record, 1, "rpNumber");
        requireField(issues, level, record, 3, "dispensingQuantity");
        requireField(issues, level, record, 4, "dispensingUnit");
        requireField(issues, level, record, 5, "dosageFormCode");
        requireField(issues, level, record, 6, "usageCodeType");
        requireField(issues, level, record, 8, "recordCreator");
        validateRecordCreator(issues, level, record, 8);
        if (hasText(record.fields[1]) && !isRpNumberLike(record.fields[1])) {
          pushIssue(
            issues,
            level,
            "INVALID_FORMAT",
            `Record 301 rpNumber must be 1-999 but was ${record.fields[1]}.`,
            record,
          );
          break;
        }

        if (hasText(record.fields[5]) && !DOSAGE_FORM_CODE_SET.has(record.fields[5] ?? "")) {
          pushIssue(
            issues,
            level,
            "INVALID_ENUM_VALUE",
            `Record 301 dosageFormCode must be one of 1,2,3,4,5,6,7,9,10 but was ${record.fields[5]}.`,
            record,
          );
        }

        if (hasText(record.fields[6]) && !isUsageCodeTypeLike(record.fields[6])) {
          pushIssue(
            issues,
            level,
            "INVALID_ENUM_VALUE",
            `Record 301 usageCodeType must be one digit but was ${record.fields[6]}.`,
            record,
          );
        }

        if (outputCategory === "1" && !["9", "10"].includes(record.fields[5] ?? "")) {
          requireField(issues, level, record, 2, "usageName");
        }

        const rpNumber = Number.parseInt(record.fields[1] ?? "", 10);
        if (!Number.isNaN(rpNumber) && rpNumber > 0) {
          currentDispensing.rpWithUsage.add(rpNumber);
          if (!currentDispensing.rpWithDrug.has(rpNumber)) {
            pushIssue(
              issues,
              level,
              "MISSING_RP_RECORD",
              `Record 301 references RP ${rpNumber} without corresponding 201 record.`,
              record,
            );
          }
        }

        if (hasText(record.fields[6]) && record.fields[6] !== "1" && !hasText(record.fields[7])) {
          pushIssue(
            issues,
            level,
            "CONDITIONAL_REQUIRED_MISSING",
            "Record 301 usageCode is required when usageCodeType is not 1.",
            record,
          );
        }
        break;
      }

      case JAHIS_TC_RECORD_NO.usageSupplement:
      case JAHIS_TC_RECORD_NO.prescriptionCaution: {
        currentDispensing = ensureDispensingForRecord(record);
        currentDispensing.hasMedicationContent = true;
        requireField(issues, level, record, 1, "rpNumber");
        requireField(issues, level, record, 2, "text");
        requireField(issues, level, record, 3, "recordCreator");
        validateRecordCreator(issues, level, record, 3);
        if (hasText(record.fields[1]) && !isRpNumberLike(record.fields[1])) {
          pushIssue(
            issues,
            level,
            "INVALID_FORMAT",
            `Record ${record.recordNo} rpNumber must be 1-999 but was ${record.fields[1]}.`,
            record,
          );
          break;
        }

        const rpNumber = Number.parseInt(record.fields[1] ?? "", 10);
        if (!Number.isNaN(rpNumber) && rpNumber > 0) {
          const baseSet =
            record.recordNo === JAHIS_TC_RECORD_NO.usageSupplement
              ? currentDispensing.rpWithUsage
              : currentDispensing.rpWithDrug;
          if (!baseSet.has(rpNumber)) {
            pushIssue(
              issues,
              level,
              "MISSING_RP_RECORD",
              `Record ${record.recordNo} references RP ${rpNumber} without required base record.`,
              record,
            );
          }
        }
        break;
      }

      case JAHIS_TC_RECORD_NO.overallCaution:
        currentDispensing = ensureDispensingForRecord(record);
        currentDispensing.hasMedicationContent = true;
        requireField(issues, level, record, 1, "cautionText");
        requireField(issues, level, record, 2, "recordCreator");
        validateRecordCreator(issues, level, record, 2);
        break;

      case JAHIS_TC_RECORD_NO.providedInfo:
        currentDispensing = ensureDispensingForRecord(record);
        requireField(issues, level, record, 1, "providedInfoText");
        requireField(issues, level, record, 2, "providedInfoType");
        requireField(issues, level, record, 3, "recordCreator");
        validateRecordCreator(issues, level, record, 3);

        if (hasNonEmptyText(record.fields[2]) && !PROVIDED_INFO_TYPE_SET.has(record.fields[2])) {
          pushIssue(
            issues,
            level,
            "INVALID_ENUM_VALUE",
            `Record 411 providedInfoType must be one of 30,31,99 but was ${record.fields[2]}.`,
            record,
          );
        }
        break;

      case JAHIS_TC_RECORD_NO.remainingMedicineConfirmation:
        currentDispensing = ensureDispensingForRecord(record);
        requireField(issues, level, record, 1, "remainingMedicineText");
        requireField(issues, level, record, 2, "recordCreator");
        validateRecordCreator(issues, level, record, 2);
        break;

      case JAHIS_TC_RECORD_NO.remark:
        ensureDispensingForRecord(record);
        requireField(issues, level, record, 1, "remarkText");
        requireField(issues, level, record, 2, "recordCreator");
        validateRecordCreator(issues, level, record, 2);
        break;

      case JAHIS_TC_RECORD_NO.patientEntry:
        ensureDispensingForRecord(record);
        requireField(issues, level, record, 1, "patientEntryText");
        validateDateField(issues, level, record, 2, "inputDate");
        break;

      case JAHIS_TC_RECORD_NO.familyPharmacist:
        requireField(issues, level, record, 1, "pharmacistName");
        requireField(issues, level, record, 2, "pharmacyName");
        requireField(issues, level, record, 3, "contact");
        requireField(issues, level, record, 6, "recordCreator");
        validateRecordCreator(issues, level, record, 6);
        validateDateField(issues, level, record, 4, "startDate");
        validateDateField(issues, level, record, 5, "endDate");
        break;

      case JAHIS_TC_RECORD_NO.splitControl:
        requireField(issues, level, record, 1, "dataId");
        requireField(issues, level, record, 2, "totalParts");
        requireField(issues, level, record, 3, "partNumber");
        if (hasText(record.fields[1]) && !isDigits(record.fields[1], 14, 14)) {
          pushIssue(
            issues,
            level,
            "INVALID_FORMAT",
            "Record 911 dataId must be 14 digits.",
            record,
          );
        }
        if (hasText(record.fields[2]) && !isDigits(record.fields[2], 1, 3)) {
          pushIssue(
            issues,
            level,
            "INVALID_FORMAT",
            "Record 911 totalParts must be 1-3 digit number.",
            record,
          );
        }
        if (hasText(record.fields[3]) && !isDigits(record.fields[3], 1, 3)) {
          pushIssue(
            issues,
            level,
            "INVALID_FORMAT",
            "Record 911 partNumber must be 1-3 digit number.",
            record,
          );
        }
        if (isDigits(record.fields[2], 1, 3) && isDigits(record.fields[3], 1, 3)) {
          const total = Number.parseInt(record.fields[2] ?? "0", 10);
          const part = Number.parseInt(record.fields[3] ?? "0", 10);
          if (part > total) {
            pushIssue(
              issues,
              level,
              "INVALID_FORMAT",
              "Record 911 partNumber must be less than or equal to totalParts.",
              record,
            );
          }
        }
        break;

      default:
        if (!record.recordNo.startsWith("JAHISTC")) {
          pushIssue(
            issues,
            level,
            "UNSUPPORTED_RECORD",
            `Record ${record.recordNo} is not defined in JAHIS-TC supported set.`,
            record,
          );
        }
        break;
    }
  }

  if (outputCategory === "1" && dispensingStates.length === 0) {
    pushIssue(
      issues,
      level,
      "REQUIRED_RECORD_MISSING",
      "Output category 1 requires at least one dispensing block (record 5).",
    );
  }

  if (outputCategory === "2" && !hasPatientRecord) {
    pushIssue(
      issues,
      level,
      "REQUIRED_RECORD_MISSING",
      "Output category 2 requires patient record 1.",
    );
  }

  dispensingStates.forEach((state, index) => {
    if (outputCategory === "1" && !state.hasRecord11) {
      pushIssue(
        issues,
        level,
        "REQUIRED_RECORD_MISSING",
        `Dispensing block #${index + 1} is missing record 11.`,
      );
    }

    if (outputCategory === "1" && state.hasMedicationContent && !state.hasRecord51) {
      pushIssue(
        issues,
        level,
        "REQUIRED_RECORD_MISSING",
        `Dispensing block #${index + 1} has medication records but is missing record 51.`,
      );
    }

    state.rpWithDrug.forEach((rpNumber) => {
      if (state.rpWithUsage.has(rpNumber)) {
        return;
      }

      pushIssue(
        issues,
        level,
        "MISSING_RP_RECORD",
        `Dispensing block #${index + 1} RP ${rpNumber} has record 201 but missing record 301.`,
      );
    });

    state.rpWithUsage.forEach((rpNumber) => {
      if (state.rpWithDrug.has(rpNumber)) {
        return;
      }

      pushIssue(
        issues,
        level,
        "MISSING_RP_RECORD",
        `Dispensing block #${index + 1} RP ${rpNumber} has record 301 but missing record 201.`,
      );
    });
  });

  return issues;
};
