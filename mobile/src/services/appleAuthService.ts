import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Trigger Apple Sign-In flow.
 * Returns identityToken and raw nonce for Supabase auth.
 */
export async function appleSignIn(): Promise<{
  idToken: string;
  nonce: string;
}> {
  if (isExpoGo) {
    throw new Error(
      'Apple Sign-In is not supported in Expo Go. Please use a development build (npx expo run:ios) or sign in with email.',
    );
  }

  const rawNonce = await generateNonce();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error('No identity token from Apple');
  }

  return {
    idToken: credential.identityToken,
    nonce: rawNonce,
  };
}

export function isAppleAuthAvailable(): boolean {
  return Platform.OS === 'ios' && !isExpoGo;
}

async function generateNonce(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
