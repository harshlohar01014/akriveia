import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { exportTasksToCSV } from '../services/csvService';

export const SettingsScreen: React.FC = () => {
  const { isDark, toggleTheme, colors } = useTheme();
  const { tasks, clearTasks } = useTasks();

  const [showClearModal, setShowClearModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleClearAll = async () => {
    setShowClearModal(false);
    await clearTasks();
    Alert.alert('Tasks Cleared', 'All local task data has been cleared successfully.');
  };

  const handleExportCSV = async () => {
    if (tasks.length === 0) {
      Alert.alert('No Tasks', 'There are no tasks to export.');
      return;
    }

    setIsExporting(true);
    try {
      await exportTasksToCSV(tasks);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      Alert.alert('Export Error', 'Could not export tasks to CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isDark ? colors.primaryLight : colors.warningLight },
                ]}
              >
                <Ionicons
                  name={isDark ? 'moon' : 'sunny'}
                  size={20}
                  color={isDark ? colors.primary : colors.warning}
                />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Dark Theme</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  {isDark ? 'Dark mode enabled' : 'Light mode enabled'}
                </Text>
              </View>
            </View>

            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Data Management Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>
          Data & Backup
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Export to CSV Option */}
          <TouchableOpacity
            style={styles.rowButton}
            onPress={handleExportCSV}
            disabled={isExporting}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: colors.infoLight }]}>
                <Ionicons name="download-outline" size={20} color={colors.info} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Export Tasks to CSV</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  Save or share your current {tasks.length} tasks
                </Text>
              </View>
            </View>

            {isExporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            )}
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Clear All Tasks Option */}
          <TouchableOpacity
            style={styles.rowButton}
            onPress={() => setShowClearModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: colors.dangerLight }]}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.danger }]}>Clear All Tasks</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  Permanently erase all {tasks.length} tasks from storage
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Storage Stats Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>
          System Status
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Storage Engine</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>AsyncStorage (Local-first)</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Active Tasks In Memory</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{tasks.length}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>App Version</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>1.0.0 (Production Build)</Text>
          </View>
        </View>

        {/* About Footer */}
        <View style={styles.aboutFooter}>
          <Text style={[styles.appName, { color: colors.text }]}>TaskFlow</Text>
          <Text style={[styles.appSub, { color: colors.textMuted }]}>
            Local-First Task Management • React Native & Expo
          </Text>
        </View>
      </ScrollView>

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        visible={showClearModal}
        title="Clear All Tasks?"
        message={`This will permanently delete all ${tasks.length} tasks from your device storage. This action cannot be reversed.`}
        confirmLabel="Clear All"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleClearAll}
        onCancel={() => setShowClearModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  metaLabel: {
    fontSize: 14,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  aboutFooter: {
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 16,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  appSub: {
    fontSize: 12,
  },
});
