import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, CSVImportResult, Task } from '../types/task';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import {
  parseAndValidateCSV,
  getSampleCSVContent,
  getSampleWithErrorsCSVContent,
} from '../services/csvService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'BulkUpload'>;

export const BulkUploadScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { tasks, importTasks } = useTasks();

  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size?: number;
    uri: string;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [importCompleted, setImportCompleted] = useState(false);
  const [importedFinalCount, setImportedFinalCount] = useState(0);

  // File picking handler
  const handlePickDocument = async () => {
    try {
      setImportResult(null);
      setImportCompleted(false);

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/comma-separated-values',
          'text/plain',
          'application/vnd.ms-excel',
          'application/csv',
          '*/*',
        ],
        // On Android in Expo Go, copyToCacheDirectory: true copies to host.exp.exponent/cache/DocumentPicker/
        // which triggers "Location '...' isn't readable" due to scoped storage boundaries.
        // copyToCacheDirectory: false retains the native content:// URI so we can bridge it safely.
        copyToCacheDirectory: Platform.OS === 'android' ? false : true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];

      // Handle Excel files (.xlsx / .xls) with clear guidance
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        Alert.alert(
          'Excel Workbook (.xlsx) Detected',
          `"${file.name}" is an Excel workbook. TaskFlow requires standard CSV (.csv) format.\n\nTo import this data, open it in Excel or Google Sheets and choose:\nFile → Save As / Export → CSV (Comma delimited) (*.csv), then select the saved .csv file.`
        );
        return;
      }

      setSelectedFile({
        name: file.name,
        size: file.size,
        uri: file.uri,
      });

      // Read file content
      setIsProcessing(true);
      let content = '';
      const tempFilename = `csv_import_${Date.now()}.csv`;
      const baseDir = FileSystemLegacy.cacheDirectory || FileSystemLegacy.documentDirectory || '';
      const localDestUri = `${baseDir}${tempFilename}`;

      try {
        if (Platform.OS === 'android' && file.uri.startsWith('content://')) {
          // Android content:// URI: copyAsync streams via ContentResolver into the app-scoped cache directory
          try {
            await FileSystemLegacy.copyAsync({
              from: file.uri,
              to: localDestUri,
            });
            content = await FileSystemLegacy.readAsStringAsync(localDestUri, {
              encoding: FileSystemLegacy.EncodingType.UTF8,
            });
            await FileSystemLegacy.deleteAsync(localDestUri, { idempotent: true });
          } catch (contentCopyErr) {
            console.warn('copyAsync from content URI failed, trying Expo File API:', contentCopyErr);
            const fileObj = new ExpoFile(file.uri);
            content = await fileObj.text();
          }
        } else {
          // iOS or scoped file URI: try direct read first
          try {
            content = await FileSystemLegacy.readAsStringAsync(file.uri, {
              encoding: FileSystemLegacy.EncodingType.UTF8,
            });
          } catch {
            try {
              const fileObj = new ExpoFile(file.uri);
              content = await fileObj.text();
            } catch {
              // Fallback: copy to scoped cache and read
              await FileSystemLegacy.copyAsync({
                from: file.uri,
                to: localDestUri,
              });
              content = await FileSystemLegacy.readAsStringAsync(localDestUri, {
                encoding: FileSystemLegacy.EncodingType.UTF8,
              });
              await FileSystemLegacy.deleteAsync(localDestUri, { idempotent: true });
            }
          }
        }
      } catch (readErr) {
        console.warn('Native filesystem read failed, attempting web/fetch fallback:', readErr);
        if ((file as any).file && typeof (file as any).file.text === 'function') {
          content = await (file as any).file.text();
        } else {
          const response = await fetch(file.uri);
          content = await response.text();
        }
      }

      if (!content || !content.trim()) {
        Alert.alert('Empty File', 'The selected file is empty or could not be read.');
        return;
      }

      const parsed = parseAndValidateCSV(content, tasks);
      setImportResult(parsed);
    } catch (err) {
      console.error('Error reading CSV file:', err);
      Alert.alert('File Error', 'Could not read the selected CSV file. Please make sure it is a valid CSV.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Clean valid sample CSV testing handler (always produces fresh valid records)
  const handleLoadSampleCSV = () => {
    setImportCompleted(false);
    setSelectedFile({
      name: 'valid_sample_tasks.csv (5 Ready-to-Import Tasks)',
      size: 1024,
      uri: 'internal://valid_sample_tasks.csv',
    });

    setIsProcessing(true);
    setTimeout(() => {
      const sampleContent = getSampleCSVContent();
      const parsed = parseAndValidateCSV(sampleContent, tasks);
      setImportResult(parsed);
      setIsProcessing(false);
    }, 200);
  };

  // Sample CSV with intentional errors to test validation display
  const handleLoadErrorsSampleCSV = () => {
    setImportCompleted(false);
    setSelectedFile({
      name: 'sample_with_issues.csv (Testing Validation Rules)',
      size: 1024,
      uri: 'internal://sample_with_issues.csv',
    });

    setIsProcessing(true);
    setTimeout(() => {
      const sampleContent = getSampleWithErrorsCSVContent();
      const parsed = parseAndValidateCSV(sampleContent, tasks);
      setImportResult(parsed);
      setIsProcessing(false);
    }, 200);
  };

  // Confirm Import
  const handleCommitImport = async (tasksToImport?: Task[]) => {
    const list = tasksToImport || importResult?.validTasks || [];
    if (list.length === 0) return;

    setIsProcessing(true);
    try {
      const count = await importTasks(list);
      setImportedFinalCount(count);
      setImportCompleted(true);
      Alert.alert(
        'Import Successful',
        `Successfully imported ${count} tasks into TaskFlow!`,
        [
          {
            text: 'View Tasks',
            onPress: () => navigation.navigate('TaskList', { filter: 'All' }),
          },
          { text: 'Done', style: 'default' },
        ]
      );
    } catch (err) {
      console.error('Import commit error:', err);
      Alert.alert('Import Failed', 'An error occurred while saving the imported tasks.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Instructions banner */}
        <View style={[styles.instructionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.instructionHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.instructionTitle, { color: colors.text }]}>CSV Requirements</Text>
          </View>
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            Expected columns:{'\n'}
            <Text style={{ fontFamily: 'monospace', fontWeight: '700' }}>
              id, title, description, category, priority, start_date, due_date, status
            </Text>
          </Text>
          <Text style={[styles.instructionSub, { color: colors.textMuted }]}>
            • Duplicate IDs are skipped automatically.{'\n'}
            • Dates must be formatted as YYYY-MM-DD.{'\n'}
            • Due date cannot be earlier than start date.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handlePickDocument}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Select CSV File</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={handleLoadSampleCSV}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              Load Valid Sample CSV (5 Ready Tasks)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={handleLoadErrorsSampleCSV}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} style={{ marginRight: 6 }} />
            <Text style={[styles.secondaryButtonText, { color: colors.warning }]}>
              Load Test Sample with Validation Errors
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected File Details */}
        {selectedFile && (
          <View style={[styles.fileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="attach-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              {selectedFile.size ? (
                <Text style={[styles.fileSize, { color: colors.textMuted }]}>
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {/* Processing Spinner */}
        {isProcessing && (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Validating CSV records...
            </Text>
          </View>
        )}

        {/* Import Results & Validation Summary */}
        {importResult && !isProcessing && (
          <View style={styles.resultsContainer}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Validation Summary</Text>

            {/* Metrics Breakdown */}
            <View style={styles.metricGrid}>
              <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.metricNumber, { color: colors.text }]}>{importResult.totalRows}</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Rows</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.metricNumber, { color: colors.success }]}>
                  {importResult.validTasks.length}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Valid</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.metricNumber, { color: colors.warning }]}>
                  {importResult.duplicateCount}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Duplicates</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.metricNumber, { color: colors.danger }]}>
                  {importResult.invalidCount}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Invalid</Text>
              </View>
            </View>

            {/* Success Import Notification */}
            {importCompleted ? (
              <View
                style={[
                  styles.completedCard,
                  { backgroundColor: colors.successLight, borderColor: colors.success },
                ]}
              >
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.completedTitle, { color: colors.success }]}>Import Complete</Text>
                  <Text style={[styles.completedSub, { color: colors.textSecondary }]}>
                    Successfully imported {importedFinalCount} tasks into TaskFlow.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.viewTasksButton, { backgroundColor: colors.success }]}
                  onPress={() => navigation.navigate('TaskList', { filter: 'All' })}
                >
                  <Text style={styles.viewTasksText}>View Tasks</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 10, marginBottom: 16 }}>
                {/* 1. Only Import Valid Non-Duplicate Records */}
                {importResult.validTasks.length > 0 && (
                  <TouchableOpacity
                    style={[styles.commitButton, { backgroundColor: colors.success }]}
                    onPress={() => handleCommitImport()}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="cloud-download-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.commitButtonText}>
                      Import {importResult.validTasks.length} Valid Tasks (Duplicates Skipped)
                    </Text>
                  </TouchableOpacity>
                )}

                {/* 2. When Duplicates exist: Show clear notification that duplicates are skipped */}
                {importResult.duplicateCount > 0 && (
                  <View
                    style={[
                      styles.alertBanner,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.warning,
                      },
                    ]}
                  >
                    <Ionicons name="shield-checkmark-outline" size={18} color={colors.warning} />
                    <Text style={[styles.alertBannerText, { color: colors.warning }]}>
                      {importResult.validTasks.length === 0
                        ? `All ${importResult.duplicateCount} tasks already exist in your local storage. Duplicate tasks are skipped and will not be uploaded.`
                        : `${importResult.duplicateCount} duplicate task(s) detected and skipped automatically.`}
                    </Text>
                  </View>
                )}

                {/* 3. When Valid is 0 and Duplicate is 0 (all rows invalid): Explain to user */}
                {importResult.validTasks.length === 0 && importResult.duplicateCount === 0 && (
                  <View style={[styles.alertBanner, { backgroundColor: colors.card, borderColor: colors.danger }]}>
                    <Ionicons name="alert-circle" size={20} color={colors.danger} />
                    <Text style={[styles.alertBannerText, { color: colors.danger }]}>
                      No records could be imported due to formatting issues. Review the issues below.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Validation Errors List */}
            {importResult.errors.length > 0 && (
              <View style={styles.errorSection}>
                <View style={styles.errorHeader}>
                  <Ionicons name="warning-outline" size={18} color={colors.danger} />
                  <Text style={[styles.errorSectionTitle, { color: colors.danger }]}>
                    Validation Issues ({importResult.errors.length})
                  </Text>
                </View>

                {importResult.errors.map((err, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.errorItem,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.borderLight,
                      },
                    ]}
                  >
                    <Ionicons name="alert-circle-outline" size={16} color={colors.danger} style={styles.errIcon} />
                    <Text style={[styles.errorMessage, { color: colors.text }]}>{err.message}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
  instructionsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  instructionText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  instructionSub: {
    fontSize: 12,
    lineHeight: 18,
  },
  actionSection: {
    gap: 10,
    marginBottom: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  loadingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  commitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  commitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  completedTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  completedSub: {
    fontSize: 13,
    marginTop: 2,
  },
  viewTasksButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewTasksText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  errorSection: {
    marginTop: 10,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  errorSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  errIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  errorMessage: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  alertBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
});
