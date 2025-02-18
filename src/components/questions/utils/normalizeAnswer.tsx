export const normalizeAnswer = (input: string | number): string => {
  // Convert to string if number
  const str = input.toString();

  // Normalize the string to remove any special characters or different encodings
  const normalized = str
    .normalize("NFKD") // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^\d,]/g, ""); // Keep only digits and commas

  // Sort numbers for consistent comparison if multiple answers
  if (normalized.includes(",")) {
    return normalized
      .split(",")
      .map((n) => parseInt(n, 10))
      .filter((n) => !isNaN(n)) // Filter out invalid numbers
      .sort((a, b) => a - b)
      .join(",");
  }

  return normalized;
};
