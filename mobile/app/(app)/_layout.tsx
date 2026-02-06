import { Redirect, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { useSession } from '@/src/providers/SessionProvider';

export default function AppLayout() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/welcome" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="summary/[id]"
        options={{ title: 'Summary', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="refresher/[id]"
        options={{
          title: 'Refresher Cards',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="creator/[id]"
        options={{ title: 'Creator Profile', headerBackTitle: 'Back' }}
      />
    </Stack>
  );
}
