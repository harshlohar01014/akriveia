import Papa from 'papaparse';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Task, CSVImportResult, CSVValidationError } from '../types/task';
import { normalizePriority, normalizeStatus } from '../utils/validation';
import { isValidDateFormat, isDueDateBeforeStartDate, normalizeDateString } from '../utils/dateUtils';

const ESSENTIAL_HEADERS = [
  'title',
  'category',
  'priority',
  'start_date',
  'due_date',
  'status',
];

interface RawCSVRow {
  [key: string]: string | undefined;
}

/**
 * Validates and parses raw CSV string content.
 * Normalizes values and detects duplicates against existing task IDs and within the CSV itself.
 */
export function parseAndValidateCSV(
  csvContent: string,
  existingTasks: Task[]
): CSVImportResult {
  const existingIdSet = new Set(existingTasks.map(t => t.id.trim().toLowerCase()));
  const seenInBatchSet = new Set<string>();

  const errors: CSVValidationError[] = [];
  const validTasks: Task[] = [];
  const duplicateTasks: Task[] = [];
  let duplicateCount = 0;
  let invalidCount = 0;

  // Clean BOM and parse CSV using PapaParse
  const cleanedContent = (csvContent || '').replace(/^\uFEFF/, '');
  const parsed = Papa.parse<RawCSVRow>(cleanedContent, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: h => {
      const clean = h.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[\s-]+/g, '_');
      if (['task_id', 'taskid', 'task_no', 'tasknumber', 'identifier', 'no', '#'].includes(clean)) return 'id';
      if (['task_name', 'task_title', 'task', 'taskname', 'tasktitle', 'name', 'subject', 'summary', 'item'].includes(clean)) return 'title';
      if (['startdate', 'start_time', 'created_date', 'created_at', 'start'].includes(clean)) return 'start_date';
      if (['duedate', 'deadline', 'target_date', 'end_date', 'due', 'end'].includes(clean)) return 'due_date';
      if (['desc', 'details', 'notes', 'note', 'content'].includes(clean)) return 'description';
      if (['cat', 'tags', 'tag', 'project', 'type'].includes(clean)) return 'category';
      if (['prio', 'importance', 'urgency', 'level'].includes(clean)) return 'priority';
      if (['state', 'task_status', 'stage', 'condition'].includes(clean)) return 'status';
      return clean;
    },
  });

  if (!parsed.data || parsed.data.length === 0) {
    return {
      totalRows: 0,
      importedCount: 0,
      skippedCount: 0,
      duplicateCount: 0,
      invalidCount: 0,
      validTasks: [],
      duplicateTasks: [],
      errors: [{ row: 1, message: 'The selected CSV file is empty or contains no records.' }],
    };
  }

  // Validate headers
  const headers = parsed.meta.fields || [];
  const missingHeaders = ESSENTIAL_HEADERS.filter(req => !headers.includes(req));
  if (missingHeaders.length > 0) {
    return {
      totalRows: parsed.data.length,
      importedCount: 0,
      skippedCount: parsed.data.length,
      duplicateCount: 0,
      invalidCount: parsed.data.length,
      validTasks: [],
      duplicateTasks: [],
      errors: [
        {
          row: 1,
          message: `Missing required column headers: ${missingHeaders.join(', ')}`,
        },
      ],
    };
  }

  const totalRows = parsed.data.length;

  parsed.data.forEach((row, index) => {
    // 1-based row number accounting for the header row (+2)
    const rowNumber = index + 2;
    let rowHasError = false;

    // 1. ID check (if absent, auto-generate unique ID)
    const rawId = (row['id'] || '').trim() || `task_${Date.now()}_${index + 1}`;
    const lowerId = rawId.toLowerCase();

    // 2. Title check
    const title = (row['title'] || '').trim();
    if (!title) {
      errors.push({
        row: rowNumber,
        field: 'title',
        message: `Row ${rowNumber}: Missing or empty title.`,
      });
      rowHasError = true;
    }

    // 3. Category check
    const category = (row['category'] || '').trim();
    if (!category) {
      errors.push({
        row: rowNumber,
        field: 'category',
        message: `Row ${rowNumber}: Missing or empty category.`,
      });
      rowHasError = true;
    }

    // 4. Priority check & normalize
    const rawPriority = row['priority'] || '';
    const priority = normalizePriority(rawPriority);
    if (!priority) {
      errors.push({
        row: rowNumber,
        field: 'priority',
        message: `Row ${rowNumber}: Invalid priority "${rawPriority}". Must be Low, Medium, or High.`,
      });
      rowHasError = true;
    }

    // 5. Status check & normalize
    const rawStatus = row['status'] || '';
    const status = normalizeStatus(rawStatus);
    if (!status) {
      errors.push({
        row: rowNumber,
        field: 'status',
        message: `Row ${rowNumber}: Invalid status "${rawStatus}". Must be Pending or Completed.`,
      });
      rowHasError = true;
    }

    // 6. Dates check & normalize
    const rawStartDate = row['start_date'] || '';
    const normalizedStart = normalizeDateString(rawStartDate);
    if (!normalizedStart || !isValidDateFormat(normalizedStart)) {
      errors.push({
        row: rowNumber,
        field: 'start_date',
        message: `Row ${rowNumber}: Invalid start date "${rawStartDate}". Expected YYYY-MM-DD.`,
      });
      rowHasError = true;
    }

    const rawDueDate = row['due_date'] || '';
    const normalizedDue = normalizeDateString(rawDueDate);
    if (!normalizedDue || !isValidDateFormat(normalizedDue)) {
      errors.push({
        row: rowNumber,
        field: 'due_date',
        message: `Row ${rowNumber}: Invalid due date "${rawDueDate}". Expected YYYY-MM-DD.`,
      });
      rowHasError = true;
    }

    // Cross-date check
    if (normalizedStart && normalizedDue && isValidDateFormat(normalizedStart) && isValidDateFormat(normalizedDue)) {
      if (isDueDateBeforeStartDate(normalizedStart, normalizedDue)) {
        errors.push({
          row: rowNumber,
          field: 'due_date',
          message: `Row ${rowNumber}: Due date cannot be earlier than start date (${normalizedDue} < ${normalizedStart}).`,
        });
        rowHasError = true;
      }
    }

    if (rowHasError) {
      invalidCount++;
      return;
    }

    const description = (row['description'] || '').trim();
    const taskCandidate: Task = {
      id: rawId,
      title,
      description,
      category,
      priority: priority!,
      start_date: normalizedStart!,
      due_date: normalizedDue!,
      status: status!,
      created_at: new Date().toISOString(),
    };

    // Duplicate check
    if (existingIdSet.has(lowerId)) {
      duplicateCount++;
      errors.push({
        row: rowNumber,
        field: 'id',
        message: `Row ${rowNumber}: Duplicate ID "${rawId}" already exists in local storage (skipped).`,
      });
      duplicateTasks.push(taskCandidate);
      return;
    }

    if (seenInBatchSet.has(lowerId)) {
      duplicateCount++;
      errors.push({
        row: rowNumber,
        field: 'id',
        message: `Row ${rowNumber}: Duplicate ID "${rawId}" appears multiple times in this CSV (skipped).`,
      });
      duplicateTasks.push(taskCandidate);
      return;
    }

    // Record is completely valid
    seenInBatchSet.add(lowerId);
    validTasks.push(taskCandidate);
  });

  const skippedCount = duplicateCount + invalidCount;
  const importedCount = validTasks.length;

  return {
    totalRows,
    importedCount,
    skippedCount,
    duplicateCount,
    invalidCount,
    validTasks,
    duplicateTasks,
    errors,
  };
}

