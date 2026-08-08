import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🌿</Text>
        <Text style={styles.brand}>Balcony Aroma</Text>
        <Text style={styles.tagline}>Order Management System</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonIcon}>🔐</Text>
          <View>
            <Text style={styles.primaryButtonText}>Admin Login</Text>
            <Text style={styles.primaryButtonSub}>Manage orders & customers</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Track')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonIcon}>📦</Text>
          <View>
            <Text style={styles.secondaryButtonText}>Track My Order</Text>
            <Text style={styles.secondaryButtonSub}>Check your order status</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>© 2024 Balcony Aroma</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 28,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    paddingTop: 48,
  },
  logo: { fontSize: 72, marginBottom: 12 },
  brand: { fontSize: 34, fontWeight: 'bold', color: colors.primary },
  tagline: { fontSize: 16, color: colors.textLight, marginTop: 6 },
  buttons: { gap: 16 },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 22,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    padding: 22,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonIcon: { fontSize: 36 },
  primaryButtonText: { fontSize: 20, fontWeight: 'bold', color: colors.white },
  primaryButtonSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  secondaryButtonText: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  secondaryButtonSub: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  footer: { textAlign: 'center', color: colors.textLight, fontSize: 13 },
});
