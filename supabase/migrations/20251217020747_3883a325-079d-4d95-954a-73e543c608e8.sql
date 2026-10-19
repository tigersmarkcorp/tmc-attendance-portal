-- Drop existing restrictive policies on employees
DROP POLICY IF EXISTS "Admins can manage all employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view their own record" ON public.employees;

-- Create PERMISSIVE policies (default behavior)
CREATE POLICY "Admins can manage all employees" 
ON public.employees 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their own record" 
ON public.employees 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);