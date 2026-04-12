import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

import TodayScreen from '../screens/TodayScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SearchScreen from '../screens/SearchScreen';
import PortionScreen from '../screens/PortionScreen';
import MealsScreen from '../screens/MealsScreen';
import CreateMealScreen from '../screens/CreateMealScreen';
import EditMealScreen from '../screens/EditMealScreen';
import WeightScreen from '../screens/WeightScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CreateFoodScreen from '../screens/CreateFoodScreen';
import EditFoodScreen from '../screens/EditFoodScreen';
import { Food, Meal } from '../services/api';

// --- Param list types ---

export type TodayStackParamList = {
  TodayHome: undefined;
  Calendar: undefined;
};

export type SearchStackParamList = {
  Search: undefined;
  Portion: { food: Food };
  CreateFood: { initialName?: string; barcode?: string };
  EditFood: { food: Food };
};

export type MealsStackParamList = {
  MealsList: undefined;
  CreateMeal: undefined;
  EditMeal: { meal: Meal };
};

type RootTabParamList = {
  Today: undefined;
  SearchTab: undefined;
  MealsTab: undefined;
  Weight: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const TodayStack = createNativeStackNavigator<TodayStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const MealsStack = createNativeStackNavigator<MealsStackParamList>();

function TodayStackNavigator() {
  return (
    <TodayStack.Navigator>
      <TodayStack.Screen
        name="TodayHome"
        component={TodayScreen}
        options={({ navigation }) => ({
          title: 'Today',
          headerRight: () => (
            <Ionicons
              name="calendar-outline"
              size={24}
              color="#2D6A4F"
              onPress={() => navigation.navigate('Calendar')}
            />
          ),
        })}
      />
      <TodayStack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendar' }} />
    </TodayStack.Navigator>
  );
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen
        name="Search"
        component={SearchScreen}
        options={({ navigation }) => ({
          title: 'Search Foods',
          headerRight: () => (
            <Ionicons
              name="add"
              size={26}
              color="#2D6A4F"
              onPress={() => navigation.navigate('CreateFood', {})}
            />
          ),
        })}
      />
      <SearchStack.Screen name="Portion" component={PortionScreen} options={{ title: 'Log Food' }} />
      <SearchStack.Screen name="CreateFood" component={CreateFoodScreen} options={{ title: 'New Food' }} />
      <SearchStack.Screen name="EditFood" component={EditFoodScreen} options={{ title: 'Edit Food' }} />
    </SearchStack.Navigator>
  );
}

function MealsStackNavigator() {
  return (
    <MealsStack.Navigator>
      <MealsStack.Screen
        name="MealsList"
        component={MealsScreen}
        options={({ navigation }) => ({
          title: 'Saved Meals',
          headerRight: () => (
            <Ionicons
              name="add"
              size={26}
              color="#2D6A4F"
              onPress={() => navigation.navigate('CreateMeal')}
            />
          ),
        })}
      />
      <MealsStack.Screen name="CreateMeal" component={CreateMealScreen} options={{ title: 'New Meal' }} />
      <MealsStack.Screen name="EditMeal" component={EditMealScreen} options={{ title: 'Edit Meal' }} />
    </MealsStack.Navigator>
  );
}

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Today: 'today-outline',
  SearchTab: 'search-outline',
  MealsTab: 'restaurant-outline',
  Weight: 'scale-outline',
  Settings: 'settings-outline',
};

function WeightTabIcon({ color, size }: { color: string; size: number }) {
  const { loggedWeightToday, refreshWeightToday } = useApp();
  useEffect(() => { refreshWeightToday(); }, []);
  return (
    <View>
      <Ionicons name="scale-outline" size={size} color={color} />
      {!loggedWeightToday && <View style={navStyles.dot} />}
    </View>
  );
}

const navStyles = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#e74c3c',
  },
});

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) =>
            route.name === 'Weight' ? (
              <WeightTabIcon color={color} size={size} />
            ) : (
              <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
            ),
          tabBarActiveTintColor: '#2D6A4F',
          tabBarInactiveTintColor: '#999',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Today" component={TodayStackNavigator} options={{ title: 'Today', headerShown: false }} />
        <Tab.Screen name="SearchTab" component={SearchStackNavigator} options={{ title: 'Search' }} />
        <Tab.Screen name="MealsTab" component={MealsStackNavigator} options={{ title: 'Meals' }} />
        <Tab.Screen name="Weight" component={WeightScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
