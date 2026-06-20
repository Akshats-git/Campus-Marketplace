import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  useColorScheme,
  Alert,
  Linking,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { signOut } from '../../src/services/auth';
import { getUserListings, getListing } from '../../src/services/listings';
import { useAuthStore } from '../../src/stores/authStore';
import { useListingStore } from '../../src/stores/listingStore';
import { ListingCard } from '../../src/components/listing/ListingCard';
import { Colors, Shadows } from '../../src/constants/colors';
import { Listing } from '../../src/types';
import { getInitials } from '../../src/utils/formatters';
import { APP_NAME, APP_VERSION } from '../../src/constants/config';

type Tab = 'listings' | 'sold' | 'wishlist';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, firebaseUser, reset, setUserProfile } = useAuthStore();
  const { wishlist } = useListingStore();
  const [tab, setTab] = useState<Tab>('listings');
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [wishlistListings, setWishlistListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!userProfile) return;
    getUserListings(userProfile.uid).then(data => {
      setMyListings(data);
      setLoading(false);
    });
  }, [userProfile]);

  useEffect(() => {
    if (tab !== 'wishlist' || wishlist.length === 0) return;
    Promise.all(wishlist.map(id => getListing(id))).then(results => {
      setWishlistListings(results.filter((l): l is Listing => l !== null));
    });
  }, [tab, wishlist]);

  const activeListings = myListings.filter(l => l.status === 'active');
  const soldListings = myListings.filter(l => l.status === 'sold');

  function handleEditProfile() {
    router.push('/edit-profile');
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          reset();
        },
      },
    ]);
  }

  const displayListings = tab === 'listings' ? activeListings : tab === 'sold' ? soldListings : wishlistListings;
  const stars = Math.round(userProfile?.rating ?? 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.avatarWrap}>
            {firebaseUser?.photoURL ? (
              <Image source={{ uri: firebaseUser.photoURL }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{getInitials(userProfile?.displayName ?? 'S')}</Text>
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={16} color={Colors.primary} />
            </View>
          </View>
          <View style={styles.nameSection}>
            <Text style={styles.name}>{userProfile?.displayName}</Text>
            <Text style={styles.email}>{userProfile?.email}</Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="home-city-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.infoText}>{userProfile?.hostel || 'No hostel set'}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.infoText}>{userProfile?.year || 'Year not set'}</Text>
            </View>
          </View>
          <Pressable style={styles.editBtn} onPress={handleEditProfile}>
            <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Listings', value: userProfile?.listingsCount ?? 0 },
            { label: 'Sold', value: userProfile?.soldCount ?? 0 },
            { label: 'Rating', value: userProfile?.rating?.toFixed(1) ?? '—' },
            { label: 'Response', value: `${userProfile?.responseRate ?? 0}%` },
          ].map((stat, i) => (
            <View key={stat.label} style={[styles.statItem, i < 3 && styles.statBorder]}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Star rating */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(s => (
            <MaterialCommunityIcons
              key={s}
              name={s <= stars ? 'star' : 'star-outline'}
              size={16}
              color={s <= stars ? Colors.accentLight : 'rgba(255,255,255,0.4)'}
            />
          ))}
          <Text style={styles.ratingCount}>({userProfile?.ratingCount ?? 0} reviews)</Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['listings', 'sold', 'wishlist'] as Tab[]).map(t => (
          <Pressable
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Listings */}
      <View style={styles.listingsGrid}>
        {displayListings.length === 0 ? (
          <View style={styles.emptyTab}>
            <MaterialCommunityIcons name="package-variant-closed" size={48} color={Colors.border} />
            <Text style={styles.emptyTabText}>
              {tab === 'wishlist' ? 'No saved items' : 'No listings yet'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {displayListings.map((listing, i) => (
              <Animated.View key={listing.id} entering={FadeInDown.delay(i * 60)} style={styles.gridItem}>
                <ListingCard listing={listing} />
              </Animated.View>
            ))}
          </View>
        )}
      </View>

      <Divider style={styles.divider} />

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {[
          {
            icon: 'bell-outline',
            label: 'Notifications',
            action: () => Linking.openSettings(),
          },
          {
            icon: 'shield-account-outline',
            label: 'Privacy & Security',
            action: () => Alert.alert('Privacy & Security', 'Your data is stored securely with Firebase and is only visible to verified IIT Bhilai students. We do not share your information with third parties.'),
          },
          {
            icon: 'help-circle-outline',
            label: 'Help & Support',
            action: () => Alert.alert('Help & Support', 'For any issues or feedback, contact us at:\n\nsupport@iitbhilai.ac.in', [
              { text: 'OK' },
              { text: 'Send Email', onPress: () => Linking.openURL('mailto:support@iitbhilai.ac.in?subject=Campus%20Marketplace%20Support') },
            ]),
          },
          {
            icon: 'information-outline',
            label: 'About Campus Marketplace',
            action: () => Alert.alert(APP_NAME, `Version ${APP_VERSION}\n\nA student marketplace exclusively for the IIT Bhilai community. Buy, sell, and trade items safely within campus.\n\nBuilt with ❤️ by IIT Bhilai students.`),
          },
        ].map(item => (
          <Pressable key={item.label} style={styles.settingItem} onPress={item.action}>
            <MaterialCommunityIcons name={item.icon as any} size={22} color={Colors.textSecondary} />
            <Text style={styles.settingLabel}>{item.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textHint} />
          </Pressable>
        ))}
        <Pressable style={[styles.settingItem, styles.signOutItem]} onPress={handleSignOut}>
          <MaterialCommunityIcons name="logout" size={22} color={Colors.error} />
          <Text style={[styles.settingLabel, { color: Colors.error }]}>Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  headerRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 26, fontWeight: '800', color: '#fff' },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameSection: { flex: 1, gap: 4 },
  name: { fontSize: 20, fontWeight: '800', color: '#fff' },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  infoText: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  dot: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingCount: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginLeft: 4 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textHint },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  listingsGrid: { padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  gridItem: { width: '47%' },
  emptyTab: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTabText: { fontSize: 15, color: Colors.textHint },
  divider: { marginHorizontal: 16, marginVertical: 8 },
  section: { padding: 16, gap: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textHint, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 4 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  settingLabel: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  signOutItem: { borderBottomWidth: 0, marginTop: 8 },
});
