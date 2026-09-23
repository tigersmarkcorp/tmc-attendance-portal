
ALTER TABLE public.worker_time_entries ALTER COLUMN recorded_by DROP NOT NULL;

CREATE POLICY "Workers can insert own time entries"
ON public.worker_time_entries FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'worker'::app_role) AND worker_id = get_worker_id(auth.uid()));

CREATE POLICY "Workers can insert own timesheets"
ON public.worker_timesheets FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'worker'::app_role) AND worker_id = get_worker_id(auth.uid()));

CREATE POLICY "Workers can update own timesheets"
ON public.worker_timesheets FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'worker'::app_role) AND worker_id = get_worker_id(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'worker'::app_role) AND worker_id = get_worker_id(auth.uid()));

CREATE POLICY "Workers can view own location assignments"
ON public.worker_location_assignments FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'worker'::app_role) AND worker_id = get_worker_id(auth.uid()));
