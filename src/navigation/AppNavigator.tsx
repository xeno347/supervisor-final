// Main App Navigator
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useAuth } from '../context/AuthContext';
import CustomTabBar from './CustomTabBar';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';

// Home Tab Screens
import DashboardScreen from '../screens/home/DashboardScreen';
import LaboursScreen from '../screens/home/LaboursScreen';

// Tasks Tab Screens
import VehiclesScreen from '../screens/tasks/VehiclesScreen';
import TasksScreen from '../screens/tasks/TasksScreen';

// Field Visit Screens
import FieldVisitListScreen from '../screens/fieldvisit/FieldVisitListScreen';

// Request Screens
import MyRequestsScreen from '../screens/request/MyRequestsScreen';
import MakeRequestScreen from '../screens/request/MakeRequestScreen';

// Profile Screen
import ProfileScreen from '../screens/profile/ProfileScreen';

// Harvest Screens
import HarvestOrdersScreen from '../screens/harvest/HarvestOrdersScreen';
import HarvestScannerScreen from '../screens/harvest/HarvestScannerScreen';

import { colors, typography } from '../utils/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const TopTab = createMaterialTopTabNavigator();

// Tasks Top Tab Navigator
const TasksTopTabs = () => {
  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIndicatorStyle: { backgroundColor: colors.primary, height: 3 },
        tabBarLabelStyle: { ...typography.body, fontWeight: '600' },
        tabBarStyle: { backgroundColor: colors.surface },
      }}
    >
      <TopTab.Screen name="FieldVisits" component={FieldVisitListScreen} options={{ title: 'Field Visits' }} />
      <TopTab.Screen name="Tasks" component={TasksScreen} />
    </TopTab.Navigator>
  );
};

// Tasks Tab Stack
const TasksStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="TasksList" 
        component={TasksTopTabs}
        options={{ 
          title: 'Tasks & Vehicles',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.surface,
          headerTitleStyle: { ...typography.h3, fontWeight: 'bold' },
        }}
      />
    </Stack.Navigator>
  );
};

// Home Tab Stack
const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Labours" component={LaboursScreen} />
    </Stack.Navigator>
  );
};

// Request Top Tab Navigator
const RequestTopTabs = () => {
  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIndicatorStyle: { backgroundColor: colors.primary, height: 3 },
        tabBarLabelStyle: { ...typography.body, fontWeight: '600' },
        tabBarStyle: { backgroundColor: colors.surface },
      }}
    >
      <TopTab.Screen name="MyRequests" component={MyRequestsScreen} options={{ title: 'My Requests' }} />
      <TopTab.Screen name="MakeRequest" component={MakeRequestScreen} options={{ title: 'Make Request' }} />
    </TopTab.Navigator>
  );
};

// Request Tab Stack
const RequestStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="RequestsList" 
        component={RequestTopTabs}
        options={{ 
          title: 'Requests',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.surface,
          headerTitleStyle: { ...typography.h3, fontWeight: 'bold' },
        }}
      />
    </Stack.Navigator>
  );
};

// Profile Tab Stack
const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="ProfileScreen" 
        component={ProfileScreen}
        options={{ 
          title: 'Profile',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.surface,
          headerTitleStyle: { ...typography.h3, fontWeight: 'bold' },
        }}
      />
    </Stack.Navigator>
  );
};

// Harvest Tab Stack
const HarvestStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="HarvestOrders"
        component={HarvestOrdersScreen}
        options={{
          title: 'Harvest',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.surface,
          headerTitleStyle: { ...typography.h3, fontWeight: 'bold' },
        }}
      />
      <Stack.Screen
        name="HarvestScanner"
        component={HarvestScannerScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Main Bottom Tab Navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      initialRouteName="HomeTab"
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="TasksTab" component={TasksStack} />
      <Tab.Screen name="HarvestTab" component={HarvestStack} />
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="RequestTab" component={RequestStack} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
    </Tab.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
