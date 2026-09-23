DROP POLICY IF EXISTS "SAO can view assigned workers" ON public.workers;

CREATE POLICY "SAO can view assigned workers"
ON public.workers
FOR SELECT
USING (
  has_role(auth.uid(), 'site_admin_officer'::app_role)
  AND (
    assigned_sao_id = get_employee_id(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.worker_sao_assignments wsa
      WHERE wsa.worker_id = workers.id
        AND wsa.sao_employee_id = get_employee_id(auth.uid())
    )
  )
);