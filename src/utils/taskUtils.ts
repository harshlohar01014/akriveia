import { Task, TaskFilterType, SortField, SortDirection, Priority } from '../types/task';
import { compareDates } from './dateUtils';

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

/**
 * Generates a unique task ID for manually created tasks.
 */
export function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Filters tasks based on status and search query.
 */
export function filterAndSearchTasks(
  tasks: Task[],
  filter: TaskFilterType,
  searchQuery: string
): Task[] {
  let result = tasks;

  // Filter by status
  if (filter === 'Pending') {
    result = result.filter(t => t.status === 'Pending');
  } else if (filter === 'Completed') {
    result = result.filter(t => t.status === 'Completed');
  }

  // Filter by search query
  const query = searchQuery.trim().toLowerCase();
  if (query) {
    result = result.filter(task => {
      const matchTitle = task.title.toLowerCase().includes(query);
      const matchCategory = task.category.toLowerCase().includes(query);
      const matchDescription = (task.description || '').toLowerCase().includes(query);
      return matchTitle || matchCategory || matchDescription;
    });
  }

  return result;
}

/**
 * Sorts tasks by field and direction.
 */
export function sortTasks(
  tasks: Task[],
  field: SortField,
  direction: SortDirection
): Task[] {
  const sorted = [...tasks];
  const multiplier = direction === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    switch (field) {
      case 'priority': {
        const weightA = PRIORITY_WEIGHTS[a.priority] || 0;
        const weightB = PRIORITY_WEIGHTS[b.priority] || 0;
        return (weightA - weightB) * multiplier;
      }
      case 'due_date': {
        return compareDates(a.due_date, b.due_date) * multiplier;
      }
      case 'start_date': {
        return compareDates(a.start_date, b.start_date) * multiplier;
      }
      case 'title': {
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }) * multiplier;
      }
      default:
        return 0;
    }
  });

  return sorted;
}
