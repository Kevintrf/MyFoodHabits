import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

import TodayScreen from '../screens/TodayScreen';
import CalendarScreen from '../screens/CalendarScreen';
import CalorieTrendScreen from '../screens/CalorieTrendScreen';
import SearchScreen from '../screens/SearchScreen';
import PortionScreen from '../screens/PortionScreen';
import MealsScreen from '../screens/MealsScreen';
import CreateMealScreen from '../screens/CreateMealScreen';
import EditMealScreen from '../screens/EditMealScreen';
import WeightScreen from '../screens/WeightScreen';
import WeightGraphScreen from '../screens/WeightGraphScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CreateFoodScreen from '../screens/CreateFoodScreen';
import EditFoodScreen from '../screens/EditFoodScreen';
import { Food, Meal } from '../services/api';

// --- Param list types ---

export type TodayStackParamList = {
  TodayHome: undefined;
  Calendar: undefined;
  CalorieTrend: undefined;
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

export type WeightStackParamList = {
  WeightHome: undefined;
  WeightGraph: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
};

type RootTabParamList = {
  Today: undefined;
  SearchTab: undefined;
  MealsTab: undefined;
  WeightTab: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const TodayStack = createNativeStackNavigator<TodayStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const MealsStack = createNativeStackNavigator<MealsStackParamList>();
const WeightStack = createNativeStackNavigator<WeightStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function TodayStackNavigator() {
  return (
    <TodayStack.Navigator>
      <TodayStack.Screen
        name="TodayHome"
        component={TodayScreen}
        options={({ navigation }) => ({
          title: 'Today',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Ionicons
                name="bar-chart-outline"
                size={22}
                color="#2D6A4F"
                onPress={() => navigation.navigate('CalorieTrend')}
              />
              <Ionicons
                name="calendar-outline"
                size={24}
                color="#2D6A4F"
                onPress={() => navigation.navigate('Calendar')}
              />
            </View>
          ),
        })}
      />
      <TodayStack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendar' }} />
      <TodayStack.Screen name="CalorieTrend" component={CalorieTrendScreen} options={{ title: 'Calorie Trend' }} />
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

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Settings' }} />
    </SettingsStack.Navigator>
  );
}

function WeightStackNavigator() {
  return (
    <WeightStack.Navigator>
      <WeightStack.Screen
        name="WeightHome"
        component={WeightScreen}
        options={({ navigation }) => ({
          title: 'Weight',
          headerRight: () => (
            <Ionicons
              name="stats-chart-outline"
              size={22}
              color="#2D6A4F"
              onPress={() => navigation.navigate('WeightGraph')}
            />
          ),
        })}
      />
      <WeightStack.Screen name="WeightGraph" component={WeightGraphScreen} options={{ title: 'Weight Trend' }} />
    </WeightStack.Navigator>
  );
}

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Today: 'today-outline',
  SearchTab: 'search-outline',
  MealsTab: 'restaurant-outline',
  WeightTab: 'scale-outline',
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
            route.name === 'WeightTab' ? (
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
        <Tab.Screen name="WeightTab" component={WeightStackNavigator} options={{ title: 'Weight', headerShown: false }} />
        <Tab.Screen name="Settings" component={SettingsStackNavigator} options={{ title: 'Settings', headerShown: false }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
