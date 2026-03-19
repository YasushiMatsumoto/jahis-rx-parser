import { RECORD_NO } from "../constants/index.js";
import type { RawRecord } from "../types/parse.js";

export type DrugUnitValidationSource = {
  rpNumber: number;
  drugNumber: number;
  code: string | undefined;
  unit: string | undefined;
};

export type ValidationIndex = {
  recordNoToRecords: Map<string, RawRecord[]>;
  rpNumbers: Set<number>;
  usageAnchorRps: Set<number>;
  drugAnchorKeys: Set<string>;
  drugAnchorRps: Set<number>;
  unitConversionKeys: Set<string>;
  drugUnitValidationSources: DrugUnitValidationSource[];
  firstRpLines: Map<number, number>;
  firstUsageLines: Map<number, number>;
  firstDrugLines: Map<number, number>;
};

const toInt = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const isDrugCodeType = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }

  return ["1", "2", "3", "4", "5", "6", "7", "8"].includes(value);
};

const isDrugInfoClass = (value: string | undefined): boolean => {
  return value === "" || value === "1" || value === "2" || value === "3";
};

const isPotencyFlag = (value: string | undefined): boolean => {
  return value === "1" || value === "2";
};

export const toDrugAnchorKey = (rpNumber: number, drugNumber: number): string => {
  return `${rpNumber}:${drugNumber}`;
};

const parseDrugUnitValidationSource = (record: RawRecord): DrugUnitValidationSource | null => {
  if (record.recordNo !== RECORD_NO.drug) {
    return null;
  }

  const rpNumber = toInt(record.fields[1]);
  const drugNumber = toInt(record.fields[2]);
  if (rpNumber === undefined || drugNumber === undefined) {
    return null;
  }

  const hasSpecLikeLayout =
    record.fields.length >= 10 &&
    isDrugInfoClass(record.fields[3]) &&
    isDrugCodeType(record.fields[4]) &&
    isPotencyFlag(record.fields[8]);

  const code = hasSpecLikeLayout ? record.fields[5] : record.fields[4];
  const unit = hasSpecLikeLayout ? record.fields[9] : record.fields[7];

  return {
    rpNumber,
    drugNumber,
    code,
    unit,
  };
};

export const buildValidationIndex = (records: RawRecord[]): ValidationIndex => {
  const recordNoToRecords = new Map<string, RawRecord[]>();
  const rpNumbers = new Set<number>();
  const usageAnchorRps = new Set<number>();
  const drugAnchorKeys = new Set<string>();
  const drugAnchorRps = new Set<number>();
  const unitConversionKeys = new Set<string>();
  const drugUnitValidationSources: DrugUnitValidationSource[] = [];
  const firstRpLines = new Map<number, number>();
  const firstUsageLines = new Map<number, number>();
  const firstDrugLines = new Map<number, number>();

  for (const record of records) {
    const bucket = recordNoToRecords.get(record.recordNo);
    if (bucket) {
      bucket.push(record);
    } else {
      recordNoToRecords.set(record.recordNo, [record]);
    }

    if (record.recordNo === RECORD_NO.rp) {
      const rpNumber = toInt(record.fields[1]);
      if (rpNumber !== undefined) {
        rpNumbers.add(rpNumber);
        if (!firstRpLines.has(rpNumber)) {
          firstRpLines.set(rpNumber, record.line);
        }
      }
      continue;
    }

    if (record.recordNo === RECORD_NO.usage) {
      const rpNumber = toInt(record.fields[1]);
      if (rpNumber !== undefined) {
        usageAnchorRps.add(rpNumber);
        if (!firstUsageLines.has(rpNumber)) {
          firstUsageLines.set(rpNumber, record.line);
        }
      }
      continue;
    }

    if (record.recordNo === RECORD_NO.drug) {
      const unitValidationSource = parseDrugUnitValidationSource(record);
      if (unitValidationSource) {
        drugUnitValidationSources.push(unitValidationSource);
      }

      const rpNumber = toInt(record.fields[1]);
      const drugNumber = toInt(record.fields[2]);
      if (rpNumber !== undefined && drugNumber !== undefined) {
        drugAnchorKeys.add(toDrugAnchorKey(rpNumber, drugNumber));
        drugAnchorRps.add(rpNumber);
        if (!firstDrugLines.has(rpNumber)) {
          firstDrugLines.set(rpNumber, record.line);
        }
      }
      continue;
    }

    if (record.recordNo === RECORD_NO.drugUnitConversion) {
      const rpNumber = toInt(record.fields[1]);
      const drugNumber = toInt(record.fields[2]);
      if (rpNumber !== undefined && drugNumber !== undefined) {
        unitConversionKeys.add(toDrugAnchorKey(rpNumber, drugNumber));
      }
    }
  }

  return {
    recordNoToRecords,
    rpNumbers,
    usageAnchorRps,
    drugAnchorKeys,
    drugAnchorRps,
    unitConversionKeys,
    drugUnitValidationSources,
    firstRpLines,
    firstUsageLines,
    firstDrugLines,
  };
};
