/**
 * Word counting utilities for reflection form
 * Encourages depth through word count display instead of character limits
 */

/**
 * Count words in text using whitespace splitting
 * Handles edge cases: empty strings, multiple spaces, line breaks
 */
export function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Format word count for display with encouraging messages
 */
export function formatWordCount(count: number): string {
  if (count === 0) return 'Your thoughts await...';
  if (count === 1) return '1 thoughtful word';
  return `${count} thoughtful words`;
}

/**
 * Get word count state for color progression
 * Based on estimated average of 5 characters per word
 * Returns: 'low' (0-50%) | 'mid' (50-90%) | 'high' (90-100%)
 */
export function getWordCountState(
  count: number,
  maxChars: number
): 'low' | 'mid' | 'high' {
  const estimatedMaxWords = maxChars / 5; // Average word length
  const percentage = count / estimatedMaxWords;

  if (percentage < 0.5) return 'low';   // 0-50%: white/70
  if (percentage < 0.9) return 'mid';   // 50-90%: gold
  return 'high';                         // 90-100%: purple
}
