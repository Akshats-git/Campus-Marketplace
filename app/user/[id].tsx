import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getUserProfile } from '../../src/services/auth';
import { getUserListings } from '../../src/services/listings';
import { useAuthStore } from '../../src/stores/authStore';
import { ListingCard } from '../../src/components/listing/ListingCard';
import { Colors, Shadows } from '../../src/constants/colors';
import { User, Listing } from '../../src/types';
import { getInitials } from '../../src/utils/formatters';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userProfile: me } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getUserProfile(id), getUserListings(id)]).then(([u, l]) => {
      setUser(u);
      setListings(l.filter(x => x.status === 'active'));
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loading}>
        <Text>User not found.</Text>
      </View>
    );
  }

  const stars = Math.round(user.rating);

  return (
    <>
      <Stack.Screen options={{ title: user.displayName, headerStyle: { backgroundColor: Colors.primaryDark }, headerTintColor: '#fff' }} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#E85555', '#FF6B6B', '#FF8E8E']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.avatarSection}>
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{getInitials(user.displayName)}</Text>
              </View>
            )}
            {user.isVerified && (
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={16} color={Colors.primary} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{user.displayName}</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="home-city-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.infoText}>{user.hostel} · {user.year}</Text>
          </View>
          <View style={styles.starsRow}>
            {[1,2,3,4,5].map(s => (
              <MaterialCommunityIcons key={s} name={s <= stars ? 'star' : 'star-outline'} size={16} color={s <= stars ? Colors.accent : 'rgba(255,255,255,0.3)'} />
            ))}
            <Text style={styles.ratingText}>{user.rating.toFixed(1)} ({user.ratingCount})</Text>
          </View>
          <View style={styles.statsRow}>
            {[
              { label: 'Listings', value: user.listingsCount },
              { label: 'Sold', value: user.soldCount },
              { label: 'Response', value: `${user.responseRate}%` },
            ].map((s, i) => (
              <View key={s.label} style={[styles.stat, i < 2 && styles.statBorder]}>
                <Text style={styles.statVal}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Active Listings ({listings.length})</Text>
          {listings.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="package-variant-closed" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>No active listings</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {listings.map((l, i) => (
                <Animated.View key={l.id} entering={FadeInDown.delay(i * 60)} style={styles.gridItem}>
                  <ListingCard listing={l} />
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', gap: 10 },
  avatarSection: { position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: '800', color: '#fff' },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 24, fontWeight: '800', color: '#fff' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginLeft: 6 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingVertical: 12, width: '100%', marginTop: 8 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' },
  statVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  content: { padding: 16, gap: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  gridItem: { width: '47%' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textHint },
});
