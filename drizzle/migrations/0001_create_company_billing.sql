CREATE TABLE public.company_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_month date NOT NULL,
  due_date date,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  amount numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, period_month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_billing TO authenticated;
GRANT ALL ON public.company_billing TO service_role;

ALTER TABLE public.company_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage company billing"
ON public.company_billing
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Org members view their billing"
ON public.company_billing
FOR SELECT
TO authenticated
USING (organization_id = public.current_org_id());

CREATE TRIGGER trg_company_billing_updated_at
BEFORE UPDATE ON public.company_billing
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();