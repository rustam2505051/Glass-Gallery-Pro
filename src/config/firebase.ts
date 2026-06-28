// Firebase Configuration with Environment Variables
// Supports Development, Staging, and Production environments

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import Constants from 'expo-constants';

// Get Firebase config from environment variables
const getFirebaseConfig = () => {
  // Try to get from Expo Constants first (for mobile)
  const expoConfig = Constants.expoConfig?.extra;
  
  // Fallback to process.env for web
  return {
    apiKey: expoConfig?.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAoaRVyi5zYP6VGNQI4rV0T2G_leaQAMqM',
    authDomain: expoConfig?.firebaseAuthDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'restartuz.firebaseapp.com',
    databaseURL: expoConfig?.firebaseDatabaseUrl || process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 'https://restartuz-default-rtdb.firebaseio.com',
    projectId: expoConfig?.firebaseProjectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'restartuz',
    storageBucket: expoConfig?.firebaseStorageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'restartuz.firebasestorage.app',
    messagingSenderId: expoConfig?.firebaseMessagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '3105202779',
    appId: expoConfig?.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:3105202779:web:3c230e83ec7c20ea88d57e',
    measurementId: expoConfig?.firebaseMeasurementId || process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-29E7WDGH3M',
  };
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase (singleton pattern)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  if (__DEV__) {
    console.log('Firebase initialized with project:', firebaseConfig.projectId);
  }
} else {
  app = getApp();
}

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Connect to emulators in development (optional)
const useEmulators = false; // Set to true for local development with emulators
if (useEmulators && __DEV__) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.log('Emulators already connected or not available');
  }
}

export default app;
