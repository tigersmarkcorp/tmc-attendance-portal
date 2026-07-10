-- Add assigned_location_id column to employees table for SAOs
ALTER TABLE public.employees 
ADD COLUMN assigned_location_id uuid REFERENCES public.work_locations(id) ON DELETE SET NULL;

-- Add assigned_location_id column to workers table
ALTER TABLE public.workers 
ADD COLUMN assigned_location_id uuid REFERENCES public.work_locations(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_employees_assigned_location ON public.employees(assigned_location_id);
CREATE INDEX idx_workers_assigned_location ON public.workers(assigned_location_id);