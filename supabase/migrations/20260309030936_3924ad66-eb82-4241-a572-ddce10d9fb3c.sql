
-- Encoder can view all workers
CREATE POLICY "Encoder can view all workers"
ON public.workers FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'encoder'::app_role));

-- Encoder can insert workers
CREATE POLICY "Encoder can insert workers"
ON public.workers FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'encoder'::app_role));

-- Encoder can update workers
CREATE POLICY "Encoder can update workers"
ON public.workers FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'encoder'::app_role));

-- Encoder can view all employees
CREATE POLICY "Encoder can view all employees"
ON public.employees FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'encoder'::app_role));

-- Encoder can insert employees
CREATE POLICY "Encoder can insert employees"
ON public.employees FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'encoder'::app_role));

-- Encoder can update employees
CREATE POLICY "Encoder can update employees"
ON public.employees FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'encoder'::app_role));

-- Encoder can manage user_roles (for assigning roles when creating employees)
CREATE POLICY "Encoder can insert user roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'encoder'::app_role));

-- Encoder can view user roles
CREATE POLICY "Encoder can view user roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'encoder'::app_role));

-- Encoder can view departments
CREATE POLICY "Encoder can view departments"
ON public.departments FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'encoder'::app_role));

-- Encoder can view profiles
CREATE POLICY "Encoder can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'encoder'::app_role));
