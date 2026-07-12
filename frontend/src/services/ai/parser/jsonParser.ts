/**
 * JSON Parsing and Markdown Cleaning Utility for AI Responses
 */

/**
 * Strips markdown code fence wrappers (e.g., ```json ... ```) from raw AI text output.
 * @param text Raw response string.
 */
export function cleanMarkdownJson(text: string): string {
  // Regex to extract text between ```json and ```, or ``` and ```, or fall back to standard cleaning
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

/**
 * Safely parses JSON from an AI response, fallback to default structure on failure.
 * @param text Raw or cleaned JSON string.
 * @param fallbackData Fallback data shape.
 */
export function parseJson<T>(text: string, fallbackData: T): T {
  try {
    const cleaned = cleanMarkdownJson(text);
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error('[JSON Parser] Safe parsing failed. Using fallback data.', error);
    return fallbackData;
  }
}
