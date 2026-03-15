import { RECORD_KIND } from "../constants/record-kind.js";
import type { RawRecord } from "./parse.js";

/**
 * Decoded JAHIS header record (`JAHIS*`).
 */
export interface HeaderRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.header;
  /** Source line number (1-based). */
  line: number;
  /** Header/version token (for example `JAHIS10`). */
  version: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded institution record (record `1`).
 */
export interface InstitutionRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.institution;
  /** Source line number (1-based). */
  line: number;
  /** Institution code type. */
  codeType?: string;
  /** Medical institution code. */
  code?: string;
  /** Institution prefecture code. */
  prefectureCode?: string;
  /** Medical institution display name. */
  name?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded institution address record (record `2`).
 */
export interface InstitutionAddressRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.institutionAddress;
  /** Source line number (1-based). */
  line: number;
  /** Medical institution postal code. */
  postalCode?: string;
  /** Medical institution address text. */
  address?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded institution phone record (record `3`).
 */
export interface InstitutionPhoneRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.institutionPhone;
  /** Source line number (1-based). */
  line: number;
  /** Medical institution phone text. */
  phone?: string;
  /** Medical institution fax text. */
  fax?: string;
  /** Additional contact text. */
  otherContact?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded department record (record `4`).
 */
export interface DepartmentRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.department;
  /** Source line number (1-based). */
  line: number;
  /** Department code type. */
  departmentCodeType?: string;
  /** Department code. */
  departmentCode?: string;
  /** Department text. */
  department?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded prescription date record (record `51`).
 */
export interface PrescriptionDateRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.prescriptionDate;
  /** Source line number (1-based). */
  line: number;
  /** Prescription issuance date in JAHIS format. */
  date?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded doctor record (record `5`).
 */
export interface DoctorRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.doctor;
  /** Source line number (1-based). */
  line: number;
  /** Doctor code. */
  code?: string;
  /** Doctor name in Kana. */
  kanaName?: string;
  /** Doctor name in Kanji. */
  kanjiName?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded patient name record (record `11`).
 */
export interface PatientNameRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.patientName;
  /** Source line number (1-based). */
  line: number;
  /** Patient code. */
  code?: string;
  /** Patient name in Kanji. */
  kanjiName?: string;
  /** Patient name in Kana. */
  kanaName?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded patient sex record (record `12`).
 */
export interface PatientSexRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.patientSex;
  /** Source line number (1-based). */
  line: number;
  /** Sex code value. */
  sexCode?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded patient birth date record (record `13`).
 */
export interface PatientBirthDateRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.patientBirthDate;
  /** Source line number (1-based). */
  line: number;
  /** Birth date in JAHIS format. */
  birthDate?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded patient copay class record (record `14`).
 */
export interface PatientCopayClassRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.patientCopayClass;
  /** Source line number (1-based). */
  line: number;
  /** Copay class code. */
  copayClassCode?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded insurance type record (record `21`).
 */
export interface InsuranceTypeRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.insuranceType;
  /** Source line number (1-based). */
  line: number;
  /** Insurance type code. */
  insuranceTypeCode?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded insurer number record (record `22`).
 */
export interface InsurerNumberRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.insurerNumber;
  /** Source line number (1-based). */
  line: number;
  /** Insurer number. */
  insurerNumber?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded insurance card record (record `23`).
 */
export interface InsuranceCardRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.insuranceCard;
  /** Source line number (1-based). */
  line: number;
  /** Insurance card symbol. */
  cardSymbol?: string;
  /** Insurance card number. */
  cardNumber?: string;
  /** Relationship code (insured/dependent). */
  insuredRelationshipCode?: string;
  /** Insurance card branch number. */
  cardBranchNumber?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded insurance rate record (record `24`).
 */
export interface InsuranceRateRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.insuranceRate;
  /** Source line number (1-based). */
  line: number;
  /** Patient copay rate. */
  patientCopayRate?: string;
  /** Insurance benefit rate. */
  insuranceBenefitRate?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded occupational accident reason record (record `25`).
 */
export interface OccupationalAccidentRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.occupationalAccident;
  /** Source line number (1-based). */
  line: number;
  /** Occupational accident reason code. */
  reasonCode?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded public expense record (records `27`, `28`, `29`).
 */
export interface PublicExpenseRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.publicExpense;
  /** Source line number (1-based). */
  line: number;
  /** Slot index to distinguish first/second/third public expense entry. */
  slot: 1 | 2 | 3;
  /** Public expense payer number. */
  payerNumber?: string;
  /** Public expense recipient number. */
  recipientNumber?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded special public expense record (record `30`).
 */
