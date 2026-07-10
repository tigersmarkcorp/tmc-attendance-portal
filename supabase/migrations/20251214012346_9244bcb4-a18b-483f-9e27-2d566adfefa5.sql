-- Create departments table
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  manager_id uuid REFERENCES public.employees(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Policies for departments
CREATE POLICY "Admins can manage departments"
ON public.departments FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view departments"
ON public.departments FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create leave_types enum
CREATE TYPE public.leave_type AS ENUM ('annual', 'sick', 'personal', 'unpaid', 'maternity', 'paternity');

-- Create leave_status enum
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- Create leave_requests table
CREATE TABLE public.leave_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status leave_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.employees(id),
  reviewed_at timestamp with time zone,
  review_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on leave_requests
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Policies for leave_requests
CREATE POLICY "Admins can manage all leave requests"
ON public.leave_requests FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view their own leave requests"
ON public.leave_requests FOR SELECT
USING (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Employees can create their own leave requests"
ON public.leave_requests FOR INSERT
WITH CHECK (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Employees can cancel their own pending leave requests"
ON public.leave_requests FOR UPDATE
USING (employee_id = get_employee_id(auth.uid()) AND status = 'pending');

-- Create overtime_settings table for configuration
CREATE TABLE public.overtime_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  regular_hours_per_day numeric NOT NULL DEFAULT 8,
  overtime_multiplier numeric NOT NULL DEFAULT 1.5,
  double_overtime_multiplier numeric NOT NULL DEFAULT 2.0,
  double_overtime_threshold_hours numeric NOT NULL DEFAULT 12,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on overtime_settings
ALTER TABLE public.overtime_settings ENABLE ROW LEVEL SECURITY;

-- Policies for overtime_settings
CREATE POLICY "Admins can manage overtime settings"
ON public.overtime_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can view overtime settings"
ON public.overtime_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert default overtime settings
INSERT INTO public.overtime_settings (regular_hours_per_day, overtime_multiplier, double_overtime_multiplier, double_overtime_threshold_hours)
VALUES (8, 1.5, 2.0, 12);

-- Add overtime columns to timesheets
ALTER TABLE public.timesheets 
ADD COLUMN IF NOT EXISTS regular_hours numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS overtime_hours numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS double_overtime_hours numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS regular_pay numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS overtime_pay numeric DEFAULT 0;

-- Create payroll_reports table
CREATE TABLE public.payroll_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_period_start date NOT NULL,
  report_period_end date NOT NULL,
  generated_by uuid REFERENCES public.employees(id),
  total_regular_hours numeric NOT NULL DEFAULT 0,
  total_overtime_hours numeric NOT NULL DEFAULT 0,
  total_regular_pay numeric NOT NULL DEFAULT 0,
  total_overtime_pay numeric NOT NULL DEFAULT 0,
  total_gross_pay numeric NOT NULL DEFAULT 0,
  employee_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on payroll_reports
ALTER TABLE public.payroll_reports ENABLE ROW LEVEL SECURITY;

-- Policies for payroll_reports
CREATE POLICY "Admins can manage payroll reports"
ON public.payroll_reports FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create payroll_report_items table for individual employee entries
CREATE TABLE public.payroll_report_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES public.payroll_reports(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id),
  regular_hours numeric NOT NULL DEFAULT 0,
  overtime_hours numeric NOT NULL DEFAULT 0,
  double_overtime_hours numeric NOT NULL DEFAULT 0,
  hourly_rate numeric NOT NULL,
  regular_pay numeric NOT NULL DEFAULT 0,
  overtime_pay numeric NOT NULL DEFAULT 0,
  double_overtime_pay numeric NOT NULL DEFAULT 0,
  gross_pay numeric NOT NULL DEFAULT 0,
  days_worked integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on payroll_report_items
ALTER TABLE public.payroll_report_items ENABLE ROW LEVEL SECURITY;

-- Policies for payroll_report_items
CREATE POLICY "Admins can manage payroll report items"
ON public.payroll_report_items FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view their own payroll items"
ON public.payroll_report_items FOR SELECT
USING (employee_id = get_employee_id(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_overtime_settings_updated_at
BEFORE UPDATE ON public.overtime_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_payroll_reports_updated_at
BEFORE UPDATE ON public.payroll_reports
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();