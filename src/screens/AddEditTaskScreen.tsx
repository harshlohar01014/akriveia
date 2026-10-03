import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Priority, TaskStatus } from '../types/task';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { validateTaskForm, TaskValidationErrors } from '../utils/validation';
import { getTodayDateString } from '../utils/dateUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddEditTask'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'AddEditTask'>;

export const AddEditTaskScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { colors } = useTheme();
  const { getTaskById, addTask, updateTask } = useTasks();

  const taskId = route.params?.taskId;
  const isEditing = Boolean(taskId);
  const existingTask = taskId ? getTaskById(taskId) : undefined;

  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(existingTask?.description || '');
  const [category, setCategory] = useState(existingTask?.category || '');
  const [priority, setPriority] = useState<Priority>(existingTask?.priority || 'Medium');
  const [startDate, setStartDate] = useState(existingTask?.start_date || getTodayDateString());
  const [dueDate, setDueDate] = useState(existingTask?.due_date || getTodayDateString());
  const [status, setStatus] = useState<TaskStatus>(existingTask?.status || 'Pending');

  const [errors, setErrors] = useState<TaskValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // Set navigation header dynamically
  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Task' : 'New Task',
    });
  }, [navigation, isEditing]);

  const handleSave = async () => {
    // Validate
    const validation = validateTaskForm({
      title,
      category,
      start_date: startDate,
      due_date: dueDate,
      priority,
      status,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSaving(true);

    try {
      if (isEditing && taskId) {
        const existing = getTaskById(taskId);
        await updateTask({
          id: taskId,
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          priority,
          start_date: startDate.trim(),
          due_date: dueDate.trim(),
          status,
          created_at: existing?.created_at,
        });
      } else {
        await addTask({
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          priority,
          start_date: startDate.trim(),
          due_date: dueDate.trim(),
          status,
        });
      }

      navigation.goBack();
    } catch (err) {
      console.error('Failed to save task:', err);
      setErrors({ title: 'Failed to save task. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const setRelativeDate = (target: 'start' | 'due', daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;

    if (target === 'start') {
      setStartDate(formatted);
      if (errors.start_date) setErrors(prev => ({ ...prev, start_date: undefined }));
    } else {
      setDueDate(formatted);
      if (errors.due_date) setErrors(prev => ({ ...prev, due_date: undefined }));
    }
  };

  const priorityOptions: Priority[] = ['Low', 'Medium', 'High'];
  const statusOptions: TaskStatus[] = ['Pending', 'Completed'];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title Field */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Task Title <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: errors.title ? colors.danger : colors.border,
                color: colors.text,
              },
            ]}
            placeholder="e.g., Prepare client presentation"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={text => {
              setTitle(text);
              if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
            }}
            maxLength={120}
          />
          {errors.title && <Text style={[styles.errorText, { color: colors.danger }]}>{errors.title}</Text>}
        </View>

        {/* Category Field */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Category <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: errors.category ? colors.danger : colors.border,
                color: colors.text,
              },
            ]}
            placeholder="e.g., Work, Personal, Finance, Health"
            placeholderTextColor={colors.textMuted}
            value={category}
            onChangeText={text => {
              setCategory(text);
              if (errors.category) setErrors(prev => ({ ...prev, category: undefined }));
            }}
            maxLength={50}
          />
          {errors.category && <Text style={[styles.errorText, { color: colors.danger }]}>{errors.category}</Text>}
        </View>

        {/* Priority Selector */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
          <View style={styles.segmentedRow}>
            {priorityOptions.map(opt => {
              const isSelected = priority === opt;
              let selectedColor = colors.primary;
              if (opt === 'High') selectedColor = colors.priorityHigh;
              if (opt === 'Medium') selectedColor = colors.priorityMedium;
              if (opt === 'Low') selectedColor = colors.priorityLow;

              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.segmentButton,
                    {
                      borderColor: isSelected ? selectedColor : colors.border,
                      backgroundColor: isSelected ? colors.card : colors.borderLight,
                    },
                  ]}
                  onPress={() => setPriority(opt)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: isSelected ? selectedColor : colors.textSecondary },
                      isSelected && styles.segmentTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Status Selector */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Status</Text>
          <View style={styles.segmentedRow}>
            {statusOptions.map(opt => {
              const isSelected = status === opt;
              const selectedColor = opt === 'Completed' ? colors.success : colors.warning;

              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.segmentButton,
                    {
                      borderColor: isSelected ? selectedColor : colors.border,
                      backgroundColor: isSelected ? colors.card : colors.borderLight,
                    },
                  ]}
                  onPress={() => setStatus(opt)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: isSelected ? selectedColor : colors.textSecondary },
                      isSelected && styles.segmentTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Date Row: Start Date & Due Date */}
        <View style={styles.dateRow}>
          {/* Start Date */}
          <View style={styles.dateCol}>
            <Text style={[styles.label, { color: colors.text }]}>
              Start Date <Text style={{ color: colors.danger }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: errors.start_date ? colors.danger : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              value={startDate}
              onChangeText={text => {
                setStartDate(text);
                if (errors.start_date) setErrors(prev => ({ ...prev, start_date: undefined }));
              }}
            />
            <View style={styles.quickDateRow}>
              <TouchableOpacity
                style={[styles.quickDateChip, { backgroundColor: colors.borderLight }]}
                onPress={() => setRelativeDate('start', 0)}
              >
                <Text style={[styles.quickDateText, { color: colors.textSecondary }]}>Today</Text>
              </TouchableOpacity>
            </View>
            {errors.start_date && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{errors.start_date}</Text>
            )}
          </View>

          {/* Due Date */}
          <View style={styles.dateCol}>
            <Text style={[styles.label, { color: colors.text }]}>
              Due Date <Text style={{ color: colors.danger }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: errors.due_date ? colors.danger : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              value={dueDate}
              onChangeText={text => {
                setDueDate(text);
                if (errors.due_date) setErrors(prev => ({ ...prev, due_date: undefined }));
              }}
            />
            <View style={styles.quickDateRow}>
              <TouchableOpacity
                style={[styles.quickDateChip, { backgroundColor: colors.borderLight }]}
                onPress={() => setRelativeDate('due', 0)}
              >
                <Text style={[styles.quickDateText, { color: colors.textSecondary }]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickDateChip, { backgroundColor: colors.borderLight }]}
                onPress={() => setRelativeDate('due', 1)}
              >
                <Text style={[styles.quickDateText, { color: colors.textSecondary }]}>+1d</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickDateChip, { backgroundColor: colors.borderLight }]}
                onPress={() => setRelativeDate('due', 7)}
              >
                <Text style={[styles.quickDateText, { color: colors.textSecondary }]}>+7d</Text>
              </TouchableOpacity>
            </View>
            {errors.due_date && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{errors.due_date}</Text>
            )}
          </View>
        </View>

        {/* Description Field */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Add relevant notes, links, or requirements..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary },
            isSaving && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons
                name={isEditing ? 'save-outline' : 'add-circle-outline'}
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.submitButtonText}>{isEditing ? 'Save Changes' : 'Create Task'}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 90,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  dateCol: {
    flex: 1,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  quickDateChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickDateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
