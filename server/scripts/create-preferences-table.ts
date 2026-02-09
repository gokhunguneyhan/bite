import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function main() {
  // Use the service role client which bypasses RLS
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Check if table already exists by trying to query it
  const { error: checkError } = await supabase
    .from('user_preferences')
    .select('id')
    .limit(1);

  if (!checkError) {
    console.log('Table user_preferences already exists!');

    // Verify columns
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .limit(0);
    console.log('Table is accessible. Migration complete.');
    return;
  }

  if (checkError.message.includes('does not exist') || checkError.message.includes('Could not find') || checkError.code === '42P01') {
    const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
    console.log('\n=== ACTION REQUIRED ===');
    console.log('The user_preferences table needs to be created.');
    console.log(`\nOpen the Supabase SQL Editor at:`);
    console.log(`https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('\nThen paste and run this SQL:\n');
    console.log(`CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  goals TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);`);
    console.log('\n=== END SQL ===');
  } else {
    console.log('Unexpected error:', checkError.message);
  }
}

main();
