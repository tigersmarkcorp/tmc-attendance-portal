
CREATE TABLE public.sao_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sao_employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  clock_in_time TIME,
  clock_out_time TIME,
  is_rest_day BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sao_employee_id, day_of_week)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sao_schedules TO authenticated;
GRANT ALL ON public.sao_schedules TO service_role;

ALTER TABLE public.sao_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all SAO schedules"
ON public.sao_schedules
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SAO can view own schedule"
ON public.sao_schedules
FOR SELECT
TO authenticated
USING (sao_employee_id = public.get_employee_id(auth.uid()));

CREATE TRIGGER update_sao_schedules_updated_at
BEFORE UPDATE ON public.sao_schedules
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
