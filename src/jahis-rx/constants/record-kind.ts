/**
 * Canonical discriminant values for decoded record kinds.
 *
 * These values are used as stable tags in `ParsedRecord` discriminated unions.
 */
export const RECORD_KIND = {
  header: "header",
  institution: "institution",
  institutionAddress: "institutionAddress",
  institutionPhone: "institutionPhone",
  department: "department",
  prescriptionDate: "prescriptionDate",
  doctor: "doctor",
  patientName: "patientName",
  patientSex: "patientSex",
  patientBirthDate: "patientBirthDate",
  patientCopayClass: "patientCopayClass",
  insuranceType: "insuranceType",
  insurerNumber: "insurerNumber",
  insuranceCard: "insuranceCard",
  insuranceRate: "insuranceRate",
  occupationalAccident: "occupationalAccident",
  publicExpense: "publicExpense",
  specialPublicExpense: "specialPublicExpense",
  receiptType: "receiptType",
  dispensingDueDate: "dispensingDueDate",
  narcotics: "narcotics",
  remainingMedicine: "remainingMedicine",
  splitDispensing: "splitDispensing",
  refill: "refill",
  note: "note",
  prescriptionNumber: "prescriptionNumber",
  rp: "rp",
  rpSplitDispensingQuantity: "rpSplitDispensingQuantity",
  usage: "usage",
  usageSupplement: "usageSupplement",
  drug: "drug",
  drugUnitConversion: "drugUnitConversion",
  drugUnevenDosing: "drugUnevenDosing",
  drugBurdenCategory: "drugBurdenCategory",
  drugSingleDoseAmount: "drugSingleDoseAmount",
  drugSupplement: "drugSupplement",
  unknown: "unknown",
} as const;

/**
 * Union of all supported decoded record kind tags.
 */
export type RecordKind = (typeof RECORD_KIND)[keyof typeof RECORD_KIND];
