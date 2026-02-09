import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — auth + DB features disabled',
  );
}

export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export async function verifyUserToken(token: string): Promise<{ id: string; email: string }> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error('Invalid or expired token');
  }

  return { id: data.user.id, email: data.user.email! };
}
