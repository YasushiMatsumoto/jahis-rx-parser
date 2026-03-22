import type { RawRecord } from "../../shared/types/parse.js";
import { JAHIS_TC_RECORD_NO, RECORD_KIND } from "../constants/index.js";
import type {
  JahisTcDispensingDateRecord,
  JahisTcDispensingInstitutionRecord,
  JahisTcDispensingStaffRecord,
  JahisTcDrugRecord,
  JahisTcFamilyPharmacistRecord,
  JahisTcNotebookMemoRecord,
  JahisTcOtcMedicationIngredientRecord,
  JahisTcOtcMedicationRecord,
  JahisTcOverallCautionRecord,
  JahisTcPatientEntryRecord,
  JahisTcPatientRecord,
  JahisTcPatientRemarkRecord,
  JahisTcPrescribingDoctorRecord,
  JahisTcPrescribingInstitutionRecord,
  JahisTcProvidedInfoRecord,
  JahisTcRecord,
  JahisTcRemainingMedicineConfirmationRecord,
  JahisTcRemarkRecord,
  JahisTcRpTextRecord,
  JahisTcSplitControlRecord,
  JahisTcUnknownRecord,
  JahisTcUsageRecord,
} from "../types/jahis-tc-records.js";

const toInt = (value: string | undefined): number => {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const decodeJahisTcRecord = (raw: RawRecord): JahisTcRecord => {
  if (raw.recordNo.startsWith("JAHISTC")) {
    return {
      kind: RECORD_KIND.header,
      line: raw.line,
      version: raw.recordNo,
      outputCategory: raw.fields[1],
      raw,
    };
  }

  switch (raw.recordNo) {
    case JAHIS_TC_RECORD_NO.patient: {
      const record: JahisTcPatientRecord = {
        kind: RECORD_KIND.patient,
        line: raw.line,
        raw,
        name: raw.fields[1],
        sexCode: raw.fields[2],
        birthDate: raw.fields[3],
        postalCode: raw.fields[4],
        address: raw.fields[5],
        phone: raw.fields[6],
        emergencyContact: raw.fields[7],
        bloodType: raw.fields[8],
        weight: raw.fields[9],
        kanaName: raw.fields[10],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.patientRemark: {
      const record: JahisTcPatientRemarkRecord = {
        kind: RECORD_KIND.patientRemark,
        line: raw.line,
        raw,
        remarkType: raw.fields[1],
        text: raw.fields[2],
        recordCreator: raw.fields[3],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.otcMedication: {
      const record: JahisTcOtcMedicationRecord = {
        kind: RECORD_KIND.otcMedication,
        line: raw.line,
        raw,
        name: raw.fields[1],
        startDate: raw.fields[2],
        endDate: raw.fields[3],
        recordCreator: raw.fields[4],
        sequence: raw.fields[5],
        janCode: raw.fields[6],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.otcMedicationIngredient: {
      const record: JahisTcOtcMedicationIngredientRecord = {
        kind: RECORD_KIND.otcMedicationIngredient,
        line: raw.line,
        raw,
        otcMedicationSequence: raw.fields[1],
        ingredientName: raw.fields[2],
        ingredientCodeType: raw.fields[3],
        ingredientCode: raw.fields[4],
        recordCreator: raw.fields[5],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.notebookMemo: {
      const record: JahisTcNotebookMemoRecord = {
        kind: RECORD_KIND.notebookMemo,
        line: raw.line,
        raw,
        text: raw.fields[1],
        inputDate: raw.fields[2],
        recordCreator: raw.fields[3],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.dispensingDate: {
      const record: JahisTcDispensingDateRecord = {
        kind: RECORD_KIND.dispensingDate,
        line: raw.line,
        raw,
        date: raw.fields[1],
        recordCreator: raw.fields[2],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.dispensingInstitution: {
      const record: JahisTcDispensingInstitutionRecord = {
        kind: RECORD_KIND.dispensingInstitution,
        line: raw.line,
        raw,
        name: raw.fields[1],
        prefectureCode: raw.fields[2],
        scoreTableCode: raw.fields[3],
        institutionCode: raw.fields[4],
        postalCode: raw.fields[5],
        address: raw.fields[6],
        phone: raw.fields[7],
        recordCreator: raw.fields[8],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.dispensingStaff: {
      const record: JahisTcDispensingStaffRecord = {
        kind: RECORD_KIND.dispensingStaff,
        line: raw.line,
        raw,
        name: raw.fields[1],
        contact: raw.fields[2],
        recordCreator: raw.fields[3],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.prescribingInstitution: {
      const record: JahisTcPrescribingInstitutionRecord = {
        kind: RECORD_KIND.prescribingInstitution,
        line: raw.line,
        raw,
        name: raw.fields[1],
        prefectureCode: raw.fields[2],
        scoreTableCode: raw.fields[3],
        institutionCode: raw.fields[4],
        recordCreator: raw.fields[5],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.prescribingDoctor: {
      const record: JahisTcPrescribingDoctorRecord = {
        kind: RECORD_KIND.prescribingDoctor,
        line: raw.line,
        raw,
        name: raw.fields[1],
        departmentName: raw.fields[2],
        recordCreator: raw.fields[3],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.drug: {
      const record: JahisTcDrugRecord = {
        kind: RECORD_KIND.drug,
        line: raw.line,
        raw,
        rpNumber: toInt(raw.fields[1]),
        name: raw.fields[2],
        amount: raw.fields[3],
        unitName: raw.fields[4],
        drugCodeType: raw.fields[5],
        drugCode: raw.fields[6],
        recordCreator: raw.fields[7],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.drugSupplement:
    case JAHIS_TC_RECORD_NO.drugCaution:
    case JAHIS_TC_RECORD_NO.usageSupplement:
    case JAHIS_TC_RECORD_NO.prescriptionCaution: {
      const kindByRecordNo: Record<string, JahisTcRpTextRecord["kind"]> = {
        [JAHIS_TC_RECORD_NO.drugSupplement]: RECORD_KIND.drugSupplement,
        [JAHIS_TC_RECORD_NO.drugCaution]: RECORD_KIND.drugCaution,
        [JAHIS_TC_RECORD_NO.usageSupplement]: RECORD_KIND.usageSupplement,
        [JAHIS_TC_RECORD_NO.prescriptionCaution]: RECORD_KIND.prescriptionCaution,
      };
      const kind = kindByRecordNo[raw.recordNo] ?? RECORD_KIND.drugSupplement;

      const record: JahisTcRpTextRecord = {
        kind,
        line: raw.line,
        raw,
        rpNumber: toInt(raw.fields[1]),
        text: raw.fields[2],
        recordCreator: raw.fields[3],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.usage: {
      const record: JahisTcUsageRecord = {
        kind: RECORD_KIND.usage,
        line: raw.line,
        raw,
        rpNumber: toInt(raw.fields[1]),
        usageName: raw.fields[2],
        dispensingQuantity: raw.fields[3],
        dispensingUnit: raw.fields[4],
        dosageFormCode: raw.fields[5],
        usageCodeType: raw.fields[6],
        usageCode: raw.fields[7],
        recordCreator: raw.fields[8],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.overallCaution: {
      const record: JahisTcOverallCautionRecord = {
        kind: RECORD_KIND.overallCaution,
        line: raw.line,
        raw,
        text: raw.fields[1],
        recordCreator: raw.fields[2],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.remark: {
      const record: JahisTcRemarkRecord = {
        kind: RECORD_KIND.remark,
        line: raw.line,
        raw,
        text: raw.fields[1],
        recordCreator: raw.fields[2],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.providedInfo: {
      const record: JahisTcProvidedInfoRecord = {
        kind: RECORD_KIND.providedInfo,
        line: raw.line,
        raw,
        text: raw.fields[1],
        infoType: raw.fields[2],
        recordCreator: raw.fields[3],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.remainingMedicineConfirmation: {
      const record: JahisTcRemainingMedicineConfirmationRecord = {
        kind: RECORD_KIND.remainingMedicineConfirmation,
        line: raw.line,
        raw,
        text: raw.fields[1],
        recordCreator: raw.fields[2],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.patientEntry: {
      const record: JahisTcPatientEntryRecord = {
        kind: RECORD_KIND.patientEntry,
        line: raw.line,
        raw,
        text: raw.fields[1],
        inputDate: raw.fields[2],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.familyPharmacist: {
      const record: JahisTcFamilyPharmacistRecord = {
        kind: RECORD_KIND.familyPharmacist,
        line: raw.line,
        raw,
        name: raw.fields[1],
        pharmacyName: raw.fields[2],
        contact: raw.fields[3],
        startDate: raw.fields[4],
        endDate: raw.fields[5],
        recordCreator: raw.fields[6],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.splitControl: {
      const record: JahisTcSplitControlRecord = {
        kind: RECORD_KIND.splitControl,
        line: raw.line,
        raw,
        dataId: raw.fields[1],
        totalParts: raw.fields[2],
        partNumber: raw.fields[3],
      };

      return record;
    }

    default: {
      const record: JahisTcUnknownRecord = {
        kind: RECORD_KIND.unknown,
        line: raw.line,
        recordNo: raw.recordNo,
        raw,
      };

      return record;
    }
  }
};
