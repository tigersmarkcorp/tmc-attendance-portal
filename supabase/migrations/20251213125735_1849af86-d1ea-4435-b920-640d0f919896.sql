-- Create roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- Create employee status enum
CREATE TYPE public.employee_status AS ENUM ('active', 'inactive', 'on_leave');

-- Create time entry type enum
CREATE TYPE public.time_entry_type AS ENUM ('clock_in', 'break_start', 'break_end', 'clock_out');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  UNIQUE (user_id, role)
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  department TEXT,
  position TEXT,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  photo_url TEXT,
  status employee_status NOT NULL DEFAULT 'active',
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create time entries table
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  entry_type time_entry_type NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  selfie_url TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create timesheets table (daily summaries)
CREATE TABLE public.timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  clock_in_time TIMESTAMPTZ,
  clock_out_time TIMESTAMPTZ,
  total_work_minutes INTEGER DEFAULT 0,
  total_break_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  hourly_rate DECIMAL(10,2),
  total_pay DECIMAL(10,2) DEFAULT 0,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get current user's employee id
CREATE OR REPLACE FUNCTION public.get_employee_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employees WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Employees policies
CREATE POLICY "Employees can view their own record"
  ON public.employees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all employees"
  ON public.employees FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Time entries policies
CREATE POLICY "Employees can view their own time entries"
  ON public.time_entries FOR SELECT
  USING (employee_id = public.get_employee_id(auth.uid()));

CREATE POLICY "Employees can insert their own time entries"
  ON public.time_entries FOR INSERT
  WITH CHECK (employee_id = public.get_employee_id(auth.uid()));

CREATE POLICY "Admins can view all time entries"
  ON public.time_entries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all time entries"
  ON public.time_entries FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Timesheets policies
CREATE POLICY "Employees can view their own timesheets"
  ON public.timesheets FOR SELECT
  USING (employee_id = public.get_employee_id(auth.uid()));

CREATE POLICY "Admins can manage all timesheets"
  ON public.timesheets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_timesheets_updated_at
  BEFORE UPDATE ON public.timesheets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for time_entries
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-photos', 'employee-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('selfies', 'selfies', true);

-- Storage policies for employee photos
CREATE POLICY "Anyone can view employee photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'employee-photos');

CREATE POLICY "Admins can upload employee photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'employee-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update employee photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'employee-photos' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for selfies
CREATE POLICY "Anyone can view selfies"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'selfies');

CREATE POLICY "Authenticated users can upload selfies"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'selfies' AND auth.role() = 'authenticated');