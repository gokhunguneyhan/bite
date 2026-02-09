import type { CreatorSubscription } from '@/src/types/summary';
import { supabase } from '@/src/lib/supabase';

export async function fetchSubscriptions(): Promise<CreatorSubscription[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('creator_subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    channelName: row.channel_name as string,
    createdAt: row.created_at as string,
  }));
}

export async function subscribeToCreator(channelName: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('creator_subscriptions')
    .insert({ user_id: session.user.id, channel_name: channelName });

  if (error) throw new Error(error.message);
}

export async function unsubscribeFromCreator(channelName: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('creator_subscriptions')
    .delete()
    .eq('user_id', session.user.id)
    .eq('channel_name', channelName);

  if (error) throw new Error(error.message);
}

export async function isSubscribed(channelName: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const { data, error } = await supabase
    .from('creator_subscriptions')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('channel_name', channelName)
    .maybeSingle();

  if (error) return false;
  return data !== null;
}
