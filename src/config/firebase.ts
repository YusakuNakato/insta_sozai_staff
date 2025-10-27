import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase設定（環境変数から取得）
// .env.localファイルに以下の値を設定してください：
// EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
// EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
// EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
// EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
// EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
// EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

// Firebase設定が空の場合は警告
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    '⚠️ Firebase設定が見つかりません。.env.localファイルにFirebase設定を追加してください。'
  );
}

// Firebaseアプリ初期化
const app = initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = getAuth(app);

// Firestore Database
export const db = getFirestore(app);

export default app;
