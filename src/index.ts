// Public API surface. Keep exports explicit to provide a stable contract.
export { isJahisRx, isJahisTc } from "./detect-jahis.js";
export type { RecordKind, RecordNo } from "./jahis-rx/constants/index.js";
export { RECORD_KIND, RECORD_NO } from "./jahis-rx/constants/index.js";
export { parseJahisRx } from "./jahis-rx/parse-jahis.js";
export type {
  JahisRxDoctor,
  JahisRxInsurance,
  JahisRxParsedData,
  JahisRxParseIssue,
  JahisRxParseIssueLevel,
  JahisRxParseOptions,
  JahisRxParseResult,
  JahisRxPatient,
  JahisRxPrescription,
  JahisRxRawRecord,
  UnknownRxRecord,
} from "./jahis-rx/types/index.js";
export type {
  RecordKind as JahisTcRecordKind,
  JahisTcRecordNo,
} from "./jahis-tc/constants/index.js";
export {
  RECORD_KIND as JAHIS_TC_RECORD_KIND,
  JAHIS_TC_RECORD_NO,
} from "./jahis-tc/constants/index.js";
export type {
  JahisTcDispensing,
  JahisTcMedicationNotebook,
  JahisTcParsedData,
  JahisTcParseIssue,
  JahisTcParseIssueLevel,
  JahisTcParseOptions,
  JahisTcParseResult,
  JahisTcPatient,
  JahisTcPrescription,
  JahisTcRawRecord,
  JahisTcRp,
  JahisTcUnknownRecord,
} from "./jahis-tc/index.js";
export { parseJahisTc } from "./jahis-tc/parse-jahis-tc.js";
