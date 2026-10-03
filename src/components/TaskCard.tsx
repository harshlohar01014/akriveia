import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../types/task';
import { useTheme } from '../context/ThemeContext';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { formatDisplayDate, isOverdue } from '../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggleStatus: () => void;
  onDelete?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onToggleStatus,
  onDelete,
}) => {
  const { colors } = useTheme();
  const isCompleted = task.status === 'Completed';
  const overdue = isOverdue(task.due_date, task.status);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: overdue ? colors.danger : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Task: ${task.title}`}
    >
      <View style={styles.headerRow}>
        {/* Toggle Checkbox */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              borderColor: isCompleted ? colors.success : colors.border,
              backgroundColor: isCompleted ? colors.success : 'transparent',
            },
          ]}
          onPress={onToggleStatus}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted }}
          accessibilityLabel={`Mark task as ${isCompleted ? 'pending' : 'completed'}`}
        >
          {isCompleted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </TouchableOpacity>

        {/* Title and Category */}
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
              isCompleted && [styles.completedTitle, { color: colors.textMuted }],
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          <View style={styles.categoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.borderLight }]}>
              <Ionicons name="folder-outline" size={11} color={colors.textSecondary} style={styles.folderIcon} />
              <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                {task.category}
              </Text>
            </View>

            {overdue && (
              <View style={[styles.overdueBadge, { backgroundColor: colors.dangerLight }]}>
                <Ionicons name="alert-circle" size={11} color={colors.danger} style={styles.alertIcon} />
                <Text style={[styles.overdueText, { color: colors.danger }]}>Overdue</Text>
              </View>
            )}
          </View>
        </View>

        {/* Delete Action if provided */}
        {onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Delete task"
          >
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Description preview if present */}
      {task.description ? (
        <Text
          style={[
            styles.description,
            { color: colors.textSecondary },
            isCompleted && { color: colors.textMuted },
          ]}
          numberOfLines={2}
        >
          {task.description}
        </Text>
      ) : null}

      {/* Footer Info: Dates, Priority, Status */}
      <View style={[styles.footerRow, { borderTopColor: colors.borderLight }]}>
        <View style={styles.dateBlock}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} style={styles.calendarIcon} />
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            Due: {formatDisplayDate(task.due_date)}
          </Text>
        </View>

        <View style={styles.badgeGroup}>
          <PriorityBadge priority={task.priority} size="small" />
          <View style={styles.badgeSpacer} />
          <StatusBadge status={task.status} size="small" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  folderIcon: {
    marginRight: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertIcon: {
    marginRight: 3,
  },
  overdueText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteButton: {
    padding: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    marginLeft: 32,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    marginRight: 4,
  },
  dateText: {
    fontSize: 12,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeSpacer: {
    width: 6,
  },
});
