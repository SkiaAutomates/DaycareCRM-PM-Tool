-- 1. Enable RLS on all data tables (in case it wasn't enabled)
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing permissive policies
DROP POLICY IF EXISTS "Users can only access their organization's parents" ON parents;
DROP POLICY IF EXISTS "Users can only access their organization's children" ON children;
DROP POLICY IF EXISTS "Users can only access their organization's parent_child" ON parent_child;
DROP POLICY IF EXISTS "Users can only access their organization's projects" ON projects;
DROP POLICY IF EXISTS "Users can only access their organization's schedules" ON schedules;
DROP POLICY IF EXISTS "Users can only access their organization's notifications" ON notifications;
DROP POLICY IF EXISTS "Users can only access their organization's waitlist" ON waitlist;

-- 3. Create strict RLS policies ensuring organization_id matches the user's org
CREATE POLICY "Users can only access their organization's parents" 
ON parents FOR ALL USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can only access their organization's children" 
ON children FOR ALL USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can only access their organization's parent_child" 
ON parent_child FOR ALL USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can only access their organization's projects" 
ON projects FOR ALL USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can only access their organization's schedules" 
ON schedules FOR ALL USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can only access their organization's notifications" 
ON notifications FOR ALL USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can only access their organization's waitlist" 
ON waitlist FOR ALL USING (organization_id IN (SELECT get_user_organizations()));

-- Note: Because the mock data currently in your Supabase database has 
-- organization_id = null, this RLS policy will HIDE the old mock data from 
-- everyone, giving you the blank slate you expect!
