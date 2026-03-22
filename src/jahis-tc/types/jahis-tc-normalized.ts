export interface JahisTcUnknownRecord {
  line: number;
  recordNo: string;
  fields: string[];
  raw: string;
}

export interface JahisTcPatient {
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

export interface JahisTcRp {
  rpNumber: number;
  usageName?: string | undefined;
  dispensingQuantity?: string | undefined;
  dispensingUnit?: string | undefined;
  dosageFormCode?: string | undefined;
  usageCodeType?: string | undefined;
  usageCode?: string | undefined;
  usageRecordCreator?: string | undefined;
  drugs: Array<{
    name?: string | undefined;
    amount?: string | undefined;
    unitName?: string | undefined;
    drugCodeType?: string | undefined;
    drugCode?: string | undefined;
    recordCreator?: string | undefined;
  }>;
  drugSupplements?: Array<{
    text?: string | undefined;
    recordCreator?: string | undefined;
  }>;
  drugCautions?: Array<{
    text?: string | undefined;
    recordCreator?: string | undefined;
  }>;
  usageSupplements?: Array<{
    text?: string | undefined;
    recordCreator?: string | undefined;
  }>;
  prescriptionCautions?: Array<{
    text?: string | undefined;
    recordCreator?: string | undefined;
  }>;
}

export interface JahisTcPrescription {
  prescribingInstitution?: {
    name?: string | undefined;
    prefectureCode?: string | undefined;
    scoreTableCode?: string | undefined;
    institutionCode?: string | undefined;
    recordCreator?: string | undefined;
  };
  prescribingDoctors?: Array<{
    name?: string | undefined;
    departmentName?: string | undefined;
    recordCreator?: string | undefined;
  }>;
  rps: JahisTcRp[];
}

export interface JahisTcDispensing {
  date?: string | undefined;
  recordCreator?: string | undefined;
  institution?: {
    name?: string | undefined;
    prefectureCode?: string | undefined;
    scoreTableCode?: string | undefined;
    institutionCode?: string | undefined;
    postalCode?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    recordCreator?: string | undefined;
  };
  staff?: {
    name?: string | undefined;
    contact?: string | undefined;
    recordCreator?: string | undefined;
  };
  prescriptions: JahisTcPrescription[];
  overallCautions?: Array<{
    text?: string | undefined;
    recordCreator?: string | undefined;
  }>;
  providedInfos?: Array<{
    text?: string | undefined;
    infoType?: string | undefined;
    recordCreator?: string | undefined;
  }>;
  remainingMedicineConfirmations?: Array<{
    text?: string | undefined;
    recordCreator?: string | undefined;
  }>;
  remarks?: Array<{
    text?: string | undefined;
    recordCreator?: string | undefined;
  }>;
  patientEntries?: Array<{
    text?: string | undefined;
    inputDate?: string | undefined;
  }>;
}

export interface JahisTcMedicationNotebook {
  version: string | null;
  outputCategory?: string | undefined;
  patient?: JahisTcPatient;
  patientRemarks?: Array<{
    remarkType?: string | undefined;
    text?: string | undefined;
    recordCreator?: string | undefined;
  }>;
  otcMedications?: Array<{
    name?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    recordCreator?: string | undefined;
    sequence?: string | undefined;
    janCode?: string | undefined;
    ingredients?: Array<{
      name?: string | undefined;
      codeType?: string | undefined;
      code?: string | undefined;
      recordCreator?: string | undefined;
    }>;
  }>;
  notebookMemos?: Array<{
    text?: string | undefined;
    inputDate?: string | undefined;
    recordCreator?: string | undefined;
  }>;
  dispensings: JahisTcDispensing[];
  familyPharmacist?: {
    name?: string | undefined;
    pharmacyName?: string | undefined;
    contact?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    recordCreator?: string | undefined;
  };
  splitControl?: {
    dataId?: string | undefined;
    totalParts?: string | undefined;
    partNumber?: string | undefined;
  };
  unknownRecords?: JahisTcUnknownRecord[];
}
