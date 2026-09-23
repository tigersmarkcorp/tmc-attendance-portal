-- Create worker_time_entries table for clock in/out with selfie
CREATE TABLE public.worker_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL REFERENCES public.employees(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('clock_in', 'clock_out')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  selfie_url TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create worker_timesheets table for daily summaries
CREATE TABLE public.worker_timesheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in_time TIMESTAMPTZ,
  clock_out_time TIMESTAMPTZ,
  total_work_minutes INTEGER DEFAULT 0,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  regular_hours NUMERIC(5,2) DEFAULT 0,
  overtime_hours NUMERIC(5,2) DEFAULT 0,
  regular_pay NUMERIC(10,2) DEFAULT 0,
  overtime_pay NUMERIC(10,2) DEFAULT 0,
  total_pay NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES public.employees(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(worker_id, date)
);

-- Add hourly_rate column to workers table
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) DEFAULT 0;

-- Enable RLS
ALTER TABLE public.worker_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_timesheets ENABLE ROW LEVEL SECURITY;

-- RLS for worker_time_entries
CREATE POLICY "Admins can manage all worker time entries"
ON public.worker_time_entries FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SAOs can manage time entries for their workers"
ON public.worker_time_entries FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.id = worker_time_entries.worker_id
    AND w.assigned_sao_id = public.get_employee_id(auth.uid())
  )
);

-- RLS for worker_timesheets
CREATE POLICY "Admins can manage all worker timesheets"
ON public.worker_timesheets FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SAOs can view timesheets for their workers"
ON public.worker_timesheets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workers w
    WHERE w.id = worker_timesheets.worker_id
    AND w.assigned_sao_id = public.get_employee_id(auth.uid())
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_worker_timesheets_updated_at
BEFORE UPDATE ON public.worker_timesheets
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();