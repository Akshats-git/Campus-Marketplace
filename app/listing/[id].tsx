import { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { getListing } from '../../src/services/listings';
import { getOrCreateChat } from '../../src/services/chat';
import { getUserProfile } from '../../src/services/auth';
import { useAuthStore } from '../../src/stores/authStore';
import { useListingStore } from '../../src/stores/listingStore';
import { toggleWishlist } from '../../src/services/listings';
import { Colors, Shadows } from '../../src/constants/colors';
import { Listing, User } from '../../src/types';
import { CATEGORIES, CONDITIONS } from '../../src/constants/categories';
import { formatPrice, formatRelativeTime, formatCondition } from '../../src/utils/formatters';

const { width } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { userProfile } = useAuthStore();
  const { wishlist, toggleWishlist: toggleLocal } = useListingStore();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [contactLoading, setContactLoading] = useState(false);

  const isWishlisted = wishlist.includes(id ?? '');
  const isMine = userProfile?.uid === listing?.sellerId;

  useEffect(() => {
    if (!id) return;
    Promise.all([getListing(id), getUserProfile(listing?.sellerId ?? '')]).then(([l]) => {
      setListing(l);
      if (l?.sellerId) getUserProfile(l.sellerId).then(setSeller);
      setLoading(false);
    });
  }, [id]);

  async function handleWishlist() {
    if (!userProfile || !listing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleLocal(listing.id);
    await toggleWishlist(listing.id, userProfile.uid, isWishlisted);
  }

  async function handleContact() {
    if (!userProfile || !listing) return;
    if (isMine) return;
    setContactLoading(true);
    try {
      const chatId = await getOrCreateChat(
        listing.id,
        listing.title,
        listing.images[0],
        listing.price,
        userProfile.uid,
        listing.sellerId
      );
      router.push(`/chat/${chatId}`);
    } catch {
      Alert.alert('Error', 'Could not start chat. Please try again.');
    } finally {
      setContactLoading(false);
    }
  }

  async function handleShare() {
    Share.share({
      title: listing?.title,
      message: `Check out "${listing?.title}" on Campus Marketplace for ${formatPrice(listing?.price ?? 0)}!`,
    });
  }

  const category = CATEGORIES.find(c => c.id === listing?.categoryId);
  const condition = CONDITIONS.find(c => c.id === listing?.condition);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Listing not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={handleWishlist} style={styles.headerBtn}>
                <MaterialCommunityIcons
                  name={isWishlisted ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isWishlisted ? Colors.error : '#fff'}
                />
              </Pressable>
              <Pressable onPress={handleShare} style={styles.headerBtn}>
                <MaterialCommunityIcons name="share-variant" size={22} color="#fff" />
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Image Carousel */}
        <View style={styles.imageCarousel}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={e => setCurrentImage(Math.round(e.nativeEvent.contentOffset.x / width))}
            scrollEventThrottle={16}
          >
            {listing.images.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.mainImage} contentFit="cover" />
            ))}
          </ScrollView>

          {/* Image dots */}
          {listing.images.length > 1 && (
            <View style={styles.imageDots}>
              {listing.images.map((_, i) => (
                <View key={i} style={[styles.dot, i === currentImage && styles.dotActive]} />
              ))}
            </View>
          )}

          {/* Status badge */}
          {listing.status !== 'active' && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: listing.status === 'sold' ? Colors.error : Colors.warning },
            ]}>
              <Text style={styles.statusText}>{listing.status.toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Title + Price */}
          <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.titleSection}>
            <View style={styles.categoryRow}>
              {category && (
                <View style={[styles.categoryChip, { backgroundColor: category.backgroundColor }]}>
                  <MaterialCommunityIcons name={category.icon as any} size={12} color={category.color} />
                  <Text style={[styles.categoryText, { color: category.color }]}>{category.name}</Text>
                </View>
              )}
              <Text style={styles.viewCount}>
                <MaterialCommunityIcons name="eye-outline" size={13} color={Colors.textHint} />
                {' '}{listing.viewCount} views
              </Text>
            </View>
            <Text style={styles.title}>{listing.title}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatPrice(listing.price)}</Text>
              {listing.originalPrice && (
                <Text style={styles.originalPrice}>₹{listing.originalPrice.toLocaleString('en-IN')}</Text>
              )}
              {listing.isNegotiable && (
                <View style={styles.negotiableBadge}>
                  <Text style={styles.negotiableText}>Negotiable</Text>
                </View>
              )}
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <MaterialCommunityIcons name="star-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{condition?.label}</Text>
              </View>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaTime}>{formatRelativeTime(listing.createdAt)}</Text>
            </View>
          </Animated.View>

          {/* Seller Card */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.sellerCard}>
            <Pressable
              style={styles.sellerRow}
              onPress={() => router.push(`/user/${listing.sellerId}`)}
            >
              {seller?.photoURL ? (
                <Image source={{ uri: seller.photoURL }} style={styles.sellerAvatar} contentFit="cover" />
              ) : (
                <View style={styles.sellerAvatarFallback}>
                  <Text style={styles.sellerInitial}>{seller?.displayName?.[0] ?? 'S'}</Text>
                </View>
              )}
              <View style={styles.sellerInfo}>
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerName}>{seller?.displayName ?? 'Student'}</Text>
                  {seller?.isVerified && (
                    <MaterialCommunityIcons name="check-decagram" size={16} color={Colors.primary} />
                  )}
                </View>
                <View style={styles.sellerMeta}>
                  <MaterialCommunityIcons name="home-city-outline" size={13} color={Colors.textHint} />
                  <Text style={styles.sellerMetaText}>{listing.sellerHostel}</Text>
                  <Text style={styles.sellerDot}>·</Text>
                  <MaterialCommunityIcons name="star" size={13} color={Colors.accentLight} />
                  <Text style={styles.sellerMetaText}>{seller?.rating?.toFixed(1) ?? '—'}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textHint} />
            </Pressable>
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </Animated.View>

          {/* Tags */}
          {listing.tags?.length > 0 && (
            <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.tagsRow}>
              {listing.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Safety tip */}
          <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.safetyCard}>
            <MaterialCommunityIcons name="shield-check" size={20} color={Colors.success} />
            <Text style={styles.safetyText}>
              Meet at campus public areas. Verify the item before payment.
            </Text>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      {!isMine && listing.status === 'active' && (
        <Animated.View
          entering={FadeInUp.springify()}
          style={[styles.ctaBar, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <Pressable style={styles.wishlistCta} onPress={handleWishlist}>
            <MaterialCommunityIcons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={24}
              color={isWishlisted ? Colors.error : Colors.textSecondary}
            />
          </Pressable>
          <Pressable
            style={[styles.contactBtn, contactLoading && { opacity: 0.7 }]}
            onPress={handleContact}
            disabled={contactLoading}
          >
            {contactLoading ? (
              <ActivityIndicator size={20} color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="chat" size={20} color="#fff" />
                <Text style={styles.contactBtnText}>Chat with Seller</Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      )}

      {isMine && (
        <Animated.View
          entering={FadeInUp.springify()}
          style={[styles.ctaBar, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <Pressable
            style={[styles.contactBtn, { backgroundColor: Colors.error }]}
            onPress={() => {
              Alert.alert('Mark as Sold', 'Has this item been sold?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Mark as Sold',
                  onPress: async () => {
                    const { markAsSold } = await import('../../src/services/listings');
                    await markAsSold(listing.id);
                    setListing({ ...listing, status: 'sold' });
                    Alert.alert('Done', 'Your listing has been marked as sold.');
                  },
                },
              ]);
            }}
          >
            <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
            <Text style={styles.contactBtnText}>Mark as Sold</Text>
          </Pressable>
          <Pressable
            style={[styles.contactBtn, { backgroundColor: Colors.error + '80', flex: 0.6 }]}
            onPress={() => {
              Alert.alert('Delete Listing', 'Are you sure? This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    const { deleteListing } = await import('../../src/services/listings');
                    await deleteListing(listing.id);
                    router.back();
                  },
                },
              ]);
            }}
          >
            <MaterialCommunityIcons name="delete" size={20} color="#fff" />
          </Pressable>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCarousel: { position: 'relative', height: 360, backgroundColor: Colors.surfaceVariant },
  mainImage: { width, height: 360 },
  imageDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 20, backgroundColor: '#fff' },
  statusBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.6 },
  content: { padding: 20, gap: 20 },
  titleSection: { gap: 10 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryText: { fontSize: 12, fontWeight: '700' },
  viewCount: { fontSize: 13, color: Colors.textHint },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, lineHeight: 30 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  price: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  originalPrice: {
    fontSize: 16,
    color: Colors.textHint,
    textDecorationLine: 'line-through',
  },
  negotiableBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.success + '20',
    borderRadius: 8,
  },
  negotiableText: { fontSize: 12, color: Colors.success, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 8,
  },
  metaText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  metaDot: { color: Colors.textHint, fontSize: 14 },
  metaTime: { fontSize: 13, color: Colors.textHint },
  sellerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    ...Shadows.small,
  },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sellerAvatar: { width: 52, height: 52, borderRadius: 26 },
  sellerAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInitial: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  sellerInfo: { flex: 1, gap: 4 },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sellerName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  sellerMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sellerMetaText: { fontSize: 13, color: Colors.textHint },
  sellerDot: { color: Colors.textHint },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  sectionSub: { fontSize: 13, color: Colors.textHint, marginTop: -6 },
  description: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.primary + '15', borderRadius: 10 },
  tagText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: Colors.successLight,
    borderRadius: 14,
  },
  safetyText: { flex: 1, fontSize: 13, color: Colors.success, fontWeight: '500', lineHeight: 20 },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.large,
  },
  wishlistCta: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  contactBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
