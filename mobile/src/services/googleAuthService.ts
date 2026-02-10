let GoogleSigninModule: typeof import('@react-native-google-signin/google-signin') | null = null;

function getGoogleSigninModule() {
  if (!GoogleSigninModule) {
    try {
      GoogleSigninModule = require('@react-native-google-signin/google-signin');
    } catch {
      throw new Error(
        'Google Sign-In is not supported in Expo Go. Please use a development build (npx expo run:ios) or sign in with email.',
      );
    }
  }
  return GoogleSigninModule;
}

let configured = false;

export function configureGoogleSignIn() {
  if (configured) return;
  const { GoogleSignin } = getGoogleSigninModule();
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
  });
  configured = true;
}

/**
 * Trigger Google Sign-In flow.
 * Returns idToken (for Supabase auth) and accessToken (for YouTube API).
 */
export async function googleSignIn(): Promise<{
  idToken: string;
  accessToken: string;
}> {
  const { GoogleSignin } = getGoogleSigninModule();
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices();

  const response = await GoogleSignin.signIn();
  if (response.type !== 'success' || !response.data.idToken) {
    throw new Error('Google Sign-In was cancelled');
  }

  const tokens = await GoogleSignin.getTokens();
  return {
    idToken: response.data.idToken,
    accessToken: tokens.accessToken,
  };
}

/**
 * Get the current Google access token (refreshes automatically if expired).
 * Returns null if not signed in with Google.
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  try {
    const { GoogleSignin } = getGoogleSigninModule();
    configureGoogleSignIn();
    const currentUser = GoogleSignin.getCurrentUser();
    if (!currentUser) return null;
    const tokens = await GoogleSignin.getTokens();
    return tokens.accessToken;
  } catch {
    return null;
  }
}

export async function signOutGoogle(): Promise<void> {
  try {
    const { GoogleSignin } = getGoogleSigninModule();
    await GoogleSignin.signOut();
  } catch {
    // Ignore — user may not have been signed in with Google
  }
}

export function getErrorHelpers() {
  const mod = getGoogleSigninModule();
  return { isErrorWithCode: mod.isErrorWithCode, statusCodes: mod.statusCodes };
}