export interface SpecialPublicExpenseRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.specialPublicExpense;
  /** Source line number (1-based). */
  line: number;
  /** Special public expense payer number. */
  payerNumber?: string;
  /** Special public expense recipient number. */
  recipientNumber?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded receipt type record (record `31`).
 */
export interface ReceiptTypeRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.receiptType;
  /** Source line number (1-based). */
  line: number;
  /** Receipt type code. */
  code?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded dispensing due date record (record `52`).
 */
export interface DispensingDueDateRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.dispensingDueDate;
  /** Source line number (1-based). */
  line: number;
  /** Dispensing due date in JAHIS format. */
  date?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded narcotics handling record (record `61`).
 */
export interface NarcoticsRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.narcotics;
  /** Source line number (1-based). */
  line: number;
  /** Narcotics practitioner license number. */
  licenseNumber?: string;
  /** Patient address for narcotics record. */
  patientAddress?: string;
  /** Patient phone for narcotics record. */
  patientPhone?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded remaining medicine confirmation record (record `62`).
 */
export interface RemainingMedicineRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.remainingMedicine;
  /** Source line number (1-based). */
  line: number;
  /** Remaining medicine confirmation flag. */
  confirmationFlag?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded split dispensing instruction record (record `63`).
 */
export interface SplitDispensingRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.splitDispensing;
  /** Source line number (1-based). */
  line: number;
  /** Total split count. */
  totalCount?: string;
  /** Current split index. */
  currentCount?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded refill instruction record (record `64`).
 */
export interface RefillRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.refill;
  /** Source line number (1-based). */
  line: number;
  /** Total allowed refill use count. */
  totalUseCount?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded note record (record `81`).
 */
export interface NoteRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.note;
  /** Source line number (1-based). */
  line: number;
  /** Note sequence number. */
  sequence?: string;
  /** Note type code. */
  noteType?: string;
  /** Note text payload. */
  text?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded prescription number record (record `82`).
 */
export interface PrescriptionNumberRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.prescriptionNumber;
  /** Source line number (1-based). */
  line: number;
  /** Prescription number type code. */
  numberType?: string;
  /** Prescription number value. */
  number?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded RP base record (record `101`).
 */
export interface RpRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.rp;
  /** Source line number (1-based). */
  line: number;
  /** RP sequence number. */
  rpNumber: number;
  /** Dosage form code. */
  dosageFormCode?: string;
  /** Dosage form name. */
  dosageFormName?: string;
  /** Dispensing quantity. */
  dispensingQuantity?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded RP split dispensing quantity record (record `102`).
 */
export interface RpSplitDispensingQuantityRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.rpSplitDispensingQuantity;
  /** Source line number (1-based). */
  line: number;
  /** RP sequence number this quantity belongs to. */
  rpNumber: number;
  /** Split dispensing quantity assigned to this RP. */
  splitDispensingQuantity?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded RP usage record (record `111`).
 */
export interface UsageRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.usage;
  /** Source line number (1-based). */
  line: number;
  /** RP sequence number this usage belongs to. */
  rpNumber: number;
  /** Usage code. */
  usageCode?: string;
  /** Usage text. */
  usageText?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded usage supplement record (record `181`).
 */
export interface UsageSupplementRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.usageSupplement;
  /** Source line number (1-based). */
  line: number;
  /** RP sequence number this supplement belongs to. */
  rpNumber: number;
  /** Usage supplement code. */
  usageSupplementCode?: string;
  /** Usage supplement text payload. */
  usageSupplementText?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded drug record (record `201`).
 */
export interface DrugRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.drug;
  /** Source line number (1-based). */
  line: number;
  /** RP sequence number this drug belongs to. */
  rpNumber: number;
  /** Drug sequence number within an RP. */
  drugNumber: number;
  /** Drug information class. */
  infoClass?: string;
  /** Drug code type. */
  codeType?: string;
  /** Drug code. */
  code?: string;
  /** Drug display name. */
  name?: string;
  /** Dose amount. */
  amount?: string;
  /** Potency flag. */
  potencyFlag?: string;
  /** Dose unit. */
  unit?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded drug unit conversion record (record `211`).
 */
export interface DrugUnitConversionRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.drugUnitConversion;
  /** Source line number (1-based). */
  line: number;
  /** RP sequence number this conversion belongs to. */
  rpNumber: number;
  /** Drug sequence number this conversion belongs to. */
  drugNumber: number;
  /** Converted amount value. */
  convertedAmount?: string;
  /** Converted unit label. */
  convertedUnit?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded drug uneven dosing record (record `221`).
 */
