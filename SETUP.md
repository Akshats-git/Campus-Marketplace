# Campus Marketplace — Setup Guide

## Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo`)
- EAS CLI (`npm install -g eas-cli`) for Play Store builds
- Android Studio (for local Android testing)

## Step 0: Environment Variables

All credentials are stored in a `.env` file that is **gitignored** (never committed).

```bash
# Create your env file from the template
cp .env.example .env
```

Open `.env` and fill in each key as you complete the steps below.

## Step 1: Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project named "campus-marketplace"
3. Enable these services:
   - **Authentication** → Enable Google Sign-In
   - **Cloud Firestore** → Create database (production mode)
   - **Storage** → Create bucket
   - **Analytics** → Enable
4. Register Android app with package: `com.iitbhilai.campusmarketplace`
5. Download `google-services.json` → place it in the project root (it's gitignored)
6. Get your Firebase web config (Project Settings → Your apps → Web app) and add to `.env`:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123:android:abc
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
   ```

## Step 2: Google Sign-In Setup

1. In Firebase Console → Authentication → Google → get Web Client ID
2. Also add your SHA-1 and SHA-256 fingerprints in Firebase project settings
3. Add to `.env`:
   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-abc.apps.googleusercontent.com
   ```

## Step 3: Gemini AI Setup

1. Go to [aistudio.google.com](https://aistudio.google.com) → Get API Key
2. The free tier (Gemini 1.5 Flash) is sufficient for this app
3. Add to `.env`:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...
   ```

## Step 4: Google Maps Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable **Maps SDK for Android** and **Maps SDK for iOS**
3. Create an API key with restrictions for your app
4. Add to `.env`:
   ```
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
   ```

## Step 5: Firestore Security Rules

Deploy these rules in Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /listings/{id} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.sellerId;
    }
    match /chats/{chatId} {
      allow read, update: if request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
      match /messages/{msgId} {
        allow read: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow create: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }
  }
}
```

## Step 6: Firestore Indexes

Create composite indexes in Firebase Console for:
- `listings`: `status ASC, createdAt DESC`
- `listings`: `status ASC, categoryId ASC, createdAt DESC`
- `chats`: `participants array-contains, lastMessageAt DESC`

## Step 7: Run Locally

```bash
npm install
npx expo start
```

## Step 8: Build for Play Store

```bash
# Login to EAS
eas login

# Configure EAS
eas build:configure

# Build Android AAB for Play Store
eas build --platform android --profile production
```

## Security Notes

- **`.env`** contains all secrets and is gitignored — never commit it
- **`google-services.json`** is also gitignored — each developer downloads their own
- **`.env.example`** is committed as a safe reference template (no real values)
- `src/constants/config.ts` reads keys from `process.env.EXPO_PUBLIC_*` at build time

## Google Technologies Used

| Technology | Purpose | Cost |
|---|---|---|
| React Native + Expo | Cross-platform framework | Free |
| Firebase Authentication | Google Sign-In, domain-locked | Free (Spark) |
| Cloud Firestore | Real-time database | Free (50K reads/day) |
| Firebase Storage | Image uploads | Free (5GB) |
| Firebase Cloud Messaging | Push notifications | Free |
| Firebase Analytics | Usage tracking | Free |
| Firebase Crashlytics | Crash reporting | Free |
| Firebase Remote Config | Feature flags | Free |
| Firebase App Check | Security | Free |
| Firebase Hosting | Web version | Free |
| Google Maps SDK | Campus map, meetup spots | Free ($200/mo credit) |
| Gemini API (1.5 Flash) | AI descriptions, smart pricing | Free tier |
| Google Sign-In | OAuth authentication | Free |
| Google Pay (UPI deeplink) | Payments | Free |
