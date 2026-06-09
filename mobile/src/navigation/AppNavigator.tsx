import React from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context';
import { colors } from '../theme';
import {
  LoginScreen,
  RegisterScreen,
  HomeScreen,
  CalendarScreen,
  ContactsScreen,
  ContactDetailsScreen,
  AddContactScreen,
  SettingsScreen,
} from '../screens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.textPrimary,
    border: colors.border,
  },
};

const TAB_ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  Calendar: { focused: 'calendar', unfocused: 'calendar-outline' },
  Contacts: { focused: 'people', unfocused: 'people-outline' },
  Settings: { focused: 'settings', unfocused: 'settings-outline' },
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        const icons = TAB_ICONS[route.name] ?? TAB_ICONS.Home;
        return <Ionicons name={focused ? icons.focused : icons.unfocused} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      headerShown: false,
      tabBarStyle: {
        paddingBottom: 8,
        paddingTop: 8,
        height: 64,
        backgroundColor: colors.card,
        borderTopColor: colors.border,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Calendar" component={CalendarScreen} />
    <Tab.Screen name="Contacts" component={ContactsScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.textOnPrimary,
      headerTitleStyle: { fontWeight: '600' },
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen
      name="MainTabs"
      component={TabNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="AddContact"
      component={AddContactScreen}
      options={{ title: 'Add Contact' }}
    />
    <Stack.Screen
      name="ContactDetails"
      component={ContactDetailsScreen}
      options={{ title: 'Contact Details' }}
    />
  </Stack.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};
