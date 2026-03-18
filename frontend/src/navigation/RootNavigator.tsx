import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import TodayScreen from '../screens/TodayScreen';
import SearchScreen from '../screens/SearchScreen';
import PortionScreen from '../screens/PortionScreen';
import MealsScreen from '../screens/MealsScreen';
import WeightScreen from '../screens/WeightScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Food } from '../services/api';

// --- Param list types ---

export type SearchStackParamList = {
  Search: undefined;
  Portion: { food: Food };
};

type RootTabParamList = {
  Today: undefined;
  SearchTab: undefined;
  Meals: undefined;
  Weight: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen name="Search" component={SearchScreen} options={{ title: 'Search Foods' }} />
      <SearchStack.Screen name="Portion" component={PortionScreen} options={{ title: 'Log Food' }} />
    </SearchStack.Navigator>
  );
}

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Today: 'today-outline',
  SearchTab: 'search-outline',
  Meals: 'restaurant-outline',
  Weight: 'scale-outline',
  Settings: 'settings-outline',
};

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
          ),
          tabBarActiveTintColor: '#2D6A4F',
          tabBarInactiveTintColor: '#999',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Today" component={TodayScreen} options={{ title: 'Today' }} />
        <Tab.Screen name="SearchTab" component={SearchStackNavigator} options={{ title: 'Search' }} />
        <Tab.Screen name="Meals" component={MealsScreen} />
        <Tab.Screen name="Weight" component={WeightScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
