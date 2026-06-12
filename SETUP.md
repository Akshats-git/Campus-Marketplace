# Campus Marketplace — Setup Guide

## Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo`)
- EAS CLI (`npm install -g eas-cli`) for Play Store builds
- Android Studio (for local Android testing)

## Step 1: Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project named "campus-marketplace"
3. Enable these services:
   - **Authentication** → Enable Google Sign-In
   - **Cloud Firestore** → Create database (production mode)
   - **Storage** → Create bucket
   - **Analytics** → Enable
4. Register Android app with package: `com.iitbhilai.campusmarketplace`
5. Download `google-services.json` → replace the placeholder file
6. Get your Firebase config (Project Settings → Your apps → Web app)
7. Update `src/constants/config.ts` with your Firebase config

## Step 2: Google Sign-In Setup

1. In Firebase Console → Authentication → Google → get Web Client ID
2. Also add your SHA-1 and SHA-256 fingerprints in Firebase project settings
3. Update `GOOGLE_WEB_CLIENT_ID` in `src/constants/config.ts`

## Step 3: Gemini AI Setup

1. Go to [aistudio.google.com](https://aistudio.google.com) → Get API Key
2. The free tier (Gemini 1.5 Flash) is sufficient for this app
3. Update `GEMINI_API_KEY` in `src/constants/config.ts`

## Step 4: Google Maps Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable **Maps SDK for Android** and **Maps SDK for iOS**
3. Create an API key with restrictions for your app
4. Update `GOOGLE_MAPS_API_KEY` in `src/constants/config.ts`

## Step 5: Firestore Security Rules

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

## Google Technologies Used

| Technology | Purpose | Cost |
|---|---|---|
| Flutter/Dart (React Native + Expo) | Cross-platform framework | Free |
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
