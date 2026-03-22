import { PROPERTY_KEY, RECORD_KIND, RECORD_NO } from "../constants/index.js";
import type {
  DepartmentRecord,
  DispensingDueDateRecord,
  DoctorRecord,
  DrugBurdenCategoryRecord,
  DrugRecord,
  DrugSingleDoseAmountRecord,
  DrugSupplementRecord,
  DrugUnevenDosingRecord,
  DrugUnitConversionRecord,
  HeaderRecord,
  InstitutionAddressRecord,
  InstitutionPhoneRecord,
  InstitutionRecord,
  InsuranceCardRecord,
  InsuranceRateRecord,
  InsuranceTypeRecord,
  InsurerNumberRecord,
  NarcoticsRecord,
  NoteRecord,
  OccupationalAccidentRecord,
  ParsedRecord,
  PatientBirthDateRecord,
  PatientCopayClassRecord,
  PatientNameRecord,
  PatientSexRecord,
  PrescriptionDateRecord,
  PrescriptionNumberRecord,
  PublicExpenseRecord,
  ReceiptTypeRecord,
  RefillRecord,
  RemainingMedicineRecord,
  RpRecord,
  RpSplitDispensingQuantityRecord,
  SpecialPublicExpenseRecord,
  SplitDispensingRecord,
  UnknownRecord,
  UsageRecord,
  UsageSupplementRecord,
} from "../types/decoded-records.js";
import type { RawRecord } from "../types/parse.js";

/**
 * Parses a base-10 integer value and returns `undefined` on invalid input.
 *
 * @param value Candidate numeric string.
 * @returns Parsed integer or `undefined`.
 */
const toInt = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

/**
 * Returns a field value by index only when that index exists.
 *
 * @param fields Tokenized field list.
 * @param index Field index to read.
 * @returns Field value or `undefined` when out of range.
 */
