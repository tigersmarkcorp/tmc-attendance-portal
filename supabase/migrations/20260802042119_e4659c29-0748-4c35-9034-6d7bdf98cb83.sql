CREATE POLICY "Workers view own SAO assignments"
ON public.worker_sao_assignments
FOR SELECT
TO authenticated
USING (worker_id = public.get_worker_id(auth.uid()));

CREATE POLICY "Workers view their assigned SAOs"
ON public.employees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.worker_sao_assignments wsa
    WHERE wsa.sao_employee_id = employees.id
      AND wsa.worker_id = public.get_worker_id(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.user_id = auth.uid()
      AND w.assigned_sao_id = employees.id
  )
);