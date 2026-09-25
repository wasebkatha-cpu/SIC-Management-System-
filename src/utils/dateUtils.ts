/**
 * Date utility functions for Sindh Information Commission (SIC) Management System
 * Standard display format: DD-MM-YYYY
 * HTML date picker format: YYYY-MM-DD
 */

export function toInputDateFormat(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  // If YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  // If DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return '';
}

export function toDisplayDateFormat(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  // If YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }
  // If DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }
  return trimmed;
}

export function addDaysToDate(baseDateStr: string, daysToAdd: number): string {
  try {
    const inputFormatted = toInputDateFormat(baseDateStr);
    const dateObj = inputFormatted ? new Date(inputFormatted) : new Date();
    dateObj.setDate(dateObj.getDate() + daysToAdd);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  } catch {
    return baseDateStr;
  }
}

/**
 * Converts a DD-MM-YYYY or ISO date string to a millisecond timestamp for chronological comparison.
 */
export function parseDateToTimestamp(dateStr: string): number {
  if (!dateStr) return 0;
  const trimmed = dateStr.trim();
  const inputFormatted = toInputDateFormat(trimmed);
  if (inputFormatted) {
    const timestamp = new Date(inputFormatted).getTime();
    if (!isNaN(timestamp)) return timestamp;
  }
  const parsed = new Date(trimmed).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Returns a normalized timestamp at midnight (00:00:00) in local time
 */
export function getNormalizedDateTimestamp(dateStr: string): number {
  if (!dateStr) return 0;
  const trimmed = dateStr.trim();
  const inputFormatted = toInputDateFormat(trimmed);
  if (inputFormatted) {
    const [year, month, day] = inputFormatted.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
  }
  return parseDateToTimestamp(trimmed);
}

/**
 * Checks if a date is today
 */
export function isTodayDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const norm = toDisplayDateFormat(dateStr);
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return norm === `${d}-${m}-${y}`;
}

/**
 * Checks if a date is in the future or today (upcoming)
 */
export function isUpcomingDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const targetTs = getNormalizedDateTimestamp(dateStr);
  if (!targetTs) return false;
  const now = new Date();
  const todayTs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  return targetTs >= todayTs;
}

/**
 * Checks if a date is strictly in the past
 */
export function isPastDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const targetTs = getNormalizedDateTimestamp(dateStr);
  if (!targetTs) return false;
  const now = new Date();
  const todayTs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  return targetTs < todayTs;
}

/**
 * Calculates day difference from today:
 * > 0 for future days, 0 for today, < 0 for past days
 */
export function getDaysFromToday(dateStr: string): number {
  const targetTs = getNormalizedDateTimestamp(dateStr);
  if (!targetTs) return 0;
  const now = new Date();
  const todayTs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  return Math.round((targetTs - todayTs) / (1000 * 60 * 60 * 24));
}

