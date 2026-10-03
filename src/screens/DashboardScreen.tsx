import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/task';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { TaskCard } from '../components/TaskCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingView } from '../components/LoadingView';
import { isToday } from '../utils/dateUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const {
    tasks,
    isLoading,
    totalTasks,
    completedTasks,
    pendingTasks,
    todayTasks,
    overdueTasks,
    loadTasks,
    toggleTaskStatus,
    deleteTask,
  } = useTasks();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, [loadTasks]);

  // Today's & Pending Tasks for quick glance
  const todayOrUpcomingTasks = React.useMemo(() => {
    return tasks
      .filter(t => isToday(t.due_date) || (t.status === 'Pending'))
      .slice(0, 4);
  }, [tasks]);

  if (isLoading && tasks.length === 0) {
    return <LoadingView message="Loading your dashboard..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header summary */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome to</Text>
          <Text style={[styles.brandTitle, { color: colors.text }]}>TaskFlow</Text>
        </View>

        {/* Dynamic Metric Cards Grid */}
        <View style={styles.statsGrid}>
          {/* Total Tasks Card */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('TaskList', { filter: 'All' })}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconWrapper, { backgroundColor: colors.infoLight }]}>
              <Ionicons name="layers-outline" size={20} color={colors.info} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalTasks}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Tasks</Text>
          </TouchableOpacity>

          {/* Pending Tasks Card */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('TaskList', { filter: 'Pending' })}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconWrapper, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="time-outline" size={20} color={colors.warning} />
            </View>
            <Text style={[styles.statValue, { color: colors.warning }]}>{pendingTasks}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          </TouchableOpacity>

          {/* Completed Tasks Card */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('TaskList', { filter: 'Completed' })}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconWrapper, { backgroundColor: colors.successLight }]}>
              <Ionicons name="checkmark-done-outline" size={20} color={colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.success }]}>{completedTasks}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
          </TouchableOpacity>

          {/* Today's Tasks Card */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('TaskList', { filter: 'All' })}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconWrapper, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="today-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.primary }]}>{todayTasks}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{"Today's"}</Text>
          </TouchableOpacity>
        </View>

        {/* Overdue alert banner if any */}
        {overdueTasks > 0 && (
          <TouchableOpacity
            style={[
              styles.overdueBanner,
              { backgroundColor: colors.dangerLight, borderColor: colors.danger },
            ]}
            onPress={() => navigation.navigate('TaskList', { filter: 'Pending' })}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <Text style={[styles.overdueBannerText, { color: colors.danger }]}>
              {overdueTasks} task{overdueTasks > 1 ? 's are' : ' is'} overdue! Tap to review.
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.danger} />
          </TouchableOpacity>
        )}

        {/* Quick Actions Row */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => navigation.navigate('TaskList', { filter: 'All' })}
            activeOpacity={0.7}
          >
            <Ionicons name="list" size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Task List</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => navigation.navigate('BulkUpload')}
            activeOpacity={0.7}
          >
            <Ionicons name="cloud-upload-outline" size={20} color={colors.info} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Bulk Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Recent / Today's Tasks Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Priority Focus</Text>
          {tasks.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('TaskList', { filter: 'All' })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All →</Text>
            </TouchableOpacity>
          )}
        </View>

        {tasks.length === 0 ? (
          <EmptyState
            icon="clipboard-outline"
            title="No tasks yet"
            message="Get started by creating your first task or importing tasks from a CSV file."
            actionLabel="+ Create First Task"
            onAction={() => navigation.navigate('AddEditTask', {})}
          />
        ) : (
          todayOrUpcomingTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() => navigation.navigate('TaskDetails', { taskId: task.id })}
              onToggleStatus={() => toggleTaskStatus(task.id)}
              onDelete={() => deleteTask(task.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Floating Action Button for Add Task */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddEditTask', {})}
        activeOpacity={0.8}
        accessibilityLabel="Create Task"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  header: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  overdueBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
