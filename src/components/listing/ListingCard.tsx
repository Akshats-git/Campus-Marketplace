import { Pressable, View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Listing } from '../../types';
import { Colors, Shadows } from '../../constants/colors';
import { formatPrice, formatRelativeTime, formatCondition } from '../../utils/formatters';
import { CATEGORIES } from '../../constants/categories';
import { useAuthStore } from '../../stores/authStore';
import { toggleWishlist } from '../../services/listings';
import { useListingStore } from '../../stores/listingStore';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

interface Props {
  listing: Listing;
  fullWidth?: boolean;
}

export function ListingCard({ listing, fullWidth = false }: Props) {
  const { userProfile } = useAuthStore();
  const { wishlist, toggleWishlist: toggleLocal } = useListingStore();
  const isWishlisted = wishlist.includes(listing.id);
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  const category = CATEGORIES.find(c => c.id === listing.categoryId);

  async function handleWishlist(e: any) {
    e.stopPropagation();
    if (!userProfile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    heartScale.value = withSpring(1.4, {}, () => { heartScale.value = withSpring(1); });
    toggleLocal(listing.id);
    await toggleWishlist(listing.id, userProfile.uid, isWishlisted);
  }

  return (
    <Animated.View style={[cardStyle, fullWidth ? styles.fullCard : styles.gridCard]}>
      <Pressable
        style={styles.container}
        onPress={() => router.push(`/listing/${listing.id}`)}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: listing.images[0] }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            placeholder="https://via.placeholder.com/300x200/F0F1F5"
          />
          <View style={styles.topLeft}>
            {listing.isFree && (
              <View style={[styles.badge, { backgroundColor: Colors.success }]}>
                <Text style={styles.badgeText}>FREE</Text>
              </View>
            )}
            {listing.status === 'sold' && (
              <View style={[styles.badge, { backgroundColor: Colors.error }]}>
                <Text style={styles.badgeText}>SOLD</Text>
              </View>
            )}
            {listing.status === 'reserved' && (
              <View style={[styles.badge, { backgroundColor: Colors.warning }]}>
                <Text style={styles.badgeText}>RESERVED</Text>
              </View>
            )}
          </View>
          <View style={styles.topRight}>
            <Animated.View style={heartStyle}>
              <Pressable style={styles.heartBtn} onPress={handleWishlist}>
                <MaterialCommunityIcons
                  name={isWishlisted ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isWishlisted ? Colors.primary : '#fff'}
                />
              </Pressable>
            </Animated.View>
          </View>
          {listing.images.length > 1 && (
            <View style={styles.imageCount}>
              <MaterialCommunityIcons name="image-multiple" size={12} color="#fff" />
              <Text style={styles.imageCountText}>{listing.images.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.categoryRow}>
            {category && (
              <View style={[styles.categoryChip, { backgroundColor: category.backgroundColor }]}>
                <MaterialCommunityIcons name={category.icon as any} size={10} color={category.color} />
                <Text style={[styles.categoryText, { color: category.color }]}>{category.name}</Text>
              </View>
            )}
            <Text style={styles.conditionText}>{formatCondition(listing.condition)}</Text>
          </View>

          <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(listing.price)}</Text>
            {listing.isNegotiable && <Text style={styles.negotiable}>Negotiable</Text>}
          </View>

          <View style={styles.footer}>
            <View style={styles.sellerRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={12} color={Colors.textHint} />
              <Text style={styles.sellerInfo} numberOfLines={1}>{listing.sellerHostel}</Text>
            </View>
            <Text style={styles.time}>{formatRelativeTime(listing.createdAt)}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gridCard: { width: CARD_WIDTH },
  fullCard: { width: '100%' },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  imageContainer: { position: 'relative', height: 160, backgroundColor: Colors.surfaceVariant },
  image: { width: '100%', height: '100%' },
  topLeft: { position: 'absolute', top: 8, left: 8, gap: 4 },
  topRight: { position: 'absolute', top: 8, right: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  heartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCount: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  imageCountText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  content: { padding: 12, gap: 6 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  conditionText: { fontSize: 10, color: Colors.textHint, fontWeight: '500' },
  title: { fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 16, fontWeight: '800', color: Colors.primaryDark },
  negotiable: { fontSize: 10, color: Colors.success, fontWeight: '600', backgroundColor: Colors.successLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  sellerInfo: { fontSize: 11, color: Colors.textHint, flex: 1 },
  time: { fontSize: 11, color: Colors.textHint },
});
