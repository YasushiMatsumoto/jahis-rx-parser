import type { RawRecord } from "../../jahis-rx/types/parse.js";
import { JAHIS_TC_RECORD_NO } from "../constants/jahis-tc-record-no.js";
import type {
  JahisTcDispensingDateRecord,
  JahisTcDispensingInstitutionRecord,
  JahisTcDispensingStaffRecord,
  JahisTcDrugRecord,
  JahisTcFamilyPharmacistRecord,
  JahisTcNotebookMemoRecord,
  JahisTcOtcMedicationRecord,
  JahisTcOverallCautionRecord,
  JahisTcPatientEntryRecord,
  JahisTcPatientRecord,
  JahisTcPatientRemarkRecord,
  JahisTcPrescribingDoctorRecord,
  JahisTcPrescribingInstitutionRecord,
  JahisTcProvidedInfoRecord,
  JahisTcRecord,
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
      kind: "tc-header",
      line: raw.line,
      version: raw.recordNo,
      outputCategory: raw.fields[1],
      raw,
    };
  }

  switch (raw.recordNo) {
    case JAHIS_TC_RECORD_NO.patient: {
      const record: JahisTcPatientRecord = {
        kind: "tc-patient",
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
        kind: "tc-patient-remark",
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
        kind: "tc-otc-medication",
        line: raw.line,
        raw,
        name: raw.fields[1],
        startDate: raw.fields[2],
        endDate: raw.fields[3],
        recordCreator: raw.fields[4],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.notebookMemo: {
      const record: JahisTcNotebookMemoRecord = {
        kind: "tc-notebook-memo",
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
        kind: "tc-dispensing-date",
        line: raw.line,
        raw,
        date: raw.fields[1],
        recordCreator: raw.fields[2],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.dispensingInstitution: {
      const record: JahisTcDispensingInstitutionRecord = {
        kind: "tc-dispensing-institution",
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
        kind: "tc-dispensing-staff",
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
        kind: "tc-prescribing-institution",
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
        kind: "tc-prescribing-doctor",
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
        kind: "tc-drug",
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
        [JAHIS_TC_RECORD_NO.drugSupplement]: "tc-drug-supplement",
        [JAHIS_TC_RECORD_NO.drugCaution]: "tc-drug-caution",
        [JAHIS_TC_RECORD_NO.usageSupplement]: "tc-usage-supplement",
        [JAHIS_TC_RECORD_NO.prescriptionCaution]: "tc-prescription-caution",
      };
      const kind = kindByRecordNo[raw.recordNo] ?? "tc-drug-supplement";

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
        kind: "tc-usage",
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
        kind: "tc-overall-caution",
        line: raw.line,
        raw,
        text: raw.fields[1],
        recordCreator: raw.fields[2],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.remark: {
      const record: JahisTcRemarkRecord = {
        kind: "tc-remark",
        line: raw.line,
        raw,
        text: raw.fields[1],
        recordCreator: raw.fields[2],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.providedInfo: {
      const record: JahisTcProvidedInfoRecord = {
        kind: "tc-provided-info",
        line: raw.line,
        raw,
        text: raw.fields[1],
        infoType: raw.fields[2],
        recordCreator: raw.fields[3],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.patientEntry: {
      const record: JahisTcPatientEntryRecord = {
        kind: "tc-patient-entry",
        line: raw.line,
        raw,
        text: raw.fields[1],
        inputDate: raw.fields[2],
      };

      return record;
    }

    case JAHIS_TC_RECORD_NO.familyPharmacist: {
      const record: JahisTcFamilyPharmacistRecord = {
        kind: "tc-family-pharmacist",
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
        kind: "tc-split-control",
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
        kind: "tc-unknown",
        line: raw.line,
        recordNo: raw.recordNo,
        raw,
      };

      return record;
    }
  }
};
