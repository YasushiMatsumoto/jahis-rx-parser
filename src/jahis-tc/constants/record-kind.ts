/**
 * Canonical discriminant values for decoded TC record kinds.
 */
export const RECORD_KIND = {
  header: "tc-header",
  patient: "tc-patient",
  patientRemark: "tc-patient-remark",
  otcMedication: "tc-otc-medication",
  otcMedicationIngredient: "tc-otc-medication-ingredient",
  notebookMemo: "tc-notebook-memo",
  dispensingDate: "tc-dispensing-date",
  dispensingInstitution: "tc-dispensing-institution",
  dispensingStaff: "tc-dispensing-staff",
  prescribingInstitution: "tc-prescribing-institution",
  prescribingDoctor: "tc-prescribing-doctor",
  drug: "tc-drug",
  drugSupplement: "tc-drug-supplement",
  drugCaution: "tc-drug-caution",
  usage: "tc-usage",
  usageSupplement: "tc-usage-supplement",
  prescriptionCaution: "tc-prescription-caution",
  overallCaution: "tc-overall-caution",
  providedInfo: "tc-provided-info",
  remainingMedicineConfirmation: "tc-remaining-medicine-confirmation",
  remark: "tc-remark",
  patientEntry: "tc-patient-entry",
  familyPharmacist: "tc-family-pharmacist",
  splitControl: "tc-split-control",
  unknown: "tc-unknown",
} as const;

export type RecordKind = (typeof RECORD_KIND)[keyof typeof RECORD_KIND];
