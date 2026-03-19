import type { RawRecord } from "../../jahis-rx/types/parse.js";

interface JahisTcBaseRecord {
  line: number;
  raw: RawRecord;
}

export interface JahisTcHeaderRecord extends JahisTcBaseRecord {
  kind: "tc-header";
  version: string;
  outputCategory?: string | undefined;
}

export interface JahisTcPatientRecord extends JahisTcBaseRecord {
  kind: "tc-patient";
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
  kind: "tc-patient-remark";
  remarkType?: string | undefined;
  text?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcOtcMedicationRecord extends JahisTcBaseRecord {
  kind: "tc-otc-medication";
  name?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcNotebookMemoRecord extends JahisTcBaseRecord {
  kind: "tc-notebook-memo";
  text?: string | undefined;
  inputDate?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcDispensingDateRecord extends JahisTcBaseRecord {
  kind: "tc-dispensing-date";
  date?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcDispensingInstitutionRecord extends JahisTcBaseRecord {
  kind: "tc-dispensing-institution";
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
  kind: "tc-dispensing-staff";
  name?: string | undefined;
  contact?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcPrescribingInstitutionRecord extends JahisTcBaseRecord {
  kind: "tc-prescribing-institution";
  name?: string | undefined;
  prefectureCode?: string | undefined;
  scoreTableCode?: string | undefined;
  institutionCode?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcPrescribingDoctorRecord extends JahisTcBaseRecord {
  kind: "tc-prescribing-doctor";
  name?: string | undefined;
  departmentName?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcDrugRecord extends JahisTcBaseRecord {
  kind: "tc-drug";
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
    | "tc-drug-supplement"
    | "tc-drug-caution"
    | "tc-usage-supplement"
    | "tc-prescription-caution";
  rpNumber: number;
  text?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcUsageRecord extends JahisTcBaseRecord {
  kind: "tc-usage";
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
  kind: "tc-overall-caution";
  text?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcRemarkRecord extends JahisTcBaseRecord {
  kind: "tc-remark";
  text?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcProvidedInfoRecord extends JahisTcBaseRecord {
  kind: "tc-provided-info";
  text?: string | undefined;
  infoType?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcPatientEntryRecord extends JahisTcBaseRecord {
  kind: "tc-patient-entry";
  text?: string | undefined;
  inputDate?: string | undefined;
}

export interface JahisTcFamilyPharmacistRecord extends JahisTcBaseRecord {
  kind: "tc-family-pharmacist";
  name?: string | undefined;
  pharmacyName?: string | undefined;
  contact?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  recordCreator?: string | undefined;
}

export interface JahisTcSplitControlRecord extends JahisTcBaseRecord {
  kind: "tc-split-control";
  dataId?: string | undefined;
  totalParts?: string | undefined;
  partNumber?: string | undefined;
}

export interface JahisTcUnknownRecord extends JahisTcBaseRecord {
  kind: "tc-unknown";
  recordNo: string;
}

export type JahisTcRecord =
  | JahisTcHeaderRecord
  | JahisTcPatientRecord
  | JahisTcPatientRemarkRecord
  | JahisTcOtcMedicationRecord
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
  | JahisTcPatientEntryRecord
  | JahisTcFamilyPharmacistRecord
  | JahisTcSplitControlRecord
  | JahisTcUnknownRecord;
