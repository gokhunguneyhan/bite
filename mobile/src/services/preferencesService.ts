import { supabase } from '@/src/lib/supabase';

export interface UserPreferences {
  interests: string[];
  goals: string[];
  preferredCategories: string[];
  onboardingCompleted: boolean;
}

export async function fetchPreferences(): Promise<UserPreferences | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    interests: data.interests ?? [],
    goals: data.goals ?? [],
    preferredCategories: data.preferred_categories ?? [],
    onboardingCompleted: data.onboarding_completed ?? false,
  };
}

export async function savePreferences(prefs: {
  interests: string[];
  goals: string[];
  preferredCategories: string[];
}): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: session.user.id,
        interests: prefs.interests,
        goals: prefs.goals,
        preferred_categories: prefs.preferredCategories,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) throw new Error(error.message);
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return true; // skip onboarding if not logged in

  const { data, error } = await supabase
    .from('user_preferences')
    .select('onboarding_completed')
    .eq('user_id', session.user.id)
    .maybeSingle();

  // If table doesn't exist or any error, skip onboarding gracefully
  if (error) return true;
  if (!data) return false; // table exists but no row = needs onboarding
  return data.onboarding_completed === true;
}
