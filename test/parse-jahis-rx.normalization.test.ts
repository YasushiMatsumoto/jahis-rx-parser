import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseJahisRx } from "../src/index.js";

const fixture = (name: string): string => {
  return readFileSync(join(process.cwd(), "test", "fixtures", name), "utf8");
};

describe("parseJahisRx normalization", () => {
  // Validates end-to-end normalization across doctor/patient/insurance and option records.
  it("normalizes doctor, patient, and insurance records", () => {
    const input = fixture("normalization-full.txt");

    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    if (result.data) {
      const data = result.data;
      expect(data.normalized.institution?.code).toBe("1234567");
      expect(data.normalized.institution?.name).toBe("テスト医院");
      expect(data.normalized.institution?.address).toBe("東京都港区新橋1-2-3");
      expect(data.normalized.institution?.phone).toBe("03-1111-2222");
      expect(data.normalized.institution?.department).toBe("内科");
      expect(data.normalized.doctor?.code).toBe("DR001");
      expect(data.normalized.doctor?.kanjiName).toBe("山田 一郎");
      expect(data.normalized.patient?.code).toBe("PT001");
      expect(data.normalized.patient?.kanjiName).toBe("日薬 太郎");
      expect(data.normalized.patient?.kanaName).toBe("ﾆﾁﾔｸ ﾀﾛｳ");
      expect(data.normalized.patient?.sexCode).toBe("1");
      expect(data.normalized.patient?.birthDate).toBe("19600606");
      expect(data.normalized.patient?.copayClassCode).toBe("3");
      expect(data.normalized.insurance?.insuranceTypeCode).toBe("1");
      expect(data.normalized.insurance?.insurerNumber).toBe("12345678");
      expect(data.normalized.insurance?.cardSymbol).toBe("AB");
      expect(data.normalized.insurance?.cardNumber).toBe("12345");
      expect(data.normalized.insurance?.insuredRelationshipCode).toBe("1");
      expect(data.normalized.insurance?.cardBranchNumber).toBe("01");
      expect(data.normalized.insurance?.patientCopayRate).toBe("30");
      expect(data.normalized.insurance?.insuranceBenefitRate).toBe("70");
      expect(data.normalized.insurance?.occupationalAccidentReasonCode).toBe("3");
      expect(data.normalized.insurance?.publicExpense?.first?.payerNumber).toBe("12123456");
      expect(data.normalized.insurance?.publicExpense?.first?.recipientNumber).toBe("1234567");
      expect(data.normalized.insurance?.publicExpense?.second?.payerNumber).toBe("22123456");
      expect(data.normalized.insurance?.publicExpense?.third?.payerNumber).toBe("32123456");
      expect(data.normalized.insurance?.publicExpense?.special?.payerNumber).toBe("特-12");
      expect(data.normalized.insurance?.receiptTypeCode).toBe("1112");
      expect(data.normalized.dispensingDueDate).toBe("20260317");
      expect(data.normalized.narcotics?.patientAddress).toBe("東京都港区新橋1-1-1");
      expect(data.normalized.narcotics?.patientPhone).toBe("03-0000-0000");
      expect(data.normalized.remainingMedicineConfirmationFlag).toBe("2");
      expect(data.normalized.splitDispensing?.totalCount).toBe("3");
      expect(data.normalized.splitDispensing?.currentCount).toBe("2");
      expect(data.normalized.rps?.[0]?.splitDispensingQuantity).toBe("14");
      expect(data.normalized.rps?.[0]?.usageSupplements?.[0]?.usageSupplementCode).toBe("U1");
      expect(data.normalized.rps?.[0]?.usageSupplements?.[0]?.usageSupplementText).toBe("就寝前");
      expect(data.normalized.rps[0]?.drugs[0]?.supplements?.[0]?.supplementCode).toBe("A1");
      expect(data.normalized.rps[0]?.drugs[0]?.supplements?.[0]?.supplementText).toBe("粉砕可");
      expect(data.normalized.rps[0]?.drugs[0]?.unitConversions?.[0]?.convertedAmount).toBe("500");
      expect(data.normalized.rps[0]?.drugs[0]?.unitConversions?.[0]?.convertedUnit).toBe("mg");
      expect(data.normalized.rps[0]?.drugs[0]?.unevenDosings?.[0]?.unevenDosingCode).toBe("E1");
      expect(data.normalized.rps[0]?.drugs[0]?.unevenDosings?.[0]?.unevenDosingText).toBe("朝多め");
      expect(data.normalized.rps[0]?.drugs[0]?.burdenCategories?.[0]?.burdenCategoryCode).toBe(
        "B1",
      );
      expect(data.normalized.rps[0]?.drugs[0]?.burdenCategories?.[0]?.burdenCategoryText).toBe(
        "公費対象",
      );
      expect(data.normalized.rps[0]?.drugs[0]?.singleDoseAmounts?.[0]?.singleDoseAmount).toBe("1");
      expect(data.normalized.rps[0]?.drugs[0]?.singleDoseAmounts?.[0]?.singleDoseUnit).toBe("錠");
      expect(data.normalized.refill?.totalUseCount).toBe("3");
      expect(data.normalized.notes?.[0]?.sequence).toBe("1");
      expect(data.normalized.notes?.[0]?.text).toBe("訪問");
      expect(data.normalized.prescriptionNumber?.numberType).toBe("1");
      expect(data.normalized.prescriptionNumber?.number).toBe("1234567890123456");
    }
  });

  // Unknown records are preserved by default to keep unsupported data inspectable.
  it("preserves unknown records in normalized output by default", () => {
    const input = fixture("normalization-unknown-record.txt");
    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.data?.normalized.unknownRecords).toHaveLength(1);
    expect(result.data?.normalized.unknownRecords?.[0]?.recordNo).toBe("999");
  });

  // Preservation of unknown records can be disabled for strict normalized payloads.
  it("can disable unknown record preservation in normalized output", () => {
    const input = fixture("normalization-unknown-record.txt");
    const result = parseJahisRx(input, {
      strict: false,
      preserveUnknownRecords: false,
    });

    expect(result.ok).toBe(true);
    expect(result.data?.normalized.unknownRecords).toBeUndefined();
  });

  // Multiple RP groups should keep usage/drug records attached to their RP number.
  it("normalizes multiple RP groups without cross-linking usage or drugs", () => {
    const input = fixture("normalization-multi-rp.txt");

    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.data?.normalized.rps).toHaveLength(2);
    expect(result.data?.normalized.rps[0]?.rpNumber).toBe(1);
    expect(result.data?.normalized.rps[0]?.dosageFormName).toBe("内服");
    expect(result.data?.normalized.rps[0]?.usageText).toBe("毎食後");
    expect(result.data?.normalized.rps[0]?.drugs).toHaveLength(1);
    expect(result.data?.normalized.rps[0]?.drugs[0]?.code).toBe("620000001");
    expect(result.data?.normalized.rps[0]?.drugs[0]?.name).toBe("DrugA");
    expect(result.data?.normalized.rps[1]?.rpNumber).toBe(2);
    expect(result.data?.normalized.rps[1]?.dosageFormName).toBe("注射");
    expect(result.data?.normalized.rps[1]?.usageText).toBe("１日１回注射");
    expect(result.data?.normalized.rps[1]?.drugs).toHaveLength(1);
    expect(result.data?.normalized.rps[1]?.drugs[0]?.code).toBe("2412403G3022");
    expect(result.data?.normalized.rps[1]?.drugs[0]?.name).toBe("DrugB");
  });

  // Some JAHIS variants include additional columns in 101/111/201.
  it("normalizes extended 101/111/201 layouts with backward-compatible field mapping", () => {
    const input = fixture("normalization-extended-101-111-201.txt");

    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.data?.normalized.rps).toHaveLength(1);
    expect(result.data?.normalized.rps[0]?.dosageFormCode).toBe("1");
    expect(result.data?.normalized.rps[0]?.dosageFormName).toBe("内服");
    expect(result.data?.normalized.rps[0]?.usageCode).toBe("3");
    expect(result.data?.normalized.rps[0]?.usageText).toBe("毎食後");
    expect(result.data?.normalized.rps[0]?.drugs[0]?.code).toBe("620000001");
    expect(result.data?.normalized.rps[0]?.drugs[0]?.name).toBe("Acetaminophen");
    expect(result.data?.normalized.rps[0]?.drugs[0]?.amount).toBe("3");
    expect(result.data?.normalized.rps[0]?.drugs[0]?.unit).toBe("錠");
  });

  // Spec-aligned 201 includes optional info class and potency flag fields.
  it("normalizes spec-full 201 layout with info class and potency flag", () => {
    const input = fixture("normalization-extended-201-spec-full.txt");

    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.data?.normalized.rps).toHaveLength(1);
    expect(result.data?.normalized.rps[0]?.drugs[0]?.code).toBe("2412403G3022");
    expect(result.data?.normalized.rps[0]?.drugs[0]?.name).toBe(
      "ソグルーヤ皮下注１５ｍｇ　１．５ｍＬ",
    );
    expect(result.data?.normalized.rps[0]?.drugs[0]?.amount).toBe("4");
    expect(result.data?.normalized.rps[0]?.drugs[0]?.unit).toBe("キット");
  });

  // Some JAHIS variants include an extra column in 281 before supplement payload.
  it("normalizes extended 281 layout with backward-compatible field mapping", () => {
    const input = fixture("normalization-extended-281.txt");

    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.data?.normalized.rps[0]?.drugs[0]?.supplements?.[0]?.supplementCode).toBe("A2");
    expect(result.data?.normalized.rps[0]?.drugs[0]?.supplements?.[0]?.supplementText).toBe(
      "一包化",
    );
  });

  // Some JAHIS variants include an extra column in 211 before amount/unit.
  it("normalizes extended 211 layout with backward-compatible field mapping", () => {
    const input = fixture("normalization-extended-211.txt");

    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.data?.normalized.rps[0]?.drugs[0]?.unitConversions?.[0]?.convertedAmount).toBe(
      "500",
    );
    expect(result.data?.normalized.rps[0]?.drugs[0]?.unitConversions?.[0]?.convertedUnit).toBe(
      "mg",
    );
  });

  // Some JAHIS variants include an extra column in 221 before uneven dosing payload.
  it("normalizes extended 221 layout with backward-compatible field mapping", () => {
    const input = fixture("normalization-extended-221.txt");

    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.data?.normalized.rps[0]?.drugs[0]?.unevenDosings?.[0]?.unevenDosingCode).toBe(
      "E2",
    );
    expect(result.data?.normalized.rps[0]?.drugs[0]?.unevenDosings?.[0]?.unevenDosingText).toBe(
      "夕多め",
    );
  });

  // Some JAHIS variants include an extra column in 231 before burden category payload.
  it("normalizes extended 231 layout with backward-compatible field mapping", () => {
    const input = fixture("normalization-extended-231.txt");

    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(
      result.data?.normalized.rps[0]?.drugs[0]?.burdenCategories?.[0]?.burdenCategoryCode,
    ).toBe("B2");
    expect(
      result.data?.normalized.rps[0]?.drugs[0]?.burdenCategories?.[0]?.burdenCategoryText,
    ).toBe("高額療養");
  });

  // Some JAHIS variants include an extra column in 241 before amount/unit.
  it("normalizes extended 241 layout with backward-compatible field mapping", () => {
    const input = fixture("normalization-extended-241.txt");

    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.data?.normalized.rps[0]?.drugs[0]?.singleDoseAmounts?.[0]?.singleDoseAmount).toBe(
      "1",
    );
    expect(result.data?.normalized.rps[0]?.drugs[0]?.singleDoseAmounts?.[0]?.singleDoseUnit).toBe(
      "錠",
    );
  });

  // Some JAHIS variants include an extra column in 181 before supplement payload.
  it("normalizes extended 181 layout with backward-compatible field mapping", () => {
    const input = fixture("normalization-extended-181.txt");

    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.data?.normalized.rps[0]?.usageSupplements?.[0]?.usageSupplementCode).toBe("U2");
    expect(result.data?.normalized.rps[0]?.usageSupplements?.[0]?.usageSupplementText).toBe("食前");
  });

  // Spec-layout fields should be preserved from decode to normalized output.
  it("normalizes additional spec fields for institution and drug-related records", () => {
    const input = fixture("normalization-spec-fields.txt");

    const result = parseJahisRx(input, { strict: false });

    expect(result.ok).toBe(true);
    expect(result.data?.normalized.institution?.codeType).toBe("1");
    expect(result.data?.normalized.institution?.prefectureCode).toBe("13");
    expect(result.data?.normalized.institution?.postalCode).toBe("105-0004");
    expect(result.data?.normalized.institution?.fax).toBe("03-3333-4444");
    expect(result.data?.normalized.institution?.otherContact).toBe("contact@example.jp");
    expect(result.data?.normalized.institution?.departmentCodeType).toBe("2");
    expect(result.data?.normalized.institution?.departmentCode).toBe("01");

    expect(result.data?.normalized.rps[0]?.dispensingQuantity).toBe("14");
    expect(result.data?.normalized.rps[0]?.drugs[0]?.infoClass).toBe("1");
    expect(result.data?.normalized.rps[0]?.drugs[0]?.codeType).toBe("2");
    expect(result.data?.normalized.rps[0]?.drugs[0]?.potencyFlag).toBe("1");

    expect(result.data?.normalized.rps[0]?.drugs[0]?.unevenDosings?.[0]?.unevenDosingAmount1).toBe(
      "1.5",
    );
    expect(result.data?.normalized.rps[0]?.drugs[0]?.unevenDosings?.[0]?.unevenDosingAmount2).toBe(
      "0.5",
    );
    expect(result.data?.normalized.rps[0]?.drugs[0]?.unevenDosings?.[0]?.unevenDosingCode1).toBe(
      "V11.5NNN",
    );
    expect(result.data?.normalized.rps[0]?.drugs[0]?.unevenDosings?.[0]?.unevenDosingCode2).toBe(
      "V20.5NNN",
    );

    expect(
      result.data?.normalized.rps[0]?.drugs[0]?.burdenCategories?.[0]?.firstPublicExpenseBurdenCode,
    ).toBe("1");
    expect(
      result.data?.normalized.rps[0]?.drugs[0]?.burdenCategories?.[0]
        ?.secondPublicExpenseBurdenCode,
    ).toBe("0");
    expect(
      result.data?.normalized.rps[0]?.drugs[0]?.burdenCategories?.[0]?.thirdPublicExpenseBurdenCode,
    ).toBe("1");
    expect(
      result.data?.normalized.rps[0]?.drugs[0]?.burdenCategories?.[0]
        ?.specialPublicExpenseBurdenCode,
    ).toBe("0");

    expect(result.data?.normalized.rps[0]?.drugs[0]?.singleDoseAmounts?.[0]?.timesPerDay).toBe("3");

    expect(result.data?.normalized.rps[0]?.drugs[0]?.supplements?.[0]?.supplementSequence).toBe(
      "1",
    );
    expect(result.data?.normalized.rps[0]?.drugs[0]?.supplements?.[0]?.supplementClass).toBe("8");
    expect(result.data?.normalized.rps[0]?.drugs[0]?.supplements?.[0]?.supplementUsageCode).toBe(
      "I1100000",
    );
  });
});
