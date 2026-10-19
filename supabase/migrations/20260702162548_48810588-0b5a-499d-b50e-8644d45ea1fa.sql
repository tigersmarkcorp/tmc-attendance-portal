
-- Cash Advances
CREATE TABLE public.cash_advances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT cash_advances_subject_chk CHECK (
    (employee_id IS NOT NULL AND worker_id IS NULL) OR
    (employee_id IS NULL AND worker_id IS NOT NULL)
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_advances TO authenticated;
GRANT ALL ON public.cash_advances TO service_role;

ALTER TABLE public.cash_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all cash advances"
  ON public.cash_advances FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees view own cash advances"
  ON public.cash_advances FOR SELECT
  USING (
    employee_id IS NOT NULL
    AND employee_id = public.get_employee_id(auth.uid())
  );

CREATE TRIGGER trg_cash_advances_updated_at
  BEFORE UPDATE ON public.cash_advances
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_cash_advances_employee_period ON public.cash_advances(employee_id, period_start, period_end);
CREATE INDEX idx_cash_advances_worker_period ON public.cash_advances(worker_id, period_start, period_end);

-- Payroll Late Minutes
CREATE TABLE public.payroll_late_minutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT payroll_late_subject_chk CHECK (
    (employee_id IS NOT NULL AND worker_id IS NULL) OR
    (employee_id IS NULL AND worker_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX payroll_late_employee_date_uk ON public.payroll_late_minutes(employee_id, date) WHERE employee_id IS NOT NULL;
CREATE UNIQUE INDEX payroll_late_worker_date_uk ON public.payroll_late_minutes(worker_id, date) WHERE worker_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_late_minutes TO authenticated;
GRANT ALL ON public.payroll_late_minutes TO service_role;

ALTER TABLE public.payroll_late_minutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all late minutes"
  ON public.payroll_late_minutes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees view own late minutes"
  ON public.payroll_late_minutes FOR SELECT
  USING (
    employee_id IS NOT NULL
    AND employee_id = public.get_employee_id(auth.uid())
  );

CREATE TRIGGER trg_payroll_late_updated_at
  BEFORE UPDATE ON public.payroll_late_minutes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
