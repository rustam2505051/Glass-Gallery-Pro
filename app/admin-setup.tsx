// Admin Setup Screen - Create the first administrator account
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/src/config/firebase';
import { Colors, Spacing, Typography, BorderRadius } from '@/src/constants/theme';

export default function AdminSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('rustam2505051@gmail.com');
  const [password, setPassword] = useState('@Rus2505051bek');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    checkExistingAdmin();
  }, []);

  const checkExistingAdmin = async () => {
    try {
      setChecking(true);
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      let adminExists = false;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.admin === true || data.role === 'admin') {
          adminExists = true;
        }
      });
      
      setHasAdmin(adminExists);
      if (adminExists) {
        setMessage('An admin account already exists. You can log in using your credentials.');
      }
    } catch (error) {
      console.error('Error checking admin:', error);
    } finally {
      setChecking(false);
    }
  };

  const createAdminUser = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Step 1: Try to create user in Firebase Auth
      setMessage('Creating user in Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Step 2: Create user document in Firestore
      setMessage('Creating admin profile in Firestore...');
      await setDoc(doc(db, 'users', uid), {
        email: email,
        role: 'admin',
        admin: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setMessage('Admin account created successfully!');
      setSuccess(true);
      
      Alert.alert(
        'Success!',
        'Admin account created successfully. You can now log in to the Admin Panel.',
        [
          {
            text: 'Go to Login',
            onPress: () => router.replace('/admin'),
          }
        ]
      );
    } catch (error: any) {
      console.error('Create admin error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        // User already exists - try to sign in and update Firestore
        setMessage('User exists. Signing in to update admin status...');
        try {
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          const credential = await signInWithEmailAndPassword(auth, email, password);
          const uid = credential.user.uid;
          
          // Create/update Firestore document with admin privileges
          setMessage('Updating admin privileges in Firestore...');
          await setDoc(doc(db, 'users', uid), {
            email: email,
            role: 'admin',
            admin: true,
            isActive: true,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          
          setMessage('Admin privileges granted successfully!');
          setSuccess(true);
          
          Alert.alert(
            'Success!',
            'Admin privileges have been granted. You can now access the Admin Panel.',
            [
              {
                text: 'Go to Admin Panel',
                onPress: () => router.replace('/admin'),
              }
            ]
          );
        } catch (signInError: any) {
          console.error('Sign in error:', signInError);
          if (signInError.code === 'auth/wrong-password' || signInError.code === 'auth/invalid-credential') {
            setMessage('Incorrect password. Please verify your password and try again.');
          } else {
            setMessage('Failed to update admin status. Please try again.');
          }
        }
      } else if (error.code === 'auth/invalid-email') {
        setMessage('Invalid email address format.');
      } else if (error.code === 'auth/weak-password') {
        setMessage('Password is too weak. Use at least 6 characters.');
      } else {
        setMessage('Failed to create admin account: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.checkingText}>Checking admin status...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Setup</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {hasAdmin ? (
          <View style={styles.infoCard}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            <Text style={styles.infoTitle}>Admin Account Exists</Text>
            <Text style={styles.infoText}>
              An administrator account has already been created.
              Please go to the Admin Panel and log in.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/admin')}
            >
              <Text style={styles.primaryButtonText}>Go to Admin Panel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark" size={48} color={Colors.primary} />
              <Text style={styles.infoTitle}>Create First Administrator</Text>
              <Text style={styles.infoText}>
                This will create the first admin account for RestArtuz.
                You'll use these credentials to access the Admin Panel.
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Admin Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="admin@example.com"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
              />

              {message ? (
                <View style={[styles.messageBox, success && styles.successBox]}>
                  <Ionicons 
                    name={success ? "checkmark-circle" : "information-circle"} 
                    size={20} 
                    color={success ? Colors.success : Colors.primary} 
                  />
                  <Text style={[styles.messageText, success && styles.successText]}>
                    {message}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={createAdminUser}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <>
                    <Ionicons name="person-add" size={20} color={Colors.background} />
                    <Text style={styles.primaryButtonText}>Create Admin Account</Text>
                  </>
                )}
              </TouchableOpacity>

              {success && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.replace('/admin')}
                >
                  <Text style={styles.secondaryButtonText}>Go to Admin Panel</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  infoTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  infoText: {
    ...Typography.body2,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body1,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  successBox: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.success,
  },
  messageText: {
    ...Typography.body2,
    color: Colors.textSecondary,
    flex: 1,
  },
  successText: {
    color: Colors.success,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.background,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  secondaryButtonText: {
    ...Typography.button,
    color: Colors.primary,
    fontWeight: '600',
  },
  checkingText: {
    ...Typography.body1,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
