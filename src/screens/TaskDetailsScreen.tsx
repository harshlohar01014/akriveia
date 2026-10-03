import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/task';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatDisplayDate, isOverdue } from '../utils/dateUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TaskDetails'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'TaskDetails'>;

export const TaskDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { colors } = useTheme();
  const { getTaskById, toggleTaskStatus, deleteTask } = useTasks();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const taskId = route.params?.taskId;
  const task = taskId ? getTaskById(taskId) : undefined;

  // Handle case where task no longer exists
  if (!task) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={54} color={colors.textMuted} />
        <Text style={[styles.notFoundTitle, { color: colors.text }]}>Task Not Found</Text>
        <Text style={[styles.notFoundSub, { color: colors.textSecondary }]}>
          This task may have been removed or does not exist.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Return to Tasks</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCompleted = task.status === 'Completed';
  const overdue = isOverdue(task.due_date, task.status);

  const handleDelete = async () => {
    setShowDeleteModal(false);
    await deleteTask(task.id);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status & Priority header badges */}
        <View style={styles.badgeRow}>
          <StatusBadge status={task.status} size="medium" />
          <PriorityBadge priority={task.priority} size="medium" />
          {overdue && (
            <View style={[styles.overdueBadge, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name="alert-circle" size={14} color={colors.danger} style={{ marginRight: 4 }} />
              <Text style={[styles.overdueText, { color: colors.danger }]}>Overdue</Text>
            </View>
          )}
        </View>

        {/* Task Title */}
        <Text
          style={[
            styles.title,
            { color: colors.text },
            isCompleted && { textDecorationLine: 'line-through', color: colors.textMuted },
          ]}
        >
          {task.title}
        </Text>

        {/* Category info */}
        <View style={[styles.infoRow, { borderColor: colors.borderLight }]}>
          <View style={styles.infoLabelGroup}>
            <Ionicons name="folder-outline" size={16} color={colors.textSecondary} style={styles.infoIcon} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Category</Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.text }]}>{task.category}</Text>
        </View>

        {/* Dates Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <View style={styles.dateTextGroup}>
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Start Date</Text>
              <Text style={[styles.dateValue, { color: colors.text }]}>
                {formatDisplayDate(task.start_date)}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.dateItem}>
            <Ionicons
              name={overdue ? 'alert-circle-outline' : 'flag-outline'}
              size={20}
              color={overdue ? colors.danger : colors.primary}
            />
            <View style={styles.dateTextGroup}>
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Due Date</Text>
              <Text
                style={[
                  styles.dateValue,
                  { color: overdue ? colors.danger : colors.text },
                ]}
              >
                {formatDisplayDate(task.due_date)}
              </Text>
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Description</Text>
          <View style={[styles.descriptionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.descriptionText, { color: colors.text }]}>
              {task.description ? task.description : 'No description provided for this task.'}
            </Text>
          </View>
        </View>

        {/* Task Identifier Details */}
        <View style={[styles.metaBox, { borderColor: colors.borderLight }]}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>Task ID: {task.id}</Text>
        </View>
      </ScrollView>

      {/* Action Footer Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {/* Toggle Status Action */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            {
              backgroundColor: isCompleted ? colors.warningLight : colors.successLight,
              borderColor: isCompleted ? colors.warning : colors.success,
            },
          ]}
          onPress={() => toggleTaskStatus(task.id)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isCompleted ? 'time-outline' : 'checkmark-circle-outline'}
            size={18}
            color={isCompleted ? colors.warning : colors.success}
          />
          <Text
            style={[
              styles.toggleButtonText,
              { color: isCompleted ? colors.warning : colors.success },
            ]}
          >
            {isCompleted ? 'Mark Pending' : 'Mark Completed'}
          </Text>
        </TouchableOpacity>

        {/* Edit Button */}
        <TouchableOpacity
          style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
          onPress={() => navigation.navigate('AddEditTask', { taskId: task.id })}
          accessibilityLabel="Edit Task"
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.iconButton, { borderColor: colors.dangerLight, backgroundColor: colors.dangerLight }]}
          onPress={() => setShowDeleteModal(true)}
          accessibilityLabel="Delete Task"
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteModal}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  notFoundSub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  infoLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 6,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTextGroup: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  descriptionBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  metaBox: {
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
