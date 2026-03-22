import type { RawRecord } from "../../shared/types/parse.js";
import { RECORD_KIND } from "../constants/record-kind.js";

interface JahisTcBaseRecord {
  line: number;
  raw: RawRecord;
}

export interface JahisTcHeaderRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.header;
  version: string;
  outputCategory?: string | undefined;
}

export interface JahisTcPatientRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.patient;
  name?: string | undefined;
  sexCode?: string | undefined;
  birthDate?: string | undefined;
  postalCode?: string | undefined;
  address?: string | undefined;
  phone?: string | undefined;
  emergencyContact?: string | undefined;
  bloodType?: string | undefined;
  weight?: string | undefined;
  kanaName?: string | undefined;
}

export interface JahisTcPatientRemarkRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.patientRemark;
  remarkType?: string | undefined;
  text?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcOtcMedicationRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.otcMedication;
  name?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  recordCreator?: string | undefined;
  sequence?: string | undefined;
  janCode?: string | undefined;
}

export interface JahisTcOtcMedicationIngredientRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.otcMedicationIngredient;
  otcMedicationSequence?: string | undefined;
  ingredientName?: string | undefined;
  ingredientCodeType?: string | undefined;
  ingredientCode?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcNotebookMemoRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.notebookMemo;
  text?: string | undefined;
  inputDate?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcDispensingDateRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.dispensingDate;
  date?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcDispensingInstitutionRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.dispensingInstitution;
  name?: string | undefined;
  prefectureCode?: string | undefined;
  scoreTableCode?: string | undefined;
  institutionCode?: string | undefined;
  postalCode?: string | undefined;
  address?: string | undefined;
  phone?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcDispensingStaffRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.dispensingStaff;
  name?: string | undefined;
  contact?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcPrescribingInstitutionRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.prescribingInstitution;
  name?: string | undefined;
  prefectureCode?: string | undefined;
  scoreTableCode?: string | undefined;
  institutionCode?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcPrescribingDoctorRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.prescribingDoctor;
  name?: string | undefined;
  departmentName?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcDrugRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.drug;
  rpNumber: number;
  name?: string | undefined;
  amount?: string | undefined;
  unitName?: string | undefined;
  drugCodeType?: string | undefined;
  drugCode?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcRpTextRecord extends JahisTcBaseRecord {
  kind:
    | typeof RECORD_KIND.drugSupplement
    | typeof RECORD_KIND.drugCaution
    | typeof RECORD_KIND.usageSupplement
    | typeof RECORD_KIND.prescriptionCaution;
  rpNumber: number;
  text?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcUsageRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.usage;
  rpNumber: number;
  usageName?: string | undefined;
  dispensingQuantity?: string | undefined;
  dispensingUnit?: string | undefined;
  dosageFormCode?: string | undefined;
  usageCodeType?: string | undefined;
  usageCode?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcOverallCautionRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.overallCaution;
  text?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcRemarkRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.remark;
  text?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcProvidedInfoRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.providedInfo;
  text?: string | undefined;
  infoType?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcRemainingMedicineConfirmationRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.remainingMedicineConfirmation;
  text?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcPatientEntryRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.patientEntry;
  text?: string | undefined;
  inputDate?: string | undefined;
}

export interface JahisTcFamilyPharmacistRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.familyPharmacist;
  name?: string | undefined;
  pharmacyName?: string | undefined;
  contact?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcSplitControlRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.splitControl;
  dataId?: string | undefined;
  totalParts?: string | undefined;
  partNumber?: string | undefined;
}

export interface JahisTcUnknownRecord extends JahisTcBaseRecord {
  kind: typeof RECORD_KIND.unknown;
  recordNo: string;
}

export type JahisTcRecord =
  | JahisTcHeaderRecord
  | JahisTcPatientRecord
  | JahisTcPatientRemarkRecord
  | JahisTcOtcMedicationRecord
  | JahisTcOtcMedicationIngredientRecord
  | JahisTcNotebookMemoRecord
  | JahisTcDispensingDateRecord
  | JahisTcDispensingInstitutionRecord
  | JahisTcDispensingStaffRecord
  | JahisTcPrescribingInstitutionRecord
  | JahisTcPrescribingDoctorRecord
  | JahisTcDrugRecord
  | JahisTcRpTextRecord
  | JahisTcUsageRecord
  | JahisTcOverallCautionRecord
  | JahisTcRemarkRecord
  | JahisTcProvidedInfoRecord
  | JahisTcRemainingMedicineConfirmationRecord
  | JahisTcPatientEntryRecord
  | JahisTcFamilyPharmacistRecord
  | JahisTcSplitControlRecord
  | JahisTcUnknownRecord;
