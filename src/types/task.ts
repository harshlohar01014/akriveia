export type Priority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'Completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  start_date: string; // Format: YYYY-MM-DD
  due_date: string;   // Format: YYYY-MM-DD
  status: TaskStatus;
  created_at?: string;
  updated_at?: string;
}

export type TaskFilterType = 'All' | 'Pending' | 'Completed';

export type SortField = 'due_date' | 'start_date' | 'priority' | 'title';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  direction: SortDirection;
}

export interface CSVValidationError {
  row: number;
  field?: string;
  message: string;
}

export interface CSVImportResult {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  duplicateCount: number;
  invalidCount: number;
  validTasks: Task[];
  duplicateTasks?: Task[];
  errors: CSVValidationError[];
}

export type RootStackParamList = {
  Dashboard: undefined;
  TaskList: { filter?: TaskFilterType } | undefined;
  TaskDetails: { taskId: string };
  AddEditTask: { taskId?: string };
  BulkUpload: undefined;
  Settings: undefined;
};
