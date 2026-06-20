import { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  RefreshControl,
  Animated as RNAnimated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getListings } from '../../src/services/listings';
import { useListingStore } from '../../src/stores/listingStore';
import { useAuthStore } from '../../src/stores/authStore';
import { ListingCard } from '../../src/components/listing/ListingCard';
import { Colors, Shadows } from '../../src/constants/colors';
import { CATEGORIES } from '../../src/constants/categories';
import { Listing } from '../../src/types';

const { width } = Dimensions.get('window');

const BANNER_ITEMS = [
  {
    title: 'Semester Clearance',
    subtitle: 'Great deals from seniors',
    icon: 'tag-multiple',
    gradient: [Colors.primary, Colors.secondary] as [string, string],
  },
  {
    title: 'Fresher Corner',
    subtitle: 'Everything a fresher needs',
    icon: 'star-shooting',
    gradient: ['#6A1B9A', '#AB47BC'] as [string, string],
  },
  {
    title: 'Free & Donate',
    subtitle: 'Pay it forward',
    icon: 'gift-open',
    gradient: [Colors.success, '#66BB6A'] as [string, string],
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile } = useAuthStore();
  const { listings, selectedCategory, setListings, setCategory, wishlist, setWishlist } =
    useListingStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 80], outputRange: [0, 1] });

  async function loadListings(category?: string | null, reset = false) {
    try {
      const { listings: data } = await getListings(category ?? undefined);
      setListings(data);
    } catch (e) {
      console.warn('Failed to load listings', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (userProfile) setWishlist(userProfile.wishlist ?? []);
    loadListings(selectedCategory);
  }, [selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadListings(selectedCategory);
  }, [selectedCategory]);

  return (
    <View style={styles.container}>
      {/* Sticky header on scroll */}
      <RNAnimated.View style={[styles.stickyHeader, { paddingTop: insets.top, opacity: headerOpacity }]}>
        <Text style={styles.stickyTitle}>Campus Marketplace</Text>
      </RNAnimated.View>

      <RNAnimated.FlatList
        data={listings}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        onScroll={RNAnimated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        ListHeaderComponent={
          <View style={{ gap: 0 }}>
            {/* Hero header */}
            <LinearGradient
              colors={[Colors.primaryDark, Colors.primary, '#5C6BC0']}
              style={[styles.hero, { paddingTop: insets.top + 12 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroContent}>
                <View>
                  <Text style={styles.heroGreeting}>
                    Hello, {userProfile?.displayName?.split(' ')[0] ?? 'Student'} 👋
                  </Text>
                  <Text style={styles.heroTitle}>What are you looking for?</Text>
                </View>
                <Pressable style={styles.notifBtn} onPress={() => router.push('/(tabs)/chats')}>
                  <MaterialCommunityIcons name="bell-outline" size={22} color="#fff" />
                </Pressable>
              </View>

              <Pressable style={styles.searchBar} onPress={() => router.push('/(tabs)/search')}>
                <MaterialCommunityIcons name="magnify" size={20} color={Colors.textHint} />
                <Text style={styles.searchPlaceholder}>Search listings...</Text>
                <View style={styles.searchFilter}>
                  <MaterialCommunityIcons name="tune-variant" size={16} color={Colors.primary} />
                </View>
              </Pressable>
            </LinearGradient>

            {/* Banners */}
            <View style={styles.bannerSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bannerScroll}>
                {BANNER_ITEMS.map((b, i) => (
                  <Pressable key={b.title} style={styles.bannerCard}>
                    <LinearGradient colors={b.gradient} style={styles.bannerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <MaterialCommunityIcons name={b.icon as any} size={28} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.bannerTitle}>{b.title}</Text>
                      <Text style={styles.bannerSub}>{b.subtitle}</Text>
                    </LinearGradient>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Categories */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Browse by Category</Text>
                <Pressable onPress={() => setCategory(null)}>
                  <Text style={styles.seeAll}>See all</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                <Pressable
                  style={[styles.catChip, !selectedCategory && styles.catChipActive]}
                  onPress={() => setCategory(null)}
                >
                  <MaterialCommunityIcons
                    name="view-grid"
                    size={18}
                    color={!selectedCategory ? '#fff' : Colors.textSecondary}
                  />
                  <Text style={[styles.catLabel, !selectedCategory && styles.catLabelActive]}>All</Text>
                </Pressable>
                {CATEGORIES.map(cat => (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.catChip,
                      selectedCategory === cat.id && styles.catChipActive,
                      { borderColor: cat.color + '40' },
                    ]}
                    onPress={() => setCategory(selectedCategory === cat.id ? null : cat.id)}
                  >
                    <MaterialCommunityIcons
                      name={cat.icon as any}
                      size={18}
                      color={selectedCategory === cat.id ? '#fff' : cat.color}
                    />
                    <Text style={[styles.catLabel, selectedCategory === cat.id && styles.catLabelActive]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Listings header */}
            <View style={styles.sectionHeader2}>
              <Text style={styles.sectionTitle}>
                {selectedCategory
                  ? CATEGORIES.find(c => c.id === selectedCategory)?.name
                  : 'Recent Listings'}
              </Text>
              <Text style={styles.listingCount}>{listings.length} items</Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <ListingCard listing={item} />
          </Animated.View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="package-variant-closed" size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>No listings found</Text>
              <Text style={styles.emptySub}>Be the first to post something!</Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/(tabs)/create')}>
                <Text style={styles.emptyBtnText}>+ Post a Listing</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignItems: 'center',
  },
  stickyTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  hero: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  heroContent: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 4,
    ...Shadows.small,
  },
  searchPlaceholder: { flex: 1, fontSize: 15, color: Colors.textHint },
  searchFilter: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerSection: { marginTop: -16 },
  bannerScroll: { paddingHorizontal: 20, paddingVertical: 8, gap: 12 },
  bannerCard: { width: 180, borderRadius: 20, overflow: 'hidden', ...Shadows.medium },
  bannerGradient: { padding: 20, gap: 6, height: 120, justifyContent: 'flex-end' },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  section: { paddingTop: 20, gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  sectionHeader2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  listingCount: { fontSize: 13, color: Colors.textHint },
  catScroll: { paddingHorizontal: 20, gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  catLabelActive: { color: '#fff' },
  listContent: { paddingHorizontal: 16, paddingTop: 0 },
  row: { gap: 12, marginBottom: 12, paddingHorizontal: 4 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 14, color: Colors.textHint, textAlign: 'center' },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
