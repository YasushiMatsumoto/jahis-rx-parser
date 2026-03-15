/**
 * Canonical record number tokens used by JAHIS text records.
 *
 * Use these constants when checking record numbers in application code to avoid
 * hard-coded string literals.
 */
export const RECORD_NO = {
  institution: "1",
  institutionAddress: "2",
  institutionPhone: "3",
  department: "4",
  doctor: "5",
  patientName: "11",
  patientSex: "12",
  patientBirthDate: "13",
  patientCopayClass: "14",
  insuranceType: "21",
  insurerNumber: "22",
  insuranceCard: "23",
  insuranceRate: "24",
  occupationalAccident: "25",
  publicExpense1: "27",
  publicExpense2: "28",
  publicExpense3: "29",
  specialPublicExpense: "30",
  receiptType: "31",
  prescriptionDate: "51",
  dispensingDueDate: "52",
  narcotics: "61",
  remainingMedicine: "62",
  splitDispensing: "63",
  refill: "64",
  note: "81",
  prescriptionNumber: "82",
  rp: "101",
  rpSplitDispensingQuantity: "102",
  usage: "111",
  usageSupplement: "181",
  drug: "201",
  drugUnitConversion: "211",
  drugUnevenDosing: "221",
  drugBurdenCategory: "231",
  drugSingleDoseAmount: "241",
  drugSupplement: "281",
} as const;

/**
 * Union of all record number tokens handled by this parser.
 */
export type RecordNo = (typeof RECORD_NO)[keyof typeof RECORD_NO];
