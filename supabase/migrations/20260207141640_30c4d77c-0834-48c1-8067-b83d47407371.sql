-- Create junction table for employee/SAO multiple location assignments
CREATE TABLE public.employee_location_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.work_locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, location_id)
);

-- Create junction table for worker multiple location assignments
CREATE TABLE public.worker_location_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.work_locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(worker_id, location_id)
);

-- Enable RLS
ALTER TABLE public.employee_location_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_location_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for employee_location_assignments
CREATE POLICY "Admins can manage employee location assignments" 
ON public.employee_location_assignments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SAO can view their own location assignments" 
ON public.employee_location_assignments 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()) AND has_role(auth.uid(), 'site_admin_officer'::app_role));

CREATE POLICY "Employees can view their own location assignments" 
ON public.employee_location_assignments 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()));

-- Policies for worker_location_assignments
CREATE POLICY "Admins can manage worker location assignments" 
ON public.worker_location_assignments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SAO can view their workers location assignments" 
ON public.worker_location_assignments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM workers w 
  WHERE w.id = worker_location_assignments.worker_id 
  AND w.assigned_sao_id = get_employee_id(auth.uid())
));