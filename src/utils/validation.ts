import { Priority, TaskStatus } from '../types/task';
import { isValidDateFormat, isDueDateBeforeStartDate } from './dateUtils';

/**
 * Normalizes priority case and whitespace variations.
 * E.g. "high", " HIGH ", "High" -> "High"
 */
export function normalizePriority(val: unknown): Priority | null {
  if (typeof val !== 'string') return null;
  const cleaned = val.trim().toLowerCase();
  if (cleaned === 'low') return 'Low';
  if (cleaned === 'medium' || cleaned === 'med') return 'Medium';
  if (cleaned === 'high') return 'High';
  return null;
}

/**
 * Normalizes status case and whitespace variations.
 * E.g. "pending", " PENDING ", "completed", "COMPLETED" -> "Completed"
 */
export function normalizeStatus(val: unknown): TaskStatus | null {
  if (typeof val !== 'string') return null;
  const cleaned = val.trim().toLowerCase();
  if (cleaned === 'pending') return 'Pending';
  if (cleaned === 'completed' || cleaned === 'complete' || cleaned === 'done') return 'Completed';
  return null;
}

export interface TaskValidationErrors {
  title?: string;
  category?: string;
  start_date?: string;
  due_date?: string;
  priority?: string;
  status?: string;
}

/**
 * Validates task input fields for Add/Edit form.
 */
export function validateTaskForm(task: {
  title?: string;
  category?: string;
  start_date?: string;
  due_date?: string;
  priority?: string;
  status?: string;
}): { isValid: boolean; errors: TaskValidationErrors } {
  const errors: TaskValidationErrors = {};

  // Title validation
  if (!task.title || !task.title.trim()) {
    errors.title = 'Title is required';
  } else if (task.title.trim().length > 120) {
    errors.title = 'Title must be 120 characters or less';
  }

  // Category validation
  if (!task.category || !task.category.trim()) {
    errors.category = 'Category is required';
  } else if (task.category.trim().length > 50) {
    errors.category = 'Category must be 50 characters or less';
  }

  // Start Date validation
  if (!task.start_date || !task.start_date.trim()) {
    errors.start_date = 'Start date is required';
  } else if (!isValidDateFormat(task.start_date.trim())) {
    errors.start_date = 'Start date must be in YYYY-MM-DD format';
  }

  // Due Date validation
  if (!task.due_date || !task.due_date.trim()) {
    errors.due_date = 'Due date is required';
  } else if (!isValidDateFormat(task.due_date.trim())) {
    errors.due_date = 'Due date must be in YYYY-MM-DD format';
  }

  // Cross-date validation
  if (
    task.start_date &&
    task.due_date &&
    isValidDateFormat(task.start_date.trim()) &&
    isValidDateFormat(task.due_date.trim())
  ) {
    if (isDueDateBeforeStartDate(task.start_date.trim(), task.due_date.trim())) {
      errors.due_date = 'Due date cannot be earlier than start date';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
