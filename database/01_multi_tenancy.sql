-- Day Care CRM - SaaS Multi-Tenancy Migration
-- Run this in Supabase SQL Editor

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Organizations table (The "Tenant")
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE, -- for custom subdomains/URLs later
    owner_id UUID REFERENCES auth.users(id), -- Points to the founder
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data_backup_allowed BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}'::jsonb
);

-- 3. Subscriptions table (Paddle Sync)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    paddle_subscription_id TEXT UNIQUE, -- Paddle ID
    paddle_customer_id TEXT,
    plan_tier TEXT DEFAULT 'starter', -- starter, professional, growth
    status TEXT DEFAULT 'active', -- active, on_trial, past_due, cancelled
    trial_ends_at TIMESTAMPTZ,
    renews_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Organization Members (For staff access)
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'staff', -- owner, admin, staff, teacher
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- 5. Add organization_id to existing tables
-- We do this as an ALTER so existing data (if any) can be migrated manually if needed
-- For fresh installs, organization_id should be NOT NULL.

DO $$ 
BEGIN
    -- Parents
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='parents') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parents' AND column_name='organization_id') THEN
            ALTER TABLE parents ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Children
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='children') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='organization_id') THEN
            ALTER TABLE children ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Projects
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='projects') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='organization_id') THEN
            ALTER TABLE projects ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Notifications
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notifications') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='organization_id') THEN
            ALTER TABLE notifications ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Attendance (create if missing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='attendance') THEN
        CREATE TABLE attendance (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            child_id UUID,
            date DATE NOT NULL,
            status TEXT DEFAULT 'present',
            check_in_time TEXT,
            check_out_time TEXT,
            notes TEXT,
            organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='organization_id') THEN
            ALTER TABLE attendance ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Waitlist (create if missing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='waitlist') THEN
        CREATE TABLE waitlist (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            child_name TEXT,
            parent_name TEXT,
            parent_email TEXT,
            parent_phone TEXT,
            date_of_birth DATE,
            preferred_start DATE,
            preferred_location TEXT,
            preferred_schedule TEXT,
            notes TEXT,
            status TEXT DEFAULT 'waiting',
            organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='waitlist' AND column_name='organization_id') THEN
            ALTER TABLE waitlist ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 6. Setup Row Level Security (RLS)
-- This is critical for SaaS. Users can ONLY see data for organizations they belong to.

-- Helper function to get the current user's organization_ids
CREATE OR REPLACE FUNCTION get_user_organizations() 
RETURNS SETOF UUID AS $$
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Update RLS Policies (only for tables that exist)
DO $$
BEGIN
    -- Parents
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='parents') THEN
        ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to parents" ON parents;
        EXECUTE 'CREATE POLICY "Users can only access their organization''s parents" ON parents FOR ALL USING (organization_id IN (SELECT get_user_organizations()))';
    END IF;

    -- Children
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='children') THEN
        ALTER TABLE children ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to children" ON children;
        EXECUTE 'CREATE POLICY "Users can only access their organization''s children" ON children FOR ALL USING (organization_id IN (SELECT get_user_organizations()))';
    END IF;

    -- Projects
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='projects') THEN
        ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to projects" ON projects;
        EXECUTE 'CREATE POLICY "Users can only access their organization''s projects" ON projects FOR ALL USING (organization_id IN (SELECT get_user_organizations()))';
    END IF;

    -- Project Tasks
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='project_tasks') THEN
        ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to project_tasks" ON project_tasks;
        EXECUTE 'CREATE POLICY "Users can access tasks through their organization''s projects" ON project_tasks FOR ALL USING (project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT get_user_organizations())))';
    END IF;

    -- Notifications
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notifications') THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to notifications" ON notifications;
        EXECUTE 'CREATE POLICY "Users can only access their organization''s notifications" ON notifications FOR ALL USING (organization_id IN (SELECT get_user_organizations()))';
    END IF;

    -- Attendance
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='attendance') THEN
        ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to attendance" ON attendance;
        EXECUTE 'CREATE POLICY "Users can only access their organization''s attendance" ON attendance FOR ALL USING (organization_id IN (SELECT get_user_organizations()))';
    END IF;

    -- Waitlist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='waitlist') THEN
        ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to waitlist" ON waitlist;
        EXECUTE 'CREATE POLICY "Users can only access their organization''s waitlist" ON waitlist FOR ALL USING (organization_id IN (SELECT get_user_organizations()))';
    END IF;
END $$;

-- 7. Organizations Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see organizations they belong to" ON organizations;
CREATE POLICY "Users can see organizations they belong to" ON organizations
    FOR SELECT USING (id IN (SELECT get_user_organizations()));
DROP POLICY IF EXISTS "Owners can update their organization" ON organizations;
CREATE POLICY "Owners can update their organization" ON organizations
    FOR UPDATE USING (owner_id = auth.uid());

-- 8. Subscription Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their organization's subscription" ON subscriptions;
CREATE POLICY "Users can see their organization's subscription" ON subscriptions
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));
