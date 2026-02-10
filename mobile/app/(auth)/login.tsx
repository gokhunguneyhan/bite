import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@/src/providers/SessionProvider';
import { Colors } from '@/src/constants/colors';
import { isAppleAuthAvailable } from '@/src/services/appleAuthService';

export default function LoginScreen() {
  const { signIn, signInWithGoogle, signInWithApple } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading('google');
    try {
      await signInWithGoogle();
      router.replace('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed';
      if (!message.includes('cancel')) {
        Alert.alert('Google Sign-In failed', message);
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setSocialLoading('apple');
    try {
      await signInWithApple();
      router.replace('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Apple sign-in failed';
      if (!message.includes('cancel')) {
        Alert.alert('Apple Sign-In failed', message);
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const isDisabled = loading || socialLoading !== null;

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      {/* Social login buttons */}
      <View style={styles.socialButtons}>
        <Pressable
          style={styles.socialButton}
          onPress={handleGoogleSignIn}
          disabled={isDisabled}
          accessibilityLabel="Continue with Google"
          accessibilityRole="button">
          {socialLoading === 'google' ? (
            <ActivityIndicator color={Colors.text} size="small" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color={Colors.text} />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        {isAppleAuthAvailable() && (
          <Pressable
            style={[styles.socialButton, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={isDisabled}
            accessibilityLabel="Continue with Apple"
            accessibilityRole="button">
            {socialLoading === 'apple' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                  Continue with Apple
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Email/password form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={Colors.tabIconDefault}
          editable={!isDisabled}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={Colors.tabIconDefault}
          editable={!isDisabled}
        />
        <Pressable
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isDisabled}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </Pressable>
      </View>

      <Pressable
        style={styles.link}
        onPress={() => router.replace('/register')}>
        <Text style={styles.linkText}>
          Don't have an account? Sign up
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
    marginBottom: 24,
  },
  socialButtons: {
    gap: 12,
    marginBottom: 4,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: Colors.surface,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  appleButtonText: {
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginHorizontal: 16,
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
