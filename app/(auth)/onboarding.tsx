import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { router } from 'expo-router';
import { updateUserProfile } from '../../src/services/auth';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors } from '../../src/constants/colors';
import { HOSTELS, DEPARTMENTS, YEARS } from '../../src/constants/categories';

type Step = 0 | 1 | 2;

export default function OnboardingScreen() {
  const { firebaseUser, setUserProfile, userProfile } = useAuthStore();
  const [step, setStep] = useState<Step>(0);
  const [hostel, setHostel] = useState('');
  const [year, setYear] = useState('');
  const [department, setDepartment] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleFinish() {
    if (!hostel || !year || !department) {
      Alert.alert('Incomplete', 'Please fill in all fields to continue.');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile(firebaseUser!.uid, { hostel, year, department });
      if (userProfile) setUserProfile({ ...userProfile, hostel, year, department });
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E85555', '#FF6B6B']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <Text style={styles.headerTag}>Step {step + 1} of 3</Text>
          <Text style={styles.headerTitle}>Tell us about yourself</Text>
          <Text style={styles.headerSub}>Help others know who they're trading with</Text>
        </Animated.View>

        <View style={styles.stepsRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.stepDot, i <= step && styles.stepDotActive]} />
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <Animated.View entering={FadeInRight.springify()} style={styles.section}>
            <Text style={styles.sectionLabel}>
              <MaterialCommunityIcons name="home-city" size={18} color={Colors.primary} /> Your Hostel
            </Text>
            <View style={styles.optionsGrid}>
              {HOSTELS.map(h => (
                <Pressable
                  key={h}
                  style={[styles.optionChip, hostel === h && styles.optionChipSelected]}
                  onPress={() => setHostel(h)}
                >
                  <Text style={[styles.optionText, hostel === h && styles.optionTextSelected]}>
                    {h}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeInRight.springify()} style={styles.section}>
            <Text style={styles.sectionLabel}>
              <MaterialCommunityIcons name="calendar-account" size={18} color={Colors.primary} /> Your Year
            </Text>
            <View style={styles.optionsGrid}>
              {YEARS.map(y => (
                <Pressable
                  key={y}
                  style={[styles.optionChip, year === y && styles.optionChipSelected]}
                  onPress={() => setYear(y)}
                >
                  <Text style={[styles.optionText, year === y && styles.optionTextSelected]}>
                    {y}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInRight.springify()} style={styles.section}>
            <Text style={styles.sectionLabel}>
              <MaterialCommunityIcons name="school" size={18} color={Colors.primary} /> Your Department
            </Text>
            <View style={styles.deptList}>
              {DEPARTMENTS.map(d => (
                <Pressable
                  key={d}
                  style={[styles.deptItem, department === d && styles.deptItemSelected]}
                  onPress={() => setDepartment(d)}
                >
                  <Text style={[styles.deptText, department === d && styles.deptTextSelected]}>
                    {d}
                  </Text>
                  {department === d && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={Colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <Pressable style={styles.backBtn} onPress={() => setStep(s => (s - 1) as Step)}>
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
        )}
        <Pressable
          style={[
            styles.nextBtn,
            step === 0 && !hostel && styles.nextBtnDisabled,
            step === 1 && !year && styles.nextBtnDisabled,
            step === 2 && !department && styles.nextBtnDisabled,
          ]}
          onPress={step < 2 ? () => setStep(s => (s + 1) as Step) : handleFinish}
          disabled={
            saving ||
            (step === 0 && !hostel) ||
            (step === 1 && !year) ||
            (step === 2 && !department)
          }
        >
          {saving ? (
            <ActivityIndicator size={20} color="#fff" />
          ) : (
            <Text style={styles.nextBtnText}>{step < 2 ? 'Next' : 'Get Started'}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24, gap: 8 },
  headerTag: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  stepsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stepDot: { width: 32, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  stepDotActive: { backgroundColor: '#fff', width: 48 },
  content: { padding: 24, paddingBottom: 120 },
  section: { gap: 16 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: Colors.text, flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  optionTextSelected: { color: '#fff', fontWeight: '600' },
  deptList: { gap: 8 },
  deptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  deptItemSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  deptText: { fontSize: 14, color: Colors.text, fontWeight: '500', flex: 1 },
  deptTextSelected: { color: Colors.primary, fontWeight: '600' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingBottom: 36,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  backBtnText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  nextBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  nextBtnDisabled: { backgroundColor: Colors.textHint },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
