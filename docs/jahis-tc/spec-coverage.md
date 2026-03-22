# JAHIS TC 仕様カバレッジ表

このドキュメントは、`jahis-rx-parser` における JAHIS 電子版お薬手帳データフォーマット仕様書 Ver.2.6 の実装対応状況を示します。

- `Parse` 対応の一次情報: `src/jahis-tc/records/decode-jahis-tc-record.ts`
- `Normalize` 対応の一次情報: `src/jahis-tc/build/build-jahis-tc-notebook.ts`
- `Validate` ルールの一次情報: `src/jahis-tc/validation/validate-jahis-tc-records.ts`
- テストカバレッジの一次情報: `test/parse-jahis-tc.test.ts`, `test/parse-jahis.test.ts`

## ステータス定義

- `Supported`: Parse/Normalize が実装され、主要動作がテストで確認済み。
- `Partially Supported`: レコード自体は処理できるが、仕様上の一部項目や拡張要素は未実装。
- `Not Yet Supported`: レコードデコード未実装、または未知レコードとして保持。

## 実装メモ

- 仕様書 Ver.2.6 のバージョン情報は `JAHISTC08`。
- 実装上のヘッダ検証は `JAHISTC` + 2桁数字を許容しており、特定の版番号 `08` に固定していない。
- 現在の正規化モデルは、患者情報、OTC/メモ、調剤ブロック、RP、かかりつけ薬剤師、分割制御を保持する。
- Ver.2.5 で追加された `31` レコードは実装済み。
- Ver.2.4 で追加された `421` レコードは実装済み。
- `201` の一般名関連項目は保持済みで、一般名コード種別 `1/2`、条件付き必須、`X 12` 書式まで validate 済み。

## レコード対応表

| レコードNo | 名称                                   | ステータス          | Parse   | Normalize | Validate | Test     | 備考                                                                  |
| ---------- | -------------------------------------- | ------------------- | ------- | --------- | -------- | -------- | --------------------------------------------------------------------- |
| `JAHISTC*` | バージョンレコード                     | Supported           | Yes     | Yes       | Yes      | Yes      | `outputCategory` を保持。実装は `JAHISTC08` 固定ではなく2桁版を許容。 |
| `1`        | 患者情報レコード                       | Supported           | Yes     | Yes       | Yes      | Yes      | 氏名、性別、生年月日、住所、電話、血液型、体重、カナ氏名を保持。      |
| `2`        | 患者特記レコード                       | Supported           | Yes     | Yes       | Yes      | Yes      | 種別 `1/2/3/9` とレコード作成者を検証。                               |
| `3`        | 要指導医薬品・一般用医薬品服用レコード | Supported           | Yes     | Yes       | Yes      | Yes      | 名称、開始日、終了日、作成者、通番、JAN コードを保持。                |
| `31`       | 要指導医薬品・一般用医薬品成分レコード | Supported           | Yes     | Yes       | Yes      | Yes      | `3` の通番に紐付く成分情報として保持。                                |
| `4`        | 手帳メモレコード                       | Supported           | Yes     | Yes       | Yes      | Yes      | メモ本文、入力日、作成者を保持。                                      |
| `5`        | 調剤等年月日レコード                   | Supported           | Yes     | Yes       | Yes      | Yes      | 調剤ブロック開始として扱う。                                          |
| `11`       | 調剤－医療機関等レコード               | Supported           | Yes     | Yes       | Yes      | Yes      | 出力区分 `1` では都道府県、点数表、コードを必須検証。                 |
| `15`       | 調剤－医師・薬剤師レコード             | Supported           | Yes     | Yes       | Yes      | Yes      | 氏名、連絡先、作成者を保持。                                          |
| `51`       | 処方－医療機関レコード                 | Supported           | Yes     | Yes       | Yes      | Yes      | 調剤ブロック内に薬品系レコードがある場合の必須条件を検証。            |
| `55`       | 処方－医師レコード                     | Supported           | Yes     | Yes       | Yes      | Yes      | 複数医師レコードの繰り返しを保持可能。                                |
| `201`      | 薬品レコード                           | Supported           | Yes     | Yes       | Yes      | Yes      | 一般名3項目まで保持。種別 `1/2`、条件付き必須、`X 12` 書式を validate。 |
| `281`      | 薬品補足レコード                       | Supported           | Yes     | Yes       | Yes      | Yes      | 同一 RP に紐付け。                                                    |
| `291`      | 薬品服用注意レコード                   | Supported           | Yes     | Yes       | Yes      | Yes      | 同一 RP に紐付け。                                                    |
| `301`      | 用法レコード                           | Supported           | Yes     | Yes       | Yes      | Yes      | 用法名、数量、単位、剤形、用法コード種別/コードを保持。               |
| `311`      | 用法補足レコード                       | Supported           | Yes     | Yes       | Yes      | Yes      | 対応する `301` が必要。                                               |
| `391`      | 処方服用注意レコード                   | Supported           | Yes     | Yes       | Yes      | Yes      | 対応する RP の基底レコード有無を検証。                                |
| `401`      | 服用注意レコード                       | Supported           | Yes     | Yes       | Yes      | Yes      | 調剤ブロック単位の注意情報として保持。                                |
| `411`      | 医療機関等提供情報レコード             | Supported           | Yes     | Yes       | Yes      | Yes      | 提供情報種別 `30/31/99` を検証。                                      |
| `421`      | 残薬確認レコード                       | Supported           | Yes     | Yes       | Yes      | Yes      | 調剤ブロック単位の残薬確認情報として保持。                            |
| `501`      | 備考レコード                           | Supported           | Yes     | Yes       | Yes      | Yes      | 調剤ブロックの備考として保持。                                        |
| `601`      | 患者等記入レコード                     | Supported           | Yes     | Yes       | Yes      | Yes      | 入力日も保持。                                                        |
| `701`      | かかりつけ薬剤師レコード               | Supported           | Yes     | Yes       | Yes      | Yes      | 氏名、薬局名、連絡先、開始日、終了日を保持。                          |
| `911`      | 分割制御レコード                       | Supported           | Yes     | Yes       | Yes      | Yes      | `dataId` 14桁、`partNumber <= totalParts` を検証。                    |

