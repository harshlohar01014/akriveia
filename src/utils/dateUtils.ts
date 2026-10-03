import { TaskStatus } from '../types/task';

/**
 * Checks if a string conforms to strict YYYY-MM-DD format and is a valid calendar date.
 */
export function isValidDateFormat(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  // Validate days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a local Date object without timezone drift.
 */
export function parseLocalDate(dateStr: string): Date | null {
  if (!isValidDateFormat(dateStr)) return null;
  const [yearStr, monthStr, dayStr] = dateStr.trim().split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  return new Date(year, month, day);
}

/**
 * Formats a YYYY-MM-DD string into human-friendly format (e.g. "Oct 15, 2026").
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  if (!date) return dateStr;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${monthName} ${day}, ${year}`;
}

/**
 * Checks if a date matches today's date.
 */
export function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  return dateStr.trim() === getTodayDateString();
}

/**
 * Checks if a task is overdue.
 * A task is overdue if it is Pending and due_date is before today.
 */
export function isOverdue(dueDateStr: string, status: TaskStatus): boolean {
  if (status === 'Completed' || !dueDateStr) return false;
  const today = getTodayDateString();
  return dueDateStr.trim() < today;
}

/**
 * Checks if due date is strictly earlier than start date.
 */
export function isDueDateBeforeStartDate(startDate: string, dueDate: string): boolean {
  if (!startDate || !dueDate) return false;
  return dueDate.trim() < startDate.trim();
}

/**
 * Compares two date strings in YYYY-MM-DD format.
 */
export function compareDates(dateA: string, dateB: string): number {
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateA.localeCompare(dateB);
}

/**
 * Attempts to normalize various date inputs into YYYY-MM-DD.
 * Handles YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, MM/DD/YYYY, and ISO strings.
 */
export function normalizeDateString(input: unknown): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Already YYYY-MM-DD
  if (isValidDateFormat(trimmed)) {
    return trimmed;
  }

  // YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = trimmed.match(/^(\d{4})[/\.](\d{1,2})[/\.](\d{1,2})$/);
  if (ymdMatch) {
    const formatted = `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
    if (isValidDateFormat(formatted)) return formatted;
  }

  // DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY, DD.MM.YYYY
  const separatorMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (separatorMatch) {
    const n1 = parseInt(separatorMatch[1], 10);
    const n2 = parseInt(separatorMatch[2], 10);
    const year = parseInt(separatorMatch[3], 10);

    let day = n1;
    let month = n2;
    // If second number is > 12, first must be month (MM/DD/YYYY)
    if (n2 > 12 && n1 <= 12) {
      month = n1;
      day = n2;
    }
    const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (isValidDateFormat(formatted)) return formatted;
  }

  // ISO string (e.g. 2026-10-15T00:00:00.000Z or 2026-10-15 14:30)
  if (trimmed.includes('T') || trimmed.includes(' ')) {
    const prefix = trimmed.split(/[T ]/)[0];
    if (isValidDateFormat(prefix)) return prefix;
  }

  // Fallback to JS Date object parsing
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    if (isValidDateFormat(formatted)) return formatted;
  }

  return null;
}
