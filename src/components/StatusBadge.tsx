import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskStatus } from '../types/task';
import { useTheme } from '../context/ThemeContext';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'small' }) => {
  const { colors } = useTheme();
  const isCompleted = status === 'Completed';
  const isSmall = size === 'small';

  const badgeBg = isCompleted ? colors.statusCompletedBg : colors.statusPendingBg;
  const textColor = isCompleted ? colors.statusCompleted : colors.statusPending;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: badgeBg },
        isSmall ? styles.badgeSmall : styles.badgeMedium,
      ]}
    >
      <Ionicons
        name={isCompleted ? 'checkmark-circle' : 'time-outline'}
        size={isSmall ? 13 : 15}
        color={textColor}
        style={styles.icon}
      />
      <Text
        style={[
          styles.text,
          { color: textColor },
          isSmall ? styles.textSmall : styles.textMedium,
        ]}
      >
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeMedium: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 13,
  },
});
