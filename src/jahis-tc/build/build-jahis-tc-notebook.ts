import type {
  JahisTcDispensing,
  JahisTcMedicationNotebook,
  JahisTcPrescription,
  JahisTcRp,
} from "../types/jahis-tc-normalized.js";
import type { JahisTcRecord } from "../types/jahis-tc-records.js";

export const buildJahisTcNotebook = (
  records: JahisTcRecord[],
  preserveUnknownRecords: boolean,
): JahisTcMedicationNotebook => {
  const notebook: JahisTcMedicationNotebook = {
    version: null,
    dispensings: [],
  };

  let currentDispensing: JahisTcDispensing | undefined;
  let currentPrescription: JahisTcPrescription | undefined;
  const rpMap = new Map<number, JahisTcRp>();

  const ensureDispensing = (): JahisTcDispensing => {
    if (currentDispensing) {
      return currentDispensing;
    }

    currentDispensing = { prescriptions: [] };
    notebook.dispensings.push(currentDispensing);
    currentPrescription = undefined;
    rpMap.clear();
    return currentDispensing;
  };

  const ensurePrescription = (): JahisTcPrescription => {
    const dispensing = ensureDispensing();
    if (currentPrescription) {
      return currentPrescription;
    }

    currentPrescription = { rps: [] };
    dispensing.prescriptions.push(currentPrescription);
    rpMap.clear();
    return currentPrescription;
  };

  const ensureRp = (rpNumber: number): JahisTcRp => {
    const prescription = ensurePrescription();
    const existingRp = rpMap.get(rpNumber);
    if (existingRp) {
      return existingRp;
    }

    const createdRp: JahisTcRp = {
      rpNumber,
      drugs: [],
    };
    prescription.rps.push(createdRp);
    rpMap.set(rpNumber, createdRp);
    return createdRp;
  };

  for (const record of records) {
    switch (record.kind) {
      case "tc-header":
        notebook.version = record.version;
        notebook.outputCategory = record.outputCategory;
        break;

      case "tc-patient":
        notebook.patient = {
          name: record.name,
          sexCode: record.sexCode,
          birthDate: record.birthDate,
          postalCode: record.postalCode,
          address: record.address,
          phone: record.phone,
          emergencyContact: record.emergencyContact,
          bloodType: record.bloodType,
          weight: record.weight,
          kanaName: record.kanaName,
        };
        break;

      case "tc-patient-remark":
        notebook.patientRemarks ??= [];
        notebook.patientRemarks.push({
          remarkType: record.remarkType,
          text: record.text,
          recordCreator: record.recordCreator,
        });
        break;

      case "tc-otc-medication":
        notebook.otcMedications ??= [];
        notebook.otcMedications.push({
          name: record.name,
          startDate: record.startDate,
          endDate: record.endDate,
          recordCreator: record.recordCreator,
        });
        break;

      case "tc-notebook-memo":
        notebook.notebookMemos ??= [];
        notebook.notebookMemos.push({
          text: record.text,
          inputDate: record.inputDate,
          recordCreator: record.recordCreator,
        });
        break;

      case "tc-dispensing-date":
        {
          const createdDispensing: JahisTcDispensing = {
            date: record.date,
            recordCreator: record.recordCreator,
            prescriptions: [],
          };
          currentDispensing = createdDispensing;
          notebook.dispensings.push(createdDispensing);
        }
        currentPrescription = undefined;
        rpMap.clear();
        break;

      case "tc-dispensing-institution": {
        const dispensing = ensureDispensing();
        dispensing.institution = {
          name: record.name,
          prefectureCode: record.prefectureCode,
          scoreTableCode: record.scoreTableCode,
          institutionCode: record.institutionCode,
          postalCode: record.postalCode,
          address: record.address,
          phone: record.phone,
          recordCreator: record.recordCreator,
        };
        break;
      }

      case "tc-dispensing-staff": {
        const dispensing = ensureDispensing();
        dispensing.staff = {
          name: record.name,
          contact: record.contact,
          recordCreator: record.recordCreator,
        };
        break;
      }

      case "tc-prescribing-institution": {
        const createdPrescription: JahisTcPrescription = {
          prescribingInstitution: {
            name: record.name,
            prefectureCode: record.prefectureCode,
            scoreTableCode: record.scoreTableCode,
            institutionCode: record.institutionCode,
            recordCreator: record.recordCreator,
          },
          rps: [],
        };
        currentPrescription = createdPrescription;

        ensureDispensing().prescriptions.push(createdPrescription);
        rpMap.clear();
        break;
      }

      case "tc-prescribing-doctor": {
        const prescription = ensurePrescription();
        prescription.prescribingDoctors ??= [];
        prescription.prescribingDoctors.push({
          name: record.name,
          departmentName: record.departmentName,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case "tc-drug": {
        const rp = ensureRp(record.rpNumber);
        rp.drugs.push({
          name: record.name,
          amount: record.amount,
          unitName: record.unitName,
          drugCodeType: record.drugCodeType,
          drugCode: record.drugCode,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case "tc-drug-supplement": {
        const rp = ensureRp(record.rpNumber);
        rp.drugSupplements ??= [];
        rp.drugSupplements.push({
          text: record.text,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case "tc-drug-caution": {
        const rp = ensureRp(record.rpNumber);
        rp.drugCautions ??= [];
        rp.drugCautions.push({
          text: record.text,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case "tc-usage": {
        const rp = ensureRp(record.rpNumber);
        rp.usageName = record.usageName;
        rp.dispensingQuantity = record.dispensingQuantity;
        rp.dispensingUnit = record.dispensingUnit;
        rp.dosageFormCode = record.dosageFormCode;
        rp.usageCodeType = record.usageCodeType;
        rp.usageCode = record.usageCode;
        rp.usageRecordCreator = record.recordCreator;
        break;
      }

      case "tc-usage-supplement": {
        const rp = ensureRp(record.rpNumber);
        rp.usageSupplements ??= [];
        rp.usageSupplements.push({
          text: record.text,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case "tc-prescription-caution": {
        const rp = ensureRp(record.rpNumber);
        rp.prescriptionCautions ??= [];
        rp.prescriptionCautions.push({
          text: record.text,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case "tc-overall-caution": {
        const dispensing = ensureDispensing();
        dispensing.overallCautions ??= [];
        dispensing.overallCautions.push({
          text: record.text,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case "tc-provided-info": {
        const dispensing = ensureDispensing();
        dispensing.providedInfos ??= [];
        dispensing.providedInfos.push({
          text: record.text,
          infoType: record.infoType,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case "tc-remark": {
        const dispensing = ensureDispensing();
        dispensing.remarks ??= [];
        dispensing.remarks.push({
          text: record.text,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case "tc-patient-entry": {
        const dispensing = ensureDispensing();
        dispensing.patientEntries ??= [];
        dispensing.patientEntries.push({
          text: record.text,
          inputDate: record.inputDate,
        });
        break;
      }

      case "tc-family-pharmacist":
        notebook.familyPharmacist = {
          name: record.name,
          pharmacyName: record.pharmacyName,
          contact: record.contact,
          startDate: record.startDate,
          endDate: record.endDate,
          recordCreator: record.recordCreator,
        };
        break;

      case "tc-split-control":
        notebook.splitControl = {
          dataId: record.dataId,
          totalParts: record.totalParts,
          partNumber: record.partNumber,
        };
        break;

      case "tc-unknown":
        if (preserveUnknownRecords) {
          notebook.unknownRecords ??= [];
          notebook.unknownRecords.push({
            line: record.line,
            recordNo: record.recordNo,
            fields: record.raw.fields,
            raw: record.raw.raw,
          });
        }
        break;
    }
  }

  return notebook;
};
