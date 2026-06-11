import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { onAuthChange, getUserProfile } from '../services/auth';
import { useAuthStore } from '../stores/authStore';

export function useAuthInit() {
  const [isReady, setIsReady] = useState(false);
  const { setFirebaseUser, setUserProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthChange(async user => {
      setFirebaseUser(user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
        const needsOnboarding = !profile?.hostel || !profile?.year || !profile?.department;
        if (needsOnboarding) {
          router.replace('/(auth)/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        setUserProfile(null);
        router.replace('/(auth)/login');
      }
      setLoading(false);
      setIsReady(true);
      await SplashScreen.hideAsync();
    });
    return unsub;
  }, []);

  return { isReady };
}
