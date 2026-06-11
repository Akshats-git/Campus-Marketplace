import { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { searchListings } from '../../src/services/listings';
import { ListingCard } from '../../src/components/listing/ListingCard';
import { Colors } from '../../src/constants/colors';
import { CATEGORIES, CONDITIONS } from '../../src/constants/categories';
import { Listing } from '../../src/types';
import { SEARCH_DEBOUNCE_MS } from '../../src/constants/config';

const RECENT_SEARCHES = ['calculator', 'cycle', 'textbook', 'mattress', 'table fan'];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        let data = await searchListings(query);
        if (selectedCategory) data = data.filter(l => l.categoryId === selectedCategory);
        if (selectedCondition) data = data.filter(l => l.condition === selectedCondition);
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, selectedCategory, selectedCondition]);

  const activeFilters = [selectedCategory, selectedCondition].filter(Boolean).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={22} color={Colors.textHint} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search listings..."
            placeholderTextColor={Colors.textHint}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textHint} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={[styles.filterBtn, activeFilters > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(s => !s)}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={20}
            color={activeFilters > 0 ? '#fff' : Colors.textSecondary}
          />
          {activeFilters > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilters}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <Animated.View entering={FadeIn} style={styles.filterPanel}>
          <Text style={styles.filterTitle}>Category</Text>
          <FlatList
            horizontal
            data={CATEGORIES}
            keyExtractor={c => c.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.filterChip, selectedCategory === item.id && { backgroundColor: item.color }]}
                onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={14}
                  color={selectedCategory === item.id ? '#fff' : item.color}
                />
                <Text style={[styles.filterChipText, selectedCategory === item.id && { color: '#fff' }]}>
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
          <Text style={[styles.filterTitle, { marginTop: 12 }]}>Condition</Text>
          <View style={styles.conditionRow}>
            {CONDITIONS.map(c => (
              <Pressable
                key={c.id}
                style={[styles.conditionChip, selectedCondition === c.id && styles.conditionChipActive]}
                onPress={() => setSelectedCondition(selectedCondition === c.id ? null : c.id)}
              >
                <Text style={[styles.conditionText, selectedCondition === c.id && { color: '#fff' }]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {activeFilters > 0 && (
            <Pressable
              style={styles.clearBtn}
              onPress={() => { setSelectedCategory(null); setSelectedCondition(null); }}
            >
              <Text style={styles.clearBtnText}>Clear filters</Text>
            </Pressable>
          )}
        </Animated.View>
      )}

      {/* Content */}
      {!hasSearched ? (
        <View style={styles.emptyState}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          <View style={styles.recentList}>
            {RECENT_SEARCHES.map(s => (
              <Pressable key={s} style={styles.recentItem} onPress={() => setQuery(s)}>
                <MaterialCommunityIcons name="history" size={16} color={Colors.textHint} />
                <Text style={styles.recentText}>{s}</Text>
                <MaterialCommunityIcons name="arrow-top-left" size={14} color={Colors.textHint} />
              </Pressable>
            ))}
          </View>

          <Text style={[styles.recentTitle, { marginTop: 24 }]}>Browse Categories</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((cat, i) => (
              <Animated.View key={cat.id} entering={FadeInDown.delay(i * 40)}>
                <Pressable
                  style={[styles.catCard, { backgroundColor: cat.backgroundColor }]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <MaterialCommunityIcons name={cat.icon as any} size={28} color={cat.color} />
                  <Text style={[styles.catCardText, { color: cat.color }]}>{cat.name}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>
      ) : loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </Text>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40)}>
              <ListingCard listing={item} />
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.noResults}>
              <MaterialCommunityIcons name="magnify-close" size={64} color={Colors.border} />
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsSub}>Try a different search or clear filters</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 16, color: Colors.text },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBtnActive: { backgroundColor: Colors.primary },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  filterPanel: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  filterTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  conditionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  conditionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  conditionChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  conditionText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  clearBtn: { alignSelf: 'flex-start', paddingVertical: 6 },
  clearBtnText: { fontSize: 13, color: Colors.error, fontWeight: '600' },
  emptyState: { flex: 1, padding: 20 },
  recentTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  recentList: { gap: 2 },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  recentText: { flex: 1, fontSize: 15, color: Colors.text },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    gap: 8,
    alignItems: 'flex-start',
  },
  catCardText: { fontSize: 13, fontWeight: '700' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: Colors.textHint },
  listContent: { padding: 16, paddingBottom: 100, gap: 0 },
  row: { gap: 12, marginBottom: 12, paddingHorizontal: 4 },
  resultsCount: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16, fontWeight: '500' },
  noResults: { alignItems: 'center', paddingTop: 60, gap: 12 },
  noResultsTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  noResultsSub: { fontSize: 14, color: Colors.textHint, textAlign: 'center' },
});
