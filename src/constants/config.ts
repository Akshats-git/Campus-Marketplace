export const INSTITUTE_EMAIL_DOMAIN = '@iitbhilai.ac.in';
export const APP_NAME = 'Campus Marketplace';
export const APP_VERSION = '1.0.0';

export const GEMINI_MODEL = 'gemini-1.5-flash';

export const LISTING_IMAGE_LIMIT = 8;
export const MAX_LISTING_PRICE = 100000;
export const SEARCH_DEBOUNCE_MS = 400;
export const PAGE_SIZE = 20;

export const FIREBASE_CONFIG = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  measurementId:     process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
};

export const GEMINI_API_KEY        = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
export const GOOGLE_WEB_CLIENT_ID  = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export const CLOUDINARY_CLOUD_NAME   = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
export const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';
