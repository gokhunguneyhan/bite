import { router } from 'expo-router';
import PersonalizeScreen from '@/src/components/onboarding/PersonalizeScreen';

export default function PersonaliseRoute() {
  return <PersonalizeScreen onComplete={() => router.back()} />;
}
