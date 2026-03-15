# Diagnostics

This folder contains developer diagnostic scripts for investigating parsing/normalization details. These scripts are not run as part of normal CI or `npm test`.

Purpose
- Provide ad-hoc tools to inspect how sample records map to the normalized output.
- Produce developer artifacts (for example `test/expected-normalized.json`) used when generating or reviewing canonical outputs.

Files
- `generate-diff-report.test.ts` — prints per-sample field → normalized property matches for drug-related samples (201/211/221/241).
- `extract-issues.test.ts` — heuristic scanner that lists sample fields not found in common normalized drug props.
- `auto-prioritize-issues.test.ts` — stricter heuristics that surface high-confidence mismatch candidates.
- `generate-expected-normalized.test.ts` — generates `test/expected-normalized.json` (canonicalized normalized output for all hardcoded samples).
- `expected-normalized.json` — output artifact (may be large); review before committing.

How to run

Run diagnostics manually (they are excluded from normal test runs):

```powershell
npm run diagnostics
```

This runs the diagnostic suite using Vitest and prints results to the console. `generate-expected-normalized.test.ts` writes `test/expected-normalized.json` into the `test/` folder.

Notes and recommendations
- These scripts are for developers and intentionally bypass some CI constraints. Keep them under `tools/diagnostics/` to avoid polluting CI.
- If you want ESLint/TypeScript to include these files, add them to your `tsconfig.json` and update `eslint.config.mjs` accordingly. Default project config currently ignores this folder.
- Before committing `expected-normalized.json`, review it for sensitive data. The repository previously used anonymized fixtures; keep that practice for any generated sample outputs.

Troubleshooting
- If `npm run diagnostics` fails with TypeScript/ESLint parser errors, ensure `eslint.config.mjs` contains `tools/diagnostics/**` in the `ignores` list (this repo already configures this).

Contact
- For any questions about these scripts, open an issue or contact the maintainer.