export interface DrugUnevenDosingRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.drugUnevenDosing;
  /** Source line number (1-based). */
  line: number;
  /** RP sequence number this uneven dosing belongs to. */
  rpNumber: number;
  /** Drug sequence number this uneven dosing belongs to. */
  drugNumber: number;
  /** Uneven dosing first amount. */
  unevenDosingAmount1?: string;
  /** Uneven dosing second amount. */
  unevenDosingAmount2?: string;
  /** Uneven dosing third amount. */
  unevenDosingAmount3?: string;
  /** Uneven dosing fourth amount. */
  unevenDosingAmount4?: string;
  /** Uneven dosing fifth amount. */
  unevenDosingAmount5?: string;
  /** Uneven dosing first code. */
  unevenDosingCode1?: string;
  /** Uneven dosing second code. */
  unevenDosingCode2?: string;
  /** Uneven dosing third code. */
  unevenDosingCode3?: string;
  /** Uneven dosing fourth code. */
  unevenDosingCode4?: string;
  /** Uneven dosing fifth code. */
  unevenDosingCode5?: string;
  /** Uneven dosing code. */
  unevenDosingCode?: string;
  /** Uneven dosing text payload. */
  unevenDosingText?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded burden category by drug record (record `231`).
 */
export interface DrugBurdenCategoryRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.drugBurdenCategory;
  /** Source line number (1-based). */
  line: number;
  /** RP sequence number this burden category belongs to. */
  rpNumber: number;
  /** Drug sequence number this burden category belongs to. */
  drugNumber: number;
  /** First public expense burden code. */
  firstPublicExpenseBurdenCode?: string;
  /** Second public expense burden code. */
  secondPublicExpenseBurdenCode?: string;
  /** Third public expense burden code. */
  thirdPublicExpenseBurdenCode?: string;
  /** Special public expense burden code. */
  specialPublicExpenseBurdenCode?: string;
  /** Burden category code. */
  burdenCategoryCode?: string;
  /** Burden category text payload. */
  burdenCategoryText?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded single-dose amount record (record `241`).
 */
export interface DrugSingleDoseAmountRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.drugSingleDoseAmount;
  /** Source line number (1-based). */
  line: number;
  /** RP sequence number this single-dose amount belongs to. */
  rpNumber: number;
  /** Drug sequence number this single-dose amount belongs to. */
  drugNumber: number;
  /** Single-dose amount value. */
  singleDoseAmount?: string;
  /** Times per day for single-dose amount. */
  timesPerDay?: string;
  /** Single-dose unit label. */
  singleDoseUnit?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded drug supplement record (record `281`).
 */
export interface DrugSupplementRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.drugSupplement;
  /** Source line number (1-based). */
  line: number;
  /** RP sequence number this supplement belongs to. */
  rpNumber: number;
  /** Drug sequence number this supplement belongs to. */
  drugNumber: number;
  /** Drug supplement sequence. */
  supplementSequence?: string;
  /** Drug supplement class. */
  supplementClass?: string;
  /** Drug supplement code. */
  supplementCode?: string;
  /** Drug supplement text payload. */
  supplementText?: string;
  /** Drug supplement usage code. */
  supplementUsageCode?: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Decoded fallback for unsupported records.
 */
export interface UnknownRecord {
  /** Discriminant tag for narrowed union handling. */
  kind: typeof RECORD_KIND.unknown;
  /** Source line number (1-based). */
  line: number;
  /** Unsupported record number token. */
  recordNo: string;
  /** Original raw record for traceability. */
  raw: RawRecord;
}

/**
 * Union of all decoded record variants produced by `decodeRecord`.
 */
export type ParsedRecord =
  | HeaderRecord
  | InstitutionRecord
  | InstitutionAddressRecord
  | InstitutionPhoneRecord
  | DepartmentRecord
  | PrescriptionDateRecord
  | DoctorRecord
  | PatientNameRecord
  | PatientSexRecord
  | PatientBirthDateRecord
  | PatientCopayClassRecord
  | InsuranceTypeRecord
  | InsurerNumberRecord
  | InsuranceCardRecord
  | InsuranceRateRecord
  | OccupationalAccidentRecord
  | PublicExpenseRecord
  | SpecialPublicExpenseRecord
  | ReceiptTypeRecord
  | DispensingDueDateRecord
  | NarcoticsRecord
  | RemainingMedicineRecord
  | SplitDispensingRecord
  | RefillRecord
  | NoteRecord
  | PrescriptionNumberRecord
  | RpRecord
  | RpSplitDispensingQuantityRecord
  | UsageRecord
  | UsageSupplementRecord
  | DrugRecord
  | DrugUnitConversionRecord
  | DrugUnevenDosingRecord
  | DrugBurdenCategoryRecord
  | DrugSingleDoseAmountRecord
  | DrugSupplementRecord
  | UnknownRecord;
