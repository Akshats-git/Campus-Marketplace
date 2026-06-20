import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { updateUserProfile } from '../src/services/auth';
import { useAuthStore } from '../src/stores/authStore';
import { Colors, Shadows } from '../src/constants/colors';
import { HOSTELS, DEPARTMENTS, YEARS } from '../src/constants/categories';
import { getInitials } from '../src/utils/formatters';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, firebaseUser, setUserProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState(userProfile?.displayName ?? '');
  const [hostel, setHostel] = useState(userProfile?.hostel ?? '');
  const [year, setYear] = useState(userProfile?.year ?? '');
  const [department, setDepartment] = useState(userProfile?.department ?? '');
  const [saving, setSaving] = useState(false);

  const hasChanges =
    displayName !== userProfile?.displayName ||
    hostel !== userProfile?.hostel ||
    year !== userProfile?.year ||
    department !== userProfile?.department;

  async function handleSave() {
    if (!userProfile) return;
    if (!displayName.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const updates = { displayName: displayName.trim(), hostel, year, department };
      await updateUserProfile(userProfile.uid, updates);
      setUserProfile({ ...userProfile, ...updates });
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Profile',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          {firebaseUser?.photoURL ? (
            <Image source={{ uri: firebaseUser.photoURL }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
            </View>
          )}
          <Text style={styles.emailText}>{userProfile?.email}</Text>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.textInput}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={Colors.textHint}
            maxLength={50}
          />
        </View>

        {/* Hostel */}
        <View style={styles.section}>
          <Text style={styles.label}>Hostel</Text>
          <View style={styles.optionsGrid}>
            {HOSTELS.map(h => (
              <Pressable
                key={h}
                style={[styles.optionCard, hostel === h && styles.optionCardActive]}
                onPress={() => setHostel(h)}
              >
                <MaterialCommunityIcons
                  name="home-city"
                  size={20}
                  color={hostel === h ? Colors.primary : Colors.textHint}
                />
                <Text style={[styles.optionText, hostel === h && styles.optionTextActive]}>
                  {h}
                </Text>
                {hostel === h && (
                  <MaterialCommunityIcons name="check-circle" size={18} color={Colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Year */}
        <View style={styles.section}>
          <Text style={styles.label}>Year</Text>
          <View style={styles.yearRow}>
            {YEARS.map(y => (
              <Pressable
                key={y}
                style={[styles.yearChip, year === y && styles.yearChipActive]}
                onPress={() => setYear(y)}
              >
                <Text style={[styles.yearText, year === y && styles.yearTextActive]}>{y}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Department */}
        <View style={styles.section}>
          <Text style={styles.label}>Department</Text>
          <View style={styles.deptList}>
            {DEPARTMENTS.map(d => (
              <Pressable
                key={d}
                style={[styles.deptItem, department === d && styles.deptItemActive]}
                onPress={() => setDepartment(d)}
              >
                <Text style={[styles.deptText, department === d && styles.deptTextActive]}>
                  {d}
                </Text>
                {department === d && (
                  <MaterialCommunityIcons name="check-circle" size={18} color={Colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={[styles.saveBtn, (!hasChanges || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size={20} color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  avatarSection: { alignItems: 'center', paddingVertical: 28, gap: 10, backgroundColor: Colors.surface },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: Colors.primary + '30' },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: '800', color: Colors.primary },
  emailText: { fontSize: 14, color: Colors.textHint },
  section: { padding: 20, gap: 12 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text, letterSpacing: 0.3 },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  optionsGrid: { gap: 10 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  optionText: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  optionTextActive: { color: Colors.primary, fontWeight: '700' },
  yearRow: { flexDirection: 'row', gap: 10 },
  yearChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  yearChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  yearText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  yearTextActive: { color: '#fff', fontWeight: '700' },
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
  deptItemActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  deptText: { fontSize: 14, color: Colors.text, fontWeight: '500', flex: 1 },
  deptTextActive: { color: Colors.primary, fontWeight: '700' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: Colors.textHint },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
