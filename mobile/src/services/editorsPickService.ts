import { supabase } from '../lib/supabase';

export async function fetchEditorsPickIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('editors_picks')
    .select('summary_id')
    .order('display_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.summary_id);
}

export async function checkIsAdmin(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return false;

  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();

  return data?.is_admin === true;
}

export async function toggleEditorsPick(summaryId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('editors_picks')
    .select('id')
    .eq('summary_id', summaryId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('editors_picks')
      .delete()
      .eq('summary_id', summaryId);
    if (error) throw new Error(error.message);
    return false;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase.from('editors_picks').insert({
    summary_id: summaryId,
    picked_by: session.user.id,
  });
  if (error) throw new Error(error.message);
  return true;
}
