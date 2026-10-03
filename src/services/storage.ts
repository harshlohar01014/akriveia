import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types/task';
import { STORAGE_KEYS } from '../constants/storageKeys';

/**
 * Retrieves persisted tasks from AsyncStorage.
 */
export async function getStoredTasks(): Promise<Task[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
    if (!jsonValue) return [];
    const parsed = JSON.parse(jsonValue);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error('Failed to load tasks from AsyncStorage:', error);
    return [];
  }
}

/**
 * Persists tasks array to AsyncStorage.
 */
export async function saveStoredTasks(tasks: Task[]): Promise<void> {
  try {
    const jsonValue = JSON.stringify(tasks);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, jsonValue);
  } catch (error) {
    console.error('Failed to save tasks to AsyncStorage:', error);
    throw new Error('Could not persist tasks to storage.');
  }
}

/**
 * Removes all stored tasks from AsyncStorage.
 */
export async function clearStoredTasks(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TASKS);
  } catch (error) {
    console.error('Failed to clear tasks from AsyncStorage:', error);
    throw new Error('Could not clear tasks from storage.');
  }
}

/**
 * Retrieves saved theme preference ('light' | 'dark').
 */
export async function getStoredTheme(): Promise<'light' | 'dark' | null> {
  try {
    const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    if (theme === 'light' || theme === 'dark') {
      return theme;
    }
    return null;
  } catch (error) {
    console.error('Failed to load theme from AsyncStorage:', error);
    return null;
  }
}

/**
 * Persists theme preference to AsyncStorage.
 */
export async function saveStoredTheme(theme: 'light' | 'dark'): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.error('Failed to save theme to AsyncStorage:', error);
  }
}
