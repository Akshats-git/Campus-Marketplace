import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth, db } from './firebase';
import { User } from '../types';
import { GOOGLE_WEB_CLIENT_ID, INSTITUTE_EMAIL_DOMAIN } from '../constants/config';

GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

export async function signInWithGoogle(): Promise<FirebaseUser> {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();

  const email = userInfo.data?.user.email ?? '';
  if (!email.endsWith(INSTITUTE_EMAIL_DOMAIN)) {
    await GoogleSignin.signOut();
    throw new Error(`Only ${INSTITUTE_EMAIL_DOMAIN} accounts are allowed.`);
  }

  const credential = GoogleAuthProvider.credential(userInfo.data?.idToken);
  const result = await signInWithCredential(auth, credential);
  await ensureUserProfile(result.user);
  return result.user;
}

async function ensureUserProfile(firebaseUser: FirebaseUser): Promise<void> {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const newUser: Omit<User, 'uid'> = {
      email: firebaseUser.email ?? '',
      displayName: firebaseUser.displayName ?? 'Student',
      photoURL: firebaseUser.photoURL,
      hostel: '',
      year: '',
      department: '',
      rating: 0,
      ratingCount: 0,
      listingsCount: 0,
      soldCount: 0,
      responseRate: 100,
      createdAt: Date.now(),
      isVerified: true,
      role: 'student',
      wishlist: [],
      following: [],
      followers: [],
    };
    await setDoc(ref, newUser);
  }
}

export async function updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: Date.now() });
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as User;
}

export async function signOut(): Promise<void> {
  await GoogleSignin.signOut();
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
