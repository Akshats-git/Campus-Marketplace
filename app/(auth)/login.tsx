import { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { signInWithGoogle } from '../../src/services/auth';
import { Colors } from '../../src/constants/colors';
import { INSTITUTE_EMAIL_DOMAIN } from '../../src/constants/config';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  { icon: 'tag-multiple', text: 'Buy & sell within IIT Bhilai' },
  { icon: 'shield-check', text: 'Verified student community only' },
  { icon: 'map-marker', text: 'Safe campus meetup spots' },
  { icon: 'robot', text: 'AI-powered listing creation' },
];

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const scale = useSharedValue(1);

  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      Alert.alert(
        'Sign In Failed',
        err.message?.includes(INSTITUTE_EMAIL_DOMAIN.replace('@', ''))
          ? `Only ${INSTITUTE_EMAIL_DOMAIN} accounts can access this app.`
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary, '#5C6BC0']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Background circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        {/* Logo section */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="store" size={52} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>Campus Marketplace</Text>
          <Text style={styles.tagline}>IIT Bhilai's student community</Text>
        </Animated.View>

        {/* Feature pills */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.features}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.text}
              entering={FadeInDown.delay(400 + i * 80).springify()}
              style={styles.featurePill}
            >
              <MaterialCommunityIcons name={f.icon as any} size={16} color={Colors.primaryLight} />
              <Text style={styles.featureText}>{f.text}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Card */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>
            Sign in with your{'\n'}
            <Text style={styles.emailHighlight}>{INSTITUTE_EMAIL_DOMAIN}</Text> account
          </Text>

          <Animated.View style={btnStyle}>
            <Pressable
              style={[styles.googleBtn, isLoading && styles.googleBtnDisabled]}
              onPress={handleGoogleSignIn}
              onPressIn={() => { scale.value = withSpring(0.96); }}
              onPressOut={() => { scale.value = withSpring(1); }}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size={22} color={Colors.primary} />
              ) : (
                <>
                  <View style={styles.googleIconWrap}>
                    <Text style={styles.gText}>G</Text>
                  </View>
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          <Text style={styles.disclaimer}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'space-between', padding: 24, paddingTop: 80, paddingBottom: 48 },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circle1: { width: 300, height: 300, top: -80, right: -80 },
  circle2: { width: 200, height: 200, bottom: 100, left: -60 },
  logoSection: { alignItems: 'center', gap: 12 },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.5 },
  features: { gap: 10, marginVertical: 8 },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  featureText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  cardSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emailHighlight: { color: Colors.primary, fontWeight: '600' },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  googleBtnDisabled: { opacity: 0.7 },
  googleIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  googleBtnText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  disclaimer: { fontSize: 11, color: Colors.textHint, textAlign: 'center', lineHeight: 16 },
});
