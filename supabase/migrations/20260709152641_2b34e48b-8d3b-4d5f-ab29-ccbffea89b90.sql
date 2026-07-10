
DROP POLICY IF EXISTS "SAOs can manage time entries for their workers" ON public.worker_time_entries;
CREATE POLICY "SAOs can manage time entries for their workers"
ON public.worker_time_entries
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.id = worker_time_entries.worker_id
      AND (
        w.assigned_sao_id = public.get_employee_id(auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.worker_sao_assignments wsa
          WHERE wsa.worker_id = w.id
            AND wsa.sao_employee_id = public.get_employee_id(auth.uid())
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.id = worker_time_entries.worker_id
      AND (
        w.assigned_sao_id = public.get_employee_id(auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.worker_sao_assignments wsa
          WHERE wsa.worker_id = w.id
            AND wsa.sao_employee_id = public.get_employee_id(auth.uid())
        )
      )
  )
);

DROP POLICY IF EXISTS "SAOs can view timesheets for their workers" ON public.worker_timesheets;
CREATE POLICY "SAOs can manage timesheets for their workers"
ON public.worker_timesheets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.id = worker_timesheets.worker_id
      AND (
        w.assigned_sao_id = public.get_employee_id(auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.worker_sao_assignments wsa
          WHERE wsa.worker_id = w.id
            AND wsa.sao_employee_id = public.get_employee_id(auth.uid())
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.id = worker_timesheets.worker_id
      AND (
        w.assigned_sao_id = public.get_employee_id(auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.worker_sao_assignments wsa
          WHERE wsa.worker_id = w.id
            AND wsa.sao_employee_id = public.get_employee_id(auth.uid())
        )
      )
  )
);
