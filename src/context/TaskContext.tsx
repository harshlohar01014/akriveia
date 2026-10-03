import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Task, TaskStatus } from '../types/task';
import { getStoredTasks, saveStoredTasks, clearStoredTasks as clearStorage } from '../services/storage';
import { generateTaskId } from '../utils/taskUtils';
import { isToday, isOverdue } from '../utils/dateUtils';

interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  
  // Derived state (always dynamically computed)
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  todayTasks: number;
  overdueTasks: number;

  // Actions
  loadTasks: () => Promise<void>;
  addTask: (taskData: Omit<Task, 'id'> & { id?: string }) => Promise<Task>;
  updateTask: (updatedTask: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  clearTasks: () => Promise<void>;
  importTasks: (newTasks: Task[]) => Promise<number>;
  getTaskById: (id: string) => Task | undefined;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stored = await getStoredTasks();
      setTasks(stored);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks from local storage.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    getStoredTasks()
      .then(stored => {
        if (isSubscribed) {
          setTasks(stored);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (isSubscribed) {
          console.error('Error loading tasks:', err);
          setError('Failed to load tasks from local storage.');
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Derived metrics computed dynamically on every render
  const totalTasks = tasks.length;

  const completedTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'Completed').length;
  }, [tasks]);

  const pendingTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'Pending').length;
  }, [tasks]);

  const todayTasks = useMemo(() => {
    return tasks.filter(t => isToday(t.due_date) || isToday(t.start_date)).length;
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    return tasks.filter(t => isOverdue(t.due_date, t.status)).length;
  }, [tasks]);

  const addTask = useCallback(
    async (taskData: Omit<Task, 'id'> & { id?: string }): Promise<Task> => {
      const newTask: Task = {
        ...taskData,
        id: taskData.id?.trim() || generateTaskId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const nextTasks = [newTask, ...tasks];
      setTasks(nextTasks);
      await saveStoredTasks(nextTasks);
      return newTask;
    },
    [tasks]
  );

  const updateTask = useCallback(
    async (updatedTask: Task): Promise<void> => {
      const taskWithTimestamp: Task = {
        ...updatedTask,
        updated_at: new Date().toISOString(),
      };

      const nextTasks = tasks.map(t => (t.id === updatedTask.id ? taskWithTimestamp : t));
      setTasks(nextTasks);
      await saveStoredTasks(nextTasks);
    },
    [tasks]
  );

  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      const nextTasks = tasks.filter(t => t.id !== id);
      setTasks(nextTasks);
      await saveStoredTasks(nextTasks);
    },
    [tasks]
  );

  const toggleTaskStatus = useCallback(
    async (id: string): Promise<void> => {
      const nextTasks: Task[] = tasks.map(t => {
        if (t.id === id) {
          const nextStatus: TaskStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
          return {
            ...t,
            status: nextStatus,
            updated_at: new Date().toISOString(),
          };
        }
        return t;
      });
      setTasks(nextTasks);
      await saveStoredTasks(nextTasks);
    },
    [tasks]
  );

  const clearTasks = useCallback(async (): Promise<void> => {
    setTasks([]);
    await clearStorage();
  }, []);

  const importTasks = useCallback(
    async (newTasks: Task[]): Promise<number> => {
      if (newTasks.length === 0) return 0;

      // Filter out any duplicates against current task state by ID and within the batch
      const currentIds = new Set(tasks.map(t => t.id.toLowerCase()));
      const seenIds = new Set<string>();
      const uniqueNew: Task[] = [];
      for (const t of newTasks) {
        const lowerId = t.id.toLowerCase();
        if (!currentIds.has(lowerId) && !seenIds.has(lowerId)) {
          seenIds.add(lowerId);
          uniqueNew.push(t);
        }
      }

      const nextTasks = [...uniqueNew, ...tasks];
      setTasks(nextTasks);
      await saveStoredTasks(nextTasks);
      return uniqueNew.length;
    },
    [tasks]
  );

  const getTaskById = useCallback(
    (id: string): Task | undefined => {
      return tasks.find(t => t.id === id);
    },
    [tasks]
  );

  const contextValue = useMemo(
    () => ({
      tasks,
      isLoading,
      error,
      totalTasks,
      completedTasks,
      pendingTasks,
      todayTasks,
      overdueTasks,
      loadTasks,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskStatus,
      clearTasks,
      importTasks,
      getTaskById,
    }),
    [
      tasks,
      isLoading,
      error,
      totalTasks,
      completedTasks,
      pendingTasks,
      todayTasks,
      overdueTasks,
      loadTasks,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskStatus,
      clearTasks,
      importTasks,
      getTaskById,
    ]
  );

  return <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>;
}

export function useTasks(): TaskContextType {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
