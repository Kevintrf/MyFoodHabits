import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { editFood } from '../services/api';
import { SearchStackParamList } from '../navigation/RootNavigator';

type NavProp = NativeStackNavigationProp<SearchStackParamList, 'EditFood'>;
type RoutePropType = RouteProp<SearchStackParamList, 'EditFood'>;

export default function EditFoodScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { food } = route.params;

  const [name, setName] = useState(food.name);
  const [calories, setCalories] = useState(String(food.calories_per_100g));
  const [protein, setProtein] = useState(String(food.protein_per_100g));
  const [carbs, setCarbs] = useState(String(food.carbs_per_100g));
  const [fat, setFat] = useState(String(food.fat_per_100g));
  const [liquid, setLiquid] = useState(food.liquid);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const cal = parseFloat(calories);
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for this food.');
      return;
    }
    if (isNaN(cal) || cal < 0) {
      Alert.alert('Invalid calories', 'Calories per 100g must be a valid number.');
      return;
    }

    setSaving(true);
    try {
      const updated = await editFood(food.id, {
        name: name.trim(),
        calories_per_100g: cal,
        protein_per_100g: parseFloat(protein) || 0,
        carbs_per_100g: parseFloat(carbs) || 0,
        fat_per_100g: parseFloat(fat) || 0,
        liquid,
      });
      navigation.replace('Portion', { food: updated });
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.field}>
        <Text style={styles.label}>NAME *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholderTextColor="#bbb"
          autoFocus
        />
      </View>

      <Text style={styles.sectionNote}>Per 100{liquid ? 'ml' : 'g'}</Text>

      <View style={styles.row}>
        <View style={[styles.field, styles.fieldHalf]}>
          <Text style={styles.label}>CALORIES (kcal) *</Text>
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            keyboardType="decimal-pad"
            placeholderTextColor="#bbb"
          />
        </View>
        <View style={[styles.field, styles.fieldHalf]}>
          <Text style={styles.label}>PROTEIN (g)</Text>
          <TextInput
            style={styles.input}
            value={protein}
            onChangeText={setProtein}
            keyboardType="decimal-pad"
            placeholderTextColor="#bbb"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.field, styles.fieldHalf]}>
          <Text style={styles.label}>CARBS (g)</Text>
          <TextInput
            style={styles.input}
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="decimal-pad"
            placeholderTextColor="#bbb"
          />
        </View>
        <View style={[styles.field, styles.fieldHalf]}>
          <Text style={styles.label}>FAT (g)</Text>
          <TextInput
            style={styles.input}
            value={fat}
            onChangeText={setFat}
            keyboardType="decimal-pad"
            placeholderTextColor="#bbb"
          />
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Liquid (store per 100ml)</Text>
        <Switch
          value={liquid}
          onValueChange={setLiquid}
          trackColor={{ true: '#2D6A4F' }}
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { padding: 16, paddingBottom: 40 },
  sectionNote: { fontSize: 12, color: '#999', marginBottom: 12, marginTop: 4 },
  field: { marginBottom: 16 },
  fieldHalf: { flex: 1 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  toggleLabel: { fontSize: 15, color: '#1A1A1A' },
  saveBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
