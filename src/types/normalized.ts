/**
 * Unsupported record preserved in normalized output for inspection.
 */
export interface UnknownNormalizedRecord {
  /** Source line number (1-based). */
  line: number;
  /** Original record number token. */
  recordNo: string;
  /** Comma-split field values. */
  fields: string[];
  /** Original raw line text. */
  raw: string;
}

/**
 * Normalized patient information.
 */
export interface JAHISPatient {
  /** Patient code from record 11. */
  code?: string;
  /** Patient name in Kanji. */
  kanjiName?: string;
  /** Patient name in Kana. */
  kanaName?: string;
  /** Sex code from record 12. */
  sexCode?: string;
  /** Birth date in JAHIS date format from record 13. */
  birthDate?: string;
  /** Copay class code from record 14. */
  copayClassCode?: string;
}

/**
 * Normalized doctor information.
 */
export interface JAHISDoctor {
  /** Doctor code from record 5. */
  code?: string;
  /** Doctor name in Kana. */
  kanaName?: string;
  /** Doctor name in Kanji. */
  kanjiName?: string;
}

/**
 * Normalized insurance and public-expense information.
 */
export interface JAHISInsurance {
  /** Insurance type code from record 21. */
  insuranceTypeCode?: string;
  /** Insurer number from record 22. */
  insurerNumber?: string;
  /** Insurance card symbol from record 23. */
  cardSymbol?: string;
  /** Insurance card number from record 23. */
  cardNumber?: string;
  /** Insured/dependent relationship code from record 23. */
  insuredRelationshipCode?: string;
  /** Insurance card branch number from record 23. */
  cardBranchNumber?: string;
  /** Patient copay rate from record 24. */
  patientCopayRate?: string;
  /** Insurance benefit rate from record 24. */
  insuranceBenefitRate?: string;
  /** Occupational accident reason code from record 25. */
  occupationalAccidentReasonCode?: string;
  /** Public expense details grouped by slot. */
  publicExpense?: {
    /** First public expense slot from record 27. */
    first?: {
      /** Public expense payer number. */
      payerNumber?: string;
      /** Public expense recipient number. */
      recipientNumber?: string;
    };
    /** Second public expense slot from record 28. */
    second?: {
      /** Public expense payer number. */
      payerNumber?: string;
      /** Public expense recipient number. */
      recipientNumber?: string;
    };
    /** Third public expense slot from record 29. */
    third?: {
      /** Public expense payer number. */
      payerNumber?: string;
      /** Public expense recipient number. */
      recipientNumber?: string;
    };
    /** Special public expense slot from record 30. */
    special?: {
      /** Special public expense payer number. */
      payerNumber?: string;
      /** Special public expense recipient number. */
      recipientNumber?: string;
    };
  };
  /** Receipt type code from record 31. */
  receiptTypeCode?: string;
}

/**
 * Normalized drug information under an RP group.
 */
export interface JAHISDrug {
  /** Drug sequence number within an RP. */
  drugNumber: number;
  /** Drug information class from record 201. */
  infoClass?: string;
  /** Drug code type from record 201. */
  codeType?: string;
  /** Drug code from record 201. */
  code?: string;
  /** Drug name from record 201. */
  name?: string;
  /** Dose amount from record 201. */
  amount?: string;
  /** Potency flag from record 201. */
  potencyFlag?: string;
  /** Dose unit from record 201. */
  unit?: string;
  /** Unit conversion entries from record 211. */
  unitConversions?: Array<{
    /** Converted amount from record 211. */
    convertedAmount?: string;
    /** Converted unit from record 211. */
    convertedUnit?: string;
  }>;
  /** Uneven dosing entries from record 221. */
  unevenDosings?: Array<{
    /** Uneven dosing first amount from record 221. */
    unevenDosingAmount1?: string;
    /** Uneven dosing second amount from record 221. */
    unevenDosingAmount2?: string;
    /** Uneven dosing third amount from record 221. */
    unevenDosingAmount3?: string;
    /** Uneven dosing fourth amount from record 221. */
    unevenDosingAmount4?: string;
    /** Uneven dosing fifth amount from record 221. */
    unevenDosingAmount5?: string;
    /** Uneven dosing first code from record 221. */
    unevenDosingCode1?: string;
    /** Uneven dosing second code from record 221. */
    unevenDosingCode2?: string;
    /** Uneven dosing third code from record 221. */
    unevenDosingCode3?: string;
    /** Uneven dosing fourth code from record 221. */
    unevenDosingCode4?: string;
    /** Uneven dosing fifth code from record 221. */
    unevenDosingCode5?: string;
    /** Uneven dosing code from record 221. */
    unevenDosingCode?: string;
    /** Uneven dosing text from record 221. */
    unevenDosingText?: string;
  }>;
  /** Burden category entries from record 231. */
  burdenCategories?: Array<{
    /** First public expense burden code from record 231. */
    firstPublicExpenseBurdenCode?: string;
    /** Second public expense burden code from record 231. */
    secondPublicExpenseBurdenCode?: string;
    /** Third public expense burden code from record 231. */
    thirdPublicExpenseBurdenCode?: string;
    /** Special public expense burden code from record 231. */
    specialPublicExpenseBurdenCode?: string;
    /** Burden category code from record 231. */
    burdenCategoryCode?: string;
    /** Burden category text from record 231. */
    burdenCategoryText?: string;
  }>;
  /** Single-dose amount entries from record 241. */
  singleDoseAmounts?: Array<{
    /** Single-dose amount from record 241. */
    singleDoseAmount?: string;
    /** Times per day from record 241. */
    timesPerDay?: string;
    /** Single-dose unit from record 241. */
    singleDoseUnit?: string;
  }>;
  /** Supplement entries from record 281. */
  supplements?: Array<{
    /** Supplement sequence from record 281. */
    supplementSequence?: string;
    /** Supplement class from record 281. */
    supplementClass?: string;
    /** Supplement code from record 281. */
    supplementCode?: string;
    /** Supplement text from record 281. */
    supplementText?: string;
    /** Supplement usage code from record 281. */
    supplementUsageCode?: string;
  }>;
}

