import { describe, test, expect } from '@jest/globals';
import {
  isValidDateFormat,
  parseLocalDate,
  formatDisplayDate,
  isToday,
  isOverdue,
  isDueDateBeforeStartDate,
  getTodayDateString,
} from '../src/utils/dateUtils';

import {
  normalizePriority,
  normalizeStatus,
  validateTaskForm,
} from '../src/utils/validation';

import {
  filterAndSearchTasks,
  sortTasks,
} from '../src/utils/taskUtils';

import { parseAndValidateCSV } from '../src/services/csvService';
import { Task } from '../src/types/task';

describe('Date Utilities', () => {
  test('isValidDateFormat validates YYYY-MM-DD correctly', () => {
    expect(isValidDateFormat('2026-10-15')).toBe(true);
    expect(isValidDateFormat('2024-02-29')).toBe(true); // Leap year
    expect(isValidDateFormat('2025-02-29')).toBe(false); // Not a leap year
    expect(isValidDateFormat('2026-13-01')).toBe(false); // Invalid month
    expect(isValidDateFormat('2026-04-31')).toBe(false); // April has 30 days
    expect(isValidDateFormat('15-10-2026')).toBe(false);
    expect(isValidDateFormat('')).toBe(false);
  });

  test('parseLocalDate parses local date without timezone drift', () => {
    const parsed = parseLocalDate('2026-05-20');
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(4); // 0-indexed May
    expect(parsed?.getDate()).toBe(20);
  });

  test('formatDisplayDate formats date string', () => {
    expect(formatDisplayDate('2026-10-15')).toBe('Oct 15, 2026');
    expect(formatDisplayDate('')).toBe('');
  });

  test('isToday checks current day correctly', () => {
    const today = getTodayDateString();
    expect(isToday(today)).toBe(true);
    expect(isToday('2000-01-01')).toBe(false);
  });

  test('isOverdue marks pending tasks with past due date as overdue', () => {
    expect(isOverdue('2020-01-01', 'Pending')).toBe(true);
    expect(isOverdue('2020-01-01', 'Completed')).toBe(false); // Completed tasks cannot be overdue
    expect(isOverdue('2099-12-31', 'Pending')).toBe(false);
  });

  test('isDueDateBeforeStartDate correctly compares dates', () => {
    expect(isDueDateBeforeStartDate('2026-10-10', '2026-10-05')).toBe(true);
    expect(isDueDateBeforeStartDate('2026-10-05', '2026-10-10')).toBe(false);
    expect(isDueDateBeforeStartDate('2026-10-05', '2026-10-05')).toBe(false);
  });
});

describe('Validation & Normalization', () => {
  test('normalizePriority handles variations and casing', () => {
    expect(normalizePriority('high')).toBe('High');
    expect(normalizePriority(' HIGH ')).toBe('High');
    expect(normalizePriority('Medium')).toBe('Medium');
    expect(normalizePriority('med')).toBe('Medium');
    expect(normalizePriority('Low')).toBe('Low');
    expect(normalizePriority('Urgent')).toBeNull();
  });

  test('normalizeStatus handles variations and casing', () => {
    expect(normalizeStatus('pending')).toBe('Pending');
    expect(normalizeStatus(' PENDING ')).toBe('Pending');
    expect(normalizeStatus('completed')).toBe('Completed');
    expect(normalizeStatus('COMPLETED')).toBe('Completed');
    expect(normalizeStatus('done')).toBe('Completed');
    expect(normalizeStatus('archived')).toBeNull();
  });

  test('validateTaskForm reports errors for invalid inputs', () => {
    const invalidForm = validateTaskForm({
      title: '',
      category: '',
      start_date: 'invalid-date',
      due_date: '2026-10-01',
    });
    expect(invalidForm.isValid).toBe(false);
    expect(invalidForm.errors.title).toBeDefined();
    expect(invalidForm.errors.category).toBeDefined();
    expect(invalidForm.errors.start_date).toBeDefined();
  });

  test('validateTaskForm detects due date earlier than start date', () => {
    const crossDateForm = validateTaskForm({
      title: 'Valid Title',
      category: 'Work',
      start_date: '2026-10-15',
      due_date: '2026-10-10',
    });
    expect(crossDateForm.isValid).toBe(false);
    expect(crossDateForm.errors.due_date).toBe('Due date cannot be earlier than start date');
  });

  test('validateTaskForm accepts valid task data', () => {
    const validForm = validateTaskForm({
      title: 'Valid Task Title',
      category: 'Engineering',
      start_date: '2026-10-01',
      due_date: '2026-10-05',
    });
    expect(validForm.isValid).toBe(true);
    expect(Object.keys(validForm.errors).length).toBe(0);
  });
});

