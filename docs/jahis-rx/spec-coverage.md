# JAHIS 仕様カバレッジ表

このドキュメントは、`jahis-rx-parser` の実装上の対応状況を示します。

- `Parse` 対応の一次情報: `src/records/decode-record.ts`
- `Normalize` 対応の一次情報: `src/build/build-prescription.ts`
- `Validate` ルールの一次情報: `src/jahis-rx/parse-jahis.ts`
- テストカバレッジの一次情報: `test/*.test.ts`

## ステータス定義

- `Supported`: Parse/Normalizeが実装され、主要動作がテストで確認済み。
- `Partially Supported`: レコード自体は処理できるが、仕様上の一部要素や拡張ケースが未実装。
- `Not Yet Supported`: レコードデコード未実装（未知レコードとして保持）。

## レコード対応表

| レコードNo | 名称                            | ステータス | Parse | Normalize | Validate | Test | 備考                                                                                               |
| ---------- | ------------------------------- | ---------- | ----- | --------- | -------- | ---- | -------------------------------------------------------------------------------------------------- |
| `JAHIS*`   | ヘッダ                          | Supported  | Yes   | N/A       | Yes      | Yes  | 先頭行が `JAHIS` で始まることを検証。                                                              |
| `1`        | Institution                     | Supported  | Yes   | Yes       | Indirect | Yes  | 医療機関情報。                                                                                     |
| `2`        | Institution Address             | Supported  | Yes   | Yes       | Indirect | Yes  | 医療機関住所情報。                                                                                 |
| `3`        | Institution Phone               | Supported  | Yes   | Yes       | Indirect | Yes  | 医療機関電話情報。                                                                                 |
| `4`        | Department                      | Supported  | Yes   | Yes       | Indirect | Yes  | 診療科情報。                                                                                       |
| `5`        | Doctor                          | Supported  | Yes   | Yes       | Indirect | Yes  | 医師情報。                                                                                         |
| `11`       | Patient Name                    | Supported  | Yes   | Yes       | Yes      | Yes  | `12`/`13` との整合を検証。                                                                         |
| `12`       | Patient Sex                     | Supported  | Yes   | Yes       | Yes      | Yes  | 患者基本セットの必須要素。                                                                         |
| `13`       | Patient Birth Date              | Supported  | Yes   | Yes       | Yes      | Yes  | 患者基本セットの必須要素。                                                                         |
| `14`       | Patient Copay Class             | Supported  | Yes   | Yes       | Indirect | Yes  | 患者一部負担区分。                                                                                 |
| `21`       | Insurance Type                  | Supported  | Yes   | Yes       | Yes      | Yes  | 保険グループとして `22`/`23` を要求。                                                              |
| `22`       | Insurer Number                  | Supported  | Yes   | Yes       | Yes      | Yes  | 保険グループの中核。                                                                               |
| `23`       | Insurance Card                  | Supported  | Yes   | Yes       | Yes      | Yes  | 保険グループの中核。                                                                               |
| `24`       | Copay / Benefit Rates           | Supported  | Yes   | Yes       | Indirect | Yes  | 負担率・給付率。                                                                                   |
| `25`       | Occupational Accident Reason    | Supported  | Yes   | Yes       | Indirect | Yes  | 職務上事由。                                                                                       |
| `27`       | First Public Expense            | Supported  | Yes   | Yes       | Indirect | Yes  | 公費1。                                                                                            |
| `28`       | Second Public Expense           | Supported  | Yes   | Yes       | Indirect | Yes  | 公費2。                                                                                            |
| `29`       | Third Public Expense            | Supported  | Yes   | Yes       | Indirect | Yes  | 公費3。                                                                                            |
| `30`       | Special Public Expense          | Supported  | Yes   | Yes       | Indirect | Yes  | 特殊公費。                                                                                         |
| `31`       | Receipt Type                    | Supported  | Yes   | Yes       | Indirect | Yes  | レセプト種別。                                                                                     |
| `51`       | Prescription Date               | Supported  | Yes   | Yes       | Yes      | Yes  | 日付は7桁または8桁の数字を要求。                                                                   |
| `52`       | Dispensing Due Date             | Supported  | Yes   | Yes       | Yes      | Yes  | 日付は7桁または8桁の数字を要求。                                                                   |
| `61`       | Narcotics                       | Supported  | Yes   | Yes       | Indirect | Yes  | 麻薬施用情報。                                                                                     |
| `62`       | Remaining Medicine Confirmation | Supported  | Yes   | Yes       | Indirect | Yes  | 残薬確認。                                                                                         |
| `63`       | Split Dispensing Instruction    | Supported  | Yes   | Yes       | Yes      | Yes  | `currentCount <= totalCount` を検証。                                                              |
| `64`       | Refill Prescription Info        | Supported  | Yes   | Yes       | Indirect | Yes  | リフィル情報。                                                                                     |
| `81`       | Note                            | Supported  | Yes   | Yes       | Yes      | Yes  | 連番は1始まりで欠番なしを検証。                                                                    |
| `82`       | Prescription Number             | Supported  | Yes   | Yes       | Yes      | Yes  | `numberType` と `number` は同時存在が必要。                                                        |
| `101`      | RP Basic Information            | Supported  | Yes   | Yes       | Yes      | Yes  | `102`/`111`/`181`/`201`/`211`/`221`/`231`/`241` の参照先RP。拡張レイアウト(追加列あり)も互換対応。 |
| `102`      | Split Dispensing Quantity by RP | Supported  | Yes   | Yes       | Yes      | Yes  | RP単位の分割調剤数量。`63` が存在する場合のみ有効。                                                |
| `111`      | Usage                           | Supported  | Yes   | Yes       | Yes      | Yes  | 参照RPが `101` で存在することを検証。拡張レイアウト(追加列あり)も互換対応。                        |
| `181`      | Usage Supplement                | Supported  | Yes   | Yes       | Yes      | Yes  | 同一RPの `111` に補足情報を紐付け。拡張レイアウト(追加列あり)も互換対応。                          |
| `201`      | Drug                            | Supported  | Yes   | Yes       | Yes      | Yes  | 参照RPが `101` で存在することを検証。拡張レイアウト(追加列あり)も互換対応。                        |
| `211`      | Unit Conversion                 | Supported  | Yes   | Yes       | Yes      | Yes  | 同一RP/薬品番号の `201` に単位変換情報を紐付け。拡張レイアウト(追加列あり)も互換対応。             |
| `221`      | Uneven Dosing                   | Supported  | Yes   | Yes       | Yes      | Yes  | 同一RP/薬品番号の `201` に不均等服用情報を紐付け。拡張レイアウト(追加列あり)も互換対応。           |
| `231`      | Burden Category by Drug         | Supported  | Yes   | Yes       | Yes      | Yes  | 同一RP/薬品番号の `201` に負担区分情報を紐付け。拡張レイアウト(追加列あり)も互換対応。             |
| `241`      | Single-dose Amount              | Supported  | Yes   | Yes       | Yes      | Yes  | 同一RP/薬品番号の `201` に1回量情報を紐付け。拡張レイアウト(追加列あり)も互換対応。                |
| `281`      | Drug Supplement                 | Supported  | Yes   | Yes       | Yes      | Yes  | 同一RP/薬品番号の `201` に補足情報を紐付け。拡張レイアウト(追加列あり)も互換対応。                 |

