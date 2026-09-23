
CREATE TABLE public.worker_sao_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  sao_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (worker_id, sao_employee_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worker_sao_assignments TO authenticated;
GRANT ALL ON public.worker_sao_assignments TO service_role;

ALTER TABLE public.worker_sao_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage worker SAO assignments"
ON public.worker_sao_assignments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SAOs and encoders view worker SAO assignments"
ON public.worker_sao_assignments
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'site_admin_officer')
  OR public.has_role(auth.uid(), 'encoder')
);

CREATE INDEX idx_wsa_worker ON public.worker_sao_assignments(worker_id);
CREATE INDEX idx_wsa_sao ON public.worker_sao_assignments(sao_employee_id);
