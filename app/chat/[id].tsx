import { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  subscribeToMessages,
  sendMessage,
  markMessagesRead,
  uploadChatImage,
  respondToOffer,
} from '../../src/services/chat';
import { getListing } from '../../src/services/listings';
import { getUserProfile } from '../../src/services/auth';
import { useAuthStore } from '../../src/stores/authStore';
import { useChatStore } from '../../src/stores/chatStore';
import { Colors, Shadows } from '../../src/constants/colors';
import { Message, Listing, User } from '../../src/types';
import { formatRelativeTime, formatPrice } from '../../src/utils/formatters';

const { width } = Dimensions.get('window');

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { userProfile, firebaseUser } = useAuthStore();
  const { chats } = useChatStore();
  const chat = chats.find(c => c.id === id);

  const [messages, setMessages] = useState<Message[]>([]);
  const [listing, setListing] = useState<Listing | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const listRef = useRef<FlatList>(null);

  const otherId = chat
    ? userProfile?.uid === chat.buyerId ? chat.sellerId : chat.buyerId
    : null;

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToMessages(id, data => {
      setMessages(data);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });
    if (chat) {
      getListing(chat.listingId).then(setListing);
    }
    if (otherId) {
      getUserProfile(otherId).then(setOtherUser);
    }
    if (userProfile) markMessagesRead(id, userProfile.uid);
    return unsub;
  }, [id]);

  async function handleSend() {
    if (!text.trim() || !userProfile || !id || !otherId) return;
    setSending(true);
    const msg = text.trim();
    setText('');
    try {
      await sendMessage(id, userProfile.uid, userProfile.displayName, firebaseUser?.photoURL ?? null, msg, otherId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  async function handleSendOffer() {
    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0 || !userProfile || !id || !otherId) return;
    setSending(true);
    setShowOffer(false);
    setOfferAmount('');
    try {
      await sendMessage(
        id, userProfile.uid, userProfile.displayName, firebaseUser?.photoURL ?? null,
        `I'd like to offer ₹${amount.toLocaleString('en-IN')} for this item.`,
        otherId, undefined, amount
      );
    } catch {
      Alert.alert('Error', 'Failed to send offer.');
    } finally {
      setSending(false);
    }
  }

  async function handleImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && userProfile && id && otherId) {
      setSending(true);
      try {
        const url = await uploadChatImage(result.assets[0].uri, id);
        await sendMessage(id, userProfile.uid, userProfile.displayName, firebaseUser?.photoURL ?? null, '📷 Photo', otherId, url);
      } catch {
        Alert.alert('Error', 'Failed to send image.');
      } finally {
        setSending(false);
      }
    }
  }

  function renderMessage({ item, index }: { item: Message; index: number }) {
    const isMe = item.senderId === userProfile?.uid;
    const showAvatar = !isMe && (index === 0 || messages[index - 1]?.senderId !== item.senderId);
    const showTime =
      index === messages.length - 1 ||
      messages[index + 1]?.senderId !== item.senderId ||
      messages[index + 1]?.createdAt - item.createdAt > 300000;

    return (
      <Animated.View entering={FadeIn.delay(30)} style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && (
          <View style={styles.avatarSpace}>
            {showAvatar ? (
              otherUser?.photoURL ? (
                <Image source={{ uri: otherUser.photoURL }} style={styles.msgAvatar} contentFit="cover" />
              ) : (
                <View style={styles.msgAvatarFallback}>
                  <Text style={styles.msgAvatarText}>{otherUser?.displayName?.[0]}</Text>
                </View>
              )
            ) : null}
          </View>
        )}

        <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
          {item.type === 'image' && item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.msgImage} contentFit="cover" borderRadius={12} />
          ) : item.type === 'offer' ? (
            <View style={styles.offerBubble}>
              <MaterialCommunityIcons name="hand-coin" size={20} color={Colors.accent} />
              <View>
                <Text style={styles.offerLabel}>Offer Sent</Text>
                <Text style={styles.offerAmount}>₹{item.offerAmount?.toLocaleString('en-IN')}</Text>
              </View>
              {!isMe && item.offerStatus === 'pending' && (
                <View style={styles.offerActions}>
                  <Pressable
                    style={[styles.offerBtn, { backgroundColor: Colors.success }]}
                    onPress={() => respondToOffer(id!, item.id, 'accepted')}
                  >
                    <Text style={styles.offerBtnText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.offerBtn, { backgroundColor: Colors.error }]}
                    onPress={() => respondToOffer(id!, item.id, 'declined')}
                  >
                    <Text style={styles.offerBtnText}>Decline</Text>
                  </Pressable>
                </View>
              )}
              {item.offerStatus !== 'pending' && (
                <View style={[styles.offerStatus, {
                  backgroundColor: item.offerStatus === 'accepted' ? Colors.successLight : Colors.errorLight,
                }]}>
                  <Text style={{ fontSize: 12, color: item.offerStatus === 'accepted' ? Colors.success : Colors.error, fontWeight: '700' }}>
                    {item.offerStatus?.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
          )}
        </View>
      </Animated.View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          title: otherUser?.displayName ?? 'Chat',
          headerStyle: { backgroundColor: Colors.primaryDark },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

      {/* Listing Header */}
      {listing && (
        <Pressable
          style={styles.listingHeader}
          onPress={() => router.push(`/listing/${listing.id}`)}
        >
          <Image source={{ uri: listing.images[0] }} style={styles.listingThumb} contentFit="cover" />
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
            <Text style={styles.listingPrice}>{formatPrice(listing.price)}</Text>
          </View>
          <Text style={styles.listingStatus}>{listing.status.toUpperCase()}</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textHint} />
        </Pressable>
      )}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderMessage}
        contentContainerStyle={[styles.msgList, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <MaterialCommunityIcons name="chat-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyChatText}>Start the conversation!</Text>
            <Text style={styles.emptyChatSub}>Ask about condition, negotiation, or meetup</Text>
          </View>
        }
      />

      {/* Offer panel */}
      {showOffer && (
        <Animated.View entering={FadeInDown} style={styles.offerPanel}>
          <Text style={styles.offerPanelTitle}>Make an Offer</Text>
          <View style={styles.offerInputRow}>
            <Text style={styles.offerCurrency}>₹</Text>
            <TextInput
              style={styles.offerInput}
              placeholder="Enter your offer"
              placeholderTextColor={Colors.textHint}
              value={offerAmount}
              onChangeText={setOfferAmount}
              keyboardType="numeric"
              autoFocus
            />
          </View>
          <View style={styles.offerBtnsRow}>
            <Pressable style={styles.cancelOfferBtn} onPress={() => setShowOffer(false)}>
              <Text style={styles.cancelOfferText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.sendOfferBtn, !offerAmount && { opacity: 0.5 }]}
              onPress={handleSendOffer}
              disabled={!offerAmount}
            >
              <Text style={styles.sendOfferText}>Send Offer</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Input Bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable style={styles.actionBtn} onPress={handleImage}>
          <MaterialCommunityIcons name="image-outline" size={24} color={Colors.textSecondary} />
        </Pressable>
        {listing && (
          <Pressable style={styles.actionBtn} onPress={() => setShowOffer(true)}>
            <MaterialCommunityIcons name="hand-coin-outline" size={24} color={Colors.accent} />
          </Pressable>
        )}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textHint}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
        </View>
        <Pressable
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size={18} color="#fff" />
          ) : (
            <MaterialCommunityIcons name="send" size={20} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listingThumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: Colors.surfaceVariant },
  listingInfo: { flex: 1, gap: 2 },
  listingTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  listingPrice: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  listingStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textHint,
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  msgList: { padding: 16, gap: 4 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  msgRowMe: { flexDirection: 'row-reverse' },
  avatarSpace: { width: 32, alignItems: 'center' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14 },
  msgAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgAvatarText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  msgBubble: {
    maxWidth: width * 0.72,
    borderRadius: 20,
    padding: 12,
    paddingHorizontal: 16,
  },
  msgBubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    ...Shadows.small,
  },
  msgText: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  msgTextMe: { color: '#fff' },
  msgImage: { width: 200, height: 200 },
  offerBubble: { gap: 8 },
  offerLabel: { fontSize: 12, color: Colors.textHint, fontWeight: '600' },
  offerAmount: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  offerActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  offerBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  offerBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  offerStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  emptyChat: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyChatText: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyChatSub: { fontSize: 14, color: Colors.textHint, textAlign: 'center' },
  offerPanel: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 14,
  },
  offerPanelTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  offerInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  offerCurrency: { fontSize: 24, fontWeight: '700', color: Colors.textSecondary },
  offerInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: 6,
  },
  offerBtnsRow: { flexDirection: 'row', gap: 10 },
  cancelOfferBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelOfferText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  sendOfferBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
  },
  sendOfferText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  inputWrap: {
    flex: 1,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  input: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.textHint },
});
