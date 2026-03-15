# Diagnostics（診断スクリプト）

このフォルダには、開発者向けの診断スクリプトが置かれています。これらは通常の CI／`npm test` では実行されない想定のツール群で、パーサーや正規化の挙動を手動で検査するために使います。

目的
- サンプルレコードが正規化出力にどのようにマッピングされているかを手動で確認する。
- 正規化の差分や疑わしいケースを抽出するための補助的なツールを提供する。
- `test/expected-normalized.json` のような開発用アーティファクトを生成する（手動レビュー後にコミットすることを想定）。

ファイル一覧（主なもの）
- `generate-diff-report.test.ts` — 薬剤レコード（201/211/221/241）について、サンプルフィールドと正規化出力の簡易マッチを表示します。
- `extract-issues.test.ts` — 正規化出力に現れないサンプルフィールドをヒューリスティックに列挙します。
- `auto-prioritize-issues.test.ts` — より厳格なルールで高確度の不一致候補を抽出します。
- `generate-expected-normalized.test.ts` — 全サンプルをパースして正規化結果を正規化（undefined→null、キーソート等）し、`test/expected-normalized.json` を生成します。
- `expected-normalized.json` — 生成済みの出力アーティファクト（大きくなる可能性あり）。生成後にレビューしてからコミットしてください。

実行方法

診断スクリプトは手動で実行します。プロジェクトルートから次のコマンドを使ってください：

```powershell
npm run diagnostics
```

- `npm run diagnostics` は `vitest` を使って `tools/diagnostics` 下のスクリプトを実行します。
- `generate-expected-normalized.test.ts` を実行すると `test/expected-normalized.json` が上書きされます。

注意点
- これらは開発用スクリプトです。CI のテストスイートに混ぜないために `tools/diagnostics/` に配置しています。
- 生成される `expected-normalized.json` をコミットする前に、個人情報や機密の残りがないか必ず確認してください。既にリポジトリでは外部データを匿名化する措置が取られていますが、生成物も同様に確認が必要です。
- ESLint/TypeScript の設定でこのフォルダを無視するように `eslint.config.mjs` を更新しています。もし診断スクリプトも型チェック／lint 対象に含めたい場合は `tsconfig.json` と ESLint 設定を調整してください。

トラブルシューティング
- `npm run diagnostics` 実行時に TypeScript 関連のパーサエラーが出る場合：`eslint.config.mjs` の `ignores` に `tools/diagnostics/**` が含まれているか確認してください（このリポジトリでは既に設定済みです）。
- 生成結果が期待と違う場合は、まず `spec-samples.test.ts` のアンカー（ヘッダやダミー院情報）を確認してください。サンプルは最小のコンテキストで正規化されるようアンカーを付与してあります。

コントリビュートのヒント
- 診断スクリプトを改善したら、tools/diagnostics にだけ変更を加え、必ず出力を手動で確認してから `test/expected-normalized.json` を更新・コミットしてください。

質問・連絡
- 使い方が分からない、あるいは診断結果の見方がわからない場合は Issue を上げてください。