describe('Task Filtering, Search, and Sorting', () => {
  const sampleTasks: Task[] = [
    {
      id: '1',
      title: 'Write technical documentation',
      description: 'Document system architecture',
      category: 'Documentation',
      priority: 'Low',
      start_date: '2026-10-01',
      due_date: '2026-10-10',
      status: 'Pending',
    },
    {
      id: '2',
      title: 'Fix critical production crash',
      description: 'Investigate memory leak on login',
      category: 'Engineering',
      priority: 'High',
      start_date: '2026-10-02',
      due_date: '2026-10-03',
      status: 'Pending',
    },
    {
      id: '3',
      title: 'Quarterly budget planning',
      description: 'Prepare financial sheets',
      category: 'Finance',
      priority: 'Medium',
      start_date: '2026-10-01',
      due_date: '2026-10-15',
      status: 'Completed',
    },
  ];

  test('filterAndSearchTasks filters by status', () => {
    const pending = filterAndSearchTasks(sampleTasks, 'Pending', '');
    expect(pending.length).toBe(2);

    const completed = filterAndSearchTasks(sampleTasks, 'Completed', '');
    expect(completed.length).toBe(1);
    expect(completed[0].id).toBe('3');
  });

  test('filterAndSearchTasks searches across title, category, and description', () => {
    // Search in title
    expect(filterAndSearchTasks(sampleTasks, 'All', 'crash').length).toBe(1);

    // Search in category
    expect(filterAndSearchTasks(sampleTasks, 'All', 'Finance').length).toBe(1);

    // Search in description
    expect(filterAndSearchTasks(sampleTasks, 'All', 'architecture').length).toBe(1);
  });

  test('filter and search work simultaneously', () => {
    // Search "planning" in Pending (it is in Completed) -> 0 results
    expect(filterAndSearchTasks(sampleTasks, 'Pending', 'planning').length).toBe(0);

    // Search "planning" in Completed -> 1 result
    expect(filterAndSearchTasks(sampleTasks, 'Completed', 'planning').length).toBe(1);
  });

  test('sortTasks sorts by priority correctly', () => {
    const sortedDesc = sortTasks(sampleTasks, 'priority', 'desc');
    expect(sortedDesc[0].priority).toBe('High');
    expect(sortedDesc[1].priority).toBe('Medium');
    expect(sortedDesc[2].priority).toBe('Low');

    const sortedAsc = sortTasks(sampleTasks, 'priority', 'asc');
    expect(sortedAsc[0].priority).toBe('Low');
    expect(sortedAsc[2].priority).toBe('High');
  });

  test('sortTasks sorts by due date', () => {
    const sorted = sortTasks(sampleTasks, 'due_date', 'asc');
    expect(sorted[0].id).toBe('2'); // Oct 03
    expect(sorted[1].id).toBe('1'); // Oct 10
    expect(sorted[2].id).toBe('3'); // Oct 15
  });
});

describe('CSV Parsing & Validation', () => {
  const existingTasks: Task[] = [
    {
      id: 'existing_100',
      title: 'Pre-existing Task',
      description: 'Already in storage',
      category: 'General',
      priority: 'Low',
      start_date: '2026-10-01',
      due_date: '2026-10-05',
      status: 'Pending',
    },
  ];

  test('rejects CSV with missing required headers', () => {
    const badCSV = `id,name,due_date\n1,Task 1,2026-10-05`;
    const result = parseAndValidateCSV(badCSV, existingTasks);
    expect(result.validTasks.length).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('Missing required column headers');
  });

  test('correctly identifies valid rows, invalid rows, and duplicates', () => {
    const csvContent = `id,title,description,category,priority,start_date,due_date,status
task_new_1,Design UX Mockups,Wireframes for app,Design,High,2026-10-01,2026-10-05,Pending
existing_100,Duplicate Task,Already in storage,Work,Medium,2026-10-01,2026-10-05,Pending
task_err_date,Invalid Due Date,Due date earlier than start,QA,High,2026-10-10,2026-10-01,Pending
task_err_prio,Invalid Priority,Wrong priority,DevOps,Urgent,2026-10-01,2026-10-05,Pending
task_new_2,Set up CI pipeline,GitHub actions,DevOps,Medium,2026-10-01,2026-10-08,Completed
task_new_1,Duplicate in CSV,Repeated ID,Design,Low,2026-10-01,2026-10-05,Pending
`;

    const result = parseAndValidateCSV(csvContent, existingTasks);

    expect(result.totalRows).toBe(6);
    expect(result.validTasks.length).toBe(2); // task_new_1 (first occurrence) and task_new_2
    expect(result.duplicateCount).toBe(2); // existing_100 (in storage) + task_new_1 (repeated in batch)
    expect(result.invalidCount).toBe(2); // task_err_date + task_err_prio

    // Verify row error messages
    const dateError = result.errors.find(e => e.message.includes('Due date cannot be earlier than start date'));
    expect(dateError).toBeDefined();

    const prioError = result.errors.find(e => e.message.includes('Invalid priority'));
    expect(prioError).toBeDefined();
  });
});
