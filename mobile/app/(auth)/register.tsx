import { View, Text, TextInput, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useSession } from '@/src/providers/SessionProvider';
import { Colors } from '@/src/constants/colors';

export default function RegisterScreen() {
  const { signUp } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      // With email confirmation disabled, signUp auto-signs in.
      // Session will be picked up by onAuthStateChange in SessionProvider.
      router.replace('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      Alert.alert('Registration failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Start summarizing in seconds</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full name"
          value={name}
          onChangeText={setName}
          placeholderTextColor={Colors.tabIconDefault}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={Colors.tabIconDefault}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={Colors.tabIconDefault}
          editable={!loading}
        />
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </Pressable>
      </View>

      <Pressable style={styles.link} onPress={() => router.replace('/login')}>
        <Text style={styles.linkText}>
          Already have an account? Log in
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 32,
  },
  backText: {
    fontSize: 16,
    color: Colors.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
});