## 検証ルール

実装済みの主な検証ルールは以下です。

- ヘッダ整合: 先頭行が `JAHISTC` ヘッダであることを検証。
- ヘッダ版番号整合: `JAHISTC` に続く2桁数字を検証。
- 出力区分整合: `outputCategory` が `1` または `2` であることを検証。
- 患者基本情報整合: `1` の氏名、性別、生年月日を検証。
- 日付形式整合: 西暦 `YYYYMMDD` または和暦 `GYYMMDD` を検証。
- 郵便番号/電話/体重整合: `1`、`11` などの書式を検証。
- レコード作成者整合: `1/2/8/9` の列挙値を検証。
- 調剤ブロック整合: `5` より前に調剤ブロック配下レコードが来た場合は順序エラー。
- 出力区分 `1` の必須レコード整合: 少なくとも1つの調剤ブロックを要求。
- 出力区分 `2` の必須レコード整合: 患者レコード `1` を要求。
- `11` 必須整合: 出力区分 `1` の各調剤ブロックで `11` を要求。
- `51` 必須整合: 薬品系レコードが存在する調剤ブロックで `51` を要求。
- RP 整合: `201` と `301` は同一 RP 番号で対になることを検証。
- RP 参照整合: `281`/`291`/`311`/`391` が参照する RP の基底レコード存在を検証。
- `201` 条件付き必須整合: 薬品コード種別が `1` 以外なら薬品コードを要求。
- `301` 条件付き必須整合: 用法コード種別が `1` 以外なら用法コードを要求。
- `301` 用法名整合: 出力区分 `1` で剤形 `9`/`10` 以外なら用法名称を要求。
- `31` OTC 成分参照整合: `3` の通番が存在することを検証。
- `31` 条件付き必須整合: 成分コード種別が `1` 以外なら成分コードを要求。
- `411` 提供情報種別整合: `30/31/99` のみを許容。
- `421` 残薬確認整合: 内容とレコード作成者を検証。
- `911` 分割制御整合: 桁数と `partNumber <= totalParts` を検証。
- 未対応レコード整合: 実装対象外のレコード番号は `UNSUPPORTED_RECORD` を報告。

運用注記:

- `strict: true` では、上記の検証失敗は `error` として扱う。
- `strict: false` では、ヘッダ欠落や空入力などの一部を除き `warning` として扱う。
- 未知レコードはデフォルトで `normalized.unknownRecords` に保持される。

## 今後の実装候補

- `JAHISTC` に続く2桁版ヘッダを許容したまま、版差分による未対応項目を明示すること。

## メンテナンス

実装変更時は、以下を同時更新してください。

1. `src/jahis-tc/records/decode-jahis-tc-record.ts` / `src/jahis-tc/build/build-jahis-tc-notebook.ts` の対応状況
2. `README.md` の対応仕様・公開API・使用例の説明
3. この `docs/jahis-tc/spec-coverage.md` の対象行
4. `test/parse-jahis-tc.test.ts` などに最低1つの根拠テスト
