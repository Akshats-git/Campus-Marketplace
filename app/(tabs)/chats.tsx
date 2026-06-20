import { useEffect } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { subscribeToChats } from '../../src/services/chat';
import { useChatStore } from '../../src/stores/chatStore';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Shadows } from '../../src/constants/colors';
import { Chat } from '../../src/types';
import { formatRelativeTime } from '../../src/utils/formatters';

export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile } = useAuthStore();
  const { chats, setChats, setTotalUnread } = useChatStore();

  useEffect(() => {
    if (!userProfile) return;
    const unsub = subscribeToChats(userProfile.uid, data => {
      setChats(data);
      const total = data.reduce((sum, c) => sum + (c.unreadCount[userProfile.uid] ?? 0), 0);
      setTotalUnread(total);
    });
    return unsub;
  }, [userProfile]);

  function renderChat({ item, index }: { item: Chat; index: number }) {
    const unread = userProfile ? item.unreadCount[userProfile.uid] ?? 0 : 0;
    const isMe = item.lastMessageSenderId === userProfile?.uid;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <Pressable
          style={[styles.chatItem, unread > 0 && styles.chatItemUnread]}
          onPress={() => router.push(`/chat/${item.id}`)}
        >
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: item.listingImage }}
              style={styles.listingThumb}
              contentFit="cover"
            />
            {unread > 0 && (
              <View style={styles.unreadDot}>
                <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </View>
          <View style={styles.chatContent}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle} numberOfLines={1}>{item.listingTitle}</Text>
              <Text style={[styles.chatTime, unread > 0 && { color: Colors.primary }]}>{formatRelativeTime(item.lastMessageAt)}</Text>
            </View>
            <View style={styles.chatFooter}>
              <Text
                style={[styles.lastMessage, unread > 0 && styles.lastMessageUnread]}
                numberOfLines={1}
              >
                {isMe ? 'You: ' : ''}{item.lastMessage || 'Start the conversation'}
              </Text>
              {unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unread}</Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Pressable style={styles.composeBtn} onPress={() => router.push('/(tabs)/search')}>
          <MaterialCommunityIcons name="magnify" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={chats}
        keyExtractor={item => item.id}
        renderItem={renderChat}
        contentContainerStyle={[styles.list, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="chat-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySub}>
              When you contact a seller or someone contacts you, it'll show up here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  composeBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingTop: 8 },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  chatItemUnread: {
    backgroundColor: Colors.primary + '06',
  },
  imageWrap: { position: 'relative' },
  listingThumb: { width: 64, height: 64, borderRadius: 16, backgroundColor: Colors.surfaceVariant },
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
    paddingHorizontal: 3,
  },
  unreadText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  chatContent: { flex: 1, gap: 4 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 8 },
  chatTime: { fontSize: 12, color: Colors.textHint },
  chatFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastMessage: { fontSize: 14, color: Colors.textHint, flex: 1, marginRight: 8 },
  lastMessageUnread: { color: Colors.text, fontWeight: '600' },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: { fontSize: 11, color: '#fff', fontWeight: '800' },
  separator: { height: 1, backgroundColor: Colors.divider, marginLeft: 94 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 14, paddingHorizontal: 48 },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 14, color: Colors.textHint, textAlign: 'center', lineHeight: 22 },
});
