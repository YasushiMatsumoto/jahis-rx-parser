# External Data Dynamic Tests

Drop external JAHIS text files (`.txt`) into this directory, then run:

```bash
npm run test:external
```

## Behavior

- Each `.txt` file is parsed dynamically by `test/external-data.dynamic.test.ts`.
- Each case runs twice:
  - `strict: false`
  - `strict: true`
- Default expectation:
  - non-strict: `ok === true`
  - strict: no default `ok` assertion (unless configured)
- This is intended to validate that imported external text can be ingested by the library.
- The test run always prints full per-file details for visual inspection:
  - `ok`, `strict`, `issueCount`, `rawCount`, `rawRecordCount`
  - full `issues` array
  - full `normalized` payload

## Optional Per-File Config

For `sample.txt`, you can add `sample.json` next to it.

```json
{
  "expectOkNonStrict": true,
  "expectOkStrict": false,
  "maxIssuesNonStrict": 5,
  "maxIssuesStrict": 5,
  "requiredIssueCodesStrict": ["NON_STANDARD_RECORD_LAYOUT"]
}
```

Supported keys:

- Shared fallback keys:
  - `expectOk`: boolean
  - `maxIssues`: number
  - `requiredIssueCodes`: string[]
- Mode-specific keys:
  - `expectOkNonStrict`: boolean
  - `expectOkStrict`: boolean
  - `maxIssuesNonStrict`: number
  - `maxIssuesStrict`: number
  - `requiredIssueCodesNonStrict`: string[]
  - `requiredIssueCodesStrict`: string[]

## Notes

- If no external files are present, the dynamic suite passes with an informational test.
- Keep any personal data anonymized before placing files here.
