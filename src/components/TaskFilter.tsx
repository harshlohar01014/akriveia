import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TaskFilterType } from '../types/task';
import { useTheme } from '../context/ThemeContext';

interface TaskFilterProps {
  currentFilter: TaskFilterType;
  onSelectFilter: (filter: TaskFilterType) => void;
  counts?: {
    all: number;
    pending: number;
    completed: number;
  };
}

export const TaskFilter: React.FC<TaskFilterProps> = ({
  currentFilter,
  onSelectFilter,
  counts,
}) => {
  const { colors } = useTheme();

  const filterOptions: { label: string; value: TaskFilterType; count?: number }[] = [
    { label: 'All', value: 'All', count: counts?.all },
    { label: 'Pending', value: 'Pending', count: counts?.pending },
    { label: 'Completed', value: 'Completed', count: counts?.completed },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.borderLight }]}>
      {filterOptions.map(option => {
        const isSelected = currentFilter === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onSelectFilter(option.value)}
            style={[
              styles.tab,
              isSelected && [
                styles.activeTab,
                { backgroundColor: colors.card, shadowColor: colors.text },
              ],
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.tabText,
                { color: isSelected ? colors.primary : colors.textSecondary },
                isSelected && styles.activeTabText,
              ]}
            >
              {option.label}
              {option.count !== undefined ? ` (${option.count})` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  activeTab: {
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '700',
  },
});
