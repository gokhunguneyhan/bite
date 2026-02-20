-- Collections: curated reading lists of videos/summaries
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_published BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  summary_id UUID REFERENCES summaries(id) ON DELETE SET NULL,
  video_id TEXT,
  video_title TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT item_has_source CHECK (summary_id IS NOT NULL OR video_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection_position
  ON collection_items(collection_id, position);

-- RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read published collections
CREATE POLICY "collections_select" ON collections
  FOR SELECT USING (is_published = true);

-- Only admins can insert/update/delete
CREATE POLICY "collections_insert" ON collections
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "collections_update" ON collections
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "collections_delete" ON collections
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Anyone can read items of published collections
CREATE POLICY "collection_items_select" ON collection_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM collections WHERE id = collection_id AND is_published = true)
  );

-- Only admins can modify items
CREATE POLICY "collection_items_insert" ON collection_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "collection_items_update" ON collection_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "collection_items_delete" ON collection_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
