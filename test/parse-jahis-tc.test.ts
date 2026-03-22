import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseJahisTc } from "../src/index.js";

const fixture = (name: string): string => {
  return readFileSync(join(process.cwd(), "test", "fixtures", name), "utf8");
};

describe("parseJahisTc", () => {
  it("parses minimal valid TC data", () => {
    const input = fixture("tc-minimal-valid.txt");
    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.data?.normalized.version).toBe("JAHISTC01");
    expect(result.data?.normalized.outputCategory).toBe("1");
    expect(result.data?.normalized.dispensings).toHaveLength(1);
    expect(result.data?.normalized.dispensings[0]?.prescriptions).toHaveLength(1);
    expect(result.data?.normalized.dispensings[0]?.prescriptions[0]?.rps).toHaveLength(1);
    expect(result.data?.normalized.dispensings[0]?.prescriptions[0]?.rps[0]?.drugs).toHaveLength(1);
  });

  it("reports conditional required field for record 201 in strict mode", () => {
    const input = fixture("tc-invalid-missing-drug-code.txt");
    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.issues.some((issue) => issue.code === "CONDITIONAL_REQUIRED_MISSING")).toBe(true);
  });

  it("reports general-name consistency issues for record 201 in strict mode", () => {
    const input = [
      "JAHISTC08,1",
      "1,山田 太郎,1,19800101",
      "5,20260310,1",
      "11,株式会社 工業会薬局 駅前店,13,4,1234567,,,03-3506-8010,1",
      "51,医療法人 工業会病院,13,1,1234567,1",
      "201,1,ノルバスク錠２．５ｍｇ,1,錠,2,612170709,1,【般】アムロジピンベシル酸塩錠２．５ｍｇ,,1179044F1ZZZ",
      "301,1,毎食後服用,3,日分,1,1,,1",
    ].join("\n");

    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(
      result.issues.some(
        (issue) =>
          issue.code === "CONDITIONAL_REQUIRED_MISSING" &&
          issue.message.includes("generalNameCodeType is required"),
      ),
    ).toBe(true);
  });

  it("reports missing general-name code when record 201 code type is present", () => {
    const input = [
      "JAHISTC08,1",
      "1,山田 太郎,1,19800101",
      "5,20260310,1",
      "11,株式会社 工業会薬局 駅前店,13,4,1234567,,,03-3506-8010,1",
      "51,医療法人 工業会病院,13,1,1234567,1",
      "201,1,ノルバスク錠２．５ｍｇ,1,錠,2,612170709,1,【般】アムロジピンベシル酸塩錠２．５ｍｇ,2,",
      "301,1,毎食後服用,3,日分,1,1,,1",
    ].join("\n");

    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(
      result.issues.some(
        (issue) =>
          issue.code === "CONDITIONAL_REQUIRED_MISSING" &&
          issue.message.includes("generalNameCode is required"),
      ),
    ).toBe(true);
  });

  it("reports invalid general-name code type for record 201", () => {
    const input = [
      "JAHISTC08,1",
      "1,山田 太郎,1,19800101",
      "5,20260310,1",
      "11,株式会社 工業会薬局 駅前店,13,4,1234567,,,03-3506-8010,1",
      "51,医療法人 工業会病院,13,1,1234567,1",
      "201,1,ノルバスク錠２．５ｍｇ,1,錠,2,612170709,1,【般】アムロジピンベシル酸塩錠２．５ｍｇ,7,1179044F1ZZZ",
      "301,1,毎食後服用,3,日分,1,1,,1",
    ].join("\n");

    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(
      result.issues.some(
        (issue) => issue.code === "INVALID_ENUM_VALUE" && issue.message.includes("one of 1,2"),
      ),
    ).toBe(true);
  });

  it("reports invalid general-name code presence when record 201 code type is 1", () => {
    const input = [
      "JAHISTC08,1",
      "1,山田 太郎,1,19800101",
      "5,20260310,1",
      "11,株式会社 工業会薬局 駅前店,13,4,1234567,,,03-3506-8010,1",
      "51,医療法人 工業会病院,13,1,1234567,1",
      "201,1,ノルバスク錠２．５ｍｇ,1,錠,2,612170709,1,【般】アムロジピンベシル酸塩錠２．５ｍｇ,1,1179044F1ZZZ",
      "301,1,毎食後服用,3,日分,1,1,,1",
    ].join("\n");

    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(
      result.issues.some(
        (issue) =>
          issue.code === "INVALID_FORMAT" &&
          issue.message.includes("generalNameCode must be omitted when generalNameCodeType is 1"),
      ),
    ).toBe(true);
  });

  it("accepts record 201 without general-name code when generalNameCodeType is 1", () => {
    const input = [
      "JAHISTC08,1",
      "1,山田 太郎,1,19800101",
      "5,20260310,1",
      "11,株式会社 工業会薬局 駅前店,13,4,1234567,,,03-3506-8010,1",
      "51,医療法人 工業会病院,13,1,1234567,1",
      "201,1,ノルバスク錠２．５ｍｇ,1,錠,2,612170709,1,【般】アムロジピンベシル酸塩錠２．５ｍｇ,1,",
      "301,1,毎食後服用,3,日分,1,1,,1",
    ].join("\n");

    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
    expect(
      result.data?.normalized.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]
        ?.generalNameCodeType,
    ).toBe("1");
    expect(
      result.data?.normalized.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]
        ?.generalNameCode,
    ).toBe("");
  });

  it("reports invalid general-name code format for record 201", () => {
    const input = [
      "JAHISTC08,1",
      "1,山田 太郎,1,19800101",
      "5,20260310,1",
      "11,株式会社 工業会薬局 駅前店,13,4,1234567,,,03-3506-8010,1",
      "51,医療法人 工業会病院,13,1,1234567,1",
      "201,1,ノルバスク錠２．５ｍｇ,1,錠,2,612170709,1,【般】アムロジピンベシル酸塩錠２．５ｍｇ,2,1179044F1ZZ_",
      "301,1,毎食後服用,3,日分,1,1,,1",
    ].join("\n");

    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(
      result.issues.some(
        (issue) =>
          issue.code === "INVALID_FORMAT" &&
          issue.message.includes("generalNameCode must be 1-12 ASCII alphanumeric characters"),
      ),
    ).toBe(true);
  });

  it("reports invalid general-name code length for record 201", () => {
    const input = [
      "JAHISTC08,1",
      "1,山田 太郎,1,19800101",
      "5,20260310,1",
      "11,株式会社 工業会薬局 駅前店,13,4,1234567,,,03-3506-8010,1",
      "51,医療法人 工業会病院,13,1,1234567,1",
      "201,1,ノルバスク錠２．５ｍｇ,1,錠,2,612170709,1,【般】アムロジピンベシル酸塩錠２．５ｍｇ,2,1179044F1ZZZA",
      "301,1,毎食後服用,3,日分,1,1,,1",
    ].join("\n");

    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(
      result.issues.some(
        (issue) =>
          issue.code === "INVALID_FORMAT" &&
          issue.message.includes("generalNameCode must be 1-12 ASCII alphanumeric characters"),
      ),
    ).toBe(true);
  });

  it("reports invalid header when output category is missing", () => {
    const input = ["JAHISTC06", "1,山田 太郎,1,19800101", "5,20260310,1"].join("\n");
    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "REQUIRED_FIELD_MISSING")).toBe(true);
  });

  it("reports RP link issues when record 301 has no record 201", () => {
    const input = [
      "JAHISTC06,1",
      "1,山田 太郎,1,19800101",
      "5,20260310,1",
      "11,株式会社 工業会薬局 駅前店,13,4,1234567,,,03-3506-8010,1",
      "51,医療法人 工業会病院,13,1,1234567,1",
      "301,1,毎食後服用,3,日分,1,1,,1",
    ].join("\n");

    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "MISSING_RP_RECORD")).toBe(true);
  });

  it("parses split control record 911 into normalized output", () => {
    const input = [
      "JAHISTC06,1",
      "1,山田 太郎,1,19800101",
      "5,20260310,1",
      "11,株式会社 工業会薬局 駅前店,13,4,1234567,,,03-3506-8010,1",
      "51,医療法人 工業会病院,13,1,1234567,1",
      "201,1,ノルバスク錠２．５ｍｇ,1,錠,2,612170709,1",
      "301,1,毎食後服用,3,日分,1,1,,1",
      "911,12345678901234,2,1",
    ].join("\n");

    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.data?.normalized.splitControl?.dataId).toBe("12345678901234");
    expect(result.data?.normalized.splitControl?.totalParts).toBe("2");
    expect(result.data?.normalized.splitControl?.partNumber).toBe("1");
  });

  it("parses representative split output data and preserves split control metadata", () => {
    const input = fixture("tc-split-output-part-2.txt");
    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();

    const normalized = result.data?.normalized;
    expect(normalized?.version).toBe("JAHISTC08");
    expect(normalized?.dispensings).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.prescriptions).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps).toHaveLength(1);
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]?.generalName,
    ).toBe("【般】アムロジピンベシル酸塩錠２．５ｍｇ");
    expect(normalized?.dispensings?.[0]?.overallCautions?.[0]?.text).toBe("他の薬との併用に注意");
    expect(normalized?.splitControl?.dataId).toBe("12345678901234");
    expect(normalized?.splitControl?.totalParts).toBe("3");
    expect(normalized?.splitControl?.partNumber).toBe("2");
  });

  it("reports invalid split control when partNumber exceeds totalParts", () => {
    const input = [
      "JAHISTC08,1",
      "1,山田 太郎,1,19800101",
      "5,20260310,1",
      "11,株式会社 工業会薬局 駅前店,13,4,1234567,,,03-3506-8010,1",
      "51,医療法人 工業会病院,13,1,1234567,1",
      "201,1,ノルバスク錠２．５ｍｇ,1,錠,2,612170709,1",
      "301,1,毎食後服用,3,日分,1,1,,1",
      "911,12345678901234,2,3",
    ].join("\n");

    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(
      result.issues.some(
        (issue) =>
          issue.code === "INVALID_FORMAT" &&
          issue.message.includes("partNumber must be less than or equal to totalParts"),
      ),
    ).toBe(true);
  });

  it("parses OTC ingredient record 31 and remaining medicine record 421", () => {
    const input = fixture("tc-with-otc-components-and-remaining-medicine.txt");
    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.data?.normalized.otcMedications).toHaveLength(1);
    expect(result.data?.normalized.otcMedications?.[0]?.sequence).toBe("1");
    expect(result.data?.normalized.otcMedications?.[0]?.janCode).toBe("4987107609229");
    expect(result.data?.normalized.otcMedications?.[0]?.ingredients).toHaveLength(2);
    expect(result.data?.normalized.otcMedications?.[0]?.ingredients?.[0]?.name).toBe(
      "イブプロフェン",
    );
    expect(result.data?.normalized.dispensings[0]?.remainingMedicineConfirmations).toHaveLength(1);
    expect(
      result.data?.normalized.dispensings[0]?.remainingMedicineConfirmations?.[0]?.text,
    ).toContain("ロキソプロフェンが10錠残薬");
  });

  it("reports missing OTC parent record when record 31 has no record 3 sequence", () => {
    const input = fixture("tc-invalid-missing-otc-sequence-parent.txt");
    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.issues.some((issue) => issue.code === "MISSING_REFERENCED_RECORD")).toBe(true);
  });

  it("normalizes a representative TC document with supported records and expected field values", () => {
    const input = fixture("tc-supported-records-full.txt");
    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();

    const normalized = result.data?.normalized;
    expect(normalized?.version).toBe("JAHISTC08");
    expect(normalized?.outputCategory).toBe("1");

    expect(normalized?.patient?.name).toBe("山田 太郎");
    expect(normalized?.patient?.sexCode).toBe("1");
    expect(normalized?.patient?.birthDate).toBe("19800101");
    expect(normalized?.patient?.postalCode).toBe("105-0004");
    expect(normalized?.patient?.address).toBe("東京都港区新橋1-2-3");
    expect(normalized?.patient?.phone).toBe("03-1234-5678");
    expect(normalized?.patient?.emergencyContact).toBe("090-9999-8888");
    expect(normalized?.patient?.bloodType).toBe("A+");
    expect(normalized?.patient?.weight).toBe("52.3");
    expect(normalized?.patient?.kanaName).toBe("ヤマダ タロウ");

    expect(normalized?.patientRemarks).toHaveLength(1);
    expect(normalized?.patientRemarks?.[0]?.remarkType).toBe("1");
    expect(normalized?.patientRemarks?.[0]?.text).toBe("アレルギー歴あり");
    expect(normalized?.patientRemarks?.[0]?.recordCreator).toBe("1");

    expect(normalized?.otcMedications).toHaveLength(1);
    expect(normalized?.otcMedications?.[0]?.name).toBe("イブA錠");
    expect(normalized?.otcMedications?.[0]?.startDate).toBe("20260301");
    expect(normalized?.otcMedications?.[0]?.endDate).toBe("20260307");
    expect(normalized?.otcMedications?.[0]?.recordCreator).toBe("1");
    expect(normalized?.otcMedications?.[0]?.sequence).toBe("1");
    expect(normalized?.otcMedications?.[0]?.janCode).toBe("4987107609229");
    expect(normalized?.otcMedications?.[0]?.ingredients).toHaveLength(1);
    expect(normalized?.otcMedications?.[0]?.ingredients?.[0]?.name).toBe("イブプロフェン");
    expect(normalized?.otcMedications?.[0]?.ingredients?.[0]?.codeType).toBe("2");
    expect(normalized?.otcMedications?.[0]?.ingredients?.[0]?.code).toBe("123456");
    expect(normalized?.otcMedications?.[0]?.ingredients?.[0]?.recordCreator).toBe("1");

    expect(normalized?.notebookMemos).toHaveLength(1);
    expect(normalized?.notebookMemos?.[0]?.text).toBe("食後に体調を記録してください");
    expect(normalized?.notebookMemos?.[0]?.inputDate).toBe("20260310");
    expect(normalized?.notebookMemos?.[0]?.recordCreator).toBe("1");

    expect(normalized?.dispensings).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.date).toBe("20260310");
    expect(normalized?.dispensings?.[0]?.recordCreator).toBe("1");
    expect(normalized?.dispensings?.[0]?.institution?.name).toBe("株式会社 工業会薬局 駅前店");
    expect(normalized?.dispensings?.[0]?.institution?.prefectureCode).toBe("13");
    expect(normalized?.dispensings?.[0]?.institution?.scoreTableCode).toBe("4");
    expect(normalized?.dispensings?.[0]?.institution?.institutionCode).toBe("1234567");
    expect(normalized?.dispensings?.[0]?.institution?.postalCode).toBe("105-0004");
    expect(normalized?.dispensings?.[0]?.institution?.address).toBe("東京都港区新橋1-1-1");
    expect(normalized?.dispensings?.[0]?.institution?.phone).toBe("03-3506-8010");
    expect(normalized?.dispensings?.[0]?.institution?.recordCreator).toBe("1");
    expect(normalized?.dispensings?.[0]?.staff?.name).toBe("工業会 次郎");
    expect(normalized?.dispensings?.[0]?.staff?.contact).toBe("03-3506-8010");
    expect(normalized?.dispensings?.[0]?.staff?.recordCreator).toBe("1");

    expect(normalized?.dispensings?.[0]?.prescriptions).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.prescribingInstitution?.name).toBe(
      "医療法人 工業会病院",
    );
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.prescribingInstitution?.prefectureCode,
    ).toBe("13");
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.prescribingInstitution?.scoreTableCode,
    ).toBe("1");
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.prescribingInstitution?.institutionCode,
    ).toBe("7654321");
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.prescribingInstitution?.recordCreator,
    ).toBe("1");
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.prescribingDoctors).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.prescribingDoctors?.[0]?.name).toBe(
      "工業会 太郎",
    );
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.prescribingDoctors?.[0]?.departmentName,
    ).toBe("内科");
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.prescribingDoctors?.[0]?.recordCreator,
    ).toBe("1");

    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.rpNumber).toBe(1);
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.usageName).toBe(
      "毎食後服用",
    );
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.dispensingQuantity).toBe(
      "3",
    );
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.dispensingUnit).toBe("日分");
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.dosageFormCode).toBe("1");
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.usageCodeType).toBe("1");
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.usageCode).toBe("");
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.usageRecordCreator).toBe(
      "1",
    );
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]?.name).toBe(
      "ノルバスク錠２．５ｍｇ",
    );
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]?.amount).toBe(
      "1",
    );
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]?.unitName).toBe(
      "錠",
    );
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]?.drugCodeType,
    ).toBe("2");
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]?.drugCode).toBe(
      "612170709",
    );
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]?.recordCreator,
    ).toBe("1");
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]?.generalName,
    ).toBe("【般】アムロジピンベシル酸塩錠２．５ｍｇ");
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]?.generalNameCodeType,
    ).toBe("2");
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]?.generalNameCode,
    ).toBe("1179044F1ZZZ");
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugSupplements,
    ).toHaveLength(1);
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugSupplements?.[0]?.text,
    ).toBe("朝1錠、夕2錠");
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugCautions).toHaveLength(
      1,
    );
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugCautions?.[0]?.text,
    ).toBe("グレープフルーツジュースを避ける");
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.usageSupplements,
    ).toHaveLength(1);
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.usageSupplements?.[0]?.text,
    ).toBe("透析日は休薬");
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.prescriptionCautions,
    ).toHaveLength(1);
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.prescriptionCautions?.[0]?.text,
    ).toBe("眠気に注意");

    expect(normalized?.dispensings?.[0]?.overallCautions).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.overallCautions?.[0]?.text).toBe("他の薬との併用に注意");
    expect(normalized?.dispensings?.[0]?.providedInfos).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.providedInfos?.[0]?.text).toBe("粉砕して交付");
    expect(normalized?.dispensings?.[0]?.providedInfos?.[0]?.infoType).toBe("31");
    expect(normalized?.dispensings?.[0]?.providedInfos?.[0]?.recordCreator).toBe("1");
    expect(normalized?.dispensings?.[0]?.remainingMedicineConfirmations).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.remainingMedicineConfirmations?.[0]?.text).toBe(
      "残薬は5錠",
    );
    expect(normalized?.dispensings?.[0]?.remarks).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.remarks?.[0]?.text).toBe("正しい飲み方は薬袋を参照");
    expect(normalized?.dispensings?.[0]?.patientEntries).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.patientEntries?.[0]?.text).toBe("昼に眠くなった");
    expect(normalized?.dispensings?.[0]?.patientEntries?.[0]?.inputDate).toBe("20260311");

    expect(normalized?.familyPharmacist?.name).toBe("工業会 次郎");
    expect(normalized?.familyPharmacist?.pharmacyName).toBe("工業会薬局 駅前店");
    expect(normalized?.familyPharmacist?.contact).toBe("03-3506-8010");
    expect(normalized?.familyPharmacist?.startDate).toBe("20260310");
    expect(normalized?.familyPharmacist?.endDate).toBe("20270310");
    expect(normalized?.familyPharmacist?.recordCreator).toBe("1");

    expect(normalized?.splitControl?.dataId).toBe("12345678901234");
    expect(normalized?.splitControl?.totalParts).toBe("2");
    expect(normalized?.splitControl?.partNumber).toBe("1");
  });

  it("parses output category 2 data with a two-digit header version and patient-authored content", () => {
    const input = fixture("tc-output-category-2-full.txt");
    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();

    const normalized = result.data?.normalized;
    expect(normalized?.version).toBe("JAHISTC12");
    expect(normalized?.outputCategory).toBe("2");

    expect(normalized?.patient?.name).toBe("鈴木 太郎");
    expect(normalized?.patient?.sexCode).toBe("1");
    expect(normalized?.patient?.birthDate).toBe("S330303");
    expect(normalized?.patient?.postalCode).toBe("105-0004");
    expect(normalized?.patient?.address).toBe("東京都港区新橋○丁目");
    expect(normalized?.patient?.phone).toBe("03-0000-0000");
    expect(normalized?.patient?.emergencyContact).toBe("090-0000-0000");
    expect(normalized?.patient?.bloodType).toBe("Ｂ＋");
    expect(normalized?.patient?.weight).toBe("63.7");
    expect(normalized?.patient?.kanaName).toBe("スズキ タロウ");

    expect(normalized?.patientRemarks).toHaveLength(2);
    expect(normalized?.patientRemarks?.[0]?.remarkType).toBe("1");
    expect(normalized?.patientRemarks?.[0]?.text).toBe("乳製品");
    expect(normalized?.patientRemarks?.[1]?.remarkType).toBe("2");
    expect(normalized?.patientRemarks?.[1]?.text).toBe("セフェム系（発熱）");

    expect(normalized?.otcMedications).toHaveLength(1);
    expect(normalized?.otcMedications?.[0]?.name).toBe("バファリン");
    expect(normalized?.otcMedications?.[0]?.startDate).toBe("R020406");
    expect(normalized?.otcMedications?.[0]?.endDate).toBe("R020409");
    expect(normalized?.otcMedications?.[0]?.recordCreator).toBe("2");
    expect(normalized?.otcMedications?.[0]?.sequence).toBe("1");
    expect(normalized?.otcMedications?.[0]?.ingredients).toHaveLength(1);
    expect(normalized?.otcMedications?.[0]?.ingredients?.[0]?.name).toBe("イブプロフェン");
    expect(normalized?.otcMedications?.[0]?.ingredients?.[0]?.codeType).toBe("2");
    expect(normalized?.otcMedications?.[0]?.ingredients?.[0]?.code).toBe("1149001");
    expect(normalized?.otcMedications?.[0]?.ingredients?.[0]?.recordCreator).toBe("2");

    expect(normalized?.notebookMemos).toHaveLength(1);
    expect(normalized?.notebookMemos?.[0]?.text).toBe("健康診断");
    expect(normalized?.notebookMemos?.[0]?.inputDate).toBe("R020411");
    expect(normalized?.notebookMemos?.[0]?.recordCreator).toBe("2");

    expect(normalized?.dispensings).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.date).toBe("R020410");
    expect(normalized?.dispensings?.[0]?.institution?.name).toBe("株式会社 工業会薬局 駅前店");
    expect(normalized?.dispensings?.[0]?.institution?.recordCreator).toBe("1");
    expect(normalized?.dispensings?.[0]?.staff?.name).toBe("薬剤師 次郎");
    expect(normalized?.dispensings?.[0]?.staff?.recordCreator).toBe("1");

    expect(normalized?.dispensings?.[0]?.prescriptions).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.prescribingInstitution?.name).toBe(
      "医療法人 工業会病院",
    );
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.prescribingInstitution?.recordCreator,
    ).toBe("1");
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.rpNumber).toBe(1);
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.usageName).toBe(
      "【分１ 朝食後服用】",
    );
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.dispensingQuantity).toBe(
      "28",
    );
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.dispensingUnit).toBe("日分");
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.dosageFormCode).toBe("1");
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.usageCodeType).toBe("1");
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.usageCode).toBe("");
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]?.name).toBe(
      "アダラートCR錠20mg",
    );
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]?.drugCode).toBe(
      "610421321",
    );
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugCautions).toHaveLength(
      1,
    );
    expect(
      normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugCautions?.[0]?.text,
    ).toBe("グレープフルーツジュースと一緒に飲まないでください。");

    expect(normalized?.dispensings?.[0]?.overallCautions).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.overallCautions?.[0]?.text).toBe(
      "他の薬を併用する際は、相談してください。",
    );
    expect(normalized?.dispensings?.[0]?.patientEntries).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.patientEntries?.[0]?.text).toBe(
      "朝に薬を飲んだ後、めまいがあった",
    );
    expect(normalized?.dispensings?.[0]?.patientEntries?.[0]?.inputDate).toBe("R020407");

    expect(normalized?.familyPharmacist?.name).toBe("薬剤師 次郎");
    expect(normalized?.familyPharmacist?.pharmacyName).toBe("工業会薬局 駅前店");
    expect(normalized?.familyPharmacist?.contact).toBe("03-3333-3333");
    expect(normalized?.familyPharmacist?.startDate).toBe("");
    expect(normalized?.familyPharmacist?.endDate).toBe("");
    expect(normalized?.familyPharmacist?.recordCreator).toBe("1");
  });

  it("separates multiple dispensing blocks into independent normalized groups", () => {
    const input = fixture("tc-multi-dispensing.txt");
    const result = parseJahisTc(input, { strict: true });

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();

    const normalized = result.data?.normalized;
    expect(normalized?.dispensings).toHaveLength(2);

    expect(normalized?.dispensings?.[0]?.date).toBe("20260312");
    expect(normalized?.dispensings?.[0]?.institution?.name).toBe("株式会社 工業会薬局 本店");
    expect(normalized?.dispensings?.[0]?.staff?.name).toBe("工業会 次郎");
    expect(normalized?.dispensings?.[0]?.prescriptions).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.prescribingInstitution?.name).toBe(
      "医療法人 工業会病院",
    );
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.prescribingDoctors?.[0]?.name).toBe(
      "工業会 太郎",
    );
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps).toHaveLength(1);
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.usageName).toBe(
      "毎食後服用",
    );
    expect(normalized?.dispensings?.[0]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]?.name).toBe(
      "ノルバスク錠２．５ｍｇ",
    );
    expect(normalized?.dispensings?.[0]?.remarks?.[0]?.text).toBe("初回調剤ブロックの備考");

    expect(normalized?.dispensings?.[1]?.date).toBe("20260220");
    expect(normalized?.dispensings?.[1]?.institution?.name).toBe("株式会社 工業会薬局 南店");
    expect(normalized?.dispensings?.[1]?.staff?.name).toBe("工業会 花子");
    expect(normalized?.dispensings?.[1]?.prescriptions).toHaveLength(1);
    expect(normalized?.dispensings?.[1]?.prescriptions?.[0]?.prescribingInstitution?.name).toBe(
      "医療法人 中央病院",
    );
    expect(normalized?.dispensings?.[1]?.prescriptions?.[0]?.prescribingDoctors?.[0]?.name).toBe(
      "中央 一郎",
    );
    expect(normalized?.dispensings?.[1]?.prescriptions?.[0]?.rps).toHaveLength(1);
    expect(normalized?.dispensings?.[1]?.prescriptions?.[0]?.rps?.[0]?.usageName).toBe(
      "朝夕食後服用",
    );
    expect(normalized?.dispensings?.[1]?.prescriptions?.[0]?.rps?.[0]?.drugs?.[0]?.name).toBe(
      "ロキソニン錠６０ｍｇ",
    );
    expect(normalized?.dispensings?.[1]?.overallCautions?.[0]?.text).toBe("疼痛時の服用状況を確認");
    expect(normalized?.dispensings?.[1]?.remarks?.[0]?.text).toBe("２回目調剤ブロックの備考");
  });
});
