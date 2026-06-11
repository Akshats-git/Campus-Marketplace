import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  userProfile: User | null;
  isLoading: boolean;
  isOnboarded: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setUserProfile: (profile: User | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboarded: (v: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  firebaseUser: null,
  userProfile: null,
  isLoading: true,
  isOnboarded: false,
  setFirebaseUser: user => set({ firebaseUser: user }),
  setUserProfile: profile => set({ userProfile: profile }),
  setLoading: loading => set({ isLoading: loading }),
  setOnboarded: v => set({ isOnboarded: v }),
  reset: () => set({ firebaseUser: null, userProfile: null, isOnboarded: false }),
}));
