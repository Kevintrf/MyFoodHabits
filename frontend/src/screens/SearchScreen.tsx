import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { showAlert } from '../utils/alert';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { searchFoods, getFoodByBarcode, getRecentFoods, Food } from '../services/api';
import { SearchStackParamList } from '../navigation/RootNavigator';

type NavProp = NativeStackNavigationProp<SearchStackParamList, 'Search'>;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerBusy, setScannerBusy] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigation = useNavigation<NavProp>();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useEffect(() => {
    getRecentFoods().then(setRecentFoods).catch(() => {});
  }, []);

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

  async function openScanner() {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        showAlert('Camera access needed', 'Enable camera permission in settings to scan barcodes.');
        return;
      }
    }
    setScannerBusy(false);
    setScannerOpen(true);
  }

  async function handleBarcodeScan({ data }: { data: string }) {
    if (scannerBusy) return;
    setScannerBusy(true);
    setScannerOpen(false);

    try {
      const food = await getFoodByBarcode(data);
      navigation.navigate('Portion', { food });
    } catch {
      showAlert(
        'Not found',
        'This barcode isn\'t in the database yet.',
        [
          { text: 'Create manually', onPress: () => navigation.navigate('CreateFood', {}) },
          { text: 'Try again', onPress: () => { setScannerBusy(false); setScannerOpen(true); } },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    }
  }

  const isSearching = query.trim() !== '';
  const listData: Food[] = isSearching ? results : recentFoods;

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
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
              <TouchableOpacity style={styles.cameraBtn} onPress={openScanner}>
                <Ionicons name="barcode-outline" size={26} color="#2D6A4F" />
              </TouchableOpacity>
            </View>
            {loading && <ActivityIndicator style={styles.spinner} color="#2D6A4F" />}
            {!isSearching && recentFoods.length > 0 && (
              <Text style={styles.sectionHeader}>RECENT</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.result}
            onPress={() => navigation.navigate('Portion', { food: item })}
          >
            <View style={styles.resultLeft}>
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultSub}>
                {item.calories_per_100g} kcal per 100{item.liquid ? 'ml' : 'g'}
              </Text>
              <Text style={styles.resultSub}>
                {item.protein_per_100g}g Protein · {item.carbs_per_100g}g Carbs · {item.fat_per_100g}g Fat
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? (
            isSearching ? (
              <Text style={styles.empty}>No results for "{query.trim()}"</Text>
            ) : (
              <Text style={styles.placeholder}>Search for a food to log it</Text>
            )
          ) : null
        }
        ListFooterComponent={null}
      />

      {/* Barcode scanner modal */}
      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={handleBarcodeScan}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerHint}>Point at a barcode</Text>
          </View>
          <TouchableOpacity style={styles.scannerClose} onPress={() => setScannerOpen(false)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  searchBar: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cameraBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 10,
  },
  spinner: { marginTop: 20 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
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
  // Scanner
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 260,
    height: 160,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
  },
  scannerHint: {
    color: '#fff',
    marginTop: 16,
    fontSize: 15,
  },
  scannerClose: {
    position: 'absolute',
    top: 56,
    right: 20,
  },
});
