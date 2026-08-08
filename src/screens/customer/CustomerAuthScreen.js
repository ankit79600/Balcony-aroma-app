import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { colors } from '../../theme';

export default function CustomerAuthScreen() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleLogin = async () => {
    if (!form.email.trim() || !form.password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
    } catch {
      Alert.alert('Login Failed', 'Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.password) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      await setDoc(doc(db, 'users', user.uid), {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        role: 'customer',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      const msg = e.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists.'
        : 'Could not create account. Please try again.';
      Alert.alert('Signup Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>🍴</Text>
          <Text style={styles.brand}>Balcony Aroma</Text>
          <Text style={styles.sub}>Order street food, delivered hot!</Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'signup' && styles.tabActive]}
            onPress={() => setMode('signup')}
          >
            <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {mode === 'signup' && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={v => set('name', v)}
                placeholder="Your name"
                placeholderTextColor={colors.textLight}
              />
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={form.phone}
                onChangeText={v => set('phone', v)}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
              />
            </>
          )}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={v => set('email', v)}
            placeholder="you@email.com"
            placeholderTextColor={colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={form.password}
            onChangeText={v => set('password', v)}
            placeholder="••••••••"
            placeholderTextColor={colors.textLight}
            secureTextEntry
            onSubmitEditing={mode === 'login' ? handleLogin : handleSignup}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={mode === 'login' ? handleLogin : handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.buttonText}>{mode === 'login' ? 'Login' : 'Create Account'}</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.switchText}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <Text style={styles.switchLink} onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Sign Up' : 'Login'}
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 24 },
  logo: { fontSize: 56 },
  brand: { fontSize: 26, fontWeight: 'bold', color: colors.primary, marginTop: 8 },
  sub: { fontSize: 13, color: colors.textLight, marginTop: 4 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontWeight: '600', color: colors.textLight, fontSize: 15 },
  tabTextActive: { color: colors.white },
  form: { paddingHorizontal: 24, gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 8 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: 'bold' },
  switchText: { textAlign: 'center', color: colors.textLight, marginTop: 20, marginBottom: 40, fontSize: 14 },
  switchLink: { color: colors.primary, fontWeight: '700' },
});
