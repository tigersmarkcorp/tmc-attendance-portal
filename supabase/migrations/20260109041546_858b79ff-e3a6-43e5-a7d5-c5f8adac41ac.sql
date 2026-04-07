-- Create workers table
CREATE TABLE public.workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  department TEXT,
  date_of_birth DATE,
  sex TEXT,
  civil_status TEXT,
  city_address TEXT,
  provincial_address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_sao_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- Admin can manage all workers
CREATE POLICY "Admins can manage all workers"
ON public.workers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- SAO can view workers assigned to them
CREATE POLICY "SAO can view assigned workers"
ON public.workers
FOR SELECT
USING (
  assigned_sao_id = get_employee_id(auth.uid()) 
  AND has_role(auth.uid(), 'site_admin_officer'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_workers_updated_at
BEFORE UPDATE ON public.workers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();