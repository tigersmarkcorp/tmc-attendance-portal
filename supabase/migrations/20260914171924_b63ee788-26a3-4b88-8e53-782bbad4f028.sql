
-- 1. Organizations
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.user_organizations (
  user_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_super_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.user_organizations TO authenticated;
GRANT ALL ON public.user_organizations TO service_role;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- 2. Helper functions
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_organizations WHERE user_id = _user_id AND is_super_admin)
$$;

CREATE OR REPLACE FUNCTION public.set_organization_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := public.current_org_id();
  END IF;
  RETURN NEW;
END $$;

-- 3. Default organization holding all existing data
INSERT INTO public.organizations (name, slug) VALUES ('Main Company', 'main');

INSERT INTO public.user_organizations (user_id, organization_id)
SELECT u.id, (SELECT id FROM public.organizations WHERE slug = 'main')
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.user_organizations uo SET is_super_admin = true
WHERE EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = uo.user_id AND r.role = 'admin');

-- 4. Add organization_id everywhere, backfill, auto-fill trigger, restrictive isolation policy
DO $do$
DECLARE
  t text;
  org uuid := (SELECT id FROM public.organizations WHERE slug = 'main');
  tables text[] := ARRAY[
    'cash_advances','chat_messages','departments','employee_location_assignments','employees',
    'leave_requests','overtime_settings','password_reset_requests','payroll_late_minutes',
    'payroll_report_items','payroll_reports','profiles','sao_schedules','time_entries',
    'timesheets','user_roles','work_locations','worker_location_assignments',
    'worker_sao_assignments','worker_time_entries','worker_timesheets','workers'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE', t);
    EXECUTE format('UPDATE public.%I SET organization_id = %L WHERE organization_id IS NULL', t, org);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (organization_id)', 'idx_' || t || '_org', t);
    EXECUTE format('DROP TRIGGER IF EXISTS set_org_id_%I ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER set_org_id_%I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_organization_id()', t, t);
    EXECUTE format('DROP POLICY IF EXISTS org_isolation ON public.%I', t);
    EXECUTE format($p$CREATE POLICY org_isolation ON public.%I AS RESTRICTIVE FOR ALL TO public
      USING (organization_id = public.current_org_id())
      WITH CHECK (organization_id = public.current_org_id())$p$, t);
  END LOOP;
END $do$;

-- 5. Keep company membership in sync when an account gets a role
CREATE OR REPLACE FUNCTION public.sync_user_organization()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.organization_id IS NOT NULL THEN
    INSERT INTO public.user_organizations (user_id, organization_id)
    VALUES (NEW.user_id, NEW.organization_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER sync_user_org_on_role AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_organization();

-- 6. Policies for the new tables
CREATE POLICY "Members can view their organization" ON public.organizations
FOR SELECT TO authenticated USING (id = public.current_org_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins manage organizations" ON public.organizations
FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Users view their own membership" ON public.user_organizations
FOR SELECT TO authenticated USING (user_id = auth.uid() OR organization_id = public.current_org_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "Admins add members to their organization" ON public.user_organizations
FOR INSERT TO authenticated WITH CHECK (organization_id = public.current_org_id() AND public.has_role(auth.uid(), 'admin'));
