/**
 * Splits one JAHIS line into comma-delimited fields.
 *
 * @param line One normalized input line.
 * @returns Array of comma-split tokens.
 */
export const splitFields = (line: string): string[] => {
  // JAHIS text is comma-delimited in this parser; escaping is intentionally not handled yet.
  return line.split(",");
};
