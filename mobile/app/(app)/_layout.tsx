import { useEffect, useState, useCallback } from 'react';
import { Redirect, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { useSession } from '@/src/providers/SessionProvider';
import { migrateLocalSummaries } from '@/src/services/summaryService';
import { hasCompletedOnboarding } from '@/src/services/preferencesService';
import PersonalizeScreen from '@/src/components/onboarding/PersonalizeScreen';
import { Toast } from '@/src/components/ui/Toast';

export default function AppLayout() {
  const { session, user, isLoading } = useSession();
  const [migrating, setMigrating] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      setMigrating(true);
      migrateLocalSummaries(user.id).finally(() => setMigrating(false));

      // Check if the user has completed personalisation onboarding
      setCheckingOnboarding(true);
      hasCompletedOnboarding()
        .then((completed) => setNeedsOnboarding(!completed))
        .catch(() => setNeedsOnboarding(false))
        .finally(() => setCheckingOnboarding(false));
    } else {
      setCheckingOnboarding(false);
    }
  }, [user?.id]);

  const handleOnboardingComplete = useCallback(() => {
    setNeedsOnboarding(false);
  }, []);

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

  if (migrating || checkingOnboarding) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Syncing your data...</Text>
      </View>
    );
  }

  if (needsOnboarding) {
    return <PersonalizeScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="analyse"
          options={{ title: 'Analyse', headerBackTitle: 'Back' }}
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
          name="mock-summary"
          options={{ title: 'Summary Preview', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="review"
          options={{ title: 'Review Cards', presentation: 'fullScreenModal' }}
        />
      </Stack>
      <Toast />
    </View>
  );
}
