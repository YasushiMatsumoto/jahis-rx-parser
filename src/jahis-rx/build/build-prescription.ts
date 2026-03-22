import { PROPERTY_KEY, RECORD_KIND } from "../constants/index.js";
import type { ParsedRecord } from "../types/decoded-records.js";
import type { JAHISDrug, JAHISRp, JahisRxPrescription } from "../types/normalized.js";
import type { ParseOptions } from "../types/parse.js";

/**
 * Assigns an optional string property only when the value exists.
 *
 * @param target Target object to mutate.
 * @param key Property key to assign.
 * @param value Optional value to assign.
 */
const withOptionalString = <T extends object, K extends Extract<keyof T, string>>(
  target: T & Partial<Record<K, string>>,
  key: K,
  value: (T & Partial<Record<K, string>>)[K],
): void => {
  if (value !== undefined) {
    target[key] = value;
  }
};

/**
 * Builds a normalized prescription model from decoded records.
 *
 * @param records Decoded records in input order.
 * @param options Optional parser behavior flags.
 * @returns Normalized prescription payload.
 */
export const buildPrescription = (
  records: ParsedRecord[],
  options?: ParseOptions,
): JahisRxPrescription => {
  const prescription: JahisRxPrescription = {
    version: null,
    rps: [],
  };
  const preserveUnknownRecords = options?.preserveUnknownRecords !== false;

  const rpMap = new Map<number, JAHISRp>();

  /**
   * Returns an existing RP group or creates one lazily.
   *
   * @param rpNumber RP sequence number.
   * @returns Existing or newly created RP group.
   */
  const ensureRp = (rpNumber: number): JAHISRp => {
    const existing = rpMap.get(rpNumber);
    if (existing) {
      return existing;
    }

    const created: JAHISRp = {
      rpNumber,
      drugs: [],
    };

    rpMap.set(rpNumber, created);
    prescription.rps.push(created);

    return created;
  };

  /**
   * Returns an existing drug entry in RP or creates a placeholder lazily.
   *
   * This lets supplement records (281) arrive before base drug records (201)
   * while still producing a stable normalized shape.
   *
   * @param rp RP group object.
   * @param drugNumber Drug sequence number.
   * @returns Existing or newly created drug entry.
   */
  const ensureDrug = (rp: JAHISRp, drugNumber: number): JAHISDrug => {
    const existing = rp.drugs.find((drug) => drug.drugNumber === drugNumber);
    if (existing) {
      return existing;
    }

    const created: JAHISDrug = { drugNumber };
    rp.drugs.push(created);
    return created;
  };

  for (const record of records) {
    switch (record.kind) {
      case RECORD_KIND.header:
        prescription.version = record.version;
        break;

      case RECORD_KIND.institution:
        prescription.institution = {};
        withOptionalString(prescription.institution, PROPERTY_KEY.codeType, record.codeType);
        withOptionalString(prescription.institution, PROPERTY_KEY.code, record.code);
        withOptionalString(
          prescription.institution,
          PROPERTY_KEY.prefectureCode,
          record.prefectureCode,
        );
        withOptionalString(prescription.institution, PROPERTY_KEY.name, record.name);
        break;

      case RECORD_KIND.institutionAddress:
        if (!prescription.institution) {
          prescription.institution = {};
        }
        withOptionalString(prescription.institution, PROPERTY_KEY.postalCode, record.postalCode);
        withOptionalString(prescription.institution, PROPERTY_KEY.address, record.address);
        break;

      case RECORD_KIND.institutionPhone:
        if (!prescription.institution) {
          prescription.institution = {};
        }
        withOptionalString(prescription.institution, PROPERTY_KEY.phone, record.phone);
        withOptionalString(prescription.institution, PROPERTY_KEY.fax, record.fax);
        withOptionalString(
          prescription.institution,
          PROPERTY_KEY.otherContact,
          record.otherContact,
        );
        break;

      case RECORD_KIND.department:
        if (!prescription.institution) {
          prescription.institution = {};
        }
        withOptionalString(
          prescription.institution,
          PROPERTY_KEY.departmentCodeType,
          record.departmentCodeType,
        );
        withOptionalString(
          prescription.institution,
          PROPERTY_KEY.departmentCode,
          record.departmentCode,
        );
        withOptionalString(prescription.institution, PROPERTY_KEY.department, record.department);
        break;

      case RECORD_KIND.prescriptionDate:
        withOptionalString(prescription, PROPERTY_KEY.prescriptionDate, record.date);
        break;

      case RECORD_KIND.doctor:
        prescription.doctor = {};
        withOptionalString(prescription.doctor, PROPERTY_KEY.code, record.code);
        withOptionalString(prescription.doctor, PROPERTY_KEY.kanaName, record.kanaName);
        withOptionalString(prescription.doctor, PROPERTY_KEY.kanjiName, record.kanjiName);
        break;

      case RECORD_KIND.patientName:
        prescription.patient = {};
        withOptionalString(prescription.patient, PROPERTY_KEY.code, record.code);
        withOptionalString(prescription.patient, PROPERTY_KEY.kanjiName, record.kanjiName);
        withOptionalString(prescription.patient, PROPERTY_KEY.kanaName, record.kanaName);
        break;

      case RECORD_KIND.patientSex:
        if (!prescription.patient) {
          prescription.patient = {};
        }
        withOptionalString(prescription.patient, PROPERTY_KEY.sexCode, record.sexCode);
        break;

      case RECORD_KIND.patientBirthDate:
        if (!prescription.patient) {
          prescription.patient = {};
        }
        withOptionalString(prescription.patient, PROPERTY_KEY.birthDate, record.birthDate);
        break;

      case RECORD_KIND.patientCopayClass:
        if (!prescription.patient) {
          prescription.patient = {};
        }
        withOptionalString(
          prescription.patient,
          PROPERTY_KEY.copayClassCode,
          record.copayClassCode,
        );
        break;

      case RECORD_KIND.insuranceType:
        prescription.insurance = {};
        withOptionalString(
          prescription.insurance,
          PROPERTY_KEY.insuranceTypeCode,
          record.insuranceTypeCode,
        );
        break;

      case RECORD_KIND.insurerNumber:
        if (!prescription.insurance) {
          prescription.insurance = {};
        }
        withOptionalString(
          prescription.insurance,
          PROPERTY_KEY.insurerNumber,
          record.insurerNumber,
        );
        break;

      case RECORD_KIND.insuranceCard:
        if (!prescription.insurance) {
          prescription.insurance = {};
        }
        withOptionalString(prescription.insurance, PROPERTY_KEY.cardSymbol, record.cardSymbol);
        withOptionalString(prescription.insurance, PROPERTY_KEY.cardNumber, record.cardNumber);
        withOptionalString(
          prescription.insurance,
          PROPERTY_KEY.insuredRelationshipCode,
          record.insuredRelationshipCode,
        );
        withOptionalString(
          prescription.insurance,
          PROPERTY_KEY.cardBranchNumber,
          record.cardBranchNumber,
        );
        break;

      case RECORD_KIND.insuranceRate:
        if (!prescription.insurance) {
          prescription.insurance = {};
        }
        withOptionalString(
          prescription.insurance,
          PROPERTY_KEY.patientCopayRate,
          record.patientCopayRate,
        );
        withOptionalString(
          prescription.insurance,
          PROPERTY_KEY.insuranceBenefitRate,
          record.insuranceBenefitRate,
        );
        break;

      case RECORD_KIND.occupationalAccident:
        if (!prescription.insurance) {
          prescription.insurance = {};
        }
        withOptionalString(
          prescription.insurance,
          PROPERTY_KEY.occupationalAccidentReasonCode,
          record.reasonCode,
        );
        break;

      case RECORD_KIND.publicExpense: {
        if (!prescription.insurance) {
          prescription.insurance = {};
        }
        if (!prescription.insurance.publicExpense) {
          prescription.insurance.publicExpense = {};
        }

        const entry: { payerNumber?: string; recipientNumber?: string } = {};
        withOptionalString(entry, PROPERTY_KEY.payerNumber, record.payerNumber);
        withOptionalString(entry, PROPERTY_KEY.recipientNumber, record.recipientNumber);

        if (record.slot === 1) {
          prescription.insurance.publicExpense.first = entry;
        }
        if (record.slot === 2) {
          prescription.insurance.publicExpense.second = entry;
        }
        if (record.slot === 3) {
          prescription.insurance.publicExpense.third = entry;
        }
        break;
      }

      case RECORD_KIND.specialPublicExpense:
        if (!prescription.insurance) {
          prescription.insurance = {};
        }
        if (!prescription.insurance.publicExpense) {
          prescription.insurance.publicExpense = {};
        }
        prescription.insurance.publicExpense.special = {};
        withOptionalString(
          prescription.insurance.publicExpense.special,
          PROPERTY_KEY.payerNumber,
          record.payerNumber,
        );
        withOptionalString(
          prescription.insurance.publicExpense.special,
          PROPERTY_KEY.recipientNumber,
          record.recipientNumber,
        );
        break;

      case RECORD_KIND.receiptType:
        if (!prescription.insurance) {
          prescription.insurance = {};
        }
        withOptionalString(prescription.insurance, PROPERTY_KEY.receiptTypeCode, record.code);
        break;

      case RECORD_KIND.dispensingDueDate:
        withOptionalString(prescription, PROPERTY_KEY.dispensingDueDate, record.date);
        break;

      case RECORD_KIND.narcotics:
        prescription.narcotics = {};
        withOptionalString(
          prescription.narcotics,
          PROPERTY_KEY.licenseNumber,
          record.licenseNumber,
        );
        withOptionalString(
          prescription.narcotics,
          PROPERTY_KEY.patientAddress,
          record.patientAddress,
        );
        withOptionalString(prescription.narcotics, PROPERTY_KEY.patientPhone, record.patientPhone);
        break;

      case RECORD_KIND.remainingMedicine:
        withOptionalString(
          prescription,
          PROPERTY_KEY.remainingMedicineConfirmationFlag,
          record.confirmationFlag,
        );
        break;

      case RECORD_KIND.splitDispensing:
        prescription.splitDispensing = {};
        withOptionalString(
          prescription.splitDispensing,
          PROPERTY_KEY.totalCount,
          record.totalCount,
        );
        withOptionalString(
          prescription.splitDispensing,
          PROPERTY_KEY.currentCount,
          record.currentCount,
        );
        break;

      case RECORD_KIND.refill:
        prescription.refill = {};
        withOptionalString(prescription.refill, PROPERTY_KEY.totalUseCount, record.totalUseCount);
        break;

      case RECORD_KIND.note: {
        if (!prescription.notes) {
          prescription.notes = [];
        }
        const entry: { sequence?: string; noteType?: string; text?: string } = {};
        withOptionalString(entry, PROPERTY_KEY.sequence, record.sequence);
        withOptionalString(entry, PROPERTY_KEY.noteType, record.noteType);
        withOptionalString(entry, PROPERTY_KEY.text, record.text);
        prescription.notes.push(entry);
        break;
      }

      case RECORD_KIND.prescriptionNumber:
        prescription.prescriptionNumber = {};
        withOptionalString(
          prescription.prescriptionNumber,
          PROPERTY_KEY.numberType,
          record.numberType,
        );
        withOptionalString(prescription.prescriptionNumber, PROPERTY_KEY.number, record.number);
        break;

      case RECORD_KIND.rp: {
        const rp = ensureRp(record.rpNumber);
        withOptionalString(rp, PROPERTY_KEY.dosageFormCode, record.dosageFormCode);
        withOptionalString(rp, PROPERTY_KEY.dosageFormName, record.dosageFormName);
        withOptionalString(rp, PROPERTY_KEY.dispensingQuantity, record.dispensingQuantity);
        break;
      }

      case RECORD_KIND.rpSplitDispensingQuantity: {
        const rp = ensureRp(record.rpNumber);
        withOptionalString(
          rp,
          PROPERTY_KEY.splitDispensingQuantity,
          record.splitDispensingQuantity,
        );
        break;
      }

      case RECORD_KIND.usage: {
        const rp = ensureRp(record.rpNumber);
        withOptionalString(rp, PROPERTY_KEY.usageCode, record.usageCode);
        withOptionalString(rp, PROPERTY_KEY.usageText, record.usageText);
        break;
      }

      case RECORD_KIND.usageSupplement: {
        const rp = ensureRp(record.rpNumber);
        if (!rp.usageSupplements) {
          rp.usageSupplements = [];
        }

        const supplement: {
          usageSupplementCode?: string;
          usageSupplementText?: string;
        } = {};
        withOptionalString(
          supplement,
          PROPERTY_KEY.usageSupplementCode,
          record.usageSupplementCode,
        );
        withOptionalString(
          supplement,
          PROPERTY_KEY.usageSupplementText,
          record.usageSupplementText,
        );
        rp.usageSupplements.push(supplement);
        break;
      }

      case RECORD_KIND.drug: {
        const rp = ensureRp(record.rpNumber);
        const drug = ensureDrug(rp, record.drugNumber);
        withOptionalString(drug, PROPERTY_KEY.infoClass, record.infoClass);
        withOptionalString(drug, PROPERTY_KEY.codeType, record.codeType);
        withOptionalString(drug, PROPERTY_KEY.code, record.code);
        withOptionalString(drug, PROPERTY_KEY.name, record.name);
        withOptionalString(drug, PROPERTY_KEY.amount, record.amount);
        withOptionalString(drug, PROPERTY_KEY.potencyFlag, record.potencyFlag);
        withOptionalString(drug, PROPERTY_KEY.unit, record.unit);
        break;
      }

      case RECORD_KIND.drugUnitConversion: {
        const rp = ensureRp(record.rpNumber);
        const drug = ensureDrug(rp, record.drugNumber);
        if (!drug.unitConversions) {
          drug.unitConversions = [];
        }

        const conversion: { convertedAmount?: string; convertedUnit?: string } = {};
        withOptionalString(conversion, PROPERTY_KEY.convertedAmount, record.convertedAmount);
        withOptionalString(conversion, PROPERTY_KEY.convertedUnit, record.convertedUnit);
        drug.unitConversions.push(conversion);
        break;
      }

      case RECORD_KIND.drugUnevenDosing: {
        const rp = ensureRp(record.rpNumber);
        const drug = ensureDrug(rp, record.drugNumber);
        if (!drug.unevenDosings) {
          drug.unevenDosings = [];
        }

        const unevenDosing: {
          unevenDosingAmount1?: string;
          unevenDosingAmount2?: string;
          unevenDosingAmount3?: string;
          unevenDosingAmount4?: string;
          unevenDosingAmount5?: string;
          unevenDosingCode1?: string;
          unevenDosingCode2?: string;
          unevenDosingCode3?: string;
          unevenDosingCode4?: string;
          unevenDosingCode5?: string;
          unevenDosingCode?: string;
          unevenDosingText?: string;
        } = {};
        withOptionalString(
          unevenDosing,
          PROPERTY_KEY.unevenDosingAmount1,
          record.unevenDosingAmount1,
        );
        withOptionalString(
          unevenDosing,
          PROPERTY_KEY.unevenDosingAmount2,
          record.unevenDosingAmount2,
        );
        withOptionalString(
          unevenDosing,
          PROPERTY_KEY.unevenDosingAmount3,
          record.unevenDosingAmount3,
        );
        withOptionalString(
          unevenDosing,
          PROPERTY_KEY.unevenDosingAmount4,
          record.unevenDosingAmount4,
        );
        withOptionalString(
          unevenDosing,
          PROPERTY_KEY.unevenDosingAmount5,
          record.unevenDosingAmount5,
        );
        withOptionalString(unevenDosing, PROPERTY_KEY.unevenDosingCode1, record.unevenDosingCode1);
        withOptionalString(unevenDosing, PROPERTY_KEY.unevenDosingCode2, record.unevenDosingCode2);
        withOptionalString(unevenDosing, PROPERTY_KEY.unevenDosingCode3, record.unevenDosingCode3);
        withOptionalString(unevenDosing, PROPERTY_KEY.unevenDosingCode4, record.unevenDosingCode4);
        withOptionalString(unevenDosing, PROPERTY_KEY.unevenDosingCode5, record.unevenDosingCode5);
        withOptionalString(unevenDosing, PROPERTY_KEY.unevenDosingCode, record.unevenDosingCode);
        withOptionalString(unevenDosing, PROPERTY_KEY.unevenDosingText, record.unevenDosingText);
        drug.unevenDosings.push(unevenDosing);
        break;
      }

      case RECORD_KIND.drugBurdenCategory: {
        const rp = ensureRp(record.rpNumber);
        const drug = ensureDrug(rp, record.drugNumber);
        if (!drug.burdenCategories) {
          drug.burdenCategories = [];
        }

        const burdenCategory: {
          firstPublicExpenseBurdenCode?: string;
          secondPublicExpenseBurdenCode?: string;
          thirdPublicExpenseBurdenCode?: string;
          specialPublicExpenseBurdenCode?: string;
          burdenCategoryCode?: string;
          burdenCategoryText?: string;
        } = {};
        withOptionalString(
          burdenCategory,
          PROPERTY_KEY.firstPublicExpenseBurdenCode,
          record.firstPublicExpenseBurdenCode,
        );
        withOptionalString(
          burdenCategory,
          PROPERTY_KEY.secondPublicExpenseBurdenCode,
          record.secondPublicExpenseBurdenCode,
        );
        withOptionalString(
          burdenCategory,
          PROPERTY_KEY.thirdPublicExpenseBurdenCode,
          record.thirdPublicExpenseBurdenCode,
        );
        withOptionalString(
          burdenCategory,
          PROPERTY_KEY.specialPublicExpenseBurdenCode,
          record.specialPublicExpenseBurdenCode,
        );
        withOptionalString(
          burdenCategory,
          PROPERTY_KEY.burdenCategoryCode,
          record.burdenCategoryCode,
        );
        withOptionalString(
          burdenCategory,
          PROPERTY_KEY.burdenCategoryText,
          record.burdenCategoryText,
        );
        drug.burdenCategories.push(burdenCategory);
        break;
      }

      case RECORD_KIND.drugSingleDoseAmount: {
        const rp = ensureRp(record.rpNumber);
        const drug = ensureDrug(rp, record.drugNumber);
        if (!drug.singleDoseAmounts) {
          drug.singleDoseAmounts = [];
        }

        const singleDoseAmount: {
          singleDoseAmount?: string;
          timesPerDay?: string;
          singleDoseUnit?: string;
        } = {};
        withOptionalString(
          singleDoseAmount,
          PROPERTY_KEY.singleDoseAmount,
          record.singleDoseAmount,
        );
        withOptionalString(singleDoseAmount, PROPERTY_KEY.timesPerDay, record.timesPerDay);
        withOptionalString(singleDoseAmount, PROPERTY_KEY.singleDoseUnit, record.singleDoseUnit);
        drug.singleDoseAmounts.push(singleDoseAmount);
        break;
      }

      case RECORD_KIND.drugSupplement: {
        const rp = ensureRp(record.rpNumber);
        const drug = ensureDrug(rp, record.drugNumber);
        if (!drug.supplements) {
          drug.supplements = [];
        }

        const supplement: {
          supplementSequence?: string;
          supplementClass?: string;
          supplementCode?: string;
          supplementText?: string;
          supplementUsageCode?: string;
        } = {};
        withOptionalString(supplement, PROPERTY_KEY.supplementSequence, record.supplementSequence);
        withOptionalString(supplement, PROPERTY_KEY.supplementClass, record.supplementClass);
        withOptionalString(supplement, PROPERTY_KEY.supplementCode, record.supplementCode);
        withOptionalString(supplement, PROPERTY_KEY.supplementText, record.supplementText);
        withOptionalString(
          supplement,
          PROPERTY_KEY.supplementUsageCode,
          record.supplementUsageCode,
        );
        drug.supplements.push(supplement);
        break;
      }

      case RECORD_KIND.unknown:
        if (!preserveUnknownRecords) {
          break;
        }
        if (!prescription.unknownRecords) {
          prescription.unknownRecords = [];
        }
        prescription.unknownRecords.push({
          line: record.line,
          recordNo: record.recordNo,
          fields: [...record.raw.fields],
          raw: record.raw.raw,
        });
        break;

      default:
        break;
    }
  }

  // Sort to keep normalized output stable regardless of source line ordering.
  prescription.rps.sort((a, b) => a.rpNumber - b.rpNumber);
  for (const rp of prescription.rps) {
    rp.drugs.sort((a, b) => a.drugNumber - b.drugNumber);
  }

  return prescription;
};
