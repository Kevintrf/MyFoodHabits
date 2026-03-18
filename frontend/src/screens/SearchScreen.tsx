import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchFoods, Food } from '../services/api';
import { SearchStackParamList } from '../navigation/RootNavigator';

type NavProp = NativeStackNavigationProp<SearchStackParamList, 'Search'>;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigation = useNavigation<NavProp>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const foods = await searchFoods(query.trim());
        setResults(foods);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const noResults = !loading && query.trim() !== '' && results.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search foods..."
          value={query}
          onChangeText={setQuery}
          autoFocus
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {loading && <ActivityIndicator style={styles.spinner} color="#2D6A4F" />}

      {noResults && (
        <Text style={styles.empty}>No results for "{query}"</Text>
      )}

      {query.trim() === '' && (
        <Text style={styles.placeholder}>Search for a food to log it</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.result}
            onPress={() => navigation.navigate('Portion', { food: item })}
          >
            <View style={styles.resultLeft}>
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultSub}>
                {item.calories_per_100g} kcal · {item.protein_per_100g}g protein per 100
                {item.liquid ? 'ml' : 'g'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          results.length > 0 ? (
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('CreateFood', { initialName: query.trim() })}
            >
              <Text style={styles.createBtnText}>+ Create new food</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {noResults && (
        <TouchableOpacity
          style={styles.createBtnProminent}
          onPress={() => navigation.navigate('CreateFood', { initialName: query.trim() })}
        >
          <Text style={styles.createBtnProminentText}>+ Create "{query.trim()}"</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  searchBar: { padding: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  spinner: { marginTop: 20 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  placeholder: { textAlign: 'center', color: '#bbb', marginTop: 60, fontSize: 15 },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 10,
    padding: 14,
  },
  resultLeft: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
  resultSub: { fontSize: 13, color: '#999', marginTop: 3 },
  chevron: { fontSize: 22, color: '#ccc', marginLeft: 8 },
  createBtn: {
    margin: 12,
    marginTop: 6,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2D6A4F',
  },
  createBtnText: { color: '#2D6A4F', fontSize: 15, fontWeight: '600' },
  createBtnProminent: {
    margin: 16,
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  createBtnProminentText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
