import { useEffect, useState } from 'react';
import { Redirect, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { useSession } from '@/src/providers/SessionProvider';
import { migrateLocalSummaries } from '@/src/services/summaryService';

export default function AppLayout() {
  const { session, user, isLoading } = useSession();
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    if (user) {
      setMigrating(true);
      migrateLocalSummaries(user.id).finally(() => setMigrating(false));
    }
  }, [user?.id]);

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

  if (migrating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Syncing your data...</Text>
      </View>
    );
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
