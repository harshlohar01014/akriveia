import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, TaskFilterType, SortOption, Task } from '../types/task';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { TaskCard } from '../components/TaskCard';
import { SearchBar } from '../components/SearchBar';
import { TaskFilter } from '../components/TaskFilter';
import { SortModal } from '../components/SortModal';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { filterAndSearchTasks, sortTasks } from '../utils/taskUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TaskList'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'TaskList'>;

export const TaskListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { colors } = useTheme();

  const {
    tasks,
    totalTasks,
    pendingTasks,
    completedTasks,
    toggleTaskStatus,
    deleteTask,
    loadTasks,
  } = useTasks();

  const [currentFilter, setCurrentFilter] = useState<TaskFilterType>(
    route.params?.filter || 'All'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'due_date',
    direction: 'asc',
  });
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // State for task deletion confirm dialog
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, [loadTasks]);

  // Combined filtering, searching, and sorting
  const processedTasks = useMemo(() => {
    const filtered = filterAndSearchTasks(tasks, currentFilter, searchQuery);
    return sortTasks(filtered, sortOption.field, sortOption.direction);
  }, [tasks, currentFilter, searchQuery, sortOption]);

  const handleDeleteConfirm = async () => {
    if (taskToDelete) {
      await deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  const renderEmptyState = () => {
    if (searchQuery.trim().length > 0) {
      return (
        <EmptyState
          icon="search-outline"
          title="No search results"
          message={`No tasks matched "${searchQuery}". Try a different keyword.`}
          actionLabel="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      );
    }

    if (currentFilter === 'Pending') {
      return (
        <EmptyState
          icon="checkmark-done-circle-outline"
          title="No pending tasks"
          message="Great job! You have cleared all pending tasks."
          actionLabel="+ Add New Task"
          onAction={() => navigation.navigate('AddEditTask', {})}
        />
      );
    }

    if (currentFilter === 'Completed') {
      return (
        <EmptyState
          icon="time-outline"
          title="No completed tasks"
          message="Tasks marked as completed will show up here."
        />
      );
    }

    return (
      <EmptyState
        icon="clipboard-outline"
        title="No tasks yet"
        message="Start organizing your work by creating your first task or importing from a CSV."
        actionLabel="+ Create First Task"
        onAction={() => navigation.navigate('AddEditTask', {})}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Search & Sort Controls */}
      <View style={[styles.controlPanel, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.searchRow}>
          <View style={styles.searchWrapper}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search title, category, description..."
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sortButton,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setSortModalVisible(true)}
            accessibilityLabel="Sort tasks"
          >
            <Ionicons name="swap-vertical" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter Segmented Control */}
        <View style={styles.filterWrapper}>
          <TaskFilter
            currentFilter={currentFilter}
            onSelectFilter={setCurrentFilter}
            counts={{
              all: totalTasks,
              pending: pendingTasks,
              completed: completedTasks,
            }}
          />
        </View>
      </View>

      {/* Task List */}
      <FlatList
        data={processedTasks}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}
            onToggleStatus={() => toggleTaskStatus(item.id)}
            onDelete={() => setTaskToDelete(item)}
          />
        )}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddEditTask', {})}
        activeOpacity={0.8}
        accessibilityLabel="Add Task"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Sort Modal */}
      <SortModal
        visible={sortModalVisible}
        currentSort={sortOption}
        onSelectSort={setSortOption}
        onClose={() => setSortModalVisible(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={taskToDelete !== null}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTaskToDelete(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlPanel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  searchWrapper: {
    flex: 1,
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterWrapper: {
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
});
