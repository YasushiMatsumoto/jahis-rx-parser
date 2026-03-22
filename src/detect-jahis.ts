const getFirstNonEmptyLine = (input: string): string | undefined => {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .find((line) => line.trim().length > 0)
    ?.trim();
};

const hasDigitAfterPrefix = (value: string | undefined, prefix: string): boolean => {
  if (!value?.startsWith(prefix)) {
    return false;
  }

  const firstCharAfterPrefix = value.charAt(prefix.length);
  return /^[0-9]$/.test(firstCharAfterPrefix);
};

export const isJahisTc = (input: string): boolean => {
  return hasDigitAfterPrefix(getFirstNonEmptyLine(input), "JAHISTC");
};

export const isJahisRx = (input: string): boolean => {
  return hasDigitAfterPrefix(getFirstNonEmptyLine(input), "JAHIS");
};
