# TaskFlow

A modern, local-first task management application built with React Native, Expo, and TypeScript for personal productivity and task tracking.

## Overview

**TaskFlow** is designed to provide a fast, reliable, offline-first task management experience. It stores data locally on the device using `@react-native-async-storage/async-storage` with zero backend dependencies. The application features a dynamic metrics dashboard, flexible task list with unified searching, filtering, and sorting, inline form validation, robust CSV bulk importing with granular row-level error reporting, CSV exporting, and full light/dark theme support.

---

## Features

- **Dynamic Dashboard**:
  - Live task metrics: **Total Tasks**, **Pending Tasks**, **Completed Tasks**, and **Today's Tasks** (computed dynamically from dates).
  - Overdue task alert banner highlighting critical pending tasks.
  - Quick action shortcuts to Task List, Bulk Upload, and Settings.
  - Floating Action Button (FAB) for fast task creation.
- **Task Management (CRUD)**:
  - Add and Edit tasks with clean, structured inputs.
  - Comprehensive form validation with field-level error messages (title, category, valid start & due dates, cross-date verification).
  - Completion toggle directly from list cards and details view.
  - Safe task deletion with custom themed confirmation dialogs.
- **Unified Search & Filtering**:
  - Filter by status: **All**, **Pending**, and **Completed** with real-time counter badges.
  - Multi-field search querying across **Title**, **Category**, and **Description** simultaneously.
  - Co-ordinated search and filtering (e.g. searching "review" within "Pending" tasks).
- **Flexible Sorting**:
  - Sort by **Due Date**, **Start Date**, **Priority** (High > Medium > Low), and **Title** (A–Z / Z–A).
  - Toggle between ascending and descending order.
- **Bulk CSV Upload**:
  - Document picker integration (`expo-document-picker` & `expo-file-system`).
  - Strict header and row-level validation.
  - Clear error identification with row numbers and exact issue descriptions (e.g., `Row 7: Due date cannot be earlier than start date`).
  - Predictable duplicate handling using task `id` as the primary identifier.
  - In-app demo sample CSV loader for instant evaluation without manual file transfer.
- **Bonus Features**:
  - **Export Tasks to CSV**: Export your current task database to a standard CSV file and share it via the native system share sheet (`expo-sharing`).
  - **Overdue Task Indicators**: Dynamic computation highlighting overdue pending tasks across cards, banners, and detail views.
  - **Task Sorting**: Multidimensional sorting modal with direction controls.
- **Customizable Theming**:
  - Complete Light and Dark themes with persistent local storage.
  - Seamless system status bar adaptation.
- **State Management & Architecture**:
  - Centralized, lightweight state management via `TaskContext` and `ThemeContext`.
  - Derived counts computed on-the-fly to guarantee synchronization across screens.
  - Graceful loading states, error boundaries, and contextual empty states.

---

## Tech Stack

- **Framework**: React Native 0.86.3 / Expo SDK 57
- **Language**: TypeScript 6.0
- **Navigation**: React Navigation (`@react-navigation/native-stack`)
- **Persistence**: `@react-native-async-storage/async-storage`
- **CSV Engine**: `papaparse` (RFC 4180 standard compliant parser & unparser)
- **File System & Sharing**: `expo-file-system`, `expo-document-picker`, `expo-sharing`
- **Icons & UI**: `@expo/vector-icons` (Ionicons), `react-native-safe-area-context`
- **Testing**: Jest with `ts-jest`

---

## Project Structure

```
akriveia/
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── ConfirmDialog.tsx  # Themed confirmation modal
│   │   ├── EmptyState.tsx     # Contextual empty state illustrations
│   │   ├── ErrorView.tsx      # Graceful error display
│   │   ├── LoadingView.tsx    # Activity indicator wrapper
│   │   ├── PriorityBadge.tsx  # Color-coded priority pill badge
│   │   ├── SearchBar.tsx      # Real-time search input with clear trigger
│   │   ├── SortModal.tsx      # Bottom sheet modal for sorting options
│   │   ├── StatusBadge.tsx    # Pending/Completed status indicator
│   │   ├── TaskCard.tsx       # Reusable task card with completion toggle
│   │   └── TaskFilter.tsx     # Segmented filter buttons with count badges
│   ├── constants/
│   │   ├── colors.ts          # Curated light and dark theme color palettes
│   │   └── storageKeys.ts     # Dedicated AsyncStorage keys
│   ├── context/
│   │   ├── TaskContext.tsx    # State management & dynamic metric calculation
│   │   └── ThemeContext.tsx   # Theme state & persistence provider
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Native Stack Navigator and themed headers
│   ├── screens/
│   │   ├── AddEditTaskScreen.tsx # Unified form for adding/editing tasks
│   │   ├── BulkUploadScreen.tsx  # CSV picker, parser, validator & summary
│   │   ├── DashboardScreen.tsx   # Metrics dashboard, quick actions & FAB
│   │   ├── SettingsScreen.tsx    # Theme toggle, CSV export & clear database
│   │   ├── TaskDetailsScreen.tsx # Detailed task view & action triggers
│   │   └── TaskListScreen.tsx    # Task list with search, filter, and sort
│   ├── services/
│   │   ├── csvService.ts      # CSV parsing, row validation & file export
│   │   └── storage.ts         # AsyncStorage service abstraction
│   ├── types/
│   │   └── task.ts            # TypeScript interfaces and navigation param types
│   └── utils/
│       ├── dateUtils.ts       # Timezone-safe date parsing, formatting & comparisons
│       ├── taskUtils.ts       # Sorting, searching, and filtering utilities
│       └── validation.ts      # Form validation and value normalizers
├── __tests__/                 # Comprehensive test suite
│   └── taskflow.test.ts       # Unit tests for dates, validation, sorting & CSV
├── app.json                   # Expo application configuration
├── package.json
└── tsconfig.json
```