const readField = (fields: string[], index: number): string | undefined => {
  return index < fields.length ? fields[index] : undefined;
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

/**
 * Assigns an optional string property only when the value exists.
 *
 * This avoids writing explicit `undefined` under `exactOptionalPropertyTypes`.
 *
 * @param target Target object to mutate.
 * @param key Property key to assign.
 * @param value Optional value to assign.
 */
const withOptionalString = <T extends object, K extends Extract<keyof T, string>>(
  target: T & Partial<Record<K, string>>,
  key: K,
  value: (T & Partial<Record<K, string>>)[K],
): void => {
  if (value !== undefined) {
    target[key] = value;
  }
};

/**
 * Decodes one tokenized raw record into a discriminated `ParsedRecord` shape.
 *
 * @param raw Tokenized raw record.
 * @returns Decoded record object matching the record number.
 */
export const decodeRecord = (raw: RawRecord): ParsedRecord => {
  // The first token can be a JAHIS version marker and not a numeric record code.
  if (raw.recordNo.startsWith("JAHIS")) {
    const header: HeaderRecord = {
      kind: RECORD_KIND.header,
      line: raw.line,
      version: raw.recordNo,
      raw,
    };

    return header;
  }

  switch (raw.recordNo) {
    case RECORD_NO.institution: {
      const hasSpecLayout = raw.fields.length >= 5;
      const record: InstitutionRecord = {
        kind: RECORD_KIND.institution,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.codeType, hasSpecLayout ? raw.fields[1] : undefined);
      withOptionalString(record, PROPERTY_KEY.code, hasSpecLayout ? raw.fields[2] : raw.fields[1]);
      withOptionalString(
        record,
        PROPERTY_KEY.prefectureCode,
        hasSpecLayout ? raw.fields[3] : undefined,
      );
      withOptionalString(record, PROPERTY_KEY.name, hasSpecLayout ? raw.fields[4] : raw.fields[2]);

      return record;
    }

    case RECORD_NO.institutionAddress: {
      const hasSpecLayout = raw.fields.length >= 3;
      const record: InstitutionAddressRecord = {
        kind: RECORD_KIND.institutionAddress,
        line: raw.line,
        raw,
      };

      withOptionalString(
        record,
        PROPERTY_KEY.postalCode,
        hasSpecLayout ? raw.fields[1] : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.address,
        hasSpecLayout ? raw.fields[2] : raw.fields[1],
      );

      return record;
    }

    case RECORD_NO.institutionPhone: {
      const record: InstitutionPhoneRecord = {
        kind: RECORD_KIND.institutionPhone,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.phone, raw.fields[1]);
      withOptionalString(record, PROPERTY_KEY.fax, raw.fields[2]);
      withOptionalString(record, PROPERTY_KEY.otherContact, raw.fields[3]);

      return record;
    }

    case RECORD_NO.department: {
      const hasSpecLayout = raw.fields.length >= 4;
      const record: DepartmentRecord = {
        kind: RECORD_KIND.department,
        line: raw.line,
        raw,
      };

      withOptionalString(
        record,
        PROPERTY_KEY.departmentCodeType,
        hasSpecLayout ? raw.fields[1] : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.departmentCode,
        hasSpecLayout ? raw.fields[2] : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.department,
        hasSpecLayout ? raw.fields[3] : raw.fields[1],
      );

      return record;
    }

    case RECORD_NO.prescriptionDate: {
      const record: PrescriptionDateRecord = {
        kind: RECORD_KIND.prescriptionDate,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.date, raw.fields[1]);

      return record;
    }

    case RECORD_NO.doctor: {
      const record: DoctorRecord = {
        kind: RECORD_KIND.doctor,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.code, raw.fields[1]);
      withOptionalString(record, PROPERTY_KEY.kanaName, raw.fields[2]);
      withOptionalString(record, PROPERTY_KEY.kanjiName, raw.fields[3]);

      return record;
    }

    case RECORD_NO.patientName: {
      const record: PatientNameRecord = {
        kind: RECORD_KIND.patientName,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.code, raw.fields[1]);
      withOptionalString(record, PROPERTY_KEY.kanjiName, raw.fields[2]);
      withOptionalString(record, PROPERTY_KEY.kanaName, raw.fields[3]);

      return record;
    }

    case RECORD_NO.patientSex: {
      const record: PatientSexRecord = {
        kind: RECORD_KIND.patientSex,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.sexCode, raw.fields[1]);

      return record;
    }

    case RECORD_NO.patientBirthDate: {
      const record: PatientBirthDateRecord = {
        kind: RECORD_KIND.patientBirthDate,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.birthDate, raw.fields[1]);

      return record;
    }

    case RECORD_NO.patientCopayClass: {
      const record: PatientCopayClassRecord = {
        kind: RECORD_KIND.patientCopayClass,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.copayClassCode, raw.fields[1]);

      return record;
    }

    case RECORD_NO.insuranceType: {
      const record: InsuranceTypeRecord = {
        kind: RECORD_KIND.insuranceType,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.insuranceTypeCode, raw.fields[1]);

      return record;
    }

    case RECORD_NO.insurerNumber: {
      const record: InsurerNumberRecord = {
        kind: RECORD_KIND.insurerNumber,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.insurerNumber, raw.fields[1]);

      return record;
    }

    case RECORD_NO.insuranceCard: {
      const record: InsuranceCardRecord = {
        kind: RECORD_KIND.insuranceCard,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.cardSymbol, raw.fields[1]);
      withOptionalString(record, PROPERTY_KEY.cardNumber, raw.fields[2]);
      withOptionalString(record, PROPERTY_KEY.insuredRelationshipCode, raw.fields[3]);
      withOptionalString(record, PROPERTY_KEY.cardBranchNumber, raw.fields[4]);

      return record;
    }

    case RECORD_NO.insuranceRate: {
      const record: InsuranceRateRecord = {
        kind: RECORD_KIND.insuranceRate,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.patientCopayRate, raw.fields[1]);
      withOptionalString(record, PROPERTY_KEY.insuranceBenefitRate, raw.fields[2]);

      return record;
    }

    case RECORD_NO.occupationalAccident: {
      const record: OccupationalAccidentRecord = {
        kind: RECORD_KIND.occupationalAccident,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.reasonCode, raw.fields[1]);

      return record;
    }

    case RECORD_NO.publicExpense1: {
      const record: PublicExpenseRecord = {
        kind: RECORD_KIND.publicExpense,
        line: raw.line,
        slot: 1,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.payerNumber, raw.fields[1]);
      withOptionalString(record, PROPERTY_KEY.recipientNumber, raw.fields[2]);

      return record;
    }

    case RECORD_NO.publicExpense2: {
      const record: PublicExpenseRecord = {
        kind: RECORD_KIND.publicExpense,
        line: raw.line,
        slot: 2,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.payerNumber, raw.fields[1]);
      withOptionalString(record, PROPERTY_KEY.recipientNumber, raw.fields[2]);

      return record;
    }

    case RECORD_NO.publicExpense3: {
      const record: PublicExpenseRecord = {
        kind: RECORD_KIND.publicExpense,
        line: raw.line,
        slot: 3,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.payerNumber, raw.fields[1]);
      withOptionalString(record, PROPERTY_KEY.recipientNumber, raw.fields[2]);

      return record;
    }

    case RECORD_NO.specialPublicExpense: {
      const record: SpecialPublicExpenseRecord = {
        kind: RECORD_KIND.specialPublicExpense,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.payerNumber, raw.fields[1]);
      withOptionalString(record, PROPERTY_KEY.recipientNumber, raw.fields[2]);

      return record;
    }

    case RECORD_NO.receiptType: {
      const record: ReceiptTypeRecord = {
        kind: RECORD_KIND.receiptType,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.code, raw.fields[1]);

      return record;
    }

    case RECORD_NO.dispensingDueDate: {
      const record: DispensingDueDateRecord = {
        kind: RECORD_KIND.dispensingDueDate,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.date, raw.fields[1]);

      return record;
    }

    case RECORD_NO.narcotics: {
      const record: NarcoticsRecord = {
        kind: RECORD_KIND.narcotics,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.licenseNumber, raw.fields[1]);
      withOptionalString(record, PROPERTY_KEY.patientAddress, raw.fields[2]);
      withOptionalString(record, PROPERTY_KEY.patientPhone, raw.fields[3]);

      return record;
    }

    case RECORD_NO.remainingMedicine: {
      const record: RemainingMedicineRecord = {
        kind: RECORD_KIND.remainingMedicine,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.confirmationFlag, raw.fields[1]);

      return record;
    }

    case RECORD_NO.splitDispensing: {
      const record: SplitDispensingRecord = {
        kind: RECORD_KIND.splitDispensing,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.totalCount, raw.fields[1]);
      withOptionalString(record, PROPERTY_KEY.currentCount, raw.fields[2]);

      return record;
    }

    case RECORD_NO.refill: {
      const record: RefillRecord = {
        kind: RECORD_KIND.refill,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.totalUseCount, raw.fields[1]);

      return record;
    }

    case RECORD_NO.note: {
      const record: NoteRecord = {
        kind: RECORD_KIND.note,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.sequence, raw.fields[1]);
      withOptionalString(record, PROPERTY_KEY.noteType, raw.fields[2]);
      withOptionalString(record, PROPERTY_KEY.text, raw.fields[3]);

      return record;
    }

    case RECORD_NO.prescriptionNumber: {
      const record: PrescriptionNumberRecord = {
        kind: RECORD_KIND.prescriptionNumber,
        line: raw.line,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.numberType, raw.fields[1]);
      withOptionalString(record, PROPERTY_KEY.number, raw.fields[2]);

      return record;
    }

    case RECORD_NO.rp: {
      // Some payloads include an extra quantity-like column before dosage name.
      const dosageFormNameIndex = raw.fields.length >= 5 ? 4 : 3;
      const record: RpRecord = {
        kind: RECORD_KIND.rp,
        line: raw.line,
        rpNumber: toInt(raw.fields[1]) ?? 0,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.dosageFormCode, raw.fields[2]);
      withOptionalString(
        record,
        PROPERTY_KEY.dosageFormName,
        readField(raw.fields, dosageFormNameIndex),
      );
      withOptionalString(record, PROPERTY_KEY.dispensingQuantity, readField(raw.fields, 4));

      return record;
    }

    case RECORD_NO.rpSplitDispensingQuantity: {
      const record: RpSplitDispensingQuantityRecord = {
        kind: RECORD_KIND.rpSplitDispensingQuantity,
        line: raw.line,
        rpNumber: toInt(raw.fields[1]) ?? 0,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.splitDispensingQuantity, raw.fields[2]);

      return record;
    }

    case RECORD_NO.usage: {
      // Some payloads include an extra usage sequence column before usage code/text.
      const usageCodeIndex = raw.fields.length >= 5 ? 3 : 2;
      const usageTextIndex = raw.fields.length >= 5 ? 4 : 3;
      const record: UsageRecord = {
        kind: RECORD_KIND.usage,
        line: raw.line,
        rpNumber: toInt(raw.fields[1]) ?? 0,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.usageCode, readField(raw.fields, usageCodeIndex));
      withOptionalString(record, PROPERTY_KEY.usageText, readField(raw.fields, usageTextIndex));

      return record;
    }

    case RECORD_NO.usageSupplement: {
      // Some payloads include an extra sequence/type column before code/text.
      const usageSupplementCodeIndex = raw.fields.length >= 5 ? 3 : 2;
      const usageSupplementTextIndex = raw.fields.length >= 5 ? 4 : 3;
      const record: UsageSupplementRecord = {
        kind: RECORD_KIND.usageSupplement,
        line: raw.line,
        rpNumber: toInt(raw.fields[1]) ?? 0,
        raw,
      };

      withOptionalString(
        record,
        PROPERTY_KEY.usageSupplementCode,
        readField(raw.fields, usageSupplementCodeIndex),
      );
      withOptionalString(
        record,
        PROPERTY_KEY.usageSupplementText,
        readField(raw.fields, usageSupplementTextIndex),
      );

      return record;
    }

    case RECORD_NO.drug: {
      // Supports both legacy compact layouts and spec-aligned layouts:
      // - compact: 201,rp,drug,codeType,code,name,amount,unit
      // - spec:    201,rp,drug,infoClass,codeType,code,name,amount,potencyFlag,unit
      const hasInfoClassAndCodeType =
        raw.fields.length >= 10 &&
        isDrugInfoClass(readField(raw.fields, 3)) &&
        isDrugCodeType(readField(raw.fields, 4));

      const hasCodeTypeOnly = raw.fields.length >= 8 && isDrugCodeType(readField(raw.fields, 3));

      const drugCodeIndex = hasInfoClassAndCodeType ? 5 : hasCodeTypeOnly ? 4 : 3;
      const drugNameIndex = drugCodeIndex + 1;
      const drugAmountIndex = drugCodeIndex + 2;
      const maybePotencyFlagIndex = drugAmountIndex + 1;
      const hasPotencyFlag =
        isPotencyFlag(readField(raw.fields, maybePotencyFlagIndex)) &&
        readField(raw.fields, maybePotencyFlagIndex + 1) !== undefined;
      const drugUnitIndex = hasPotencyFlag ? maybePotencyFlagIndex + 1 : maybePotencyFlagIndex;

      const record: DrugRecord = {
        kind: RECORD_KIND.drug,
        line: raw.line,
        rpNumber: toInt(raw.fields[1]) ?? 0,
        drugNumber: toInt(raw.fields[2]) ?? 0,
        raw,
      };

      withOptionalString(record, PROPERTY_KEY.code, readField(raw.fields, drugCodeIndex));
      withOptionalString(
        record,
        PROPERTY_KEY.codeType,
        readField(raw.fields, hasInfoClassAndCodeType ? 4 : 3),
      );
      withOptionalString(
        record,
        PROPERTY_KEY.infoClass,
        hasInfoClassAndCodeType ? readField(raw.fields, 3) : undefined,
      );
      withOptionalString(record, PROPERTY_KEY.name, readField(raw.fields, drugNameIndex));
      withOptionalString(record, PROPERTY_KEY.amount, readField(raw.fields, drugAmountIndex));
      withOptionalString(
        record,
        PROPERTY_KEY.potencyFlag,
        hasPotencyFlag ? readField(raw.fields, maybePotencyFlagIndex) : undefined,
      );
      withOptionalString(record, PROPERTY_KEY.unit, readField(raw.fields, drugUnitIndex));

      return record;
    }

    case RECORD_NO.drugUnitConversion: {
      // Some payloads include an extra conversion-type column before amount/unit.
      const convertedAmountIndex = raw.fields.length >= 6 ? 4 : 3;
      const convertedUnitIndex = raw.fields.length >= 6 ? 5 : 4;
      const record: DrugUnitConversionRecord = {
        kind: RECORD_KIND.drugUnitConversion,
        line: raw.line,
        rpNumber: toInt(raw.fields[1]) ?? 0,
        drugNumber: toInt(raw.fields[2]) ?? 0,
        raw,
      };

      withOptionalString(
        record,
        PROPERTY_KEY.convertedAmount,
        readField(raw.fields, convertedAmountIndex),
      );
      withOptionalString(
        record,
        PROPERTY_KEY.convertedUnit,
        readField(raw.fields, convertedUnitIndex),
      );

      return record;
    }

    case RECORD_NO.drugUnevenDosing: {
      // Some payloads include an extra uneven-dosing type column before code/text.
      const unevenDosingCodeIndex = raw.fields.length >= 6 ? 4 : 3;
      const unevenDosingTextIndex = raw.fields.length >= 6 ? 5 : 4;
      const record: DrugUnevenDosingRecord = {
        kind: RECORD_KIND.drugUnevenDosing,
        line: raw.line,
        rpNumber: toInt(raw.fields[1]) ?? 0,
        drugNumber: toInt(raw.fields[2]) ?? 0,
        raw,
      };

      const hasSpecLayout = raw.fields.length >= 8;
      withOptionalString(
        record,
        PROPERTY_KEY.unevenDosingCode,
        readField(raw.fields, unevenDosingCodeIndex),
      );
      withOptionalString(
        record,
        PROPERTY_KEY.unevenDosingText,
        readField(raw.fields, unevenDosingTextIndex),
      );
      withOptionalString(
        record,
        PROPERTY_KEY.unevenDosingAmount1,
        hasSpecLayout ? readField(raw.fields, 3) : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.unevenDosingAmount2,
        hasSpecLayout ? readField(raw.fields, 4) : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.unevenDosingAmount3,
        hasSpecLayout ? readField(raw.fields, 5) : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.unevenDosingAmount4,
        hasSpecLayout ? readField(raw.fields, 6) : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.unevenDosingAmount5,
        hasSpecLayout ? readField(raw.fields, 7) : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.unevenDosingCode1,
        hasSpecLayout ? readField(raw.fields, 8) : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.unevenDosingCode2,
        hasSpecLayout ? readField(raw.fields, 9) : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.unevenDosingCode3,
        hasSpecLayout ? readField(raw.fields, 10) : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.unevenDosingCode4,
        hasSpecLayout ? readField(raw.fields, 11) : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.unevenDosingCode5,
        hasSpecLayout ? readField(raw.fields, 12) : undefined,
      );

      return record;
    }

    case RECORD_NO.drugBurdenCategory: {
      // Some payloads include an extra burden-type column before code/text.
      const burdenCategoryCodeIndex = raw.fields.length >= 6 ? 4 : 3;
      const burdenCategoryTextIndex = raw.fields.length >= 6 ? 5 : 4;
      const record: DrugBurdenCategoryRecord = {
        kind: RECORD_KIND.drugBurdenCategory,
        line: raw.line,
        rpNumber: toInt(raw.fields[1]) ?? 0,
        drugNumber: toInt(raw.fields[2]) ?? 0,
        raw,
      };

      const hasSpecLayout = raw.fields.length >= 7;
      withOptionalString(
        record,
        PROPERTY_KEY.burdenCategoryCode,
        readField(raw.fields, burdenCategoryCodeIndex),
      );
      withOptionalString(
        record,
        PROPERTY_KEY.burdenCategoryText,
        readField(raw.fields, burdenCategoryTextIndex),
      );
      withOptionalString(
        record,
        PROPERTY_KEY.firstPublicExpenseBurdenCode,
        hasSpecLayout ? readField(raw.fields, 3) : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.secondPublicExpenseBurdenCode,
        hasSpecLayout ? readField(raw.fields, 4) : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.thirdPublicExpenseBurdenCode,
        hasSpecLayout ? readField(raw.fields, 5) : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.specialPublicExpenseBurdenCode,
        hasSpecLayout ? readField(raw.fields, 6) : undefined,
      );

      return record;
    }

    case RECORD_NO.drugSingleDoseAmount: {
      const timesPerDayCandidate = readField(raw.fields, 4);
      const hasTimesPerDay = Boolean(
        raw.fields.length === 5 && timesPerDayCandidate && /^\d{1,2}$/.test(timesPerDayCandidate),
      );
      // Some payloads include an extra single-dose type column before amount/unit.
      const singleDoseAmountIndex = raw.fields.length >= 6 ? 4 : 3;
      const singleDoseUnitIndex = raw.fields.length >= 6 ? 5 : 4;
      const record: DrugSingleDoseAmountRecord = {
        kind: RECORD_KIND.drugSingleDoseAmount,
        line: raw.line,
        rpNumber: toInt(raw.fields[1]) ?? 0,
        drugNumber: toInt(raw.fields[2]) ?? 0,
        raw,
      };

      withOptionalString(
        record,
        PROPERTY_KEY.singleDoseAmount,
        readField(raw.fields, singleDoseAmountIndex),
      );
      withOptionalString(
        record,
        PROPERTY_KEY.timesPerDay,
        hasTimesPerDay ? timesPerDayCandidate : undefined,
      );
      withOptionalString(
        record,
        PROPERTY_KEY.singleDoseUnit,
        hasTimesPerDay ? undefined : readField(raw.fields, singleDoseUnitIndex),
      );

      return record;
    }

    case RECORD_NO.drugSupplement: {
      // Some payloads include an extra supplement-type column before text payload.
      const supplementCodeIndex = raw.fields.length >= 6 ? 4 : 3;
      const supplementTextIndex = raw.fields.length >= 6 ? 5 : 4;
      const record: DrugSupplementRecord = {
        kind: RECORD_KIND.drugSupplement,
        line: raw.line,
        rpNumber: toInt(raw.fields[1]) ?? 0,
        drugNumber: toInt(raw.fields[2]) ?? 0,
        raw,
      };

      withOptionalString(
        record,
        PROPERTY_KEY.supplementCode,
        readField(raw.fields, supplementCodeIndex),
      );
      withOptionalString(
        record,
        PROPERTY_KEY.supplementText,
        readField(raw.fields, supplementTextIndex),
      );
      withOptionalString(record, PROPERTY_KEY.supplementSequence, readField(raw.fields, 3));
      withOptionalString(record, PROPERTY_KEY.supplementClass, readField(raw.fields, 4));
      withOptionalString(record, PROPERTY_KEY.supplementUsageCode, readField(raw.fields, 6));

      return record;
    }

    default: {
      // Unknown records are preserved so callers can inspect unsupported payloads.
      const record: UnknownRecord = {
        kind: RECORD_KIND.unknown,
        line: raw.line,
        recordNo: raw.recordNo,
        raw,
      };

      return record;
    }
  }
};
