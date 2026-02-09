import 'dotenv/config';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Extract the project ref from the URL
const projectRef = new URL(url).hostname.split('.')[0];

// Supabase direct connection (transaction mode pooler on port 5432)
// password is the service role key's secret portion
// Actually, the postgres password must come from the Supabase dashboard.
// Let's use the Supabase JS client to check, then use postgres package with the pooler.

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  // Check if table already exists
  const { error: checkError } = await supabase
    .from('creator_subscriptions')
    .select('id')
    .limit(1);

  if (!checkError) {
    console.log('Table creator_subscriptions already exists.');
    process.exit(0);
  }

  // Try connecting via the pooler with the database password from env
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (!dbPassword) {
    console.log('SUPABASE_DB_PASSWORD not set in .env');
    console.log('Please add SUPABASE_DB_PASSWORD=<your-db-password> to server/.env');
    console.log('You can find it in Supabase Dashboard > Settings > Database > Connection string');
    console.log('');
    console.log('Or run this SQL manually in Supabase Dashboard > SQL Editor:');
    console.log('');
    console.log(`CREATE TABLE IF NOT EXISTS creator_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_name)
);

ALTER TABLE creator_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own subscriptions" ON creator_subscriptions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "service role full access" ON creator_subscriptions FOR ALL USING (true);`);
    process.exit(1);
  }

  const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;

  const sql = postgres(connectionString, { ssl: 'require' });

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS creator_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        channel_name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, channel_name)
      )
    `;
    console.log('Created table creator_subscriptions');

    await sql`ALTER TABLE creator_subscriptions ENABLE ROW LEVEL SECURITY`;
    console.log('Enabled RLS');

    await sql.unsafe(`CREATE POLICY "users can manage own subscriptions" ON creator_subscriptions FOR ALL USING (auth.uid() = user_id)`);
    console.log('Created user RLS policy');

    await sql.unsafe(`CREATE POLICY "service role full access" ON creator_subscriptions FOR ALL USING (true)`);
    console.log('Created service role RLS policy');

    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

run();
