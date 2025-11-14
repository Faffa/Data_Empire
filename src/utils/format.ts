/**
 * Number Formatting Utilities
 * Formats large numbers for display in the UI
 */

/**
 * Format a number with K/M/B/T suffixes
 * @param num Number to format
 * @param decimals Number of decimal places (default 1)
 * @returns Formatted string
 *
 * @example
 * formatNumber(1234) => "1.2K"
 * formatNumber(1234567) => "1.2M"
 * formatNumber(999) => "999"
 */
export function formatNumber(num: number, decimals: number = 1): string {
  if (num < 1000) {
    return Math.floor(num).toString()
  }

  const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi']
  const order = Math.floor(Math.log10(num) / 3)
  const unitIndex = Math.min(order, units.length - 1)
  const value = num / Math.pow(1000, unitIndex)

  return value.toFixed(decimals) + units[unitIndex]
}

/**
 * Format a percentage
 * @param value Percentage value (0-100)
 * @param decimals Number of decimal places (default 1)
 * @returns Formatted string with % suffix
 *
 * @example
 * formatPercent(95.5) => "95.5%"
 * formatPercent(100) => "100.0%"
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return value.toFixed(decimals) + '%'
}

/**
 * Format a time duration in seconds to human-readable format
 * @param seconds Duration in seconds
 * @returns Formatted string
 *
 * @example
 * formatDuration(65) => "1m 5s"
 * formatDuration(3665) => "1h 1m"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  if (minutes > 0 && secs > 0) {
    return `${minutes}m ${secs}s`
  }

  return `${minutes}m`
}

/**
 * Format a DC generation rate
 * @param rate DC per second
 * @returns Formatted string with suffix
 *
 * @example
 * formatRate(1.5) => "+1.5 DC/s"
 * formatRate(1234.56) => "+1.2K DC/s"
 */
export function formatRate(rate: number): string {
  if (rate === 0) {
    return '0 DC/s'
  }

  const sign = rate > 0 ? '+' : ''
  return `${sign}${formatNumber(Math.abs(rate), 1)} DC/s`
}
