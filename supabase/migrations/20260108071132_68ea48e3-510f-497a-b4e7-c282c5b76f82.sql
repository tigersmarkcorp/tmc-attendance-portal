-- Update RLS policies for employees table to allow SAO to view their own record
CREATE POLICY "SAO can view their own employee record" 
ON public.employees 
FOR SELECT 
USING (auth.uid() = user_id AND has_role(auth.uid(), 'site_admin_officer'::app_role));

-- Update RLS policies for time_entries to allow SAO
CREATE POLICY "SAO can insert their own time entries" 
ON public.time_entries 
FOR INSERT 
WITH CHECK (employee_id = get_employee_id(auth.uid()) AND has_role(auth.uid(), 'site_admin_officer'::app_role));

CREATE POLICY "SAO can view their own time entries" 
ON public.time_entries 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()) AND has_role(auth.uid(), 'site_admin_officer'::app_role));

-- Update RLS policies for timesheets to allow SAO
CREATE POLICY "SAO can view their own timesheets" 
ON public.timesheets 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()) AND has_role(auth.uid(), 'site_admin_officer'::app_role));

-- Update RLS policies for leave_requests to allow SAO
CREATE POLICY "SAO can create their own leave requests" 
ON public.leave_requests 
FOR INSERT 
WITH CHECK (employee_id = get_employee_id(auth.uid()) AND has_role(auth.uid(), 'site_admin_officer'::app_role));

CREATE POLICY "SAO can view their own leave requests" 
ON public.leave_requests 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()) AND has_role(auth.uid(), 'site_admin_officer'::app_role));

CREATE POLICY "SAO can cancel their own pending leave requests" 
ON public.leave_requests 
FOR UPDATE 
USING (employee_id = get_employee_id(auth.uid()) AND status = 'pending'::leave_status AND has_role(auth.uid(), 'site_admin_officer'::app_role));

-- Update RLS policies for payroll_report_items to allow SAO
CREATE POLICY "SAO can view their own payroll items" 
ON public.payroll_report_items 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()) AND has_role(auth.uid(), 'site_admin_officer'::app_role));