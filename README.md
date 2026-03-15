# jahis-rx-parser

## 概要 Overview

JAHIS院外処方箋2次元コード文字列を解析し、JSONへ変換するTypeScriptライブラリです。

このパッケージは、すでにデコード済みのJAHIS処方箋テキストを解析します。

対象外:

- QR画像の読み取り
- OCR
- カメラアクセス
- 外部薬剤マスタによる妥当性検証

A TypeScript library that parses JAHIS outpatient prescription 2D barcode text into JSON.

This package only parses already-decoded JAHIS prescription text.

It does not:

- read QR images
- perform OCR
- access cameras
- validate against external drug master data

## インストール Install

`npm` でインストールします。

Install via `npm`.

```bash
npm install jahis-rx-parser
```

## 使用方法 Usage

`parseJahisRx` にJAHISテキストを渡すと、`ok/data/issues` を返します。

Pass JAHIS text to `parseJahisRx`; it returns `ok/data/issues`.

```ts
import { parseJahisRx } from "jahis-rx-parser";

const input = [
  "JAHIS10",
  "1,1234567,Test Clinic",
  "51,20260310",
  "101,1,1,内服",
  "111,1,3,毎食後",
  "201,1,1,620000001,Acetaminophen,3,錠",
].join("\n");

const result = parseJahisRx(input, { strict: true });

if (!result.ok) {
  console.error(result.issues);
} else {
  console.log(result.data?.raw);
  console.log(result.data?.normalized);
}
```

## サポートするレコード種別 Supported Records (v1)

以下のレコードに対応しています。

The following records are currently supported.

| No.      | 種別               | Kind                            |
| -------- | ------------------ | ------------------------------- |
| `JAHIS*` | バージョン情報     | Header / Version                |
| `1`      | 医療機関           | Institution                     |
| `2`      | 医療機関住所       | Institution Address             |
| `3`      | 医療機関電話番号   | Institution Phone               |
| `4`      | 診療科             | Department                      |
| `5`      | 医師               | Doctor                          |
| `11`     | 患者氏名           | Patient Name                    |
| `12`     | 患者性別           | Patient Sex                     |
| `13`     | 患者生年月日       | Patient Birth Date              |
| `14`     | 患者一部負担区分   | Patient Copay Class             |
| `21`     | 保険種別           | Insurance Type                  |
| `22`     | 保険者番号         | Insurer Number                  |
| `23`     | 記号番号           | Insurance Card                  |
| `24`     | 負担・給付率       | Copay / Benefit Rates           |
| `25`     | 職務上の事由       | Occupational Accident Reason    |
| `27`     | 第一公費           | First Public Expense            |
| `28`     | 第二公費           | Second Public Expense           |
| `29`     | 第三公費           | Third Public Expense            |
| `30`     | 特殊公費           | Special Public Expense          |
| `31`     | レセプト種別       | Receipt Type                    |
| `51`     | 処方箋交付年月日   | Prescription Date               |
| `52`     | 使用期限年月日     | Dispensing Due Date             |
| `61`     | 麻薬施用           | Narcotics                       |
| `62`     | 残薬確認欄         | Remaining Medicine Confirmation |
| `63`     | 分割指示           | Split Dispensing Instruction    |
| `64`     | リフィル処方箋情報 | Refill Prescription Info        |
| `81`     | 備考               | Note                            |
| `82`     | 処方箋番号         | Prescription Number             |
| `101`    | 剤形               | RP Basic Information            |
| `102`    | RP毎分割調剤数量   | Split Dispensing Quantity by RP |
| `111`    | 用法               | Usage                           |
| `181`    | 用法補足           | Usage Supplement                |
| `201`    | 薬品               | Drug                            |
| `211`    | 単位変換           | Unit Conversion                 |
| `221`    | 不均等服用         | Uneven Dosing                   |
| `231`    | 薬剤別負担区分     | Burden Category by Drug         |
| `241`    | 1回服用量          | Single-dose Amount              |
| `281`    | 薬品補足           | Drug Supplement                 |

未知レコードはデフォルトで `data.normalized.unknownRecords` に保持されます。

補足: 上記マッピングはJAHIS Ver.1.10のレコード定義テーブルに基づきます。

Unknown record codes are preserved under `data.normalized.unknownRecords` by default.

Developer note: mappings above are based on JAHIS Ver.1.10 table definitions for each record number.

## 仕様対応状況 Specification Coverage

詳細な対応マトリクスは以下を参照してください。

See the detailed implementation coverage matrix:

- `docs/spec-coverage.md`
- `docs/jahis-record-spec.md`

現時点サマリー:

- 対応済み: 37レコード + ヘッダー (`JAHIS*`)
- 未対応: 0レコード
- 未対応レコードはデフォルトで `data.normalized.unknownRecords` に保持

Current summary:

- Supported: 37 records + header (`JAHIS*`)
- Not yet supported: 0 records
- Unsupported records are preserved in `data.normalized.unknownRecords` by default

## 検証 Validation Behavior

- `strict: true`: 構造不整合（例: `101`なしで`111`/`201`）をerror扱い
- `strict: false`: 同条件をwarning扱いで継続
- `preserveUnknownRecords: false`: `unknownRecords` をnormalized出力から除外
- `drugPriceUnitByCode`: 薬品コードごとの薬価収載単位マップ（指定時のみ `201` の単位差分に対し `211` 必須を検証）
- `prescriptionContext`: 仕様の「当該処方箋」などの条件付き必須を外部コンテキストで明示し、対象レコードの必須検証を有効化
- 仕様の `◎`/`●` 必須項目チェックと一部件数チェック（例: `111`/`102`/`211`/`221`/`231`/`241`）は、`strict: true` でerror、`strict: false` でwarning

- `strict: true`: structural issues (for example, `111`/`201` without `101`) are treated as errors.
- `strict: false`: the same issues are warnings and parsing continues.
- `preserveUnknownRecords: false`: omits `unknownRecords` from normalized output.
- `drugPriceUnitByCode`: optional code-to-listed-unit map; when provided, unit mismatch in `201` requires `211`.
- `prescriptionContext`: enables conditional-required validations (for context-dependent rules in the spec).
- New checks for spec-required items (`◎`/`●`) and selected cardinality constraints are treated as errors in strict mode and warnings in non-strict mode.

詳細な検証ルール一覧は `docs/spec-coverage.md` を参照してください。

For the full validation rule matrix, see `docs/spec-coverage.md`.

## ランタイム Runtime

このパッケージはアイソモーフィックに設計されており、ブラウザ環境とNode.js環境の両方で動作します。

This package is designed to be isomorphic and works in both browser and Node.js environments.
