import React from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/task';
import { useTheme } from '../context/ThemeContext';

// Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { TaskListScreen } from '../screens/TaskListScreen';
import { AddEditTaskScreen } from '../screens/AddEditTaskScreen';
import { TaskDetailsScreen } from '../screens/TaskDetailsScreen';
import { BulkUploadScreen } from '../screens/BulkUploadScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >

        
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={({ navigation }) => ({
            title: 'TaskFlow',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('Settings')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Settings"
                style={{ marginRight: 4 }}
              >
                <Ionicons name="settings-outline" size={22} color={colors.text} />
              </TouchableOpacity>
            ),
          })}
        />

        <Stack.Screen
          name="TaskList"
          component={TaskListScreen}
          options={({ navigation }) => ({
            title: 'All Tasks',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('AddEditTask', {})}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="New Task"
                style={{ marginRight: 4 }}
              >
                <Ionicons name="add" size={26} color={colors.primary} />
              </TouchableOpacity>
            ),
          })}
        />

        <Stack.Screen
          name="TaskDetails"
          component={TaskDetailsScreen}
          options={{
            title: 'Task Details',
          }}
        />

        <Stack.Screen
          name="AddEditTask"
          component={AddEditTaskScreen}
          options={{
            title: 'Task',
          }}
        />

        <Stack.Screen
          name="BulkUpload"
          component={BulkUploadScreen}
          options={{
            title: 'Bulk CSV Upload',
          }}
        />

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
