import { Tabs } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '../../src/constants/colors';
import { useChatStore } from '../../src/stores/chatStore';

type TabName = 'index' | 'search' | 'create' | 'chats' | 'profile';

const TAB_CONFIG: { name: TabName; icon: string; label: string }[] = [
  { name: 'index', icon: 'home-variant', label: 'Home' },
  { name: 'search', icon: 'magnify', label: 'Search' },
  { name: 'create', icon: 'plus-circle', label: 'Sell' },
  { name: 'chats', icon: 'chat-outline', label: 'Chats' },
  { name: 'profile', icon: 'account-circle-outline', label: 'Profile' },
];

function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { totalUnread } = useChatStore();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <BlurView intensity={95} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.tabRow}>
        {TAB_CONFIG.map((tab, index) => {
          const isFocused = state.index === index;
          const scale = useSharedValue(1);
          const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

          return (
            <Pressable
              key={tab.name}
              style={styles.tabItem}
              onPress={() => {
                scale.value = withSpring(0.85, {}, () => { scale.value = withSpring(1); });
                navigation.navigate(tab.name);
              }}
            >
              <Animated.View style={[styles.tabContent, animStyle]}>
                {tab.name === 'create' ? (
                  <View style={styles.createBtn}>
                    <MaterialCommunityIcons name="plus" size={28} color="#fff" />
                  </View>
                ) : (
                  <>
                    <View style={styles.iconWrap}>
                      <MaterialCommunityIcons
                        name={isFocused ? tab.icon.replace('-outline', '') as any : tab.icon as any}
                        size={24}
                        color={isFocused ? Colors.primary : Colors.textHint}
                      />
                      {tab.name === 'chats' && totalUnread > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {totalUnread > 9 ? '9+' : totalUnread}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.tabLabel,
                        isFocused && styles.tabLabelActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                    {isFocused && <View style={styles.activeDot} />}
                  </>
                )}
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="create" />
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabContent: { alignItems: 'center', gap: 2, minHeight: 48, justifyContent: 'center' },
  iconWrap: { position: 'relative' },
  createBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 4,
  },
  tabLabel: { fontSize: 11, color: Colors.textHint, fontWeight: '500' },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '800' },
});
