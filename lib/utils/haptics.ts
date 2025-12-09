export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning';

const HAPTIC_DURATIONS: Record<HapticStyle, number | number[]> = {
  light: 10, // Quick tap feedback
  medium: 25, // Button press
  heavy: 50, // Significant action
  success: [15, 50, 30], // Double-tap pattern
  warning: [30, 30, 30], // Triple-tap pattern
};

/**
 * Trigger haptic feedback on supported devices
 * Fails silently on unsupported devices (iOS Safari)
 *
 * @example
 * // In click handler
 * onClick={() => {
 *   haptic('light');
 *   navigate('/dashboard');
 * }}
 */
export function haptic(style: HapticStyle = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(HAPTIC_DURATIONS[style]);
    } catch {
      // Silent fail - haptic feedback is not critical
    }
  }
}

/**
 * Check if haptic feedback is supported
 * Useful for conditional UI hints
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}