/**
 * Normalized RP (prescription group) information.
 */
export interface JAHISRp {
  /** RP sequence number. */
  rpNumber: number;
  /** Dosage form code from record 101. */
  dosageFormCode?: string;
  /** Dosage form name from record 101. */
  dosageFormName?: string;
  /** Dispensing quantity from record 101. */
  dispensingQuantity?: string;
  /** Split dispensing quantity from record 102. */
  splitDispensingQuantity?: string;
  /** Usage code from record 111. */
  usageCode?: string;
  /** Usage text from record 111. */
  usageText?: string;
  /** Usage supplement entries from record 181. */
  usageSupplements?: Array<{
    /** Usage supplement code from record 181. */
    usageSupplementCode?: string;
    /** Usage supplement text from record 181. */
    usageSupplementText?: string;
  }>;
  /** Drugs that belong to this RP group. */
  drugs: JAHISDrug[];
}

/**
 * Top-level normalized prescription output.
 *
 * This is the main application-facing payload returned as `result.data.normalized`.
 */
export interface JAHISPrescription {
  /** JAHIS header/version token from the first line. */
  version: string | null;
  /** Medical institution information from record 1. */
  institution?: {
    /** Medical institution code type from record 1. */
    codeType?: string;
    /** Medical institution code. */
    code?: string;
    /** Medical institution prefecture code from record 1. */
    prefectureCode?: string;
    /** Medical institution display name. */
    name?: string;
    /** Medical institution postal code from record 2. */
    postalCode?: string;
    /** Medical institution address from record 2. */
    address?: string;
    /** Medical institution phone from record 3. */
    phone?: string;
    /** Medical institution fax from record 3. */
    fax?: string;
    /** Other contact from record 3. */
    otherContact?: string;
    /** Department code type from record 4. */
    departmentCodeType?: string;
    /** Department code from record 4. */
    departmentCode?: string;
    /** Department text from record 4. */
    department?: string;
  };
  /** Doctor information from record 5. */
  doctor?: JAHISDoctor;
  /** Patient information from records 11/12/13/14. */
  patient?: JAHISPatient;
  /** Insurance/public-expense information from records 21-31. */
  insurance?: JAHISInsurance;
  /** Prescription date from record 51. */
  prescriptionDate?: string;
  /** Dispensing due date from record 52. */
  dispensingDueDate?: string;
  /** Narcotics information from record 61. */
  narcotics?: {
    /** Narcotics practitioner license number. */
    licenseNumber?: string;
    /** Patient address for narcotics handling. */
    patientAddress?: string;
    /** Patient phone for narcotics handling. */
    patientPhone?: string;
  };
  /** Remaining medicine confirmation flag from record 62. */
  remainingMedicineConfirmationFlag?: string;
  /** Split-dispensing settings from record 63. */
  splitDispensing?: {
    /** Total split count. */
    totalCount?: string;
    /** Current split index. */
    currentCount?: string;
  };
  /** Refill settings from record 64. */
  refill?: {
    /** Total number of allowed refill uses. */
    totalUseCount?: string;
  };
  /** Note entries from record 81. */
  notes?: Array<{
    /** Note sequence number. */
    sequence?: string;
    /** Note type code. */
    noteType?: string;
    /** Note free text. */
    text?: string;
  }>;
  /** Prescription number payload from record 82. */
  prescriptionNumber?: {
    /** Prescription number type code. */
    numberType?: string;
    /** Prescription number value. */
    number?: string;
  };
  /** Prescription groups (RP blocks). */
  rps: JAHISRp[];
  /** Unsupported records preserved when `preserveUnknownRecords` is enabled. */
  unknownRecords?: UnknownNormalizedRecord[];
}