注記（最近の拡張）:

- Parse/Normalizeは、Ver.1.10の主要追加項目も保持可能。
- 具体例: `1`(codeType/prefectureCode)、`2`(postalCode)、`3`(fax/otherContact)、`4`(departmentCodeType/departmentCode)、`101`(dispensingQuantity)、`201`(infoClass/codeType/potencyFlag)、`241`(timesPerDay)、`281`(supplementSequence/supplementClass/supplementUsageCode)、`231`(4公費負担区分)、`221`(回別量/回別コード)。

## 検証ルール

実装済みの主な検証ルールは以下です。

- RP整合: `102`/`111`/`181`/`201`/`211`/`221`/`231`/`241` が参照するRP番号に対応する `101` が必要。
- 必須トップレコード整合: `1`/`5`/`11`/`51` が必要。
- 患者基本セット整合: `11` が存在する場合、`12` と `13` も必要。
- 保険グループ整合: 保険系レコード群が存在する場合、`22` と `23` が必要。
- 仕様外レコード整合: 仕様外レコード番号は `strict: true` で error、`strict: false` で warning。
- 処方箋番号整合: `82` は `numberType` と `number` が同時に存在する必要。
- 日付形式整合: `51`/`52` は7桁または8桁の数字。
- 分割回数整合: `63` は `currentCount <= totalCount`。
- RP分割数量整合: `102` が存在する場合、`63` が必要。
- RPコア整合: RPグループが存在する場合、`101` が必要。各 `101` に対応する `111`/`201` が必要。
- 用法補足整合: `181` が存在する場合、同一RPの `111` が必要。
- 単位変換整合: `211` が存在する場合、同一RP/薬品番号の `201` が必要。
- 単位変換条件必須整合: `drugPriceUnitByCode` 指定時、`201` の単位が薬価収載単位と不一致なら同一RP/薬品番号の `211` が必要。
- 条件付き必須整合: `prescriptionContext` 指定時、`4`/`14`/`25`/`27`/`28`/`29`/`30`/`52`/`61` の条件付き必須を検証。
- 不均等服用整合: `221` が存在する場合、同一RP/薬品番号の `201` が必要。
- 負担区分整合: `231` が存在する場合、同一RP/薬品番号の `201` が必要。
- 負担区分混在整合: `231` は処方箋内で全薬品出力または全薬品未出力のいずれか（混在不可）。
- 1回量整合: `241` が存在する場合、同一RP/薬品番号の `201` が必要。
- 薬品補足整合: `281` が存在する場合、同一RP/薬品番号の `201` が必要。
- 備考連番整合: `81` は1開始で連続する連番。
- 出力順整合: `1`-`82` は昇順、かつRP/薬品グループ開始後に `1`-`82` を出力しない。RP内は `101 -> 111 -> 201` の順序を検証。
- 必須項目整合: 主要レコードの `◎` 必須項目未出力を `REQUIRED_FIELD_MISSING` として検出。
- 代替必須整合: `2`（郵便番号/住所）と `11`（漢字氏名/カナ氏名）の `●` 条件を `REQUIRED_ONE_OF_MISSING` として検出。
- 件数整合: `111`（1RP=1件）、`102`（1RP=最大1件、`63` 存在時は各RPで対応推奨）、`211/221/231/241`（1薬品=最大1件）を `INVALID_RECORD_CARDINALITY` として検出。

運用注記:

- 上記の「必須項目整合 / 代替必須整合 / 件数整合」は、`strict: true` では error、`strict: false` では warning として報告する。

## メンテナンス

実装変更時は、以下を同時更新してください。

1. `src/records/decode-record.ts` / `src/build/build-prescription.ts` の対応状況
2. `README.md` のサマリー件数
3. この `docs/spec-coverage.md` の対象行
4. `test/*.test.ts` に最低1つの根拠テスト
