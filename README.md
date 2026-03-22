# jahis-rx-parser

## 概要

JAHISのデコード済みテキストを解析し、JSONへ変換するTypeScriptライブラリです。

以下の2つの仕様に対応しています。

- JAHIS院外処方箋 ２次元バーコード (`JAHIS Rx`)
- JAHIS電子版お薬手帳データ (`JAHIS TC`)

対象外:

- QR画像の読み取り
- OCR
- カメラアクセス
- 外部薬剤マスタによる妥当性検証

## インストール

`npm` でインストールします。

```bash
npm install jahis-rx-parser
```

## 対応ランタイム

- Node.js 20 以上
- ESM / CJS の両方に対応

## 公開API

- `parseJahisRx(input, options)`: JAHIS Rx を解析します
- `parseJahisTc(input, options)`: JAHIS TC を解析します
- `isJahisRx(input)`: データが JAHIS Rx として開始しているかを判定します
- `isJahisTc(input)`: データが JAHIS TC として開始しているかを判定します

## 使用方法

どちらの parser も `ok / data / issues` を返します。

### フォーマットを判定して使い分ける

```ts
import { isJahisRx, isJahisTc, parseJahisRx, parseJahisTc } from "jahis-rx-parser";

const result = isJahisTc(input)
  ? parseJahisTc(input, { strict: true })
  : isJahisRx(input)
    ? parseJahisRx(input, { strict: true })
    : null;

if (!result) {
  throw new Error("Unsupported JAHIS format");
}

if (!result.ok) {
  console.error(result.issues);
} else {
  console.log(result.data?.raw);
  console.log(result.data?.normalized);
}
```

### JAHIS Rx を解析する

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
```

### JAHIS TC を解析する

```ts
import { parseJahisTc } from "jahis-rx-parser";

const input = [
  "JAHISTC01,1",
  "1,山田 太郎,1,19800101",
  "5,20260310,1",
  "11,株式会社 工業会薬局 駅前店,13,4,1234567,,,03-3506-8010,1",
  "51,医療法人 工業会病院,13,1,1234567,1",
  "201,1,ノルバスク錠２．５ｍｇ,1,錠,2,612170709,1",
  "301,1,毎食後服用,3,日分,1,1,,1",
].join("\n");

const result = parseJahisTc(input, { strict: true });
```

## オプション

主なオプションは以下のとおりです。

- `strict: true`: エラーを厳格に扱います
- `strict: false`: 警告を返しつつ解析を継続します
- `includeRawRecords: true`: `rawRecords` を結果に含めます
- `preserveUnknownRecords: false`: normalized 出力から未知レコードを除外します

## 対応仕様

- JAHIS院外処方箋2次元シンボル記録条件規約 Ver.1.10
- JAHIS電子版お薬手帳データフォーマット仕様書 Ver.2.6

## 開発時の確認コマンド

```bash
npm run check
```

公開前と同等のフル確認:

```bash
npm run check:publish
```

## 公開フロー

ローカルで公開前チェックを通します。

```bash
npm run release:preflight
npm run check:publish
```

バージョン更新後に Git tag を push し、GitHub Release を作成します。

```bash
git tag v0.1.0
git push origin main --tags
npm run release:github
```

GitHub Release 公開後は GitHub Actions の npm publish workflow から npm 公開を自動実行できる構成です。