/**
 * Converts task array to standard CSV string and shares/exports it.
 */
export async function exportTasksToCSV(tasks: Task[]): Promise<string> {
  const csvData = tasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description || '',
    category: t.category,
    priority: t.priority,
    start_date: t.start_date,
    due_date: t.due_date,
    status: t.status,
  }));

  const csvString = Papa.unparse(csvData, {
    quotes: true,
    header: true,
  });

  const filename = `taskflow_export_${Date.now()}.csv`;
  const fileUri = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, csvString, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Tasks CSV',
      UTI: 'public.comma-separated-values-text',
    });
  }

  return fileUri;
}

/**
 * Generates a valid sample CSV string with unique IDs for quick testing inside the app.
 */
export function getSampleCSVContent(): string {
  const seed = Date.now().toString().slice(-4);
  return `id,title,description,category,priority,start_date,due_date,status
task_${seed}_1,Design Mobile Wireframes,Create mockups for client presentation,Design,High,2026-10-01,2026-10-05,Pending
task_${seed}_2,Update Expo Dependencies,Upgrade Expo packages to latest SDK,Engineering,Medium,2026-10-02,2026-10-08,Completed
task_${seed}_3,Team Sprint Planning,Review backlog and assign story points,Management,Low,2026-10-01,2026-10-10,Completed
task_${seed}_4,Quarterly Financial Review,Analyze balance sheet and budget,Finance,High,2026-10-05,2026-10-12,Pending
task_${seed}_5,Customer Survey Outreach,Collect user feedback on new features,Marketing,Medium,2026-10-03,2026-10-15,Pending
`;
}

/**
 * Generates a sample CSV with intentional validation issues to test error handling.
 */
export function getSampleWithErrorsCSVContent(): string {
  const seed = Date.now().toString().slice(-4);
  return `id,title,description,category,priority,start_date,due_date,status
task_${seed}_1,Valid Task Alpha,Properly formatted task record,Engineering,High,2026-10-01,2026-10-05,Pending
task_${seed}_2,Invalid Date Range,Due date earlier than start date,QA,Medium,2026-10-15,2026-10-01,Pending
task_${seed}_3,Invalid Priority Value,Priority is set to Critical which is invalid,DevOps,Critical,2026-10-01,2026-10-05,Pending
task_${seed}_4,Valid Task Beta,Another properly formatted record,Design,Low,2026-10-02,2026-10-10,Completed
`;
}
