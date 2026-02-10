import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/src/providers/SessionProvider';

export default function AuthLayout() {
  const { session } = useSession();

  if (session) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="confirm-email" />
    </Stack>
  );
}
