import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Priority } from '../types/task';
import { useTheme } from '../context/ThemeContext';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'small' | 'medium';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'small' }) => {
  const { colors } = useTheme();

  const getBadgeStyle = () => {
    switch (priority) {
      case 'High':
        return {
          backgroundColor: colors.priorityHighBg,
          color: colors.priorityHigh,
          label: 'High',
        };
      case 'Medium':
        return {
          backgroundColor: colors.priorityMediumBg,
          color: colors.priorityMedium,
          label: 'Medium',
        };
      case 'Low':
      default:
        return {
          backgroundColor: colors.priorityLowBg,
          color: colors.priorityLow,
          label: 'Low',
        };
    }
  };

  const config = getBadgeStyle();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.backgroundColor },
        isSmall ? styles.badgeSmall : styles.badgeMedium,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text
        style={[
          styles.text,
          { color: config.color },
          isSmall ? styles.textSmall : styles.textMedium,
        ]}
      >
        {config.label}
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
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
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
