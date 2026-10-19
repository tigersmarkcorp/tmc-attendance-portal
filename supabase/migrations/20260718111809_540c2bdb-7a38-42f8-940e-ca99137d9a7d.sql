
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS workers_user_id_idx ON public.workers(user_id);

-- Helper to get worker id from user
CREATE OR REPLACE FUNCTION public.get_worker_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.workers WHERE user_id = _user_id LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.get_worker_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_worker_id(uuid) TO authenticated, service_role;

-- Workers can view their own row
CREATE POLICY "Workers can view own record" ON public.workers
FOR SELECT USING (has_role(auth.uid(), 'worker'::app_role) AND user_id = auth.uid());

-- Workers can view own time entries
CREATE POLICY "Workers can view own time entries" ON public.worker_time_entries
FOR SELECT USING (has_role(auth.uid(), 'worker'::app_role) AND worker_id = public.get_worker_id(auth.uid()));

-- Workers can view own timesheets
CREATE POLICY "Workers can view own timesheets" ON public.worker_timesheets
FOR SELECT USING (has_role(auth.uid(), 'worker'::app_role) AND worker_id = public.get_worker_id(auth.uid()));
