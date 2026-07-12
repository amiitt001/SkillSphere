export * from './apiResponse';

/**
 * Cleans markdown code blocks (e.g., ```json ... ```) from a string.
 * @param text Raw markdown string.
 */
export function cleanMarkdownJson(text: string): string {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

/**
 * Safely parses a JSON string, returning a default value if it fails.
 * @param text Raw JSON or markdown-wrapped JSON string.
 * @param defaultValue Default fallback object.
 */
export function safeJsonParse<T>(text: string, defaultValue: T): T {
  try {
    const cleaned = cleanMarkdownJson(text);
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error('Safe JSON parsing failed:', error);
    return defaultValue;
  }
}
