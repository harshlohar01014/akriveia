export interface ThemeColors {
  primary: string;
  primaryLight: string;
  background: string;
  card: string;
  cardElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  inputBackground: string;
  inputBorder: string;
  divider: string;
  statusBar: 'light' | 'dark';
  
  // Status Colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  info: string;
  infoLight: string;

  // Priority Colors
  priorityHigh: string;
  priorityHighBg: string;
  priorityMedium: string;
  priorityMediumBg: string;
  priorityLow: string;
  priorityLowBg: string;

  // Status Badge Colors
  statusPending: string;
  statusPendingBg: string;
  statusCompleted: string;
  statusCompletedBg: string;
}

export const lightColors: ThemeColors = {
  primary: '#4F46E5', // Indigo 600
  primaryLight: '#EEF2FF',
  background: '#F8FAFC', // Slate 50
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  text: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8', // Slate 400
  border: '#E2E8F0', // Slate 200
  borderLight: '#F1F5F9', // Slate 100
  inputBackground: '#F8FAFC',
  inputBorder: '#CBD5E1', // Slate 300
  divider: '#E2E8F0',
  statusBar: 'dark',

  // Status
  success: '#10B981', // Emerald 500
  successLight: '#ECFDF5',
  warning: '#F59E0B', // Amber 500
  warningLight: '#FFFBEB',
  danger: '#EF4444', // Red 500
  dangerLight: '#FEF2F2',
  info: '#3B82F6', // Blue 500
  infoLight: '#EFF6FF',

  // Priority
  priorityHigh: '#DC2626',
  priorityHighBg: '#FEE2E2',
  priorityMedium: '#D97706',
  priorityMediumBg: '#FEF3C7',
  priorityLow: '#059669',
  priorityLowBg: '#D1FAE5',

  // Status Badge
  statusPending: '#D97706',
  statusPendingBg: '#FEF3C7',
  statusCompleted: '#059669',
  statusCompletedBg: '#D1FAE5',
};

export const darkColors: ThemeColors = {
  primary: '#6366F1', // Indigo 500
  primaryLight: '#1E1B4B',
  background: '#0F172A', // Slate 900
  card: '#1E293B', // Slate 800
  cardElevated: '#334155', // Slate 700
  text: '#F8FAFC', // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  textMuted: '#64748B', // Slate 500
  border: '#334155', // Slate 700
  borderLight: '#1E293B',
  inputBackground: '#0F172A',
  inputBorder: '#475569', // Slate 600
  divider: '#334155',
  statusBar: 'light',

  // Status
  success: '#34D399',
  successLight: '#064E3B',
  warning: '#FBBF24',
  warningLight: '#78350F',
  danger: '#F87171',
  dangerLight: '#7F1D1D',
  info: '#60A5FA',
  infoLight: '#1E3A8A',

  // Priority
  priorityHigh: '#F87171',
  priorityHighBg: '#450A0A',
  priorityMedium: '#FBBF24',
  priorityMediumBg: '#451A03',
  priorityLow: '#34D399',
  priorityLowBg: '#064E3B',

  // Status Badge
  statusPending: '#FBBF24',
  statusPendingBg: '#451A03',
  statusCompleted: '#34D399',
  statusCompletedBg: '#064E3B',
};
