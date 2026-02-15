-- Add is_admin flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Editor's Picks table
CREATE TABLE IF NOT EXISTS editors_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  picked_by UUID NOT NULL REFERENCES auth.users(id),
  picked_at TIMESTAMPTZ DEFAULT now(),
  display_order INT DEFAULT 0,
  UNIQUE(summary_id)
);

-- RLS
ALTER TABLE editors_picks ENABLE ROW LEVEL SECURITY;

-- Anyone can read picks
CREATE POLICY "editors_picks_select" ON editors_picks
  FOR SELECT USING (true);

-- Only admins can insert
CREATE POLICY "editors_picks_insert" ON editors_picks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Only admins can delete
CREATE POLICY "editors_picks_delete" ON editors_picks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
