import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../state/authStore';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { SetupScreen } from '../screens/onboarding/SetupScreen';
import { colors } from '../theme';

// Placeholder Feature Screens handled below
import { Text } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
);

import {
    LayoutDashboard,
    Calendar,
    Users,
    Inbox,
    BarChart3,
    Clock,
    List,
    UserCircle
} from 'lucide-react-native';
import { ScheduleScreen as AdminSchedule } from '../screens/admin/ScheduleScreen';
import { TodayScreen as StaffToday } from '../screens/staff/TodayScreen';
import { RequestsScreen } from '../screens/requests/RequestsScreen';
import { ReportsScreen } from '../screens/admin/ReportsScreen';
import { StaffListScreen } from '../screens/admin/StaffListScreen';
import { MyShiftsScreen } from '../screens/staff/MyShiftsScreen';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { ProfileScreen as StaffProfile } from '../screens/staff/ProfileScreen';

const AdminRequests = RequestsScreen;
const StaffRequests = RequestsScreen;
const AdminReports = ReportsScreen;
const AdminStaff = StaffListScreen;
const StaffMyShifts = MyShiftsScreen;
const AdminDashboard = DashboardScreen;

const AdminNavigator = () => (
    <Tab.Navigator screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.card },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary
    }}>
        <Tab.Screen
            name="Dashboard"
            component={AdminDashboard}
            options={{ tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} /> }}
        />
        <Tab.Screen
            name="Schedule"
            component={AdminSchedule}
            options={{ tabBarIcon: ({ color }) => <Calendar color={color} size={24} /> }}
        />
        <Tab.Screen
            name="Staff"
            component={AdminStaff}
            options={{ tabBarIcon: ({ color }) => <Users color={color} size={24} /> }}
        />
        <Tab.Screen
            name="Requests"
            component={AdminRequests}
            options={{ tabBarIcon: ({ color }) => <Inbox color={color} size={24} /> }}
        />
        <Tab.Screen
            name="Reports"
            component={AdminReports}
            options={{ tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} /> }}
        />
    </Tab.Navigator>
);

const StaffNavigator = () => (
    <Tab.Navigator screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.card },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary
    }}>
        <Tab.Screen
            name="Today"
            component={StaffToday}
            options={{ tabBarIcon: ({ color }) => <Clock color={color} size={24} /> }}
        />
        <Tab.Screen
            name="MyShifts"
            component={StaffMyShifts}
            options={{ tabBarIcon: ({ color }) => <List color={color} size={24} />, title: 'My Shifts' }}
        />
        <Tab.Screen
            name="Requests"
            component={StaffRequests}
            options={{ tabBarIcon: ({ color }) => <Inbox color={color} size={24} /> }}
        />
        <Tab.Screen
            name="Profile"
            component={StaffProfile}
            options={{ tabBarIcon: ({ color }) => <UserCircle color={color} size={24} /> }}
        />
    </Tab.Navigator>
);

export const AppNavigator = () => {
    const { session, role, isLoading, checkSession } = useAuthStore();

    useEffect(() => {
        checkSession();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!session ? (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                ) : !role ? (
                    <Stack.Screen name="Setup" component={SetupScreen} />
                ) : role === 'admin' ? (
                    <Stack.Screen name="AdminApp" component={AdminNavigator} />
                ) : (
                    <Stack.Screen name="StaffApp" component={StaffNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
