import { RECORD_KIND } from "../constants/record-kind.js";
import type {
  JahisTcDispensing,
  JahisTcMedicationNotebook,
  JahisTcPrescription,
  JahisTcRp,
} from "../types/jahis-tc-normalized.js";
import type {
  JahisTcOtcMedicationIngredientRecord,
  JahisTcOtcMedicationRecord,
  JahisTcRecord,
  JahisTcRemainingMedicineConfirmationRecord,
} from "../types/jahis-tc-records.js";

type JahisTcOtcMedication = NonNullable<JahisTcMedicationNotebook["otcMedications"]>[number];
type JahisTcOtcIngredient = NonNullable<JahisTcOtcMedication["ingredients"]>[number];
type JahisTcRemainingMedicineConfirmation = NonNullable<
  JahisTcDispensing["remainingMedicineConfirmations"]
>[number];

const createOtcMedication = (record: JahisTcOtcMedicationRecord): JahisTcOtcMedication => {
  return {
    name: record.name,
    startDate: record.startDate,
    endDate: record.endDate,
    recordCreator: record.recordCreator,
    sequence: record.sequence,
    janCode: record.janCode,
  };
};

const getOtcIngredientSequence = (record: JahisTcOtcMedicationIngredientRecord): string => {
  return record.otcMedicationSequence ?? "";
};

const createOtcIngredient = (
  record: JahisTcOtcMedicationIngredientRecord,
): JahisTcOtcIngredient => {
  return {
    name: record.ingredientName,
    codeType: record.ingredientCodeType,
    code: record.ingredientCode,
    recordCreator: record.recordCreator,
  };
};

const createRemainingMedicineConfirmation = (
  record: JahisTcRemainingMedicineConfirmationRecord,
): JahisTcRemainingMedicineConfirmation => {
  return {
    text: record.text,
    recordCreator: record.recordCreator,
  };
};

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
  const otcMedicationMap = new Map<string, JahisTcOtcMedication>();

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
      case RECORD_KIND.header:
        notebook.version = record.version;
        notebook.outputCategory = record.outputCategory;
        break;

      case RECORD_KIND.patient:
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

      case RECORD_KIND.patientRemark:
        notebook.patientRemarks ??= [];
        notebook.patientRemarks.push({
          remarkType: record.remarkType,
          text: record.text,
          recordCreator: record.recordCreator,
        });
        break;

      case RECORD_KIND.otcMedication: {
        notebook.otcMedications ??= [];
        const medication = createOtcMedication(record);
        notebook.otcMedications.push(medication);
        if (medication.sequence) {
          otcMedicationMap.set(medication.sequence, medication);
        }
        break;
      }

      case RECORD_KIND.otcMedicationIngredient: {
        notebook.otcMedications ??= [];
        const sequence = getOtcIngredientSequence(record);
        let medication = otcMedicationMap.get(sequence);

        if (!medication) {
          medication = {
            sequence: record.otcMedicationSequence,
          };
          notebook.otcMedications.push(medication);
          if (sequence) {
            otcMedicationMap.set(sequence, medication);
          }
        }

        const ingredients = medication.ingredients ?? [];
        medication.ingredients = ingredients;
        ingredients.push(createOtcIngredient(record));
        break;
      }

      case RECORD_KIND.notebookMemo:
        notebook.notebookMemos ??= [];
        notebook.notebookMemos.push({
          text: record.text,
          inputDate: record.inputDate,
          recordCreator: record.recordCreator,
        });
        break;

      case RECORD_KIND.dispensingDate: {
        const createdDispensing: JahisTcDispensing = {
          date: record.date,
          recordCreator: record.recordCreator,
          prescriptions: [],
        };
        currentDispensing = createdDispensing;
        notebook.dispensings.push(createdDispensing);
        currentPrescription = undefined;
        rpMap.clear();
        break;
      }

      case RECORD_KIND.dispensingInstitution: {
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

      case RECORD_KIND.dispensingStaff: {
        const dispensing = ensureDispensing();
        dispensing.staff = {
          name: record.name,
          contact: record.contact,
          recordCreator: record.recordCreator,
        };
        break;
      }

      case RECORD_KIND.prescribingInstitution: {
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

      case RECORD_KIND.prescribingDoctor: {
        const prescription = ensurePrescription();
        prescription.prescribingDoctors ??= [];
        prescription.prescribingDoctors.push({
          name: record.name,
          departmentName: record.departmentName,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case RECORD_KIND.drug: {
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

      case RECORD_KIND.drugSupplement: {
        const rp = ensureRp(record.rpNumber);
        rp.drugSupplements ??= [];
        rp.drugSupplements.push({
          text: record.text,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case RECORD_KIND.drugCaution: {
        const rp = ensureRp(record.rpNumber);
        rp.drugCautions ??= [];
        rp.drugCautions.push({
          text: record.text,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case RECORD_KIND.usage: {
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

      case RECORD_KIND.usageSupplement: {
        const rp = ensureRp(record.rpNumber);
        rp.usageSupplements ??= [];
        rp.usageSupplements.push({
          text: record.text,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case RECORD_KIND.prescriptionCaution: {
        const rp = ensureRp(record.rpNumber);
        rp.prescriptionCautions ??= [];
        rp.prescriptionCautions.push({
          text: record.text,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case RECORD_KIND.overallCaution: {
        const dispensing = ensureDispensing();
        dispensing.overallCautions ??= [];
        dispensing.overallCautions.push({
          text: record.text,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case RECORD_KIND.providedInfo: {
        const dispensing = ensureDispensing();
        dispensing.providedInfos ??= [];
        dispensing.providedInfos.push({
          text: record.text,
          infoType: record.infoType,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case RECORD_KIND.remainingMedicineConfirmation: {
        const dispensing = ensureDispensing();
        const remainingMedicineConfirmations: JahisTcRemainingMedicineConfirmation[] =
          Array.isArray(dispensing.remainingMedicineConfirmations)
            ? dispensing.remainingMedicineConfirmations
            : [];
        dispensing.remainingMedicineConfirmations = remainingMedicineConfirmations;
        remainingMedicineConfirmations.push(createRemainingMedicineConfirmation(record));
        break;
      }

      case RECORD_KIND.remark: {
        const dispensing = ensureDispensing();
        dispensing.remarks ??= [];
        dispensing.remarks.push({
          text: record.text,
          recordCreator: record.recordCreator,
        });
        break;
      }

      case RECORD_KIND.patientEntry: {
        const dispensing = ensureDispensing();
        dispensing.patientEntries ??= [];
        dispensing.patientEntries.push({
          text: record.text,
          inputDate: record.inputDate,
        });
        break;
      }

      case RECORD_KIND.familyPharmacist:
        notebook.familyPharmacist = {
          name: record.name,
          pharmacyName: record.pharmacyName,
          contact: record.contact,
          startDate: record.startDate,
          endDate: record.endDate,
          recordCreator: record.recordCreator,
        };
        break;

      case RECORD_KIND.splitControl:
        notebook.splitControl = {
          dataId: record.dataId,
          totalParts: record.totalParts,
          partNumber: record.partNumber,
        };
        break;

      case RECORD_KIND.unknown:
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
