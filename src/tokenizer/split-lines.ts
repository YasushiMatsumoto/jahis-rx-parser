/**
 * Splits raw input text into lines with normalized line endings.
 *
 * @param text Raw JAHIS text payload.
 * @returns Array of lines in source order.
 */
export const splitLines = (text: string): string[] => {
  // Normalize line endings first so line indexes stay stable across platforms.
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
};
