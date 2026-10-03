import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SortField, SortDirection, SortOption } from '../types/task';
import { useTheme } from '../context/ThemeContext';

interface SortModalProps {
  visible: boolean;
  currentSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
  onClose: () => void;
}

export const SortModal: React.FC<SortModalProps> = ({
  visible,
  currentSort,
  onSelectSort,
  onClose,
}) => {
  const { colors } = useTheme();

  const sortFields: { label: string; field: SortField; ascLabel: string; descLabel: string }[] = [
    {
      label: 'Due Date',
      field: 'due_date',
      ascLabel: 'Earliest first',
      descLabel: 'Latest first',
    },
    {
      label: 'Start Date',
      field: 'start_date',
      ascLabel: 'Earliest first',
      descLabel: 'Latest first',
    },
    {
      label: 'Priority',
      field: 'priority',
      ascLabel: 'Low → High',
      descLabel: 'High → Low',
    },
    {
      label: 'Title',
      field: 'title',
      ascLabel: 'A → Z',
      descLabel: 'Z → A',
    },
  ];

  const handleFieldSelect = (field: SortField) => {
    if (currentSort.field === field) {
      // Toggle direction if already selected
      const nextDir: SortDirection = currentSort.direction === 'asc' ? 'desc' : 'asc';
      onSelectSort({ field, direction: nextDir });
    } else {
      // Default directions: for priority/due_date usually desc/asc
      const defaultDir: SortDirection = field === 'priority' ? 'desc' : 'asc';
      onSelectSort({ field, direction: defaultDir });
    }
  };

  const handleDirectionToggle = (dir: SortDirection) => {
    onSelectSort({ field: currentSort.field, direction: dir });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.modalContent,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Sort Tasks</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Sort By</Text>
          <View style={styles.fieldList}>
            {sortFields.map(item => {
              const isSelected = currentSort.field === item.field;
              return (
                <TouchableOpacity
                  key={item.field}
                  style={[
                    styles.fieldItem,
                    { borderColor: isSelected ? colors.primary : colors.border },
                    isSelected && { backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => handleFieldSelect(item.field)}
                >
                  <View style={styles.fieldLeft}>
                    <Ionicons
                      name={
                        item.field === 'due_date' || item.field === 'start_date'
                          ? 'calendar-outline'
                          : item.field === 'priority'
                          ? 'flag-outline'
                          : 'text-outline'
                      }
                      size={18}
                      color={isSelected ? colors.primary : colors.textSecondary}
                      style={styles.fieldIcon}
                    />
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: isSelected ? colors.primary : colors.text },
                        isSelected && styles.selectedLabel,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>

                  {isSelected && (
                    <Text style={[styles.fieldDirection, { color: colors.primary }]}>
                      {currentSort.direction === 'asc' ? item.ascLabel : item.descLabel}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 14 }]}>
            Order Direction
          </Text>
          <View style={styles.directionRow}>
            <TouchableOpacity
              style={[
                styles.directionButton,
                { borderColor: colors.border },
                currentSort.direction === 'asc' && [
                  styles.activeDirection,
                  { backgroundColor: colors.primary, borderColor: colors.primary },
                ],
              ]}
              onPress={() => handleDirectionToggle('asc')}
            >
              <Ionicons
                name="arrow-up"
                size={16}
                color={currentSort.direction === 'asc' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.directionText,
                  { color: currentSort.direction === 'asc' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Ascending
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.directionButton,
                { borderColor: colors.border },
                currentSort.direction === 'desc' && [
                  styles.activeDirection,
                  { backgroundColor: colors.primary, borderColor: colors.primary },
                ],
              ]}
              onPress={() => handleDirectionToggle('desc')}
            >
              <Ionicons
                name="arrow-down"
                size={16}
                color={currentSort.direction === 'desc' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.directionText,
                  { color: currentSort.direction === 'desc' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Descending
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.applyButtonText}>Apply Sorting</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  fieldList: {
    gap: 8,
  },
  fieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  fieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldIcon: {
    marginRight: 10,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  selectedLabel: {
    fontWeight: '700',
  },
  fieldDirection: {
    fontSize: 12,
    fontWeight: '600',
  },
  directionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  directionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  activeDirection: {},
  directionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
