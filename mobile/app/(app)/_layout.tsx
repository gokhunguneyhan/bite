import { useEffect, useState } from 'react';
import { Redirect, Stack } from 'expo-router';
import { Text, View } from 'react-native';

import { useSession } from '@/src/providers/SessionProvider';
import { RevenueCatProvider } from '@/src/providers/RevenueCatProvider';
import { migrateLocalSummaries } from '@/src/services/summaryService';
import { Toast } from '@/src/components/ui/Toast';
import { SUMMARIZE } from '@/src/utils/locale';

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
    <RevenueCatProvider>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="analyse"
            options={{ title: SUMMARIZE, headerBackTitle: 'Back' }}
          />
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
            name="category/[name]"
            options={{ headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="creator/[id]"
            options={{ title: 'Creator Profile', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="following"
            options={{ title: 'Following', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="followers"
            options={{ title: 'Followers', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="paywall"
            options={{ title: '', presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="confirm-analyse"
            options={{ title: `${SUMMARIZE} Video`, headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="personalise"
            options={{ title: 'Personalise', presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="review"
            options={{ title: 'Review Cards', presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="editors-picks"
            options={{ title: "Editor's Picks", headerBackTitle: 'Back' }}
          />
        </Stack>
        <Toast />
      </View>
    </RevenueCatProvider>
  );
}
