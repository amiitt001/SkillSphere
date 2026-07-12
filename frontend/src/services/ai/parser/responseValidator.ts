/**
 * AI Response Schema Validation Helper
 */

/**
 * Validates that the parsed JSON object contains the list of required properties.
 * @param obj The parsed object to validate.
 * @param requiredKeys Keys expected in the object.
 * @returns An object describing the validation outcome and missing keys.
 */
export function validateKeys(
  obj: any,
  requiredKeys: string[]
): { isValid: boolean; missing: string[] } {
  if (!obj || typeof obj !== 'object') {
    return { isValid: false, missing: requiredKeys };
  }

  const missing = requiredKeys.filter((key) => !(key in obj));
  return {
    isValid: missing.length === 0,
    missing,
  };
}