---

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Verify dependency health**:
   ```bash
   npx expo-doctor
   ```

3. **Run TypeScript typecheck**:
   ```bash
   npx tsc --noEmit
   ```

4. **Run Linter**:
   ```bash
   npx expo lint
   ```

5. **Run Unit Tests**:
   ```bash
   npx jest
   ```

---

## Running the App

### Start Expo Dev Server
```bash
npx expo start
```

### Run on Android
```bash
npx expo run:android
```
*(or press `a` in the Expo CLI terminal)*

### Run on iOS
```bash
npx expo run:ios
```
*(requires macOS with Xcode installed)*

### Run on Web
```bash
npx expo start --web
```

---

## CSV Import

### Expected CSV Structure
The application requires standard CSV files containing the following column headers:

```csv
id,title,description,category,priority,start_date,due_date,status
```

### Supported Values & Normalization
- **priority**: `Low`, `Medium`, `High` (case-insensitive, whitespace-trimmed, accepts variations like `med` -> `Medium`)
- **status**: `Pending`, `Completed` (case-insensitive, whitespace-trimmed, accepts variations like `done` / `complete` -> `Completed`)
- **start_date / due_date**: `YYYY-MM-DD` (also accepts standard ISO-8601 strings and normalized slashes)

### Validation Rules
Every row in the uploaded CSV is validated independently:
1. **Required Headers**: The CSV must include all required column headers (`id`, `title`, `description`, `category`, `priority`, `start_date`, `due_date`, `status`).
2. **Missing ID**: Records without an ID are flagged.
3. **Missing Title / Category**: Rows with empty titles or categories are rejected.
4. **Invalid Priority**: Values outside `Low`, `Medium`, or `High` are flagged (e.g. `Row 11: Invalid priority "Urgent"`).
5. **Invalid Status**: Values outside `Pending` or `Completed` are flagged.
6. **Invalid Dates**: Non-existent calendar dates or incorrect formats are reported.
7. **Date Logic**: Due date cannot be earlier than start date (e.g. `Row 7: Due date cannot be earlier than start date (2026-10-01 < 2026-10-10)`).

### Duplicate Handling Strategy
- The task `id` serves as the primary duplicate identifier.
- **Existing Records**: If an incoming CSV row ID already exists in local storage, it is **skipped** and recorded in the duplicate count without overwriting the user's existing task.
- **Batch Duplicates**: If a CSV contains multiple rows with the same ID, the **first valid row is accepted** and subsequent duplicate rows are skipped and counted as duplicates.
- The summary dialog clearly displays:
  - Total Rows
  - Valid Rows Ready for Import
  - Duplicates Skipped
  - Invalid Rows (with row numbers and specific reasons)

---

## Build

### Android APK Generation
The debug APK was built locally using Expo continuous native generation and the Gradle build tool:

1. **Native Project Generation**:
   ```bash
   npx expo prebuild --platform android
   ```
2. **Gradle Assembly**:
   ```bash
   cd android && ./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a --max-workers=2
   ```
3. **Output Artifact**:
   The generated APK is located at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## Known Issues

- **Hardware Concurrency on Heavy C++ Builds**: When compiling all 4 native architectures simultaneously on Windows with CMake/Ninja, high memory consumption can occur during C++ codegen for `react-native-screens`. Specifying `-PreactNativeArchitectures=arm64-v8a` or `--max-workers=2` resolves this completely.
- **Expo File Sharing on Headless Web**: The CSV Export functionality uses native share sheets via `expo-sharing`; on desktop web browsers that do not support the Web Share API, file sharing falls back to direct URI download.
